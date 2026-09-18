import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import katex from "katex";

const rootUrl = new URL("../", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`${specifier.slice(2)}.ts`, rootUrl).href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { analyzeFlangedBeam, getFlangedBeamAnalysisSteps, deriveTBeamLayersFromOverallHeight } = await import("../lib/flanged-beam-analysis.ts");

const common = {
  bw: 300,
  hf: 120,
  d: 550,
  span: 6000,
  clearSpacingLeft: 2700,
  clearSpacingRight: 2700,
  fc: 28,
  fy: 420,
  barCount: 4,
  barDiameter: 25,
  Mu: 300,
};

function close(actual, expected, tolerance = 1e-7) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
}

test("T-beam analysis matches an independent yielding-steel flange calculation", () => {
  const input = { ...common, shape: "T" };
  const result = analyzeFlangedBeam(input);
  const As = 4 * Math.PI * 25 ** 2 / 4;
  const clearSpacing = 2700;
  const overhang = Math.min(6000 / 8, 8 * 120, clearSpacing / 2);
  const beff = 300 + 2 * overhang;
  const a = As * 420 / (0.85 * 28 * beff);
  const Mn = As * 420 * (550 - a / 2) / 1_000_000;

  close(result.beff, beff);
  close(result.As, As);
  close(result.a, a);
  close(result.Mn, Mn);
  close(result.phiMn, 0.9 * Mn);
  assert.equal(result.sectionCase, "flange");
  assert.equal(result.tensionSteelYields, true);
  assert.equal(result.status, "PASS");
});

test("calculated T flange width sums separately limited left and right overhangs", () => {
  const input = { ...common, shape: "T", span: 8000, hf: 100,
    clearSpacingLeft: 1500, clearSpacingRight: 600 };
  const result = analyzeFlangedBeam(input);
  const steps = getFlangedBeamAnalysisSteps(input, result);
  const left = Math.min(8 * 100, 1500 / 2, 8000 / 8);
  const right = Math.min(8 * 100, 600 / 2, 8000 / 8);

  close(left, 750);
  close(right, 300);
  close(result.beff, 300 + left + right);
  assert.equal(steps[0].label, "Left-side effective overhang");
  assert.equal(steps[1].label, "Right-side effective overhang");
  assert.equal(steps[2].label, "Total effective flange width");
  assert.match(steps[0].substitution, /1500/);
  assert.match(steps[1].substitution, /600/);
  assert.match(steps[2].result, /1350/);
  for (const step of steps.slice(0, 3)) {
    for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
      assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
    }
  }
});

test("calculated T width rejects an invalid right-side spacing", () => {
  assert.throws(
    () => analyzeFlangedBeam({ ...common, shape: "T", clearSpacingRight: 0 }),
    /right-side clear spacing/,
  );
});

test("calculated T width requires both clear distances, unlike the one-sided L-beam", () => {
  const oneSide = { ...common };
  delete oneSide.clearSpacingRight;
  assert.throws(
    () => analyzeFlangedBeam({ ...oneSide, shape: "T" }),
    /right-side clear spacing/,
  );
  const lResult = analyzeFlangedBeam({ ...oneSide, shape: "L" });
  assert.equal(lResult.rightOverhang, null);
  close(lResult.beff, 300 + Math.min(6 * 120, 2700 / 2, 6000 / 12));
});

test("T-beam analysis accepts a given effective flange width without span or spacing", () => {
  const base = { ...common };
  delete base.span;
  delete base.clearSpacingLeft;
  delete base.clearSpacingRight;
  const input = { ...base, shape: "T", flangeWidthMode: "given", bf: 1100 };
  const result = analyzeFlangedBeam(input);
  const As = 4 * Math.PI * 25 ** 2 / 4;
  const a = As * 420 / (0.85 * 28 * 1100);
  const expectedMn = As * 420 * (550 - a / 2) / 1_000_000;
  const steps = getFlangedBeamAnalysisSteps(input, result);

  close(result.beff, 1100);
  close(result.a, a);
  close(result.Mn, expectedMn);
  assert.equal(result.flangeWidthMode, "given");
  assert.deepEqual(result.widthLimits, []);
  assert.equal(steps[0].label, "Given effective flange width");
  assert.doesNotMatch(steps[0].formula, /\\min|L/);
  for (const step of steps) {
    for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
      assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
    }
  }
});

test("given T flange width must be at least the web width", () => {
  const base = { ...common };
  delete base.span;
  delete base.clearSpacingLeft;
  delete base.clearSpacingRight;
  assert.throws(
    () => analyzeFlangedBeam({ ...base, shape: "T", flangeWidthMode: "given", bf: 250 }),
    /at least bw/,
  );
});

test("L-beam analysis accepts a given effective flange width without span or spacing", () => {
  const base = { ...common };
  delete base.span;
  delete base.clearSpacingLeft;
  delete base.clearSpacingRight;
  const input = { ...base, shape: "L", flangeWidthMode: "given", bf: 900, Mu: null };
  const result = analyzeFlangedBeam(input);
  const steps = getFlangedBeamAnalysisSteps(input, result);

  close(result.beff, 900);
  assert.equal(result.effectiveOverhang, null);
  assert.equal(result.flangeWidthMode, "given");
  assert.equal(result.widthLimits.length, 0);
  assert.equal(steps[0].label, "Given effective flange width");
  assert.match(steps[0].formula, /b_\{f,\\mathrm\{given\}\}/);
});

test("calculated T flange width still requires span and both clear distances", () => {
  const base = { ...common };
  delete base.span;
  delete base.clearSpacingLeft;
  delete base.clearSpacingRight;
  assert.throws(
    () => analyzeFlangedBeam({ ...base, shape: "T", flangeWidthMode: "calculated" }),
    /clear span ln and left-side clear spacing/,
  );
});

test("L-beam analysis applies the one-sided overhang limits", () => {
  const result = analyzeFlangedBeam({ ...common, shape: "L", Mu: null });
  const overhang = Math.min(6000 / 12, 6 * 120, 2700 / 2);
  const widthStep = getFlangedBeamAnalysisSteps({ ...common, shape: "L", Mu: null }, result)[0];

  close(result.effectiveOverhang, overhang);
  close(result.beff, 300 + overhang);
  assert.equal(result.status, "CAPACITY ONLY");
  assert.match(widthStep.formula, /s_w/);
  assert.match(widthStep.substitution, /2700/);
  assert.match(widthStep.result, /800/);
  for (const math of [widthStep.formula, widthStep.substitution, widthStep.result]) {
    assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }));
  }
});

test("heavily reinforced flanged sections solve elastic steel from C = T", () => {
  const input = { ...common, shape: "T", barCount: 30, barDiameter: 36, Mu: null };
  const result = analyzeFlangedBeam(input);
  const concrete = 0.85 * input.fc * (
    result.sectionCase === "flange"
      ? result.beff * result.a
      : input.bw * result.a + (result.beff - input.bw) * input.hf
  );

  assert.equal(result.tensionSteelYields, false);
  close(concrete, result.As * result.tensionStress, 1e-5);
  close(result.epsilonT, 0.003 * (input.d - result.c) / result.c);
});

test("analysis manual solution contains valid KaTeX for both shapes", () => {
  for (const shape of ["T", "L"]) {
    const input = { ...common, shape };
    const result = analyzeFlangedBeam(input);
    const steps = getFlangedBeamAnalysisSteps(input, result);
    assert.equal(steps.at(-1).label, "Demand-capacity check");
    for (const step of steps) {
      for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
        assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
      }
    }
  }
});

test("L-beam full manual solution includes every capacity-analysis stage", () => {
  const input = { ...common, shape: "L" };
  const result = analyzeFlangedBeam(input);
  const labels = getFlangedBeamAnalysisSteps(input, result).map((step) => step.label);

  for (const required of [
    "Layer s1: steel area and depth",
    "Layer s1: strain, stress and force",
    "Determine stress-block region and solve force equilibrium",
    "Concrete compression resultants and centroids",
    "Nominal moment from every force about the top face",
    "Strength reduction factor and design capacity",
    "Minimum tensile strain for a nonprestressed beam",
    "Demand-capacity check",
  ]) {
    assert.ok(labels.includes(required), `missing L-beam solution stage: ${required}`);
  }
});

test("layered T beam solves flange and web cases with per-layer equilibrium and moment", () => {
  for (const bars of [4, 18]) {
    const input = { ...common, shape: "T", barCount: bars, tensionLayers: [
      { barCount: bars, barDiameter: 25, depth: 550 },
      { barCount: 2, barDiameter: 20, depth: 500 },
    ], compressionLayers: [{ barCount: 2, barDiameter: 16, depth: 60 }] };
    const r = analyzeFlangedBeam(input);
    const Cc = 0.85 * input.fc * (r.sectionCase === "flange"
      ? r.beff * r.a : input.bw * r.a + (r.beff - input.bw) * input.hf);
    const all = [...r.tensionLayers, ...r.compressionLayers];
    const net = all.reduce((sum, layer) => sum + layer.area * (layer.stress - (layer.depth <= r.a ? 0.85 * input.fc : 0)), 0);
    const Cmoment = r.concreteWebForce * r.a / 2 + r.concreteFlangeForce * input.hf / 2;
    const independentMn = -(Cmoment + all.reduce((sum, layer) => sum + layer.netForce * layer.depth, 0)) / 1e6;
    close(Cc + net, 0, 1e-5);
    close(r.Mn, independentMn, 1e-8);
    assert.equal(r.tensionLayers.length, 2);
    assert.equal(r.compressionLayers.length, 1);
    const steps = getFlangedBeamAnalysisSteps(input, r);
    assert.ok(steps.some((step) => step.label.includes("Layer s'1")));
    assert.ok(steps.some((step) => step.label.includes("Nominal moment")));
    for (const step of steps) for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
      assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
    }
  }
});

test("doubly T-beam manual solution follows the eight capacity-analysis stages", () => {
  for (const bars of [4, 18]) {
    const input = { ...common, shape: "T", tensionLayers: [{ barCount: bars, barDiameter: 25, depth: 550 }],
      compressionLayers: [{ barCount: 2, barDiameter: 16, depth: 60 }] };
    const result = analyzeFlangedBeam(input);
    const steps = getFlangedBeamAnalysisSteps(input, result);
    const labels = steps.map((step) => step.label);
    const ordered = ["1. Compression-block assumption", "2. Steel-state assumptions",
      "3. Trial compatible steel stresses", "4. Solve force equilibrium",
      "5. Verify compression-block and steel assumptions", "6. Nominal moment from every force about the top face",
      "7. Strength-reduction factor", "8. Design moment capacity"];
    for (let i = 0; i < ordered.length; i += 1) {
      assert.ok(labels.includes(ordered[i]), ordered[i]);
      if (i > 0) assert.ok(labels.indexOf(ordered[i]) > labels.indexOf(ordered[i - 1]));
    }
    assert.match(steps.find((step) => step.label === ordered[3]).formula, /C_c/);
    assert.match(steps.find((step) => step.label === ordered[4]).result, /flange|web/);
    for (const step of steps) for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
      assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
    }
  }
});

test("doubly manual solution identifies elastic top bars in tension and leaves singly stages alone", () => {
  const doublyInput = { ...common, shape: "T", flangeWidthMode: "given", bf: 1500,
    tensionLayers: [{ barCount: 1, barDiameter: 12, depth: 550 }],
    compressionLayers: [{ barCount: 5, barDiameter: 36, depth: 110 }] };
  const doubly = analyzeFlangedBeam(doublyInput);
  const checks = getFlangedBeamAnalysisSteps(doublyInput, doubly);
  const top = checks.find((step) => step.label === "5a. Top layer 1: final state check");
  assert.ok(top);
  assert.match(top.result, /tension, elastic/);
  const singlyInput = { ...common, shape: "T" };
  const singlySteps = getFlangedBeamAnalysisSteps(singlyInput, analyzeFlangedBeam(singlyInput));
  assert.ok(!singlySteps.some((step) => /^[1-8]\. /.test(step.label)));
  assert.ok(singlySteps.some((step) => step.label === "Strength reduction factor and design capacity"));
});

test("T beam rejects compression steel below the tension steel", () => {
  const input = { ...common, shape: "T", compressionLayers: [{ barCount: 2, barDiameter: 16, depth: 560 }] };
  assert.throws(() => analyzeFlangedBeam(input), /compression steel above the tension steel/);
});

test("nonductile T beam reports strain-limit failure even when moment demand is small", () => {
  const input = { ...common, shape: "T", barCount: 30, barDiameter: 36, Mu: 1 };
  const r = analyzeFlangedBeam(input);
  assert.ok(r.phiMn > input.Mu);
  assert.ok(r.epsilonT < 0.004);
  assert.equal(r.strainLimitOk, false);
  assert.equal(r.status, "FAIL");
});

test("top steel is solved in its actual elastic or yielded state", () => {
  const light = analyzeFlangedBeam({ ...common, shape: "T", flangeWidthMode: "given", bf: 1500,
    tensionLayers: [{ barCount: 1, barDiameter: 12, depth: 550 }],
    compressionLayers: [{ barCount: 5, barDiameter: 36, depth: 110 }] });
  const heavy = analyzeFlangedBeam({ ...common, shape: "T", flangeWidthMode: "given", bf: 1500,
    tensionLayers: [{ barCount: 30, barDiameter: 36, depth: 550 }],
    compressionLayers: [{ barCount: 2, barDiameter: 16, depth: 40 }] });
  assert.ok(light.compressionLayers[0].stress < 0);
  assert.equal(light.compressionLayers[0].yields, false);
  assert.ok(heavy.compressionLayers[0].stress > 0);
  assert.equal(heavy.compressionLayers[0].yields, true);
});

test("doubly reinforced flange case agrees with an independent elastic-top-steel quadratic", () => {
  const input = { ...common, shape: "T", flangeWidthMode: "given", bf: 1500,
    tensionLayers: [{ barCount: 12, barDiameter: 25, depth: 550 }],
    compressionLayers: [{ barCount: 2, barDiameter: 16, depth: 50 }] };
  const r = analyzeFlangedBeam(input);
  const As = 12 * Math.PI * 25 ** 2 / 4;
  const Asp = 2 * Math.PI * 16 ** 2 / 4;
  const beta = 0.85;
  const k = 0.85 * 28 * 1500 * beta;
  const s = 200000 * 0.003;
  const b = Asp * (s - 0.85 * 28) - As * 420;
  const c = (-b + Math.sqrt(b * b + 4 * k * Asp * s * 50)) / (2 * k);
  const a = beta * c;
  const fsPrime = s * (c - 50) / c;
  const Cc = 0.85 * 28 * 1500 * a;
  const netTop = Asp * (fsPrime - 0.85 * 28);
  const expectedMn = -(Cc * a / 2 + netTop * 50 - As * 420 * 550) / 1e6;
  assert.equal(r.sectionCase, "flange");
  assert.ok(a > 58);
  assert.ok(fsPrime > 0 && fsPrime < 420);
  close(r.c, c, 1e-8);
  close(r.Mn, expectedMn, 1e-8);
});

test("T-beam accepts a custom steel modulus and uses it in equilibrium and the manual solution", () => {
  const input = { ...common, shape: "T", flangeWidthMode: "given", bf: 1500, Es: 150000,
    tensionLayers: [{ barCount: 12, barDiameter: 25, depth: 550 }],
    compressionLayers: [{ barCount: 2, barDiameter: 16, depth: 50 }] };
  const r = analyzeFlangedBeam(input);
  const defaultResult = analyzeFlangedBeam({ ...input, Es: undefined });
  const As = 12 * Math.PI * 25 ** 2 / 4;
  const Asp = 2 * Math.PI * 16 ** 2 / 4;
  const k = 0.85 * 28 * 1500 * 0.85;
  const elasticFactor = 150000 * 0.003;
  const b = Asp * (elasticFactor - 0.85 * 28) - As * 420;
  const c = (-b + Math.sqrt(b * b + 4 * k * Asp * elasticFactor * 50)) / (2 * k);
  const topStress = elasticFactor * (c - 50) / c;
  const a = 0.85 * c;
  const moment = -(0.85 * 28 * 1500 * a * a / 2 +
    Asp * (topStress - 0.85 * 28) * 50 - As * 420 * 550) / 1e6;
  const steps = getFlangedBeamAnalysisSteps(input, r);

  assert.equal(r.Es, 150000);
  assert.equal(defaultResult.Es, 200000);
  close(r.epsilonY, 420 / 150000);
  close(r.c, c, 1e-8);
  close(r.compressionLayers[0].stress, topStress, 1e-7);
  close(r.Mn, moment, 1e-8);
  assert.notEqual(r.Mn, defaultResult.Mn);
  assert.ok(steps.some((step) => step.substitution?.includes("150000")));
  assert.ok(!steps.some((step) => [step.formula, step.substitution, step.result].some((math) => math?.includes("200000"))));
});

test("T-beam rejects nonpositive or incompatible steel modulus", () => {
  const input = { ...common, shape: "T" };
  assert.throws(() => analyzeFlangedBeam({ ...input, Es: 0 }), /positive section and material values/);
  assert.throws(() => analyzeFlangedBeam({ ...input, Es: 80000 }), /yield strain below 0.005/);
});

test("a stress block crossing a bar row keeps displacement and equilibrium continuous", () => {
  const r = analyzeFlangedBeam({ ...common, shape: "T", flangeWidthMode: "given", bf: 1500,
    tensionLayers: [{ barCount: 12, barDiameter: 25, depth: 550 }],
    compressionLayers: [{ barCount: 2, barDiameter: 16, depth: 60 }] });
  const top = r.compressionLayers[0];
  assert.ok(top.displacedFraction > 0 && top.displacedFraction < 1);
  close(r.equilibriumResidual, 0, 1e-5);
  close(top.netForce, top.area * (top.stress - 0.85 * 28 * top.displacedFraction), 1e-8);
});

test("T-beam overall height derives each tension and compression centroid like the rectangular page", () => {
  const geometry = { h: 600, bw: 300, hf: 120, clearCover: 40, stirrupDiameter: 10,
    tensionLayers: [{ barCount: 4, barDiameter: 25 }, { barCount: 2, barDiameter: 20 }],
    compressionLayers: [{ barCount: 2, barDiameter: 16 }, { barCount: 2, barDiameter: 20 }] };
  const layers = deriveTBeamLayersFromOverallHeight(geometry);
  assert.deepEqual(layers.tensionLayers.map((layer) => layer.depth), [537.5, 490]);
  assert.deepEqual(layers.compressionLayers.map((layer) => layer.depth), [58, 101]);
  const input = { ...common, shape: "T", tensionLayers: layers.tensionLayers,
    compressionLayers: layers.compressionLayers,
    depthGeometry: { h: geometry.h, clearCover: geometry.clearCover, stirrupDiameter: geometry.stirrupDiameter } };
  const r = analyzeFlangedBeam(input);
  const As1 = 4 * Math.PI * 25 ** 2 / 4;
  const As2 = 2 * Math.PI * 20 ** 2 / 4;
  close(r.d, (As1 * 537.5 + As2 * 490) / (As1 + As2));
  const steps = getFlangedBeamAnalysisSteps(input, r);
  assert.ok(steps.some((step) => step.label === "Bar-layer depths from overall height"));
  for (const step of steps) for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
    assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
  }
});

test("T-beam overall height rejects layers outside the physical section", () => {
  const base = { h: 600, bw: 300, hf: 120, clearCover: 40, stirrupDiameter: 10,
    tensionLayers: [{ barCount: 4, barDiameter: 25 }], compressionLayers: [] };
  assert.throws(() => deriveTBeamLayersFromOverallHeight({ ...base, h: 140 }), /below the flange|fit|height/i);
  assert.throws(() => deriveTBeamLayersFromOverallHeight({ ...base, clearCover: 140 }), /web|cover|fit/i);
});

test("failed flange-only trial explicitly re-solves web depth before moment capacity", () => {
  const input = { ...common, shape: "T", flangeWidthMode: "given", bf: 1000, hf: 80,
    tensionLayers: [{ barCount: 10, barDiameter: 25, depth: 550 }], Mu: null };
  const r = analyzeFlangedBeam(input);
  const As = 10 * Math.PI * 25 ** 2 / 4;
  const aFlange = As * 420 / (0.85 * 28 * 1000);
  const aWeb = (As * 420 / (0.85 * 28) - (1000 - 300) * 80) / 300;
  const Cw = 0.85 * 28 * 300 * aWeb;
  const Cf = 0.85 * 28 * (1000 - 300) * 80;
  const Mn = (Cw * (550 - aWeb / 2) + Cf * (550 - 80 / 2)) / 1e6;
  assert.ok(aFlange > 80);
  assert.ok(aWeb > 80);
  assert.equal(r.sectionCase, "web");
  close(r.a, aWeb, 1e-8);
  close(r.Mn, Mn, 1e-8);
  const steps = getFlangedBeamAnalysisSteps(input, r);
  const labels = steps.map((step) => step.label);
  const failedTrial = labels.indexOf("Check flange-only trial");
  const webResolve = labels.indexOf("Re-solve a for flange-plus-web compression");
  const moment = labels.indexOf("Nominal moment from every force about the top face");
  assert.ok(failedTrial >= 0 && webResolve > failedTrial && moment > webResolve);
  assert.match(steps[failedTrial].result, /fails|invalid/i);
  assert.match(steps[webResolve].formula, /b_w/);
  assert.match(steps[webResolve].result, /a_\{w/);
  for (const step of steps) for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
    assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
  }
});

test("valid flange-only trial does not show a web re-solve", () => {
  const input = { ...common, shape: "T", flangeWidthMode: "given", bf: 1000, hf: 80,
    tensionLayers: [{ barCount: 4, barDiameter: 25, depth: 550 }], Mu: null };
  const r = analyzeFlangedBeam(input);
  assert.equal(r.sectionCase, "flange");
  const labels = getFlangedBeamAnalysisSteps(input, r).map((step) => step.label);
  assert.ok(labels.includes("Check flange-only trial"));
  assert.ok(!labels.includes("Re-solve a for flange-plus-web compression"));
});

test("elastic tension or compression steel requires the full compatibility re-solve", () => {
  const inputs = [
    { ...common, shape: "T", barCount: 30, barDiameter: 36, Mu: null },
    { ...common, shape: "T", tensionLayers: [{ barCount: 12, barDiameter: 25, depth: 550 }],
      compressionLayers: [{ barCount: 2, barDiameter: 16, depth: 60 }], Mu: null },
  ];
  for (const input of inputs) {
    const r = analyzeFlangedBeam(input);
    assert.equal(r.yieldTrialAccepted, false);
    close(r.equilibriumResidual, 0, 1e-5);
    const steps = getFlangedBeamAnalysisSteps(input, r);
    assert.ok(steps.some((step) => step.label === "Re-solve equilibrium with actual steel stresses"));
    assert.ok(steps.some((step) => step.label === "Check flange-only trial"));
    for (const step of steps) for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
      assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
    }
  }
});

test("the flange/web boundary a = hf stays in the flange case", () => {
  const As = 4 * Math.PI * 25 ** 2 / 4;
  const bf = As * 420 / (0.85 * 28 * 80);
  const input = { ...common, shape: "T", flangeWidthMode: "given", bf, hf: 80,
    tensionLayers: [{ barCount: 4, barDiameter: 25, depth: 550 }], Mu: null };
  const r = analyzeFlangedBeam(input);
  close(r.a, 80, 1e-9);
  assert.equal(r.sectionCase, "flange");
  assert.equal(r.webTrialA, null);
  assert.ok(r.yieldTrialAccepted);
});
