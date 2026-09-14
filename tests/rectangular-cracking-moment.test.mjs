import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRectangularCrackingMoment } from '../lib/rectangular-cracking-moment.ts';

const close = (actual, expected, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

const baseInput = {
  mode: 'rectangle',
  direction: 'positive',
  reinforcementMode: 'none',
  fc: 28,
  lambda: 1,
  Es: 200_000,
  b: 300,
  h: 500,
};

test('TypeScript calculator finds cracking moment for an unreinforced rectangle', () => {
  const result = calculateRectangularCrackingMoment(baseInput);
  const fr = 0.62 * Math.sqrt(28);
  const Ig = (300 * 500 ** 3) / 12;
  const expectedMcr = (fr * Ig / 250) / 1_000_000;

  close(result.fr, fr);
  close(result.inertia, Ig);
  close(result.neutralAxisFromTop, 250);
  close(result.Mcr, expectedMcr);
});

test('TypeScript calculator transforms tension reinforcement before finding Mcr', () => {
  const input = {
    ...baseInput,
    reinforcementMode: 'bottom',
    bottomBarCount: 3,
    bottomBarDiameter: 25,
    d: 450,
  };
  const result = calculateRectangularCrackingMoment(input);
  const grossArea = input.b * input.h;
  const Ig = (input.b * input.h ** 3) / 12;
  const As = input.bottomBarCount * Math.PI * input.bottomBarDiameter ** 2 / 4;
  const n = input.Es / (4700 * Math.sqrt(input.fc));
  const transformedAs = n * As;
  const neutralAxis =
    (grossArea * input.h / 2 + transformedAs * input.d) /
    (grossArea + transformedAs);
  const inertia =
    Ig +
    grossArea * (input.h / 2 - neutralAxis) ** 2 +
    transformedAs * (input.d - neutralAxis) ** 2;

  close(result.As, As);
  close(result.transformedTensionArea, transformedAs);
  close(result.neutralAxisFromTop, neutralAxis);
  close(result.inertia, inertia);
  close(result.Mcr, result.fr * inertia / (input.h - neutralAxis) / 1_000_000);
});

test('TypeScript calculator supports custom section properties and rejects invalid values', () => {
  const result = calculateRectangularCrackingMoment({
    ...baseInput,
    mode: 'custom',
    reinforcementMode: 'none',
    Ig: 3_125_000_000,
    yt: 250,
  });

  close(result.Mcr, (0.62 * Math.sqrt(28) * 3_125_000_000 / 250) / 1_000_000);
  assert.throws(
    () => calculateRectangularCrackingMoment({ ...baseInput, b: 0 }),
    /positive value for b/,
  );
});
