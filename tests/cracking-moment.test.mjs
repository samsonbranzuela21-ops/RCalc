import test from "node:test";
import assert from "node:assert/strict";
import katex from "katex";
import { calculateCrackingMoment, getCrackingMomentSteps } from "../lib/cracking-moment.ts";

const close = (actual, expected, tolerance = 1e-7) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

const baseInput = {
  sectionShape: "rectangular",
  direction: "positive",
  reinforcementLayout: "none",
  compressionSteelTransform: "n-minus-1",
  momentBasis: "gross",
  curvatureBasis: "before-cracking",
  fc: 28,
  lambda: 1,
  Es: 200_000,
  b: 300,
  h: 500,
  tensionLayers: [],
  compressionLayers: [],
};

test("ACI/NSCP gross rectangular cracking moment uses fr Ig / yt", () => {
  const result = calculateCrackingMoment(baseInput);
  const fr = 0.62 * Math.sqrt(28);
  const Ig = 300 * 500 ** 3 / 12;
  close(result.fr, fr);
  close(result.grossInertia, Ig);
  close(result.grossYt, 250);
  close(result.codeMcr, fr * Ig / 250 / 1_000_000);
  close(result.selectedInertia, result.grossInertia);
  close(result.selectedYt, result.grossYt);
  close(result.Mcr, result.codeMcr);
});

test("Stage 1 doubly reinforced centroid uses Varignon from the bottom tension face", () => {
  const input = {
    ...baseInput,
    reinforcementLayout: "doubly",
    momentBasis: "uncracked",
    tensionLayers: [
      { count: 4, diameter: 25, depth: 450 },
      { count: 3, diameter: 20, depth: 405 },
    ],
    compressionLayers: [{ count: 2, diameter: 16, depth: 50 }],
  };
  const result = calculateCrackingMoment(input);
  const Ec = 4700 * Math.sqrt(input.fc);
  const alpha = input.Es / Ec - 1;
  const rawLayers = [...input.tensionLayers, ...input.compressionLayers];
  const additions = rawLayers.map((layer) => ({
    ...layer,
    area: alpha * layer.count * Math.PI * layer.diameter ** 2 / 4,
  }));
  const Ag = input.b * input.h;
  const Yg = input.h / 2;
  const Auc = Ag + additions.reduce((sum, layer) => sum + layer.area, 0);
  const Yuc = (Ag * Yg + additions.reduce((sum, layer) => sum + layer.area * (input.h - layer.depth), 0)) / Auc;
  const Iuc = input.b * input.h ** 3 / 12 + Ag * (Yg - Yuc) ** 2 + additions.reduce(
    (sum, layer) => sum + layer.area * (input.h - layer.depth - Yuc) ** 2,
    0,
  );

  close(result.uncrackedYt, Yuc);
  close(result.uncrackedCentroidFromTop, input.h - Yuc);
  close(result.uncrackedInertia, Iuc, 1e-5);
  close(result.selectedInertia, result.uncrackedInertia);
  close(result.selectedYt, result.uncrackedYt);
  assert.notEqual(result.Mcr.toFixed(6), result.codeMcr.toFixed(6));
  close(result.Mcr, result.fr * Iuc / Yuc / 1_000_000);
  assert.equal(result.layers.length, 3);
  const inertiaStep = getCrackingMomentSteps(input, result)
    .find((step) => step.label === "Before-cracking Ig including steel");
  assert.equal(inertiaStep?.formula.includes("\\Delta I_i"), false);
});

test("Stage 1 singly reinforced rectangle follows the stated bh and (n-1)As Varignon equation", () => {
  const input = {
    ...baseInput,
    reinforcementLayout: "singly",
    momentBasis: "uncracked",
    tensionLayers: [{ count: 4, diameter: 20, depth: 450 }],
  };
  const result = calculateCrackingMoment(input);
  const n = input.Es / (4700 * Math.sqrt(input.fc));
  const As = 4 * Math.PI * 20 ** 2 / 4;
  const Yuc = (
    input.b * input.h * (input.h / 2) +
    (n - 1) * As * (input.h - input.tensionLayers[0].depth)
  ) / (input.b * input.h + (n - 1) * As);

  close(result.uncrackedYt, Yuc);
  close(result.uncrackedCentroidFromTop, input.h - Yuc);
  const centroidStep = getCrackingMomentSteps(input, result).find((step) => step.label.includes("Varignon"));
  assert.equal(
    centroidStep?.formula,
    "Y_g=\\dfrac{bh(h/2)+(n-1)A_s(h-d)}{bh+(n-1)A_s}",
  );
});

test("steel-inclusive solution obtains Yg only from the before-cracking Varignon calculation", () => {
  const input = {
    ...baseInput,
    reinforcementLayout: "singly",
    momentBasis: "uncracked",
    tensionLayers: [{ count: 4, diameter: 20, depth: 450 }],
  };
  const result = calculateCrackingMoment(input);
  const steps = getCrackingMomentSteps(input, result);
  const varignon = steps.find((step) => step.label === "Before-cracking Yg by Varignon's theorem");

  assert.ok(varignon);
  assert.match(varignon.result, /^A_g=.*Y_g=/);
  assert.equal(steps.some((step) => step.label === "Concrete-only centroid distance to tension face"), false);
  assert.equal(steps.some((step) => /Y_\{g,c\}=h-/.test(step.formula)), false);

  const concreteOnly = calculateCrackingMoment({ ...input, momentBasis: "gross" });
  const concreteSteps = getCrackingMomentSteps({ ...input, momentBasis: "gross" }, concreteOnly);
  assert.equal(concreteSteps.some((step) => step.label === "Concrete-only before-cracking Yg"), true);
  assert.equal(concreteSteps.some((step) => step.label.includes("Varignon")), false);
});

test("curvature option uses selected before-cracking Ig or cracked INA at the same Mcr", () => {
  const input = {
    ...baseInput,
    reinforcementLayout: "singly",
    momentBasis: "uncracked",
    tensionLayers: [{ count: 4, diameter: 20, depth: 450 }],
  };
  const before = calculateCrackingMoment(input);
  const after = calculateCrackingMoment({ ...input, curvatureBasis: "after-cracking" });
  const n = input.Es / (4700 * Math.sqrt(input.fc));
  const As = 4 * Math.PI * 20 ** 2 / 4;
  const nAs = n * As;
  const c = (-nAs + Math.sqrt(nAs ** 2 + 2 * input.b * nAs * input.tensionLayers[0].depth)) / input.b;
  const INA = input.b * c ** 3 / 3 + nAs * (input.tensionLayers[0].depth - c) ** 2;
  const expectedBefore = before.McrNmm / (before.Ec * before.selectedInertia);
  const expectedAfter = after.McrNmm / (after.Ec * INA);

  close(before.selectedCentroidFromTop, before.uncrackedCentroidFromTop);
  close(before.beforeCrackingCurvaturePerMm, expectedBefore);
  close(before.curvaturePerMm, expectedBefore);
  close(after.crackedNeutralAxisFromCompressionFace, c);
  close(after.crackedCentroidFromTop, c);
  close(after.crackedInertia, INA, 1e-5);
  close(after.afterCrackingCurvaturePerMm, expectedAfter);
  close(after.curvaturePerMm, expectedAfter);
  close(after.Mcr, before.Mcr);
});

test("doubly reinforced cracked INA includes compression steel with the selected factor", () => {
  const input = {
    ...baseInput,
    reinforcementLayout: "doubly",
    momentBasis: "uncracked",
    curvatureBasis: "after-cracking",
    tensionLayers: [
      { count: 4, diameter: 25, depth: 450 },
      { count: 2, diameter: 20, depth: 405 },
    ],
    compressionLayers: [
      { count: 2, diameter: 16, depth: 40 },
      { count: 2, diameter: 12, depth: 75 },
    ],
  };
  const standard = calculateCrackingMoment(input);
  const alternate = calculateCrackingMoment({ ...input, compressionSteelTransform: "2n-minus-1" });

  assert.ok(standard.crackedNeutralAxisFromCompressionFace > 50);
  assert.ok(alternate.crackedInertia > standard.crackedInertia);
  assert.ok(alternate.afterCrackingCurvaturePerMm < standard.afterCrackingCurvaturePerMm);
  close(alternate.McrNmm, calculateCrackingMoment({ ...input, compressionSteelTransform: "2n-minus-1", curvatureBasis: "before-cracking" }).McrNmm);
});

test("T- and L-beam cracked neutral axis and INA include only compression concrete", () => {
  for (const sectionShape of ["t", "l"]) {
    const input = {
      ...baseInput,
      sectionShape,
      bf: 900,
      bw: 300,
      hf: 120,
      h: 600,
      reinforcementLayout: "singly",
      momentBasis: "gross",
      curvatureBasis: "after-cracking",
      tensionLayers: [{ count: 5, diameter: 25, depth: 550 }],
    };
    const result = calculateCrackingMoment(input);
    const n = result.modularRatio;
    const As = 5 * Math.PI * 25 ** 2 / 4;
    const c = result.crackedNeutralAxisFromCompressionFace;
    const Af = input.bf * input.hf;
    const webDepth = c - input.hf;
    const equilibrium = Af * (c - input.hf / 2) + input.bw * webDepth ** 2 / 2;
    close(equilibrium, n * As * (input.tensionLayers[0].depth - c), 1e-4);
    const INA =
      input.bf * input.hf ** 3 / 12 + Af * (c - input.hf / 2) ** 2 +
      input.bw * webDepth ** 3 / 3 +
      n * As * (input.tensionLayers[0].depth - c) ** 2;
    close(result.crackedInertia, INA, 1e-4);
  }
});

test("after-cracking curvature requires reinforcement and geometric section data", () => {
  assert.throws(
    () => calculateCrackingMoment({ ...baseInput, curvatureBasis: "after-cracking" }),
    /requires reinforcement/,
  );
  assert.throws(
    () => calculateCrackingMoment({
      ...baseInput,
      sectionShape: "custom",
      Ig: 3_125_000_000,
      grossCentroid: 250,
      curvatureBasis: "after-cracking",
    }),
    /requires rectangular, T-, or L-beam geometry/,
  );
});

test("2n-1 option applies only to compression reinforcement layers", () => {
  const common = {
    ...baseInput,
    reinforcementLayout: "doubly",
    momentBasis: "uncracked",
    tensionLayers: [{ count: 4, diameter: 25, depth: 450 }],
    compressionLayers: [{ count: 2, diameter: 20, depth: 50 }],
  };
  const standard = calculateCrackingMoment(common);
  const alternate = calculateCrackingMoment({ ...common, compressionSteelTransform: "2n-minus-1" });
  close(standard.layers[0].transformFactor, standard.modularRatio - 1);
  close(alternate.layers[0].transformFactor, alternate.modularRatio - 1);
  close(alternate.layers[1].transformFactor, 2 * alternate.modularRatio - 1);
  assert.ok(alternate.uncrackedInertia > standard.uncrackedInertia);
  close(alternate.codeMcr, standard.codeMcr);
});

test("T and L sections use non-overlapping flange and web gross properties", () => {
  for (const sectionShape of ["t", "l"]) {
    const input = {
      ...baseInput,
      sectionShape,
      b: undefined,
      bf: 900,
      bw: 300,
      hf: 120,
      h: 600,
    };
    const result = calculateCrackingMoment(input);
    const Af = 900 * 120;
    const Aw = 300 * 480;
    const yf = 60;
    const yw = 360;
    const yg = (Af * yf + Aw * yw) / (Af + Aw);
    const Ig = 900 * 120 ** 3 / 12 + Af * (yf - yg) ** 2 +
      300 * 480 ** 3 / 12 + Aw * (yw - yg) ** 2;
    close(result.grossArea, Af + Aw);
    close(result.grossCentroidFromTop, yg);
    close(result.grossInertia, Ig);
    close(result.grossYt, 600 - yg);
  }
});

test("negative bending measures yt to the top face", () => {
  const positive = calculateCrackingMoment({ ...baseInput, sectionShape: "t", bf: 900, bw: 300, hf: 120, h: 600 });
  const negative = calculateCrackingMoment({ ...baseInput, sectionShape: "t", direction: "negative", bf: 900, bw: 300, hf: 120, h: 600 });
  close(negative.grossYt, negative.grossCentroidFromTop);
  assert.ok(negative.codeMcr > positive.codeMcr);

  const reinforced = calculateCrackingMoment({
    ...baseInput,
    direction: "negative",
    reinforcementLayout: "singly",
    momentBasis: "uncracked",
    tensionLayers: [{ count: 3, diameter: 20, depth: 50 }],
  });
  const alpha = reinforced.modularRatio - 1;
  const As = 3 * Math.PI * 20 ** 2 / 4;
  const expectedYuc = (300 * 500 * 250 + alpha * As * 50) / (300 * 500 + alpha * As);
  close(reinforced.uncrackedYt, expectedYuc);
  close(reinforced.uncrackedCentroidFromTop, expectedYuc);

  const after = calculateCrackingMoment({ ...reinforced.input, curvatureBasis: "after-cracking" });
  const nAs = after.modularRatio * As;
  const distanceFromBottomCompressionFace = 500 - 50;
  const c = (-nAs + Math.sqrt(nAs ** 2 + 2 * 300 * nAs * distanceFromBottomCompressionFace)) / 300;
  close(after.crackedNeutralAxisFromCompressionFace, c);
  close(after.crackedCentroidFromTop, 500 - c);
});

test("custom gross properties and invalid geometry are handled", () => {
  const custom = calculateCrackingMoment({
    ...baseInput,
    sectionShape: "custom",
    Ig: 3_125_000_000,
    grossCentroid: 250,
  });
  close(custom.Mcr, 0.62 * Math.sqrt(28) * 3_125_000_000 / 250 / 1_000_000);
  assert.throws(
    () => calculateCrackingMoment({ ...baseInput, sectionShape: "t", bf: 250, bw: 300, hf: 100 }),
    /greater than web width/,
  );
});

test("lightweight Stage 1 analysis requires a project Ec", () => {
  const lightweight = {
    ...baseInput,
    lambda: 0.75,
    reinforcementLayout: "singly",
    momentBasis: "uncracked",
    tensionLayers: [{ count: 4, diameter: 20, depth: 450 }],
  };
  assert.throws(() => calculateCrackingMoment(lightweight), /Enter Ec for lightweight concrete/);
  const result = calculateCrackingMoment({ ...lightweight, EcOverride: 18_000 });
  close(result.Ec, 18_000);
  close(result.modularRatio, 200_000 / 18_000);
});

test("every generated solution equation renders as strict KaTeX", () => {
  for (const sectionShape of ["rectangular", "t", "l", "custom"]) {
    const input = sectionShape === "custom"
      ? { ...baseInput, sectionShape, Ig: 3_125_000_000, grossCentroid: 250 }
      : {
          ...baseInput,
          sectionShape,
          ...(sectionShape === "rectangular" ? {} : { bf: 900, bw: 300, hf: 120, h: 600 }),
          reinforcementLayout: "doubly",
          momentBasis: "uncracked",
          curvatureBasis: "after-cracking",
          tensionLayers: [{ count: 4, diameter: 25, depth: sectionShape === "rectangular" ? 450 : 550 }],
          compressionLayers: [{ count: 2, diameter: 16, depth: 50 }],
        };
    const result = calculateCrackingMoment(input);
    for (const step of getCrackingMomentSteps(input, result)) {
      for (const math of [step.formula, step.substitution, step.result].filter(Boolean)) {
        assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true }), `${sectionShape}: ${step.label}`);
      }
    }
  }
});
