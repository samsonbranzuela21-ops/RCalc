import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {
  designSinglyReinforcedBeam,
  getDesignSolutionSteps,
  getReinforcementLayoutCapacity,
  getSolutionSteps,
  validateFlexuralBeamInput,
} from '../lib/flexural-beam.ts';

const common = {
  b: 300, h: 600, cover: 40, stirrupDiameter: 12, aggregateSize: 19,
  fc: 28, fy: 420, Es: 200_000, barDiameter: 25, compressionBarDiameter: 25,
};

const problem = (Mu, overrides = {}) => ({ Mu, ...common, ...overrides });
const area = (count, diameter) => count * Math.PI * diameter ** 2 / 4;
const close = (actual, expected, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test('design-only solution ends with reinforcement and spacing, with valid KaTeX', () => {
  const input = problem(500, { b: 350, fc: 21, barDiameter: 32, compressionBarDiameter: 20 });
  const result = designSinglyReinforcedBeam(input);
  const solution = getDesignSolutionSteps(input, result);
  const labels = solution.map(step => step.label);

  assert.ok(labels.includes('Beam 1: singly reinforced portion'));
  assert.ok(labels.includes('Beam 2: additional tension steel'));
  assert.ok(labels.includes('Beam 2: required compression steel'));
  assert.ok(labels.includes('Horizontal clear spacing'));
  assert.ok(!labels.some(label => /force equilibrium|provided-section strain|moment capacity/i.test(label)));
  assert.match(solution.find(step => step.label === 'Horizontal clear spacing').formula, /b-2d_\{st\}-2C_c-n d_b/);
  assert.ok(!JSON.stringify(solution).includes('Module 4'));
  for (const step of solution) {
    for (const math of [step.formula, step.substitution, step.resultMath].filter(Boolean)) {
      assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
    }
  }
});

test('Problem 19 one-layer design agrees with an independent force and moment calculation', () => {
  const input = problem(350);
  const result = designSinglyReinforcedBeam(input);
  const As = area(4, 25);
  const d = 600 - 40 - 12 - 25 / 2;
  const a = (As * 420) / (0.85 * 28 * 300);
  const c = a / result.beta1;
  const epsilonT = 0.003 * (d - c) / c;
  const Mn = (As * 420 * (d - a / 2)) / 1e6;

  assert.equal(result.ok, true);
  assert.equal(result.sectionType, 'singly');
  assert.deepEqual(result.tensionBarsPerLayer, [4]);
  close(result.d, d);
  close(result.a, a);
  close(result.c, c);
  close(result.epsilonT, epsilonT);
  assert.ok(epsilonT >= 0.005);
  close(result.Mn, Mn);
  close(result.phiMn, 0.9 * Mn);
  assert.ok(result.phiMn >= input.Mu);
});

test('spacing guidance uses clear prose and the manual solution preserves KaTeX equations', () => {
  const input = problem(350);
  const result = designSinglyReinforcedBeam(input);
  const solution = getSolutionSteps(input, result);
  const capacityStep = solution.find(step => step.label === 'Aggregate-based clear spacing and width inside stirrups');

  assert.match(result.spacingMessage, /4 tension bars arranged in 1 layer/);
  assert.match(result.spacingMessage, /up to 4 bars per layer/);
  assert.match(result.spacingMessage, /One layer is provided, so a vertical layer-spacing check does not apply/);
  assert.doesNotMatch(result.spacingMessage, /layer\(s\)|bar\(s\)|n d_b|s_clear,min/);
  assert.match(capacityStep.result, /4 tension bars in 1 layer/);
  assert.match(capacityStep.resultMath, /\\dfrac/);
  assert.match(capacityStep.resultMath, /\\le/);
  assert.ok(solution.every(step => !step.result.includes('\\')));
  assert.ok(solution.every(step => !step.reference?.includes('§')));
  assert.ok(solution.every(step => ![step.formula, step.substitution, step.resultMath].some(math => math?.includes('\\cdot'))));
  for (const step of solution) {
    for (const math of [step.formula, step.substitution, step.resultMath].filter(Boolean)) {
      assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
    }
  }
  const layerSpacing = solution.find(step => step.label === 'Tension layer-by-layer spacing and physical fit');
  assert.match(layerSpacing.formula, /b-2d_\{st\}-2C_c-n d_b/);
  assert.match(layerSpacing.explanation, /clear spacing provided, which must be at least s_clear,min/);
  assert.match(layerSpacing.explanation, /no vertical-spacing or upper-layer alignment check applies/);
  const firstLayer = result.tensionLayers[0];
  close(firstLayer.uniformSpreadClearSpacing,
    (input.b - 2 * input.stirrupDiameter - 2 * input.cover - firstLayer.count * firstLayer.barDiameter) /
      (firstLayer.count - 1));
  assert.ok(firstLayer.clearGaps.every(gap => gap >= result.minClearSpacingRequired));
});

test('Problem 20 keeps the fixed 25 mm bar size and resolves a valid second layer', () => {
  const input = problem(400);
  const result = designSinglyReinforcedBeam(input);

  assert.equal(result.ok, true);
  assert.equal(result.sectionType, 'singly');
  assert.deepEqual(result.tensionBarsPerLayer, [4, 1]);
  close(result.minClearSpacingRequired, (4 / 3) * 19);
  close(result.tensionLayers[0].clearSpacing, 32);
  assert.equal(result.tensionLayers[1].clearSpacing, null);
  close(result.tensionLayers[0].verticalClearSpacingToNext, 25);
  const expectedCentroidDepth = (4 * 535.5 + 1 * 485.5) / 5;
  close(result.d, expectedCentroidDepth);
  assert.ok(result.tensionLayers.every(layer => layer.directlyAbovePreviousLayer !== false));
  assert.ok(result.spacingOk && result.verticalSpacingOk);
  assert.ok(result.phiMn >= input.Mu);
  assert.ok(result.tensionLayers.every(layer =>
    layer.yFromCompressionFace - layer.barDiameter / 2 >= input.cover + input.stirrupDiameter,
  ));
});

test('reinforcement layer capacity includes both cover-to-bar-centre distances', () => {
  const input = problem(180, {
    b: 300, h: 510, cover: 40, stirrupDiameter: 10, aggregateSize: 19,
    barDiameter: 20, compressionBarDiameter: 20,
  });
  const capacity = getReinforcementLayoutCapacity(input, 'tension');

  assert.equal(capacity.widthInsideStirrups, 200);
  close(capacity.minimumHorizontalClearSpacing, 4 * 19 / 3);
  assert.equal(capacity.maximumBarsPerLayer, 4);
  assert.equal(capacity.maximumLayers, 9);
  assert.equal(capacity.maximumTotalBars, 36);
  assert.equal(capacity.minimumVerticalClearSpacing, 25);
});

test('an infeasible bar count reports concise code-based layout limits, not the trial dump', () => {
  const input = problem(2500, {
    b: 300, h: 510, cover: 40, stirrupDiameter: 10, aggregateSize: 19,
    barDiameter: 20, compressionBarDiameter: 20,
  });
  const result = designSinglyReinforcedBeam(input);

  assert.equal(result.ok, false);
  assert.equal(result.failureType, 'layout');
  assert.match(result.message, /Not adequate/);
  assert.doesNotMatch(result.message, /bounded at|T .*\/C|bar-count increments/);
  assert.ok(result.iterationRows.some(row => row.reason.includes('section allows at most')));
  const iterationStep = getSolutionSteps(input, result).find(step => step.label === 'Iteration record');
  assert.doesNotMatch(iterationStep.explanation, /Trial \d+:/);
});

test('Problem 21 switches to a doubly reinforced design after the singly trial fails capacity', () => {
  const input = problem(500, { barDiameter: 32, compressionBarDiameter: 32 });
  const result = designSinglyReinforcedBeam(input);

  assert.equal(result.ok, true);
  assert.equal(result.sectionType, 'doubly');
  assert.ok(result.iterationRows.some(row => row.compressionBars === String.fromCharCode(0x2014) && row.phiMn !== null && row.phiMn < input.Mu));
  assert.ok(result.compressionBarsRequired > 0);
  assert.ok(result.strainOk && result.equilibriumOk && result.strengthOk);
  assert.ok(result.phiMn >= input.Mu);
  assert.ok(result.fsPrime < input.fy, 'the final top steel should not be assumed to yield');
  assert.equal(result.compressionSteelYields, false);
  const solution = getSolutionSteps(input, result);
  assert.ok(solution.every(step => !step.result.includes('\\')));
  for (const step of solution) {
    for (const math of [step.formula, step.substitution, step.resultMath].filter(Boolean)) {
      assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
    }
  }
  assert.ok(solution.find(step => step.label === 'Doubly reinforced superposition trial').substitution.includes('c_{design}'));
  assert.ok(solution.find(step => step.label === 'Compression-steel strain, stress, and theoretical area').substitution.includes('s,design'));
});

test('Problem 27 checks bar counts and rechecks phi from final strain', () => {
  const input = problem(500, { b: 350, fc: 21, barDiameter: 32, compressionBarDiameter: 20 });
  const result = designSinglyReinforcedBeam(input);

  assert.equal(result.ok, true);
  assert.equal(result.sectionType, 'doubly');
  assert.deepEqual(result.tensionBarsPerLayer, [4]);
  assert.deepEqual(result.compressionBarsPerLayer, [2]);
  assert.ok(result.epsilonT >= 0.004 && result.epsilonT < 0.005);
  assert.ok(result.phi < 0.9, 'final phi must reflect the rounded barsâ€™ final strain');
  assert.ok(result.phiMn >= input.Mu);
  assert.ok(result.spacingOk && result.compressionSpacingOk && result.geometryOk);
});

test('rho max is fixed at the cited code limit and stays distinct from phi', () => {
  const input = problem(350);
  const result = designSinglyReinforcedBeam(input);
  const solution = getSolutionSteps(input, result);

  assert.equal(result.rhoMax, 0.025);
  assert.notEqual(result.rhoMax, result.phi);
  assert.ok(result.rhoRequired <= result.rhoMax && result.rhoProvided <= result.rhoMax);
  close(result.asMax, result.rhoMax * result.b * result.d);
  assert.equal(result.requiredRhoLimitOk, true);
  assert.equal(result.rhoLimitOk, true);
  assert.match(solution.find(step => step.label === 'Maximum reinforcement ratio').reference, /NSCP 2015 Section 418\.6\.3\.1 \/ ACI 318-14 Section 18\.6\.3\.1/);
  assert.ok(solution.every(step => !step.reference || /^(NSCP|ACI)/.test(step.reference)));
  assert.ok(!JSON.stringify(solution).includes('Module 4'));
  assert.ok(!JSON.stringify(result.warnings).includes('Module 4'));
});

test('rho max rejects a rounded bar layout that exceeds the limit while required steel fits', () => {
  const input = problem(145, {
    b: 200, h: 450, stirrupDiameter: 10, barDiameter: 12, compressionBarDiameter: 12,
  });
  const result = designSinglyReinforcedBeam(input);
  const rejectedTrial = result.iterationRows.find(row => row.reason.includes('exceeds ρmax=0.025'));
  assert.ok(rejectedTrial, 'an over-limit trial should be recorded');

  const trialBars = rejectedTrial.tensionBars.split('+').reduce((sum, count) => sum + Number(count), 0);
  const requiredRatio = rejectedTrial.asRequired / (input.b * rejectedTrial.d);
  const roundedProvidedRatio = area(trialBars, input.barDiameter) / (input.b * rejectedTrial.d);
  assert.ok(requiredRatio <= result.rhoMax);
  assert.ok(roundedProvidedRatio > result.rhoMax);
  assert.equal(result.ok, false);
});

test('legacy effective-depth callers retain d instead of having it reinterpreted as h', () => {
  const input = { Mu: 180, b: 300, d: 450, fc: 28, fy: 420, barDiameter: 20 };
  const result = designSinglyReinforcedBeam(input);

  assert.equal(result.input.legacyEffectiveDepth, true);
  close(result.d, 450);
  assert.ok(Number.isNaN(result.input.h));
  assert.ok(getSolutionSteps(input, result)[0].explanation.includes('preserved as d'));
});

test('invalid nonfinite inputs and infeasible reinforcement layouts fail clearly', () => {
  const nonfinite = problem(Number.POSITIVE_INFINITY);
  assert.match(validateFlexuralBeamInput(nonfinite), /finite numeric value/);
  assert.match(validateFlexuralBeamInput(problem(300, { b: 90 })), /usable beam width/);

  const tooSmall = {
    Mu: 300, b: 150, h: 180, cover: 25, stirrupDiameter: 10, aggregateSize: 19,
    fc: 28, fy: 420, Es: 200_000, barDiameter: 32, compressionBarDiameter: 32,
  };
  const result = designSinglyReinforcedBeam(tooSmall);
  assert.equal(result.ok, false);
  assert.match(result.message, /Not adequate/);
  assert.match(result.failureDetails, /below the neutral axis/i);
});


