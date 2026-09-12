import test from "node:test";
import assert from "node:assert/strict";
import katex from "katex";
import { checkBeamCapacity, getBeamCapacitySolutionSteps } from "../lib/beam-capacity.ts";

const area = (bars, diameter) => bars * Math.PI * diameter ** 2 / 4;
const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test("singly reinforced elastic tension steel re-solves c from C = T", () => {
  const result = checkBeamCapacity({
    b: 250, d: 430, dPrime: 0, fc: 28, fy: 420,
    As: area(4, 32), AsPrime: 0,
  });

  assert.equal(result.tensionSteelYields, false);
  close(result.c, 256.9736921570669);
  close(result.tensionStress, 403.99382455969766);
  close(result.Mn, 416.9079789421168);
  assert.ok(getBeamCapacitySolutionSteps(
    { b: 250, d: 430, dPrime: 0, fc: 28, fy: 420, As: area(4, 32), AsPrime: 0 },
    result,
  ).some((step) => step.label.includes("Re-solve c from C = T")));
});

test("singly reinforced yielding example remains unchanged", () => {
  const result = checkBeamCapacity({
    b: 300, d: 530, dPrime: 0, fc: 28, fy: 420,
    As: area(4, 25), AsPrime: 0,
  });

  assert.equal(result.tensionSteelYields, true);
  close(result.Mn, 389.449608164394);
  close(result.phiMn, 350.50464734795463);
});

test("beam capacity uses rho max 0.025 and shows the complete geometry workflow", () => {
  const barArea = area(1, 25);
  const input = {
    b: 300, d: 510.5, dPrime: 0, fc: 28, fy: 420,
    As: 5 * barArea, AsPrime: 0, Mu: 300,
    tensionLayers: [
      { area: 4 * barArea, depth: 535.5, barCount: 4 },
      { area: barArea, depth: 485.5, barCount: 1 },
    ],
    detailing: {
      depthsFromOverall: true,
      overallDepth: 600,
      clearCover: 40,
      stirrupDiameter: 12,
      tensionBarDiameter: 25,
      compressionBarDiameter: 25,
      tensionBarsPerLayer: [4, 1],
      compressionBarsPerLayer: [],
    },
  };
  const result = checkBeamCapacity(input);
  const solution = getBeamCapacitySolutionSteps(input, result);
  const ratioStep = solution.find((step) => step.label === "Tension steel area and reinforcement ratio checks");

  assert.equal(result.rhoMax, 0.025);
  assert.match(ratioStep.formula, /\\rho_\{max\}=0\.025/);
  assert.doesNotMatch(ratioStep.formula, /rho_b|0\.75/);
  assert.ok(solution.some((step) => step.label === "Reinforcement-layer depths from the section geometry"));
  assert.ok(solution.some((step) => step.label === "Individual layer depths and combined effective depth"));
  assert.ok(solution.some((step) => step.label === "Clear spacing of the entered tension-bar arrangement"));
  assert.ok(solution.some((step) => step.label === "Nominal moment capacity, Mₙ"));
  assert.ok(solution.some((step) => step.label === "Design moment capacity, φMₙ"));
  assert.ok(solution.some((step) => step.label === "Adequacy check"));
  for (const step of solution) {
    for (const math of [step.formula, step.substitution, step.resultKind === "text" ? null : step.result].filter(Boolean)) {
      assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
    }
  }
});

test("two tension layers use d1 and d2 individually and report their combined depth", () => {
  const barArea = area(1, 32);
  const input = {
    b: 250, d: 400, dPrime: 0, fc: 28, fy: 420,
    As: 4 * barArea, AsPrime: 0,
    tensionLayers: [
      { area: 3 * barArea, depth: 430, barCount: 3 },
      { area: barArea, depth: 370, barCount: 1 },
    ],
  };
  const result = checkBeamCapacity(input);
  const concreteForce = 0.85 * input.fc * input.b * result.a;
  const layerForce = result.tensionLayers.reduce((sum, layer) => sum + layer.force, 0);
  const expectedMoment = (
    result.tensionLayers.reduce((sum, layer) => sum + layer.force * layer.depth, 0)
    - concreteForce * result.a / 2
  ) / 1e6;

  close(result.d, 415);
  close(result.dExtremeTension, 430);
  close(concreteForce, layerForce, 1e-5);
  close(result.Mn, expectedMoment, 1e-9);
  assert.equal(result.tensionLayers.length, 2);
  assert.notEqual(result.tensionLayers[0].strain, result.tensionLayers[1].strain);
  const solution = getBeamCapacitySolutionSteps(input, result);
  const depthStep = solution.find((step) => step.label === "Individual layer depths and combined effective depth");
  assert.ok(depthStep);
  assert.match(depthStep.formula, /n_iA_\{bi\}d_i/);
  assert.match(depthStep.substitution, /\(3\).*\(430\.0\).*\(1\).*\(370\.0\)/);
  assert.ok(solution.some((step) => step.label === "Solve force equilibrium using each tension layer"));
});

test("doubly reinforced equilibrium uses the calculated compression-steel stress", () => {
  const input = {
    b: 300, d: 450, dPrime: 60, fc: 28, fy: 420,
    As: area(5, 25), AsPrime: area(2, 16),
  };
  const result = checkBeamCapacity(input);
  const compressionForce = 0.85 * input.fc * input.b * result.a
    + input.AsPrime * result.fsPrime;
  const tensionForce = input.As * result.tensionStress;

  assert.equal(result.tensionSteelYields, true);
  assert.equal(result.compressionSteelYields, false);
  close(compressionForce, tensionForce, 1e-5);
  close(result.fsPrime, 354.08393778209813);
});

test("doubly reinforced module examples match the NSCP solution process", () => {
  const examples = [
    { top: 2, topDiameter: 22, bottom: 3, bottomDiameter: 28, expected: 262.15627352239164 },
    { top: 2, topDiameter: 16, bottom: 4, bottomDiameter: 32, expected: 309.9083387122124 },
    { top: 2, topDiameter: 22, bottom: 2, bottomDiameter: 22, expected: 116.12499076282892 },
  ];

  for (const example of examples) {
    const result = checkBeamCapacity({
      b: 250,
      d: 430,
      dPrime: 70,
      fc: 28,
      fy: 420,
      As: area(example.bottom, example.bottomDiameter),
      AsPrime: area(example.top, example.topDiameter),
    });
    close(result.phiMn, example.expected, 1e-9);
    assert.equal(result.tensionSteelYields, true);
  }
});
