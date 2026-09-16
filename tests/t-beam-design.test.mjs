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
  assert.ok(steps.some((step) => step.label === "Tension layer 2: strain, stress and force"));
  assert.ok(steps.at(-1).formula.includes("\\sum F_{s,i}d_i"));
  for (const step of steps) for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
    assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
  }
});

test("T design rejects compression steel that cannot fit or reach a compression strain", () => {
  assert.throws(() => designTBeam({ ...base, clearCover: 160 }), /compression steel|cover|fit/i);
  assert.throws(() => designTBeam({ ...base, Es: 0 }), /Es|positive/i);
});
