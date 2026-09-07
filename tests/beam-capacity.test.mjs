import test from "node:test";
import assert from "node:assert/strict";
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
