import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SLAB_INPUT, designOneWaySlab, classifyOneWaySlab } from "../lib/one-way-slab.ts";

// Hand-check fixture: 200 mm × 24 kN/m³ = 4.8 kPa self-weight;
// D = 6 kPa; wu = 10.4 kN/m; wu Ln² = 166.4 kN·m for a 1 m strip.
const fixture = { ...DEFAULT_SLAB_INPUT, floorLength: 20, floorWidth: 10,
  panelLength: 4.3, panelWidth: 10, span: 4, leftSpan: 4, rightSpan: 4,
  h: 200, finishLoad: 1, ceilingLoad: 0.2, partitionLoad: 0, otherDeadLoad: 0, liveLoad: 2 };
const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test("floor classification uses a strict >2 ratio or two opposite supports", () => {
  assert.equal(classifyOneWaySlab(4, 8, "four").oneWay, false);
  assert.equal(classifyOneWaySlab(4, 8.01, "four").oneWay, true);
  assert.equal(classifyOneWaySlab(4, 4, "two").oneWay, true);
  assert.throws(() => designOneWaySlab({ ...fixture, panelWidth: 8 }), /not classified/);
  assert.throws(() => designOneWaySlab({ ...fixture, spanDirection: "width" }), /shorter span/);
});
test("hand calculation: loads, floor area, effective depth and separate moment zones", () => {
  const result = designOneWaySlab(fixture);
  close(result.floorArea, 200); close(result.selfWeight, 4.8);
  close(result.deadLoadTotal, 6); close(result.factoredLoad, 10.4);
  close(result.stripLoad, 10.4); close(result.d, 174);
  assert.deepEqual(result.designs.map((item) => item.tableCase.denominator), [14, 24, 10]);
  close(result.designs[0].Mu, 11.885714285714286);
  close(result.designs[1].Mu, 6.933333333333334);
  close(result.designs[2].Mu, 16.64);
  close(result.Vu, 23.92);
  assert.equal(result.overallOk, true);
});
test("support selection uses all applicable module coefficients", () => {
  const denominators = (changes) => designOneWaySlab({ ...fixture, ...changes }).designs.map((item) => item.tableCase.denominator);
  assert.deepEqual(denominators({ exteriorSupport: "column" }), [14, 16, 10]);
  assert.deepEqual(denominators({ spanCount: 2 }), [14, 24, 9]);
  assert.deepEqual(denominators({ supportCondition: "end-unrestrained" }), [11, 10]);
  assert.deepEqual(denominators({ supportCondition: "interior" }), [16, 11, 11]);
  assert.deepEqual(denominators({ shortSpanCase: true, span: 3, leftSpan: 3, rightSpan: 3 }), [14, 12, 12]);
});
test("negative moments use each adjacent-span average, not one common span", () => {
  const result = designOneWaySlab({ ...fixture, supportCondition: "interior", leftSpan: 3.5, rightSpan: 4.5 });
  close(result.designs[1].designSpan, 3.75); close(result.designs[2].designSpan, 4.25);
  close(result.designs[1].Mu, 13.295454545454545);
  close(result.designs[2].Mu, 17.077272727272728);
  assert.notEqual(result.designs[1].AsRequired, result.designs[2].AsRequired);
  const exterior = designOneWaySlab({ ...fixture, rightSpan: 4.5 }).designs[1];
  assert.equal(exterior.adjacentSpans, null); close(exterior.designSpan, 4);
});
test("strip width scales area and moments, but preserves spacing and adequacy", () => {
  const one = designOneWaySlab(fixture);
  const two = designOneWaySlab({ ...fixture, stripWidth: 2000 });
  close(two.stripLoad, 20.8);
  one.designs.forEach((item, index) => {
    close(two.designs[index].Mu, item.Mu * 2);
    close(two.designs[index].AsRequired, item.AsRequired * 2);
    close(two.designs[index].AsProvided, item.AsProvided * 2);
    assert.equal(two.designs[index].spacingProvided, item.spacingProvided);
  });
});
test("dead-only combination controls when live load is zero", () => {
  const result = designOneWaySlab({ ...fixture, liveLoad: 0 });
  close(result.factoredLoad, 8.4); assert.equal(result.loadCombination, "1.4D");
});
test("quadratic steel, minimum area, spacing and capacity agree with equilibrium", () => {
  const result = designOneWaySlab(fixture);
  close(result.rhoMin, 0.0018); close(result.spacingMax, 300);
  result.designs.forEach((item) => {
    close(item.AsMinimum, 360);
    const aRequired = item.AsRequired * 420 / (0.85 * 28 * 1000);
    close(0.9 * item.AsRequired * 420 * (174 - aRequired / 2) / 1e6, item.Mu);
    close(item.a, item.AsProvided * 420 / 23800);
    close(item.c, item.a / 0.85);
    assert.ok(item.AsProvided >= item.AsGoverning);
    assert.ok(item.spacingProvided <= result.spacingMax);
    assert.ok(item.epsilonT >= 0.004);
    assert.ok(item.phiMn >= item.Mu);
  });
  close(designOneWaySlab({ ...fixture, fy: 550 }).rhoMin, 0.0014);
  close(designOneWaySlab({ ...fixture, fy: 280 }).rhoMin, 0.002);
});
test("invalid conditions are rejected instead of falling back to a generic coefficient", () => {
  for (const changes of [
    { supportCondition: "simply-supported" }, { supportCondition: "bogus" },
    { uniformLoads: false }, { continuous: false }, { prismatic: false }, { spanCount: 1 },
    { supportCondition: "interior", spanCount: 2 }, { rightSpan: 5 },
    { shortSpanCase: true }, { liveLoad: 19 }, { span: 0 }, { span: 5 },
    { fc: -1 }, { fc: NaN }, { h: 40 }, { finishLoad: NaN },
    { floorLength: 0 }, { panelWidth: 30 }, { stripWidth: 11000 }, { Es: 0 },
    { isOneWay: false }, { cover: -1 }, { normalWeight: false },
  ]) assert.throws(() => designOneWaySlab({ ...fixture, ...changes }), undefined, JSON.stringify(changes));
});
test("failed cover and thickness screens prevent an overall adequate status", () => {
  const cover = designOneWaySlab({ ...fixture, cover: 15 });
  assert.equal(cover.coverOk, false); assert.equal(cover.overallOk, false);
  const thickness = designOneWaySlab({ ...fixture, h: 170 });
  assert.equal(thickness.thicknessOk, false); assert.equal(thickness.overallOk, false);
});
test("insufficient steel from minimum practical spacing is not reported adequate", () => {
  const result = designOneWaySlab({ ...fixture, barDiameter: 2, distributionBarDiameter: 2 });
  assert.equal(result.overallOk, false);
  assert.ok(result.designs.some((item) => !item.steelOk));
  assert.equal(result.distribution.adequate, false);
});
test("minimum tensile strain is enforced even for a section with nominal strength", () => {
  const result = designOneWaySlab({ ...fixture, h: 380, fc: 17, fy: 550, barDiameter: 32 });
  assert.ok(result.designs.every((item) => item.phiMn > item.Mu));
  assert.ok(result.designs.some((item) => !item.strainOk));
  assert.equal(result.overallOk, false);
  assert.ok(result.warnings.some((warning) => warning.includes("0.004")));
});
