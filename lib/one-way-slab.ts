export type SlabSupportCondition =
  | "simply-supported"
  | "one-end-continuous"
  | "both-ends-continuous"
  | "cantilever";

export interface OneWaySlabInput {
  span: number;
  h: number;
  deadLoad: number;
  liveLoad: number;
  fc: number;
  fy: number;
  cover: number;
  barDiameter: number;
  distributionBarDiameter: number;
  supportCondition: SlabSupportCondition;
}

export interface OneWaySlabResult {
  selfWeight: number;
  deadLoadTotal: number;
  factoredLoad: number;
  momentCoefficient: number;
  momentType: string;
  Mu: number;
  Vu: number;
  d: number;
  beta1: number;
  rhoRequired: number;
  rhoMin: number;
  AsRequired: number;
  AsMinimum: number;
  barArea: number;
  spacingRequired: number;
  spacingProvided: number;
  AsProvided: number;
  AsShrinkageMinimum: number;
  shrinkageSpacing: number;
  shrinkageAsProvided: number;
  shrinkageSpacingMax: number;
  spacingMax: number;
  c: number;
  a: number;
  epsilonT: number;
  phi: number;
  phiMn: number;
  Vc: number;
  phiVc: number;
  thicknessMinimum: number;
  thicknessRatio: number;
  thicknessOk: boolean;
  shearOk: boolean;
  shrinkageOk: boolean;
  flexureOk: boolean;
  overallOk: boolean;
  warnings: string[];
}

const PHI_SHEAR = 0.75;
const LAMBDA = 1;

function positive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Enter a valid positive value for ${label}.`);
  }
  return value;
}

function beta1(fc: number) {
  return fc <= 28 ? 0.85 : Math.max(0.65, 0.85 - (0.05 * (fc - 28)) / 7);
}

function supportFactors(condition: SlabSupportCondition) {
  switch (condition) {
    case "one-end-continuous":
      return { momentCoefficient: 1 / 14, momentType: "positive span moment (approx.)", thicknessRatio: 24 };
    case "both-ends-continuous":
      return { momentCoefficient: 1 / 16, momentType: "positive span moment (approx.)", thicknessRatio: 28 };
    case "cantilever":
      return { momentCoefficient: 1 / 2, momentType: "fixed-support moment", thicknessRatio: 10 };
    default:
      return { momentCoefficient: 1 / 8, momentType: "midspan moment", thicknessRatio: 20 };
  }
}

function designPhi(epsilonT: number) {
  if (epsilonT <= 0.002) return 0.65;
  if (epsilonT >= 0.005) return 0.9;
  return 0.65 + 0.25 * ((epsilonT - 0.002) / (0.005 - 0.002));
}

export function designOneWaySlab(input: OneWaySlabInput): OneWaySlabResult {
  positive(input.span, "span");
  positive(input.h, "slab thickness h");
  positive(input.fc, "f'c");
  positive(input.fy, "fy");
  positive(input.barDiameter, "bar diameter");
  positive(input.distributionBarDiameter, "distribution bar diameter");
  if (!Number.isFinite(input.deadLoad) || input.deadLoad < 0) throw new Error("Dead load must be zero or positive.");
  if (!Number.isFinite(input.liveLoad) || input.liveLoad < 0) throw new Error("Live load must be zero or positive.");
  if (!Number.isFinite(input.cover) || input.cover < 0) throw new Error("Clear cover must be zero or positive.");
  if (input.cover + input.barDiameter / 2 >= input.h) throw new Error("Cover plus half the bar diameter must be less than h.");

  const factors = supportFactors(input.supportCondition);
  const width = 1000;
  const selfWeight = (input.h / 1000) * 24;
  const deadLoadTotal = input.deadLoad + selfWeight;
  const factoredLoad = 1.2 * deadLoadTotal + 1.6 * input.liveLoad;
  const spanMm = input.span * 1000;
  const Mu = (factoredLoad * input.span ** 2 * factors.momentCoefficient);
  const Vu = input.supportCondition === "cantilever"
    ? factoredLoad * input.span
    : (factoredLoad * input.span) / 2;
  const d = input.h - input.cover - input.barDiameter / 2;
  const b1 = beta1(input.fc);
  const phiFlexure = 0.9;
  const MnRequired = (Mu * 1e6) / phiFlexure;
  const Rn = MnRequired / (width * d ** 2);
  const m = input.fy / (0.85 * input.fc);
  const discriminant = 1 - (2 * m * Rn) / input.fy;
  if (discriminant <= 0) throw new Error("The required moment is beyond the singly reinforced slab limit; increase h or redesign as a different section.");
  const rhoRequired = (1 / m) * (1 - Math.sqrt(discriminant));
  // NSCP 2015 / ACI slab minimum (metric form): 0.002 for lower-grade
  // reinforcement; for fy above 420 MPa, reduce 0.0018 in proportion to fy.
  const rhoMin = input.fy < 420 ? 0.002 : 0.0018 * (420 / input.fy);
  const AsMinimum = rhoMin * width * input.h;
  const AsRequired = Math.max(rhoRequired * width * d, AsMinimum);
  const barArea = (Math.PI * input.barDiameter ** 2) / 4;
  const spacingRequired = Math.min(1000, (barArea * width) / AsRequired);
  const spacingMax = Math.min(3 * input.h, 450);
  const minimumMainSpacing = input.barDiameter + 25;
  const spacingProvided = Math.max(minimumMainSpacing, Math.floor(Math.min(spacingRequired, spacingMax) / 5) * 5);
  const AsProvided = (barArea * width) / spacingProvided;
  const AsShrinkageMinimum = rhoMin * width * input.h;
  const distributionBarArea = (Math.PI * input.distributionBarDiameter ** 2) / 4;
  const shrinkageSpacingMax = Math.min(5 * input.h, 450);
  const minimumDistributionSpacing = input.distributionBarDiameter + 25;
  const shrinkageSpacing = Math.max(minimumDistributionSpacing, Math.floor(Math.min((distributionBarArea * width) / AsShrinkageMinimum, shrinkageSpacingMax) / 5) * 5);
  const shrinkageAsProvided = (distributionBarArea * width) / shrinkageSpacing;
  const a = (AsProvided * input.fy) / (0.85 * input.fc * width);
  const c = a / b1;
  const epsilonT = 0.003 * ((d - c) / c);
  const phi = designPhi(epsilonT);
  const phiMn = (phi * AsProvided * input.fy * (d - a / 2)) / 1e6;
  const Vc = (0.17 * LAMBDA * Math.sqrt(input.fc) * width * d) / 1000;
  const phiVc = PHI_SHEAR * Vc;
  const thicknessMinimum = spanMm / factors.thicknessRatio;
  const thicknessOk = input.h >= thicknessMinimum;
  const flexureOk = phiMn + 1e-8 >= Mu;
  const shearOk = Vu <= phiVc + 1e-8;
  const shrinkageOk = shrinkageAsProvided + 1e-8 >= AsShrinkageMinimum && shrinkageSpacing <= shrinkageSpacingMax + 1e-8;
  const warnings: string[] = [];
  if (!thicknessOk) warnings.push(`h = ${input.h.toFixed(0)} mm is below the ${factors.thicknessRatio} span-to-depth screening value of ${thicknessMinimum.toFixed(0)} mm; check deflection explicitly.`);
  if (input.supportCondition !== "simply-supported") warnings.push("The continuous-span coefficient is an approximate ACI method and applies only when its span, loading, and continuity conditions are satisfied.");
  if (!shearOk) warnings.push("One-way shear exceeds φVc; increase slab thickness or provide a shear design outside this slab flexural module.");
  if (spacingProvided > spacingMax) warnings.push("The selected bar diameter cannot provide the required steel within the code maximum spacing; choose a smaller bar or increase slab thickness.");
  if (!shrinkageOk) warnings.push("The selected distribution bar diameter cannot provide the minimum shrinkage and temperature steel within the maximum spacing; choose a larger bar or reduce spacing.");

  return {
    selfWeight, deadLoadTotal, factoredLoad, momentCoefficient: factors.momentCoefficient,
    momentType: factors.momentType, Mu, Vu, d, beta1: b1, rhoRequired, rhoMin,
    AsRequired, AsMinimum, barArea, spacingRequired, spacingProvided, AsProvided,
    AsShrinkageMinimum, shrinkageSpacing, shrinkageAsProvided, shrinkageSpacingMax,
    spacingMax, c, a, epsilonT, phi, phiMn, Vc, phiVc, thicknessMinimum,
    thicknessRatio: factors.thicknessRatio, thicknessOk, shearOk, flexureOk,
    shrinkageOk, overallOk: thicknessOk && shearOk && flexureOk && shrinkageOk, warnings,
  };
}
