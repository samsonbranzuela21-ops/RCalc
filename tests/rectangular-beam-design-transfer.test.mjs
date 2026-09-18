import test from 'node:test';
import assert from 'node:assert/strict';
import { designSinglyReinforcedBeam } from '../lib/flexural-beam.ts';
import { rectangularBeamAnalysisHref, readRectangularBeamDesignTransfer } from '../lib/rectangular-beam-design-transfer.ts';

const input = {
  Mu: 180, b: 200, h: 510, cover: 40, stirrupDiameter: 10,
  aggregateSize: 19, fc: 28, fy: 420, Es: 200000,
  barDiameter: 20, compressionBarDiameter: 20,
};

function parseHref(href) {
  const url = new URL(href, 'http://localhost:3000');
  return readRectangularBeamDesignTransfer(Object.fromEntries(url.searchParams));
}

test('a feasible three-layer rectangular design transfers every layer to analysis', () => {
  const result = designSinglyReinforcedBeam(input);
  assert.equal(result.ok, true);
  assert.deepEqual(result.tensionBarsPerLayer, [2, 2, 1]);

  const prefill = parseHref(rectangularBeamAnalysisHref(result));
  assert.ok(prefill);
  assert.deepEqual(prefill.tensionRows, [2, 2, 1]);
  assert.deepEqual(prefill.compressionRows, []);
  assert.equal(prefill.h, input.h);
  assert.equal(prefill.clearCover, input.cover);
  assert.equal(prefill.tensionBarDiameter, input.barDiameter);
});

test('the analysis transfer accepts three compression layers but rejects invalid counts', () => {
  const result = designSinglyReinforcedBeam(input);
  const url = new URL(rectangularBeamAnalysisHref(result), 'http://localhost:3000');
  url.searchParams.set('doubly', '1');
  url.searchParams.set('compressionRows', '2,2,1');
  assert.deepEqual(parseHref(url.href)?.compressionRows, [2, 2, 1]);
  url.searchParams.set('compressionRows', '2,0,1');
  assert.equal(parseHref(url.href), undefined);
});
