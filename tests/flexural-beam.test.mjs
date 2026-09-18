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

test('design solution shows every doubly reinforced calculation and final verification with valid KaTeX', () => {
  const input = problem(500, { b: 350, fc: 21, barDiameter: 32, compressionBarDiameter: 20 });
  const result = designSinglyReinforcedBeam(input);
  const solution = getDesignSolutionSteps(input, result);
  const labels = solution.map(step => step.label);

  assert.ok(labels.includes('Beam 1: singly reinforced tension steel'));
  assert.ok(labels.includes('Additional Beam 2 tension steel'));
  assert.ok(labels.includes('Compression-steel strain'));
  assert.ok(labels.includes('Compression-steel design stress'));
  assert.ok(labels.includes('Required compression steel area'));
  assert.ok(labels.includes('Tension-bar area, rounding, and provided area'));
  assert.ok(labels.includes('Compression-bar area, rounding, and provided area'));
  assert.ok(labels.includes('Horizontal clear spacing'));
  assert.ok(labels.includes('Final strain and stress in every reinforcement layer'));
  assert.ok(labels.includes('Final concrete force and force equilibrium'));
  assert.ok(labels.includes('Final nominal moment of the provided section'));
  assert.ok(labels.includes('Final strength-reduction factor'));
  assert.ok(labels.includes('Final design strength and complete check'));
  const compressionAreaStep = solution.find(step => step.label === 'Required compression steel area');
  const compressionStrainStep = solution.find(step => step.label === 'Compression-steel strain');
  const finalLayerStrainStep = solution.find(step => step.label === 'Final strain and stress in every reinforcement layer');
  const rhoStep = solution.find(step => step.label === 'Required singly reinforced ratio');
  const tensionBarCountStep = solution.find(step => step.label === 'Tension-bar area, rounding, and provided area');
  const compressionBarCountStep = solution.find(step => step.label === 'Compression-bar area, rounding, and provided area');
  const a1 = result.asSinglyPortion * input.fy / (0.85 * input.fc * input.b);
  const dTrial = input.h - input.cover - input.stirrupDiameter - input.barDiameter / 2;
  const dPrimeTrial = input.cover + input.stirrupDiameter + input.compressionBarDiameter / 2;
  close(result.mnSingly, result.asSinglyPortion * input.fy * (dTrial - a1 / 2) / 1e6);
  close(result.mnRemaining, result.requiredMn - result.mnSingly);
  close(result.asAdditionalTension, result.mnRemaining * 1e6 /
    (input.fy * (dTrial - dPrimeTrial)));
  const netCompressionStress = result.fsPrimeDesign - (dPrimeTrial <= a1 ? 0.85 * input.fc : 0);
  close(result.asCompression, result.asAdditionalTension * input.fy / netCompressionStress);
  assert.match(compressionAreaStep.formula, /A'_s=\\dfrac\{A_\{s2\}f_y\}\{f'_\{s,net\}\}/);
  assert.ok(compressionAreaStep.substitution.includes(result.asAdditionalTension.toFixed(2)));
  assert.ok(compressionAreaStep.substitution.includes(netCompressionStress.toFixed(2)));
  assert.ok(compressionAreaStep.substitution.includes(result.asCompression.toFixed(2)));
  assert.match(compressionStrainStep.formula, /0\.003\\times\\dfrac\{c_\{design\}-d'\}\{c_\{design\}\}/);
  assert.doesNotMatch(compressionStrainStep.formula, /0\.003dfrac/);
  assert.match(finalLayerStrainStep.formula, /0\.003\\times\\dfrac\{c-y_i\}\{c\}/);
  assert.match(rhoStep.formula, /\\dfrac\{1-\\sqrt\{1-\\dfrac\{2mR_n\}\{f_y\}\}\}\{m\}/);
  assert.ok(tensionBarCountStep.substitution.includes(
    'n_{min}=\\left\\lceil ' + result.barsBeforeRounding.toFixed(4) + ' \\right\\rceil=' + Math.ceil(result.barsBeforeRounding - 1e-10),
  ));
  assert.ok(compressionBarCountStep.substitution.includes(
    "n'_{min}=\\left\\lceil " + result.compressionBarsBeforeRounding.toFixed(4) + ' \\right\\rceil=' + Math.ceil(result.compressionBarsBeforeRounding - 1e-10),
  ));
  assert.ok(solution.every(step =>
    ![step.formula, step.substitution, step.resultMath].some(math => math?.includes('/')),
  ), 'every division in the displayed solution must use fraction notation');
  assert.match(solution.find(step => step.label === 'Whitney stress-block factor').formula, /\\quad/);
  assert.match(solution.find(step => step.label === 'Whitney stress-block factor').formula, /\\le/);
  assert.match(solution.find(step => step.label === 'Final design strength and complete check').formula, /\\ge/);
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
  assert.match(result.failureDetails, /needs at least .* section can hold at most/);
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

test('doubly design can recover from an over-reinforced singly bar-count trial', () => {
  const input = problem(175, { b: 200, h: 450, stirrupDiameter: 10,
    barDiameter: 20, compressionBarDiameter: 20 });
  const result = designSinglyReinforcedBeam(input);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.sectionType, 'doubly');
  assert.ok(result.barsRequired < 6);
  assert.ok(result.phiMn >= input.Mu);
  assert.ok(result.rhoProvided <= 0.025);
  assert.ok(result.compressionLayers.every(layer => layer.state === 'compression'));
});

test('a detail-limited singly trial can reserve moment for a valid steel couple', () => {
  const input = problem(200, { b: 200, h: 500, stirrupDiameter: 10,
    barDiameter: 12, compressionBarDiameter: 20 });
  const result = designSinglyReinforcedBeam(input);
  assert.equal(result.ok, true, result.message);
  assert.equal(result.sectionType, 'doubly');
  assert.ok(result.mnRemaining > 0);
  assert.ok(result.phiMn >= input.Mu);
  assert.ok(result.compressionBarsRequired > 0);
});

test('an over-limit doubly trial reports the ratio check instead of a later bar-fit trial', () => {
  const input = problem(200, { b: 200, h: 450, stirrupDiameter: 10,
    barDiameter: 16, compressionBarDiameter: 20 });
  const result = designSinglyReinforcedBeam(input);
  assert.equal(result.ok, false);
  assert.equal(result.failureType, 'reinforcement-limit');
  assert.match(result.failureDetails, /can carry Mu.*exceeds ρmax=0.025/);
});

test('a doubly design can adopt the sufficient five-bar layout without inheriting the singly bar count', () => {
  const input = problem(520, {
    b: 300, h: 600, cover: 40, stirrupDiameter: 10, aggregateSize: 19,
    barDiameter: 28, compressionBarDiameter: 20,
  });
  const result = designSinglyReinforcedBeam(input);
  const barStep = getDesignSolutionSteps(input, result)
    .find(step => step.label === 'Tension-bar area, rounding, and provided area');

  assert.equal(result.ok, true);
  assert.equal(Math.ceil(result.barsBeforeRounding - 1e-10), 5);
  assert.equal(result.barsRequired, 5);
  assert.deepEqual(result.tensionBarsPerLayer, [4, 1]);
  assert.ok(result.phiMn >= input.Mu);
  assert.match(barStep.result, /Adopt 5 bottom bars/);
});

test('an optional target tension strain derives c and changes the strain-based design trial', () => {
  const input = problem(500, {
    b: 350, fc: 21, barDiameter: 32, compressionBarDiameter: 20,
    targetTensionStrain: 0.006,
  });
  const defaultResult = designSinglyReinforcedBeam({ ...input, targetTensionStrain: undefined });
  const result = designSinglyReinforcedBeam(input);
  const trialD = input.h - input.cover - input.stirrupDiameter - input.barDiameter / 2;
  const expectedC = 0.003 * trialD / (0.003 + input.targetTensionStrain);
  const designSteps = getDesignSolutionSteps(input, result);
  const strainStep = designSteps.find(step => step.label === 'Target tension strain and neutral-axis depth');
  const superpositionStep = designSteps.find(step => step.label === 'Doubly reinforced design strain and neutral axis');
  const fullSteps = getSolutionSteps(input, result);

  assert.equal(result.ok, true);
  assert.equal(result.input.targetTensionStrain, 0.006);
  assert.equal(result.sectionType, 'doubly');
  close(result.phiAssumed, 0.9);
  assert.ok(strainStep.substitution.includes(expectedC.toFixed(2)));
  assert.ok(superpositionStep.resultMath.includes('\\varepsilon_{t,design}=0.006000'));
  assert.notDeepEqual(result.compressionBarsPerLayer, defaultResult.compressionBarsPerLayer);
  assert.ok(designSteps.every(step =>
    ![step.formula, step.substitution, step.resultMath].some(math => math?.includes('/')),
  ), 'target-strain solution divisions must also use fraction notation');
  for (const step of [...designSteps, ...fullSteps]) {
    for (const math of [step.formula, step.substitution, step.resultMath].filter(Boolean)) {
      assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), step.label);
    }
  }
});

test('a target-strain trial that cannot carry Mu switches to doubly reinforced even if rounded tension bars appear sufficient', () => {
  const input = problem(450, {
    b: 300, h: 600, barDiameter: 25, compressionBarDiameter: 25,
    targetTensionStrain: 0.006,
  });
  const result = designSinglyReinforcedBeam(input);
  const singlyTrial = result.iterationRows[0];

  assert.ok(singlyTrial.phiMn > input.Mu, 'rounded tension bars alone appear to carry Mu');
  assert.match(singlyTrial.reason, /target-strain singly reinforced block provides phi Mn=.*below Mu/);
  assert.equal(result.ok, true);
  assert.equal(result.sectionType, 'doubly');
  assert.ok(result.compressionBarsRequired > 0);
  assert.ok(result.phiMn >= input.Mu);
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

test('rho max rejects an over-limit singly layout but allows a valid doubly redesign', () => {
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
  assert.equal(result.ok, true);
  assert.equal(result.sectionType, 'doubly');
  assert.ok(result.rhoProvided <= result.rhoMax);
  assert.ok(result.phiMn >= input.Mu);
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
  assert.match(validateFlexuralBeamInput(problem(300, { targetTensionStrain: Number.NaN })), /finite numeric value/);
  assert.match(validateFlexuralBeamInput(problem(300, { targetTensionStrain: 0.003 })), /at least 0\.004/);
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


