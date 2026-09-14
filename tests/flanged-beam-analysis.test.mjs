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

const { analyzeFlangedBeam, getFlangedBeamAnalysisSteps } = await import("../lib/flanged-beam-analysis.ts");

const common = {
  bw: 300,
  hf: 120,
  d: 550,
  span: 6000,
  beamSpacing: 3000,
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
  const beff = Math.min(6000 / 4, 300 + 16 * 120, 3000);
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

test("L-beam analysis applies the one-sided overhang limits", () => {
  const result = analyzeFlangedBeam({ ...common, shape: "L", Mu: null });
  const overhang = Math.min(6000 / 12, 6 * 120, (3000 - 300) / 2);

  close(result.effectiveOverhang, overhang);
  close(result.beff, 300 + overhang);
  assert.equal(result.status, "CAPACITY ONLY");
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
