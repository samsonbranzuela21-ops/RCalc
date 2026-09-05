import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SLAB_PROBLEM, designSlabProblem } from '../lib/one-way-slab.ts';
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('the supplied classroom problem needs no floor dimensions or precomputed depth', () => {
  const result = designSlabProblem(DEFAULT_SLAB_PROBLEM);
  close(result.exteriorClear, 3.9); close(result.interiorClear, 4.2);
  close(result.minimumThickness, 175); assert.equal(result.thickness, 180);
  close(result.spans[0].result.d, 155);
  // Independent hand calculation: self = 0.180*24 = 4.32;
  // D = 4.32+2.8 = 7.12; wu = 1.2*7.12+1.6*2.4 = 12.384.
  close(result.spans[0].result.selfWeight, 4.32);
  close(result.spans[0].result.factoredLoad, 12.384);
  const moments = [7.84836, 13.454331428571429, 20.312856, 13.65336, 19.859432727272727];
  result.zones.forEach((zone, index) => close(zone.design.Mu, moments[index]));
  assert.deepEqual(result.zones.map(zone => zone.design.tableCase.denominator), [24,14,10,16,11]);
  assert.deepEqual(result.zones.map(zone => zone.design.spacingProvided), [240,240,220,240,225]);
  assert.equal(result.overallOk, true);
  assert.ok(result.spans.every(span => span.input.geometryMode === 'strip'));
});
test('two spans designs both spans as end spans; three spans uses actual neighboring end spans', () => {
  const two = designSlabProblem({...DEFAULT_SLAB_PROBLEM, spanCount:2});
  assert.equal(two.thickness, 190);
  assert.ok(two.spans.every(span => span.result.designs[0].tableCase.denominator === 14));
  assert.equal(two.zones[2].design.tableCase.denominator, 9);
  const three = designSlabProblem({...DEFAULT_SLAB_PROBLEM, spanCount:3});
  three.spans[1].result.designs.filter(item => item.face === 'top').forEach(item => close(item.designSpan, 4.05));
});
test('equal 2.8 m beam spacings reproduce the highlighted 1/14 and 1/10 cases', () => {
  const result = designSlabProblem({...DEFAULT_SLAB_PROBLEM, exteriorSpacing:2.8, interiorSpacing:2.8, spanCount:3});
  close(result.exteriorClear, 2.5); close(result.interiorClear, 2.5);
  assert.equal(result.zones[1].design.tableCase.denominator, 14);
  assert.equal(result.zones[2].design.tableCase.denominator, 10);
  const special = designSlabProblem({...DEFAULT_SLAB_PROBLEM, exteriorSpacing:2.8, interiorSpacing:2.8, negativeRule:'short-spans'});
  assert.ok(special.zones.filter(zone => zone.design.face === 'top').every(zone => zone.design.tableCase.denominator === 12));
});
test('a supplied thickness is checked without silently increasing it', () => {
  const result = designSlabProblem({...DEFAULT_SLAB_PROBLEM, thickness:150});
  assert.equal(result.thickness, 150); assert.equal(result.overallOk, false);
  assert.equal(result.trials.length, 1);
});
test('automatic thickness retries re-evaluate dead load and all reinforcement checks', () => {
  const result = designSlabProblem({...DEFAULT_SLAB_PROBLEM, superimposedDeadLoad:30, fc:17});
  assert.ok(result.trials.length > 1);
  assert.equal(result.trials[0].adequate, false);
  assert.equal(result.overallOk, true);
  close(result.spans[0].result.selfWeight, result.thickness / 1000 * 24);
  assert.ok(result.spans.every(span => span.result.overallOk));
});
test('blank/invalid givens and unsupported table conditions produce errors', () => {
  for (const changes of [{beamWidth:NaN},{beamWidth:4500},{superimposedDeadLoad:NaN},{superimposedDeadLoad:-1},{exteriorSpacing:0},{interiorSpacing:8},{thickness:NaN},{barDiameter:0},{liveLoad:100},{negativeRule:'short-spans'},{spanCount:1},{cover:NaN}]) {
    assert.throws(() => designSlabProblem({...DEFAULT_SLAB_PROBLEM,...changes}));
  }
});
test('unrestrained exterior ends have no exterior negative moment recommendations', () => {
  const result = designSlabProblem({...DEFAULT_SLAB_PROBLEM,endSupport:'unrestrained'});
  assert.equal(result.zones[0].design.tableCase.denominator, 11);
  assert.ok(result.zones.every(zone => !zone.label.includes('exterior support')));
});
