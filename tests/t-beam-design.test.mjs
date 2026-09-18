import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import katex from "katex";

const rootUrl = new URL("../", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) return nextResolve(new URL(specifier.slice(2) + ".ts", rootUrl).href, context);
    return nextResolve(specifier, context);
  },
});
const { designTBeam, getTBeamSolutionSteps } = await import("../lib/t-beam.ts");

const base = {
  Mu: 600, bw: 300, hf: 50, d: 550, span: 2000,
  clearSpacingLeft: 300, clearSpacingRight: 300,
  fc: 21, fy: 420, Es: 200000, barDiameter: 25, compressionBarDiameter: 20,
  clearCover: 40, stirrupDiameter: 10, aggregateSize: 19,
};

function close(actual, expected, tolerance = 1e-5) {
  assert.ok(Math.abs(actual - expected) <= tolerance, actual + " != " + expected);
}

test("T design switches to doubly reinforcement and verifies flange-plus-web equilibrium", () => {
  const result = designTBeam(base);
  assert.equal(result.sectionType, "doubly");
  assert.ok(result.compressionBarsRequired > 0);
  assert.ok(result.ok, result.message);
  assert.equal(result.sectionCase, "web");
  assert.ok(result.epsilonT >= 0.005);
  assert.ok(result.phiMn >= base.Mu);
  assert.ok(result.compressionLayers.every((layer) => layer.depth < result.tensionLayers.at(-1).depth));
  const Cw = 0.85 * base.fc * base.bw * result.a;
  const Cf = 0.85 * base.fc * (result.beff - base.bw) * base.hf;
  close(result.concreteWebForce, Cw);
  close(result.concreteFlangeForce, Cf);
  const all = [...result.tensionLayers, ...result.compressionLayers];
  close(Cw + Cf + all.reduce((sum, layer) => sum + layer.netForce, 0), 0);
  const Mn = -(Cw * result.a / 2 + Cf * base.hf / 2 +
    all.reduce((sum, layer) => sum + layer.netForce * layer.depth, 0)) / 1e6;
  close(result.Mn, Mn);
  const steps = getTBeamSolutionSteps(base, result);
  assert.ok(steps.some((step) => step.label === "Compression steel strain and yield check"));
  assert.ok(steps.some((step) => step.label === "Flange and web concrete resultants"));
  for (const step of steps) for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
    assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
  }
});

test("calculated T flange width treats left and right clear web spacing independently", () => {
  const input = { ...base, Mu: 150, hf: 120, span: 6000,
    clearSpacingLeft: 200, clearSpacingRight: 1200 };
  const result = designTBeam(input);
  assert.equal(result.flangeWidthMode, "calculated");
  close(result.leftOverhang, 100);
  close(result.rightOverhang, 600);
  close(result.beff, 1000);
  const widthSteps = getTBeamSolutionSteps(input, result).filter((step) =>
    step.label.includes("overhang") || step.label.includes("flange width"));
  assert.ok(widthSteps.some((step) => step.label.includes("left")));
  assert.ok(widthSteps.some((step) => step.label.includes("right")));
  for (const step of widthSteps) for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
    assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
  }
});

test("given T flange width works without span or neighboring web spacing", () => {
  const input = { Mu: 150, bw: 300, hf: 120, d: 550, fc: 28, fy: 420,
    barDiameter: 25, flangeWidthMode: "given", bf: 950 };
  const result = designTBeam(input);
  assert.equal(result.flangeWidthMode, "given");
  close(result.beff, 950);
  assert.equal(result.leftOverhang, null);
  assert.equal(result.rightOverhang, null);
  assert.equal(getTBeamSolutionSteps(input, result)[0].label, "Given effective flange width");
  assert.throws(() => designTBeam({ ...input, bf: 299 }), /bf.*bw/i);
});

test("L design uses the shared design workflow with one-sided flange limits", () => {
  const input = { ...base, shape: "L", Mu: 150, hf: 120, span: 6000,
    clearSpacingLeft: 2700, clearSpacingRight: undefined };
  const result = designTBeam(input);
  const expectedOverhang = Math.min(6000 / 12, 6 * 120, 2700 / 2);

  close(result.leftOverhang, expectedOverhang);
  assert.equal(result.rightOverhang, null);
  close(result.beff, 300 + expectedOverhang);
  assert.equal(result.designStatus, "PASS");
  const steps = getTBeamSolutionSteps(input, result);
  assert.equal(steps[0].label, "Effective one-sided overhang");
  assert.ok(steps.some((step) => step.label === "Selected bar areas and counts"));
  for (const step of steps) for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
    assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
  }
});

test("L design accepts given bf without span or spacing", () => {
  const input = { Mu: 150, shape: "L", bw: 300, hf: 120, d: 550, fc: 28, fy: 420,
    Es: 200000, barDiameter: 25, compressionBarDiameter: 20, flangeWidthMode: "given", bf: 950 };
  const result = designTBeam(input);
  assert.equal(result.flangeWidthMode, "given");
  close(result.beff, 950);
  assert.equal(getTBeamSolutionSteps(input, result)[0].label, "Given effective flange width");
});

test("given flange width also feeds the doubly reinforced design and manual solution", () => {
  const input = { ...base, flangeWidthMode: "given", bf: 600,
    span: undefined, clearSpacingLeft: undefined, clearSpacingRight: undefined };
  const result = designTBeam(input);
  assert.equal(result.sectionType, "doubly");
  close(result.beff, 600);
  assert.ok(result.phiMn >= input.Mu);
  const steps = getTBeamSolutionSteps(input, result);
  assert.equal(steps[0].label, "Given effective flange width");
  assert.ok(steps.some((step) => step.label === "Compression steel strain and yield check"));
  for (const step of steps) for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
    assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
  }
});

test("calculated T flange width requires both positive clear spacings", () => {
  assert.throws(() => designTBeam({ ...base, clearSpacingRight: undefined }), /right.*spacing/i);
  assert.throws(() => designTBeam({ ...base, clearSpacingLeft: 0 }), /left.*spacing/i);
});

test("a modest T-beam demand remains singly reinforced without compression steel", () => {
  const result = designTBeam({ ...base, Mu: 120 });
  assert.equal(result.sectionType, "singly");
  assert.equal(result.compressionBarsRequired, 0);
  assert.ok(result.ok, result.message);
});

test("manual singly design screens flange moment and solves the flange block", () => {
  const input = { ...base, Mu: 120 };
  const result = designTBeam(input);
  const steps = getTBeamSolutionSteps(input, result);
  const screening = steps.find((step) => step.label === "Flange-only moment screening");
  const block = steps.find((step) => step.label === "Required compression-block depth within flange");
  const steel = steps.find((step) => step.label === "Required steel from flange equilibrium");
  assert.ok(screening);
  assert.ok(block);
  assert.ok(steel);
  assert.match(screening.result, /Within flange/);
  assert.match(block.formula, /b_f/);
  assert.match(steel.formula, /b_fa/);
  const bf = base.bw + base.clearSpacingLeft / 2 + base.clearSpacingRight / 2;
  const nominal = input.Mu / 0.9;
  const a = input.d - Math.sqrt(input.d ** 2 - 2 * nominal * 1e6 / (0.85 * input.fc * bf));
  const As = 0.85 * input.fc * bf * a / input.fy;
  assert.match(block.result, new RegExp(`a=${a.toFixed(2)}`));
  assert.match(steel.result, new RegExp(`A_\\{s,\\\\mathrm\\{calc\\}\\}=${As.toFixed(2)}`));
});

test("manual singly design re-solves the web beyond flange-only strength", () => {
  const input = { ...base, Mu: 270 };
  const result = designTBeam(input);
  const steps = getTBeamSolutionSteps(input, result);
  const screening = steps.find((step) => step.label === "Flange-only moment screening");
  const block = steps.find((step) => step.label === "Required compression-block depth in web");
  const steel = steps.find((step) => step.label === "Required steel from flange and web equilibrium");
  assert.ok(screening);
  assert.ok(block);
  assert.ok(steel);
  assert.match(screening.result, /Flange and web/);
  assert.match(block.formula, /M_1/);
  assert.match(steel.formula, /b_fh_f\+b_w/);
  const bf = base.bw + base.clearSpacingLeft / 2 + base.clearSpacingRight / 2;
  const Mf = 0.85 * input.fc * bf * input.hf * (input.d - input.hf / 2) / 1e6;
  const M1 = input.Mu / 0.9 - Mf;
  const x = (input.d - input.hf) - Math.sqrt((input.d - input.hf) ** 2 -
    2 * M1 * 1e6 / (0.85 * input.fc * input.bw));
  const a = input.hf + x;
  const As = 0.85 * input.fc * (bf * input.hf + input.bw * x) / input.fy;
  assert.match(block.result, new RegExp(`a=${a.toFixed(2)}`));
  assert.ok(steel.result.includes(`=${As.toFixed(2)}`));
  for (const step of [screening, block, steel]) {
    for (const math of [step.formula, step.substitution, step.result].filter(Boolean))
      assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
  }
});

test("doubly reinforced flange-only case checks elastic compression steel", () => {
  const input = { ...base, hf: 160, Mu: 750 };
  const result = designTBeam(input);
  assert.equal(result.sectionType, "doubly");
  assert.equal(result.sectionCase, "flange");
  assert.equal(result.concreteFlangeForce, 0);
  assert.equal(result.compressionSteelYields, false);
  assert.ok(result.compressionLayers.some((layer) => layer.stress < input.fy));
  const net = result.concreteWebForce +
    [...result.tensionLayers, ...result.compressionLayers].reduce((sum, layer) => sum + layer.netForce, 0);
  close(net, 0);
  assert.ok(result.phiMn >= input.Mu);
  const labels = getTBeamSolutionSteps(input, result).map((step) => step.label);
  for (const label of ["Minimum tension reinforcement", "Trial flange-only or flange-plus-web assumption",
    "Supplementary steel couple and displaced concrete", "Final force equilibrium",
    "Extreme tension strain and strength-reduction factor", "Nominal moment strength from the final force system",
    "Design moment and final status"]) assert.ok(labels.includes(label), label);
});

test("high-demand web case detects yielding compression reinforcement", () => {
  const result = designTBeam({ ...base, Mu: 550 });
  assert.equal(result.sectionType, "doubly");
  assert.equal(result.sectionCase, "web");
  assert.equal(result.compressionSteelYields, true);
  assert.ok(result.compressionLayers.every((layer) => Math.abs(layer.stress - base.fy) < 1e-8));
});

test("multiple singly reinforced rows use actual layer depths in the manual solution", () => {
  const input = { ...base, Mu: 650, hf: 120, fc: 28, span: 6000,
    clearSpacingLeft: 2700, clearSpacingRight: 2700 };
  const result = designTBeam(input);
  assert.equal(result.sectionType, "singly");
  assert.ok(result.tensionLayers.length > 1);
  const steps = getTBeamSolutionSteps(input, result);
  assert.ok(steps.some((step) => step.label === "Tension layer 2: final strain, stress, and force"));
  assert.ok(steps.some((step) => step.label === "Nominal moment strength from the final force system"));
  for (const step of steps) for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
    assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
  }
});

test("T design rejects compression steel that cannot fit or reach a compression strain", () => {
  assert.throws(() => designTBeam({ ...base, clearCover: 160 }), /compression steel|cover|fit/i);
  assert.throws(() => designTBeam({ ...base, Es: 0 }), /Es|positive/i);
});
