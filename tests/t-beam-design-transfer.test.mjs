import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

const rootUrl = new URL("../", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) return nextResolve(new URL(specifier.slice(2) + ".ts", rootUrl).href, context);
    return nextResolve(specifier, context);
  },
});
const { designTBeam } = await import("../lib/t-beam.ts");
const { analyzeFlangedBeam } = await import("../lib/flanged-beam-analysis.ts");
const { lBeamAnalysisHref, readLBeamDesignTransfer, tBeamAnalysisHref, readTBeamDesignTransfer } =
  await import("../lib/t-beam-design-transfer.ts");

const base = {
  Mu: 600, bw: 300, hf: 50, d: 550, span: 2000,
  clearSpacingLeft: 300, clearSpacingRight: 300,
  fc: 21, fy: 420, Es: 200000, barDiameter: 25,
  compressionBarDiameter: 20, clearCover: 40, stirrupDiameter: 10,
  aggregateSize: 19,
};

function roundTrip(input) {
  const result = designTBeam(input);
  const href = tBeamAnalysisHref(input, result);
  const query = Object.fromEntries(new URL(href, "http://localhost").searchParams);
  return { result, href, prefill: readTBeamDesignTransfer(query) };
}

function roundTripL(input) {
  const result = designTBeam(input);
  const href = lBeamAnalysisHref(input, result);
  const query = Object.fromEntries(new URL(href, "http://localhost").searchParams);
  return { result, href, prefill: readLBeamDesignTransfer(query) };
}

test("calculated asymmetric T flange design transfers exact adopted layers and geometry", () => {
  const input = { ...base, clearSpacingLeft: 200, clearSpacingRight: 400 };
  const { result, prefill } = roundTrip(input);
  assert.ok(prefill);
  assert.equal(prefill.flangeWidthMode, "calculated");
  assert.equal(prefill.clearSpacingLeft, 200);
  assert.equal(prefill.clearSpacingRight, 400);
  assert.equal(prefill.span, input.span);
  assert.equal(prefill.compressionLayers.length, result.compressionLayers.length);
  assert.deepEqual(prefill.tensionLayers.map((layer) => [layer.barCount, layer.barDiameter, layer.depth]),
    result.tensionLayers.map((layer) => [layer.barCount, layer.diameter, layer.depth]));
  assert.deepEqual(prefill.compressionLayers.map((layer) => [layer.barCount, layer.barDiameter, layer.depth]),
    result.compressionLayers.map((layer) => [layer.barCount, layer.diameter, layer.depth]));
  const analyzed = analyzeFlangedBeam({
    ...prefill, shape: "T", barCount: prefill.tensionLayers[0].barCount,
    barDiameter: prefill.tensionLayers[0].barDiameter,
  });
  assert.ok(Math.abs(analyzed.beff - result.beff) < 1e-8);
  assert.ok(Math.abs(analyzed.Mn - result.Mn) < 1e-5);
  assert.ok(Math.abs(analyzed.phiMn - result.phiMn) < 1e-5);
});

test("given bf design transfers without a span or spacing", () => {
  const input = { ...base, flangeWidthMode: "given", bf: 600,
    span: undefined, clearSpacingLeft: undefined, clearSpacingRight: undefined };
  const { result, prefill } = roundTrip(input);
  assert.ok(prefill);
  assert.equal(prefill.bf, 600);
  assert.equal(prefill.span, undefined);
  assert.equal(prefill.clearSpacingLeft, undefined);
  const analyzed = analyzeFlangedBeam({
    ...prefill, shape: "T", barCount: prefill.tensionLayers[0].barCount,
    barDiameter: prefill.tensionLayers[0].barDiameter,
  });
  assert.ok(Math.abs(analyzed.beff - result.beff) < 1e-8);
  assert.ok(Math.abs(analyzed.phiMn - result.phiMn) < 1e-5);
});

test("calculated L flange design transfers one-sided geometry and adopted layers", () => {
  const input = { ...base, shape: "L", Mu: 150, span: 6000,
    clearSpacingLeft: 2700, clearSpacingRight: undefined };
  const { result, href, prefill } = roundTripL(input);
  assert.match(href, /l-beam-analysis\?/);
  assert.ok(prefill);
  assert.equal(prefill.clearSpacingLeft, 2700);
  assert.equal(prefill.clearSpacingRight, undefined);
  assert.equal(prefill.span, 6000);
  assert.equal(prefill.compressionLayers.length, result.compressionLayers.length);
  const analyzed = analyzeFlangedBeam({
    ...prefill, shape: "L", barCount: prefill.tensionLayers[0].barCount,
    barDiameter: prefill.tensionLayers[0].barDiameter,
  });
  assert.ok(Math.abs(analyzed.beff - result.beff) < 1e-8);
});

test("transfer rejects invalid or unrelated query data", () => {
  const { href } = roundTrip({ ...base, Mu: 150 });
  const query = Object.fromEntries(new URL(href, "http://localhost").searchParams);
  assert.equal(readTBeamDesignTransfer({ ...query, source: "other" }), undefined);
  assert.equal(readTBeamDesignTransfer({ ...query, tensionLayers: "0:25:550" }), undefined);
  assert.equal(readTBeamDesignTransfer({ ...query, clearSpacingRight: "" }), undefined);
});
