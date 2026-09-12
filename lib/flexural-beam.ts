export type SectionType = "singly" | "doubly";
export type FlexuralFailureType = "layout" | "strength" | "reinforcement-limit" | "strain" | "equilibrium" | "other" | null;

export interface ReinforcementLayoutCapacity {
  widthInsideStirrups: number;
  minimumHorizontalClearSpacing: number;
  maximumBarsPerLayer: number;
  maximumLayers: number;
  maximumTotalBars: number;
  minimumVerticalClearSpacing: number;
}

/** `d` is accepted only for old callers. When `h` is supplied, `d` is ignored. */
export interface FlexuralBeamInput {
  Mu: number;
  b: number;
  h?: number;
  d?: number;
  fc: number;
  fy: number;
  Es?: number;
  barDiameter: number;
  compressionBarDiameter?: number;
  cover?: number;
  stirrupDiameter?: number;
  aggregateSize?: number;
  /** Legacy effective depth to the compression steel centroid. Used only when h is omitted. */
  dPrime?: number;
}

export interface SolutionStep {
  label: string;
  formula: string;
  substitution: string;
  result: string;
  resultMath?: string;
  reference?: string;
  explanation?: string;
  status?: "pass" | "fail" | "info";
}

export interface ReinforcementLayerResult {
  index: number;
  count: number;
  barDiameter: number;
  areaPerBar: number;
  area: number;
  /** Bar-centre coordinate measured from the tension face. */
  yFromTensionFace: number;
  /** Bar-centre coordinate measured from the extreme compression face. */
  yFromCompressionFace: number;
  xCentres: number[];
  centreToCentreGaps: number[];
  clearGaps: number[];
  clearSpacing: number | null;
  requiredClearSpacing: number;
  uniformSpreadClearSpacing: number | null;
  widthInsideStirrups: number;
  barWidthOccupied: number;
  remainingWidthForClearGaps: number;
  numberOfClearGaps: number;
  maximumBarsByUniformSpacing: number;
  verticalClearSpacingToNext: number | null;
  directlyAbovePreviousLayer: boolean | null;
  strain: number | null;
  stress: number | null;
  yielded: boolean | null;
  state: "tension" | "compression" | "mixed" | "unanalysed";
  netForce: number | null;
}

export interface FlexuralBeamResult {
  ok: boolean;
  message: string;
  failureType: FlexuralFailureType;
  failureDetails: string | null;
  sectionType: SectionType;
  governingCase: "minimum" | "calculated" | "doubly-reinforced";
  input: {
    Mu: number;
    b: number;
    h: number;
    fc: number;
    fy: number;
    Es: number;
    barDiameter: number;
    compressionBarDiameter: number;
    cover: number;
    stirrupDiameter: number;
    aggregateSize: number;
    legacyEffectiveDepth: boolean;
  };
  b: number;
  h: number;
  d: number;
  dExtremeTension: number;
  dPrime: number | null;
  beta1: number;
  phiAssumed: number;
  phi: number | null;
  epsilonY: number;
  epsilonT: number | null;
  a: number | null;
  c: number | null;
  Rn: number;
  requiredMn: number;
  rhoRequired: number;
  rhoMin: number;
  /** Assumed special-moment-frame beam limit from NSCP 418.6.3.1. */
  rhoMax: number;
  minimumTensileStrain: number;
  rhoProvided: number;
  asRequired: number;
  asMin: number;
  asMax: number;
  asFinal: number;
  asProvided: number;
  barsRequired: number;
  barsBeforeRounding: number;
  barArea: number;
  compressionBarsRequired: number;
  compressionBarsBeforeRounding: number;
  compressionBarArea: number;
  clearSpacing: number | null;
  minClearSpacingRequired: number;
  spacingOk: boolean;
  spacingMessage: string;
  tensionBarLayers: number;
  tensionBarsPerLayer: number[];
  tensionVerticalClearSpacing: number | null;
  tensionLayers: ReinforcementLayerResult[];
  compressionBarLayers: number;
  compressionBarsPerLayer: number[];
  compressionVerticalClearSpacing: number | null;
  compressionLayers: ReinforcementLayerResult[];
  compressionClearSpacing: number | null;
  compressionSpacingOk: boolean | null;
  compressionSpacingMessage: string;
  insideWidth: number;
  rhoLimitOk: boolean;
  requiredRhoLimitOk: boolean;
  minimumSteelOk: boolean;
  geometryOk: boolean;
  verticalSpacingOk: boolean;
  compressionStateOk: boolean;
  equilibriumOk: boolean;
  forceResidual: number | null;
  concreteForce: number | null;
  tensionForce: number | null;
  compressionSteelForce: number | null;
  concreteMoment: number | null;
  tensionMoment: number | null;
  compressionSteelMoment: number | null;
  Mn: number | null;
  phiMn: number | null;
  strengthOk: boolean;
  strainOk: boolean;
  asSinglyPortion: number | null;
  mnSingly: number | null;
  mnRemaining: number | null;
  muRemaining: number | null;
  asAdditionalTension: number | null;
  asCompression: number | null;
  epsilonSPrime: number | null;
  fsPrime: number | null;
  epsilonSPrimeDesign: number | null;
  fsPrimeDesign: number | null;
  compressionSteelYields: boolean | null;
  iterationCount: number;
  iterationRows: Array<{
    trial: number;
    tensionBars: string;
    compressionBars: string;
    d: number;
    asRequired: number;
    phiMn: number | null;
    spacingOk: boolean;
    reason: string;
  }>;
  warnings: string[];
}

interface NormalizedInput {
  Mu: number;
  b: number;
  h: number;
  fc: number;
  fy: number;
  Es: number;
  barDiameter: number;
  compressionBarDiameter: number;
  cover: number;
  stirrupDiameter: number;
  aggregateSize: number;
  legacyEffectiveDepth: boolean;
  legacyEffectiveDepthValue: number | null;
  legacyDPrime: number | null;
}

interface RawLayer {
  index: number;
  count: number;
  diameter: number;
  areaPerBar: number;
  area: number;
  yFromTensionFace: number;
  yFromCompressionFace: number;
  xCentres: number[];
  verticalClearSpacingToNext: number | null;
  directlyAbovePreviousLayer: boolean | null;
}

interface GroupLayout {
  rows: RawLayer[];
  layers: ReinforcementLayerResult[];
  totalBars: number;
  area: number;
  centroidFromTensionFace: number;
  centroidFromCompressionFace: number;
  d: number | null;
  spacingOk: boolean;
  spacingMessage: string;
  clearSpacing: number | null;
  verticalClearSpacing: number | null;
  maxBarsPerLayer: number;
  valid: boolean;
  reason: string;
  verticalSpacingOk: boolean;
  insideWidth: number;
}

interface SectionAnalysis {
  valid: boolean;
  reason: string;
  c: number | null;
  a: number | null;
  phi: number | null;
  epsilonT: number | null;
  Mn: number | null;
  phiMn: number | null;
  forceResidual: number | null;
  concreteForce: number | null;
  tensionForce: number | null;
  compressionForce: number | null;
  concreteMoment: number | null;
  tensionMoment: number | null;
  compressionMoment: number | null;
  equilibriumOk: boolean;
  strainOk: boolean;
  tensionLayers: ReinforcementLayerResult[];
  compressionLayers: ReinforcementLayerResult[];
  compressionStateOk: boolean;
  epsilonSPrime: number | null;
  fsPrime: number | null;
  compressionSteelYields: boolean | null;
}

const EPSILON_CU = 0.003;
const EPSILON_BEAM_MIN = 0.004;
const EPSILON_TENSION_CONTROLLED = 0.005;
const PHI_TENSION = 0.9;
const PHI_COMPRESSION = 0.65;
const RHO_MAX = 0.025;
const VERTICAL_CLEAR_MIN = 25;
const MAX_SINGLE_BAR_TRIALS = 96;
const MAX_DOUBLE_BAR_INCREMENTS = 48;
const FORCE_TOLERANCE_RELATIVE = 1e-8;

function beta1Factor(fc: number): number {
  if (fc <= 28) return 0.85;
  return Math.max(0.65, 0.85 - 0.05 * ((fc - 28) / 7));
}

function steelArea(diameter: number): number {
  return (Math.PI * diameter * diameter) / 4;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeInput(input: FlexuralBeamInput): NormalizedInput {
  const legacyEffectiveDepth = input.h === undefined;
  const cover = input.cover ?? 40;
  const stirrupDiameter = input.stirrupDiameter ?? 10;
  const barDiameter = input.barDiameter;
  const legacyD = input.d;
  const h = legacyEffectiveDepth
    ? Number(legacyD) + cover + stirrupDiameter + barDiameter / 2
    : Number(input.h);

  return {
    Mu: input.Mu,
    b: input.b,
    h,
    fc: input.fc,
    fy: input.fy,
    Es: input.Es ?? 200_000,
    barDiameter,
    compressionBarDiameter: input.compressionBarDiameter ?? barDiameter,
    cover,
    stirrupDiameter,
    aggregateSize: input.aggregateSize ?? 19,
    legacyEffectiveDepth,
    legacyEffectiveDepthValue: legacyEffectiveDepth ? input.d ?? null : null,
    legacyDPrime: legacyEffectiveDepth ? input.dPrime ?? null : null,
  };
}

export function validateFlexuralBeamInput(input: FlexuralBeamInput): string | null {
  const normalized = normalizeInput(input);
  const numeric: Array<[string, number]> = [
    ["Mu", normalized.Mu],
    ["b", normalized.b],
    [normalized.legacyEffectiveDepth ? "legacy effective depth d" : "h", normalized.legacyEffectiveDepth ? Number(input.d) : normalized.h],
    ["f'c", normalized.fc],
    ["fy", normalized.fy],
    ["Es", normalized.Es],
    ["concrete cover", normalized.cover],
    ["stirrup diameter", normalized.stirrupDiameter],
    ["tension-bar diameter", normalized.barDiameter],
    ["compression-bar diameter", normalized.compressionBarDiameter],
    ["maximum nominal aggregate size", normalized.aggregateSize],
  ] as const;

  const nonFinite = numeric.find(([, value]) => !Number.isFinite(value));
  if (nonFinite) return `Enter a finite numeric value for ${nonFinite[0]}.`;
  const nonPositive = numeric.find(([, value]) => value <= 0);
  if (nonPositive) return `${nonPositive[0]} must be greater than zero.`;
  if (normalized.fc > 100) return "This calculator supports concrete strengths up to 100 MPa.";
  if (normalized.fy > 550) return "This calculator supports reinforcement yield strengths up to 550 MPa.";
  if (normalized.Es < 150_000 || normalized.Es > 250_000 || normalized.Es <= normalized.fy) {
    return "Enter a steel modulus from 150,000 to 250,000 MPa and greater than fy.";
  }
  if (normalized.cover + normalized.stirrupDiameter >= normalized.b / 2) {
    return "Cover and stirrup diameter leave no usable beam width; reduce them or increase b.";
  }
  if (normalized.aggregateSize >= normalized.b) {
    return "Maximum aggregate size must be smaller than the beam width.";
  }
  if (normalized.h <= 2 * (normalized.cover + normalized.stirrupDiameter)) {
    return "Overall height must leave room for cover, stirrups, and reinforcement at both faces.";
  }
  if (normalized.legacyDPrime !== null && (!Number.isFinite(normalized.legacyDPrime) || normalized.legacyDPrime <= 0)) {
    return "The legacy compression-steel depth must be a finite positive value.";
  }
  return null;
}

function minimumTensionSpacing(input: NormalizedInput): number {
  return Math.max(25, input.barDiameter, (4 / 3) * input.aggregateSize);
}

function minimumCompressionSpacing(input: NormalizedInput): number {
  return Math.max(25, input.compressionBarDiameter, (4 / 3) * input.aggregateSize);
}

function reinforcementLayoutCapacity(
  input: NormalizedInput,
  diameter: number,
  minimumHorizontalClearSpacing: number,
): ReinforcementLayoutCapacity {
  const widthInsideStirrups = input.b - 2 * (input.cover + input.stirrupDiameter);
  const maximumBarsPerLayer = Math.max(0, Math.floor(
    (widthInsideStirrups + minimumHorizontalClearSpacing + 1e-9) /
      (diameter + minimumHorizontalClearSpacing),
  ));
  const availableBarCentreSpan = input.h - 2 * (input.cover + input.stirrupDiameter) - diameter;
  const maximumLayers = availableBarCentreSpan < -1e-9
    ? 0
    : Math.floor((availableBarCentreSpan + 1e-9) / (diameter + VERTICAL_CLEAR_MIN)) + 1;

  return {
    widthInsideStirrups,
    minimumHorizontalClearSpacing,
    maximumBarsPerLayer,
    maximumLayers,
    maximumTotalBars: maximumBarsPerLayer * maximumLayers,
    minimumVerticalClearSpacing: VERTICAL_CLEAR_MIN,
  };
}

export function getReinforcementLayoutCapacity(
  input: FlexuralBeamInput,
  group: "tension" | "compression" = "tension",
): ReinforcementLayoutCapacity {
  const normalized = normalizeInput(input);
  const diameter = group === "tension" ? normalized.barDiameter : normalized.compressionBarDiameter;
  const minimumClearSpacing = group === "tension"
    ? minimumTensionSpacing(normalized)
    : minimumCompressionSpacing(normalized);
  return reinforcementLayoutCapacity(normalized, diameter, minimumClearSpacing);
}

function barCentres(
  count: number,
  widthInsideStirrups: number,
  sideOffset: number,
  diameter: number,
  previous: number[] | null,
): number[] {
  if (count === 1) {
    if (previous?.length) {
      return [previous[Math.floor(previous.length / 2)]];
    }
    return [sideOffset + widthInsideStirrups / 2];
  }

  if (previous && count <= previous.length) {
    const indices = Array.from({ length: count }, (_, index) =>
      Math.round((index * (previous.length - 1)) / (count - 1)),
    );
    return indices.map((index) => previous[index]);
  }

  const usableCentreSpan = widthInsideStirrups - diameter;
  if (count <= 0 || usableCentreSpan < 0) return [];
  return Array.from({ length: count }, (_, index) =>
    sideOffset + diameter / 2 + (usableCentreSpan * index) / (count - 1),
  );
}

function buildGroupLayout(
  input: NormalizedInput,
  count: number,
  kind: "tension" | "compression",
): GroupLayout {
  const diameter = kind === "tension" ? input.barDiameter : input.compressionBarDiameter;
  const barA = steelArea(diameter);
  const widthInsideStirrups = input.b - 2 * (input.cover + input.stirrupDiameter);
  const sideOffset = input.cover + input.stirrupDiameter;
  const requiredClearSpacing = kind === "tension"
    ? minimumTensionSpacing(input)
    : minimumCompressionSpacing(input);
  const layoutCapacity = reinforcementLayoutCapacity(input, diameter, requiredClearSpacing);
  const maxBarsByUniformSpacing = layoutCapacity.maximumBarsPerLayer;

  const empty = (reason: string): GroupLayout => ({
    rows: [],
    layers: [],
    totalBars: count,
    area: 0,
    centroidFromTensionFace: Number.NaN,
    centroidFromCompressionFace: Number.NaN,
    d: null,
    spacingOk: false,
    spacingMessage: reason,
    clearSpacing: null,
    verticalClearSpacing: null,
    maxBarsPerLayer: maxBarsByUniformSpacing,
    valid: false,
    reason,
    verticalSpacingOk: false,
    insideWidth: widthInsideStirrups,
  });

  if (!Number.isInteger(count) || count < 1) return empty("At least one reinforcing bar is required.");
  if (widthInsideStirrups <= 0 || maxBarsByUniformSpacing < 1) {
    return empty("The bar diameter and cover do not fit inside the stirrups.");
  }
  if (layoutCapacity.maximumLayers < 1) {
    return empty("The selected bar diameter does not fit between the top and bottom cover zones.");
  }

  let remaining = count;
  let rowIndex = 0;
  let previousX: number[] | null = null;
  const rows: RawLayer[] = [];
  const layerDetails: ReinforcementLayerResult[] = [];
  const maxRows = layoutCapacity.maximumLayers;
  const bottomSteelCentroid = input.cover + input.stirrupDiameter + diameter / 2;
  const firstLayerCentroid = kind === "compression" && input.legacyEffectiveDepth && input.legacyDPrime !== null
    ? input.legacyDPrime
    : kind === "tension" && input.legacyEffectiveDepth
      ? Number(input.legacyEffectiveDepthValue)
      : bottomSteelCentroid;

  while (remaining > 0) {
    if (rowIndex >= maxRows) {
      return empty(`${kind === "tension" ? "Tension" : "Compression"} group needs ${count} bars, but the section allows at most ${maxBarsByUniformSpacing} bars per layer in ${maxRows} layers.`);
    }
    const rowCount = Math.min(maxBarsByUniformSpacing, remaining);
    const previousPositions = previousX;
    const xCentres = barCentres(rowCount, widthInsideStirrups, sideOffset, diameter, previousPositions);
    const centreFromFace = kind === "tension"
      ? input.legacyEffectiveDepth && rowIndex === 0
        ? input.h - Number(input.legacyEffectiveDepthValue)
        : bottomSteelCentroid + rowIndex * (diameter + VERTICAL_CLEAR_MIN)
      : firstLayerCentroid + rowIndex * (diameter + VERTICAL_CLEAR_MIN);
    const yFromTensionFace = kind === "tension" ? centreFromFace : input.h - centreFromFace;
    const yFromCompressionFace = input.h - yFromTensionFace;
    const gaps = xCentres.slice(1).map((x, index) => x - xCentres[index]);
    const clearGaps = gaps.map((gap) => gap - diameter);
    const clearSpacing = clearGaps.length > 0 ? Math.min(...clearGaps) : null;
    const uniformSpreadClearSpacing = rowCount >= 2
      ? (widthInsideStirrups - rowCount * diameter) / (rowCount - 1)
      : null;
    const barsOccupied = rowCount * diameter;
    const remainingWidthForClearGaps = Math.max(0, widthInsideStirrups - barsOccupied);
    const verticalClearSpacingToNext = remaining > rowCount ? VERTICAL_CLEAR_MIN : null;
    const aligned = previousPositions === null
      ? null
      : xCentres.every((x) => previousPositions.some((previous) => Math.abs(previous - x) < 1e-6));
    const layer: RawLayer = {
      index: rowIndex,
      count: rowCount,
      diameter,
      areaPerBar: barA,
      area: rowCount * barA,
      yFromTensionFace,
      yFromCompressionFace,
      xCentres,
      verticalClearSpacingToNext,
      directlyAbovePreviousLayer: aligned,
    };
    rows.push(layer);
    layerDetails.push({
      index: rowIndex + 1,
      count: rowCount,
      barDiameter: diameter,
      areaPerBar: barA,
      area: rowCount * barA,
      yFromTensionFace,
      yFromCompressionFace,
      xCentres,
      centreToCentreGaps: gaps,
      clearGaps,
      clearSpacing,
      requiredClearSpacing,
      uniformSpreadClearSpacing,
      widthInsideStirrups,
      barWidthOccupied: barsOccupied,
      remainingWidthForClearGaps,
      numberOfClearGaps: rowCount - 1,
      maximumBarsByUniformSpacing: maxBarsByUniformSpacing,
      verticalClearSpacingToNext,
      directlyAbovePreviousLayer: aligned,
      strain: null,
      stress: null,
      yielded: null,
      state: "unanalysed",
      netForce: null,
    });
    previousX = xCentres;
    remaining -= rowCount;
    rowIndex += 1;
  }

  const totalArea = rows.reduce((sum, row) => sum + row.area, 0);
  const centroidFromTensionFace = rows.reduce(
    (sum, row) => sum + row.area * row.yFromTensionFace,
    0,
  ) / totalArea;
  const centroidFromCompressionFace = input.h - centroidFromTensionFace;
  const d = kind === "tension" ? centroidFromCompressionFace : null;
  const allHorizontalPass = layerDetails.every((layer) =>
    layer.clearSpacing === null || layer.clearSpacing + 1e-9 >= requiredClearSpacing,
  );
  const allAligned = layerDetails.every((layer) => layer.directlyAbovePreviousLayer !== false);
  const geometryFits = rows.every((row) =>
    row.xCentres.every((x) =>
      x - diameter / 2 >= sideOffset - 1e-7 &&
      x + diameter / 2 <= sideOffset + widthInsideStirrups + 1e-7,
    ),
  ) && rows.every((row) =>
    row.yFromCompressionFace - diameter / 2 >= sideOffset - 1e-7 &&
    row.yFromCompressionFace + diameter / 2 <= input.h - sideOffset + 1e-7,
  );
  const spacingOk = allHorizontalPass && allAligned && geometryFits;
  const messages = [
    `${count} ${kind} bar${count === 1 ? "" : "s"} arranged in ${rows.length} ${rows.length === 1 ? "layer" : "layers"}.`,
    `Uniform spacing allows up to ${maxBarsByUniformSpacing} bar${maxBarsByUniformSpacing === 1 ? "" : "s"} per layer.`,
    allHorizontalPass
      ? `Every actual horizontal clear gap meets the required minimum of ${requiredClearSpacing} mm.`
      : `At least one actual horizontal clear gap is below the required minimum of ${requiredClearSpacing} mm.`,
    rows.length > 1
      ? `Adjacent layers have ${VERTICAL_CLEAR_MIN} mm of clear vertical spacing.`
      : "One layer is provided, so a vertical layer-spacing check does not apply.",
    ...(rows.length > 1
      ? [allAligned
        ? "Bars in each upper layer align directly above bars in the layer below."
        : "Bars in an upper layer do not align directly above bars in the layer below."]
      : []),
    geometryFits
      ? "All bars remain inside the stirrup envelope and maintain the specified cover."
      : "Some bars extend outside the cover or stirrup envelope.",
  ];
  const valid = spacingOk;
  const reason = !geometryFits
    ? "The selected bars extend outside the section or stirrups. Increase h/b or reduce cover/bar size."
    : !allHorizontalPass
      ? "A horizontal clear-spacing check failed. Increase b, select smaller bars, or use a different layer arrangement."
      : !allAligned
        ? "Upper-layer bars must sit directly above bars in the layer below; this arrangement does not satisfy the alignment check."
        : "";

  return {
    rows,
    layers: layerDetails,
    totalBars: count,
    area: totalArea,
    centroidFromTensionFace,
    centroidFromCompressionFace,
    d,
    spacingOk,
    spacingMessage: messages.join(" "),
    clearSpacing: layerDetails[0]?.clearSpacing ?? null,
    verticalClearSpacing: rows.length > 1 ? VERTICAL_CLEAR_MIN : null,
    maxBarsPerLayer: maxBarsByUniformSpacing,
    valid,
    reason,
    verticalSpacingOk: rows.length <= 1 || layerDetails.slice(0, -1).every((layer) =>
      (layer.verticalClearSpacingToNext ?? 0) >= VERTICAL_CLEAR_MIN,
    ),
    insideWidth: widthInsideStirrups,
  };
}

function phiFromTensionStrain(epsilonT: number, epsilonY: number): number {
  if (epsilonT <= epsilonY) return PHI_COMPRESSION;
  if (epsilonT >= EPSILON_TENSION_CONTROLLED) return PHI_TENSION;
  return PHI_COMPRESSION +
    ((epsilonT - epsilonY) / (EPSILON_TENSION_CONTROLLED - epsilonY)) *
      (PHI_TENSION - PHI_COMPRESSION);
}

function analyzeSection(
  input: NormalizedInput,
  beta1: number,
  tensionLayout: GroupLayout,
  compressionLayout: GroupLayout | null,
): SectionAnalysis {
  const allRows = [
    ...tensionLayout.rows.map((row) => ({ ...row, group: "tension" as const })),
    ...(compressionLayout?.rows ?? []).map((row) => ({ ...row, group: "compression" as const })),
  ];
  const compressionStateOk = (compressionLayout?.rows ?? []).every((row) => {
    // The actual neutral-axis state is checked after strain compatibility below.
    return row.yFromCompressionFace < input.h;
  });
  if (!tensionLayout.valid || (compressionLayout && !compressionLayout.valid)) {
    return emptyAnalysis(tensionLayout.reason || compressionLayout?.reason || "The bar layout failed a detailing check.");
  }
  const minTensionY = Math.max(...tensionLayout.rows.map((row) => row.yFromCompressionFace));
  const upper = Math.min(minTensionY - 1e-7, input.h / beta1);
  const lower = Math.max(1e-7, upper * 1e-10);
  if (!(upper > lower)) return emptyAnalysis("No positive neutral-axis interval remains above the extreme tension reinforcement.");

  const forceAt = (c: number) => {
    const a = beta1 * c;
    if (a > input.h) return Number.POSITIVE_INFINITY;
    const concrete = 0.85 * input.fc * input.b * a;
    let steel = 0;
    for (const row of allRows) {
      const strain = EPSILON_CU * (c - row.yFromCompressionFace) / c;
      const stress = clamp(strain * input.Es, -input.fy, input.fy);
      const displacedConcreteStress = row.yFromCompressionFace <= a ? 0.85 * input.fc : 0;
      steel += row.area * (stress - displacedConcreteStress);
    }
    return concrete + steel;
  };

  let fLow = forceAt(lower);
  let fHigh = forceAt(upper);
  if (!Number.isFinite(fLow) || !Number.isFinite(fHigh) || fLow === 0) {
    return emptyAnalysis("Strain compatibility produced a non-finite force balance.");
  }
  if (fLow * fHigh > 0) {
    return emptyAnalysis("No force-equilibrium root exists while the outer tension layer remains in tension. Reduce reinforcement or revise the section.");
  }

  let low = lower;
  let high = upper;
  let c = (low + high) / 2;
  for (let index = 0; index < 100; index += 1) {
    c = (low + high) / 2;
    const fMid = forceAt(c);
    if (!Number.isFinite(fMid)) return emptyAnalysis("The force-equilibrium iteration became non-finite.");
    if (Math.abs(fMid) <= Math.max(1, Math.abs(fLow), Math.abs(fHigh)) * FORCE_TOLERANCE_RELATIVE) break;
    if (fLow * fMid <= 0) {
      high = c;
      fHigh = fMid;
    } else {
      low = c;
      fLow = fMid;
    }
  }

  const a = beta1 * c;
  const concreteForce = 0.85 * input.fc * input.b * a;
  let tensionForce = 0;
  let compressionForce = 0;
  let tensionMoment = 0;
  let compressionMoment = 0;
  const updateLayers = (rows: RawLayer[], group: "tension" | "compression") =>
    rows.map((row): ReinforcementLayerResult => {
      const strain = EPSILON_CU * (c - row.yFromCompressionFace) / c;
      const stress = clamp(strain * input.Es, -input.fy, input.fy);
      const displacedConcreteStress = row.yFromCompressionFace <= a ? 0.85 * input.fc : 0;
      const netForce = row.area * (stress - displacedConcreteStress);
      const tension = Math.max(-netForce, 0);
      const compression = Math.max(netForce, 0);
      tensionForce += tension;
      compressionForce += compression;
      tensionMoment += tension * row.yFromCompressionFace;
      compressionMoment += compression * row.yFromCompressionFace;
      const epsTolerance = 1e-12;
      return {
        index: row.index + 1,
        count: row.count,
        barDiameter: row.diameter,
        areaPerBar: row.areaPerBar,
        area: row.area,
        yFromTensionFace: row.yFromTensionFace,
        yFromCompressionFace: row.yFromCompressionFace,
        xCentres: row.xCentres,
        centreToCentreGaps: row.xCentres.slice(1).map((x, i) => x - row.xCentres[i]),
        clearGaps: row.xCentres.slice(1).map((x, i) => x - row.xCentres[i] - row.diameter),
        clearSpacing: row.xCentres.length > 1
          ? Math.min(...row.xCentres.slice(1).map((x, i) => x - row.xCentres[i] - row.diameter))
          : null,
        requiredClearSpacing: group === "tension"
          ? minimumTensionSpacing(input)
          : minimumCompressionSpacing(input),
        uniformSpreadClearSpacing: row.count > 1
          ? (tensionLayout.insideWidth - row.count * row.diameter) / (row.count - 1)
          : null,
        widthInsideStirrups: tensionLayout.insideWidth,
        barWidthOccupied: row.count * row.diameter,
        remainingWidthForClearGaps: Math.max(0, tensionLayout.insideWidth - row.count * row.diameter),
        numberOfClearGaps: row.count - 1,
        maximumBarsByUniformSpacing: group === "tension"
          ? tensionLayout.maxBarsPerLayer
          : compressionLayout?.maxBarsPerLayer ?? 0,
        verticalClearSpacingToNext: row.verticalClearSpacingToNext,
        directlyAbovePreviousLayer: row.directlyAbovePreviousLayer,
        strain,
        stress,
        yielded: Math.abs(stress) >= input.fy - 1e-7,
        state: Math.abs(strain) < epsTolerance
          ? "mixed"
          : strain < 0
            ? "tension"
            : "compression",
        netForce,
      };
    });
  const tensionLayers = updateLayers(tensionLayout.rows, "tension");
  const compressionLayers = compressionLayout
    ? updateLayers(compressionLayout.rows, "compression")
    : [];
  const epsilonT = Math.max(
    ...tensionLayout.rows.map((row) => Math.max(0, EPSILON_CU * (row.yFromCompressionFace - c) / c)),
  );
  const phi = phiFromTensionStrain(epsilonT, input.fy / input.Es);
  const forceResidual = concreteForce + tensionLayers.reduce((sum, layer) => sum + (layer.netForce ?? 0), 0) +
    compressionLayers.reduce((sum, layer) => sum + (layer.netForce ?? 0), 0);
  const equilibriumOk = Math.abs(forceResidual) <= Math.max(1, (concreteForce + tensionForce + compressionForce) * 1e-7);
  const concreteMoment = concreteForce * (a / 2);
  const MnNmm = tensionMoment - concreteMoment - compressionMoment;
  const Mn = MnNmm / 1e6;
  const phiMn = phi * Mn;
  const strainOk = epsilonT + 1e-12 >= EPSILON_BEAM_MIN && c < minTensionY;
  const compState = compressionLayers.every((layer) => layer.state === "compression");
  const compressionStateResultOk = compressionStateOk && compState;
  const valid = [c, a, phi, epsilonT, Mn, phiMn, forceResidual].every(Number.isFinite) &&
    a > 0 && a <= input.h && Mn > 0 && equilibriumOk;
  const compressionArea = compressionLayout?.area ?? 0;
  const epsilonSPrime = compressionArea > 0
    ? EPSILON_CU * (c - compressionLayout!.centroidFromCompressionFace) / c
    : null;
  const fsPrime = epsilonSPrime === null ? null : clamp(epsilonSPrime * input.Es, -input.fy, input.fy);
  const compressionSteelYields = fsPrime === null ? null : Math.abs(fsPrime) >= input.fy - 1e-7;

  return {
    valid,
    reason: valid ? "" : "The provided reinforcement did not produce a valid force-equilibrium moment capacity.",
    c,
    a,
    phi,
    epsilonT,
    Mn,
    phiMn,
    forceResidual,
    concreteForce,
    tensionForce,
    compressionForce,
    concreteMoment,
    tensionMoment,
    compressionMoment,
    equilibriumOk,
    strainOk,
    tensionLayers,
    compressionLayers,
    compressionStateOk: compressionStateResultOk,
    epsilonSPrime,
    fsPrime,
    compressionSteelYields,
  };
}

function emptyAnalysis(reason: string): SectionAnalysis {
  return {
    valid: false,
    reason,
    c: null,
    a: null,
    phi: null,
    epsilonT: null,
    Mn: null,
    phiMn: null,
    forceResidual: null,
    concreteForce: null,
    tensionForce: null,
    compressionForce: null,
    concreteMoment: null,
    tensionMoment: null,
    compressionMoment: null,
    equilibriumOk: false,
    strainOk: false,
    tensionLayers: [],
    compressionLayers: [],
    compressionStateOk: false,
    epsilonSPrime: null,
    fsPrime: null,
    compressionSteelYields: null,
  };
}

function requiredSteel(
  input: NormalizedInput,
  beta1: number,
  d: number,
): { Rn: number; rho: number; area: number; discriminant: number; m: number; requiredMn: number } {
  const phiAssumed = PHI_TENSION;
  const requiredMnNmm = input.Mu * 1e6 / phiAssumed;
  const Rn = requiredMnNmm / (input.b * d * d);
  const m = input.fy / (0.85 * input.fc);
  const discriminant = 1 - (2 * m * Rn) / input.fy;
  const rho = discriminant >= 0
    ? (1 / m) * (1 - Math.sqrt(discriminant))
    : Number.NaN;
  const area = Number.isFinite(rho) ? rho * input.b * d : Number.NaN;
  void beta1;
  return { Rn, rho, area, discriminant, m, requiredMn: requiredMnNmm / 1e6 };
}

function rhoMinimum(input: NormalizedInput): number {
  return Math.max(Math.sqrt(input.fc) / (4 * input.fy), 1.4 / input.fy);
}

function makeBaseResult(
  input: NormalizedInput,
  beta1: number,
  rhoMin: number,
  initialD: number,
  trial: ReturnType<typeof requiredSteel>,
  message: string,
): FlexuralBeamResult {
  const asMin = rhoMin * input.b * initialD;
  const asRequired = Number.isFinite(trial.area) ? Math.max(trial.area, asMin) : asMin;
  return {
    ok: false,
    message,
    failureType: null,
    failureDetails: null,
    sectionType: "singly",
    governingCase: Number.isFinite(trial.rho) && trial.rho < rhoMin ? "minimum" : "calculated",
    input: {
      Mu: input.Mu,
      b: input.b,
      h: input.legacyEffectiveDepth ? Number.NaN : input.h,
      fc: input.fc,
      fy: input.fy,
      Es: input.Es,
      barDiameter: input.barDiameter,
      compressionBarDiameter: input.compressionBarDiameter,
      cover: input.cover,
      stirrupDiameter: input.stirrupDiameter,
      aggregateSize: input.aggregateSize,
      legacyEffectiveDepth: input.legacyEffectiveDepth,
    },
    b: input.b,
    h: input.legacyEffectiveDepth ? Number.NaN : input.h,
    d: initialD,
    dExtremeTension: initialD,
    dPrime: null,
    beta1,
    phiAssumed: PHI_TENSION,
    phi: null,
    epsilonY: input.fy / input.Es,
    epsilonT: null,
    a: null,
    c: null,
    Rn: trial.Rn,
    requiredMn: trial.requiredMn,
    rhoRequired: trial.rho,
    rhoMin,
    rhoMax: RHO_MAX,
    minimumTensileStrain: EPSILON_BEAM_MIN,
    rhoProvided: Number.NaN,
    asRequired,
    asMin,
    asMax: RHO_MAX * input.b * initialD,
    asFinal: asRequired,
    asProvided: 0,
    barsRequired: 0,
    barsBeforeRounding: asRequired / steelArea(input.barDiameter),
    barArea: steelArea(input.barDiameter),
    compressionBarsRequired: 0,
    compressionBarsBeforeRounding: 0,
    compressionBarArea: steelArea(input.compressionBarDiameter),
    clearSpacing: null,
    minClearSpacingRequired: minimumTensionSpacing(input),
    spacingOk: false,
    spacingMessage: message,
    tensionBarLayers: 0,
    tensionBarsPerLayer: [],
    tensionVerticalClearSpacing: null,
    tensionLayers: [],
    compressionBarLayers: 0,
    compressionBarsPerLayer: [],
    compressionVerticalClearSpacing: null,
    compressionLayers: [],
    compressionClearSpacing: null,
    compressionSpacingOk: null,
    compressionSpacingMessage: "Compression reinforcement was not laid out.",
    insideWidth: input.b - 2 * (input.cover + input.stirrupDiameter),
    rhoLimitOk: false,
    requiredRhoLimitOk: false,
    minimumSteelOk: false,
    geometryOk: false,
    verticalSpacingOk: false,
    compressionStateOk: true,
    equilibriumOk: false,
    forceResidual: null,
    concreteForce: null,
    tensionForce: null,
    compressionSteelForce: null,
    concreteMoment: null,
    tensionMoment: null,
    compressionSteelMoment: null,
    Mn: null,
    phiMn: null,
    strengthOk: false,
    strainOk: false,
    asSinglyPortion: null,
    mnSingly: null,
    mnRemaining: null,
    muRemaining: null,
    asAdditionalTension: null,
    asCompression: null,
    epsilonSPrime: null,
    fsPrime: null,
    epsilonSPrimeDesign: null,
    fsPrimeDesign: null,
    compressionSteelYields: null,
    iterationCount: 0,
    iterationRows: [],
    warnings: [],
  };
}

function pairwiseGeometryCheck(
  tension: GroupLayout,
  compression: GroupLayout | null,
): boolean {
  if (!compression) return true;
  for (const tensionRow of tension.rows) {
    for (const compressionRow of compression.rows) {
      for (const tx of tensionRow.xCentres) {
        for (const cx of compressionRow.xCentres) {
          const dx = tx - cx;
          const dy = tensionRow.yFromCompressionFace - compressionRow.yFromCompressionFace;
          const clear = Math.hypot(dx, dy) - (tensionRow.diameter + compressionRow.diameter) / 2;
          if (clear < -1e-7) return false;
        }
      }
    }
  }
  return true;
}

/** Design a positive-moment rectangular beam, switching to superposition when the singly design is not valid. */
export function designSinglyReinforcedBeam(input: FlexuralBeamInput): FlexuralBeamResult {
  const validationError = validateFlexuralBeamInput(input);
  if (validationError) throw new Error(validationError);
  const normalized = normalizeInput(input);
  const beta1 = beta1Factor(normalized.fc);
  const rhoMin = rhoMinimum(normalized);
  const initialD = normalized.legacyEffectiveDepth
    ? Number(input.d)
    : normalized.h - normalized.cover - normalized.stirrupDiameter - normalized.barDiameter / 2;
  if (!Number.isFinite(initialD) || initialD <= 0) {
    throw new Error("The first tension-bar centroid is outside the section; increase h or reduce cover/stirrup/bar dimensions.");
  }
  // Store the legacy d separately instead of ever treating it as h.
  if (normalized.legacyEffectiveDepth) {
    if (normalized.legacyDPrime !== null && normalized.legacyDPrime >= normalized.h - normalized.cover - normalized.stirrupDiameter) {
      throw new Error("Legacy d′ must lie inside the section, measured from the compression face.");
    }
  }
  const trial = requiredSteel(normalized, beta1, initialD);
  const base = makeBaseResult(normalized, beta1, rhoMin, initialD, trial, "No valid reinforcement arrangement has been selected.");
  const minSteelArea = rhoMin * normalized.b * initialD;
  const trialArea = Number.isFinite(trial.area) ? Math.max(trial.area, minSteelArea) : minSteelArea;
  const firstCount = Math.max(1, Math.ceil(trialArea / base.barArea));
  const applicableRhoMax = RHO_MAX;
  const iterationRows: FlexuralBeamResult["iterationRows"] = [];
  let iterationCount = 0;
  let singlyLimitReason = Number.isFinite(trial.rho) && trial.rho > applicableRhoMax
    ? `Required trial ratio ${trial.rho.toFixed(5)} exceeds ρmax=${applicableRhoMax.toFixed(3)}.`
    : "";
  let selectedSingle: {
    layout: GroupLayout;
    analysis: SectionAnalysis;
    asRequired: number;
    rhoRequired: number;
    rhoProvided: number;
    requiredData: ReturnType<typeof requiredSteel>;
    governingCase: "minimum" | "calculated";
  } | null = null;

  if (!singlyLimitReason) {
    for (let offset = 0; offset < MAX_SINGLE_BAR_TRIALS; offset += 1) {
      const count = firstCount + offset;
      iterationCount += 1;
      const layout = buildGroupLayout(normalized, count, "tension");
      if (!layout.valid || !layout.d) {
        iterationRows.push({
          trial: iterationCount,
          tensionBars: layout.rows.map((row) => row.count).join("+"),
          compressionBars: "—",
          d: layout.d ?? initialD,
          asRequired: trialArea,
          phiMn: null,
          spacingOk: false,
          reason: layout.reason,
        });
        if (offset === 0) singlyLimitReason = layout.reason;
        if (layout.reason.includes("more reinforcement layers than fit")) break;
        continue;
      }
      const requiredData = requiredSteel(normalized, beta1, layout.d);
      const asRequired = Math.max(Number.isFinite(requiredData.area) ? requiredData.area : 0, rhoMin * normalized.b * layout.d);
      const rhoRequired = asRequired / (normalized.b * layout.d);
      const rhoProvided = layout.area / (normalized.b * layout.d);
      const applicableLimit = applicableRhoMax;
      const requiredLimitOk = rhoRequired <= applicableLimit + 1e-12;
      const providedLimitOk = rhoProvided <= applicableLimit + 1e-12;
      if (!requiredLimitOk || !providedLimitOk) {
        singlyLimitReason = "The required or rounded provided tension reinforcement exceeds ρmax=0.025.";
        iterationRows.push({
          trial: iterationCount,
          tensionBars: layout.rows.map((row) => row.count).join("+"),
          compressionBars: "—",
          d: layout.d,
          asRequired,
          phiMn: null,
          spacingOk: layout.spacingOk,
          reason: "Required or provided reinforcement ratio exceeds ρmax=0.025.",
        });
        break;
      }
      const analysis = analyzeSection(normalized, beta1, layout, null);
      const strengthOk = analysis.valid && analysis.phiMn !== null && analysis.phiMn + 1e-8 >= normalized.Mu;
      const minimumOk = layout.area + 1e-8 >= rhoMin * normalized.b * layout.d;
      const adequacy = layout.valid && minimumOk && analysis.valid && analysis.strainOk && analysis.equilibriumOk && strengthOk;
      const failedChecks = [
        !analysis.valid ? analysis.reason : null,
        !analysis.strainOk ? `Extreme tension strain εt=${analysis.epsilonT?.toFixed(6) ?? "not available"} does not meet εt,min=${EPSILON_BEAM_MIN.toFixed(3)}.` : null,
        !analysis.equilibriumOk ? "Force equilibrium did not converge within tolerance." : null,
        !strengthOk && analysis.phiMn !== null ? `φMn=${analysis.phiMn.toFixed(2)} kN·m is below Mu=${normalized.Mu.toFixed(2)} kN·m.` : null,
        !minimumOk ? "Provided tension steel is below As,min." : null,
      ].filter((reason): reason is string => reason !== null);
      const trialReason = adequacy ? "Adequate singly reinforced trial." : failedChecks.join(" ") || "The provided singly reinforced bars do not meet the required steel area.";
      iterationRows.push({
        trial: iterationCount,
        tensionBars: layout.rows.map((row) => row.count).join("+"),
        compressionBars: "—",
        d: layout.d,
        asRequired,
        phiMn: analysis.phiMn,
        spacingOk: layout.spacingOk,
        reason: trialReason,
      });
      if (!adequacy) singlyLimitReason = trialReason;
      if (adequacy && layout.area + 1e-8 >= asRequired) {
        selectedSingle = {
          layout,
          analysis,
          asRequired,
          rhoRequired,
          rhoProvided,
          requiredData,
          governingCase: Number.isFinite(requiredData.rho) && requiredData.rho < rhoMin ? "minimum" : "calculated",
        };
        break;
      }
      if (!analysis.valid && iterationRows[iterationRows.length - 1].reason.includes("No force-equilibrium root")) {
        singlyLimitReason = "The singly reinforced section has no valid force-equilibrium solution with the selected section and bar arrangement.";
      }
    }
  }

  if (selectedSingle) {
    const { layout, analysis, asRequired, rhoRequired, rhoProvided, requiredData, governingCase } = selectedSingle;
    const warnings = ["ρmax = 0.025 follows the special moment-frame beam limit in NSCP 2015 Section 418.6.3.1. Passing this section check does not establish full seismic-system compliance."];
    const result: FlexuralBeamResult = {
      ...base,
      ok: true,
      message: `Adequate singly reinforced section: φMn = ${analysis.phiMn!.toFixed(2)} kN·m ≥ Mu = ${normalized.Mu.toFixed(2)} kN·m.`,
      sectionType: "singly",
      governingCase,
      d: layout.d!,
      dExtremeTension: normalized.legacyEffectiveDepth ? initialD : normalized.h - layout.rows[0].yFromTensionFace,
      beta1,
      phi: analysis.phi,
      epsilonY: normalized.fy / normalized.Es,
      epsilonT: analysis.epsilonT,
      a: analysis.a,
      c: analysis.c,
      Rn: requiredData.Rn,
      requiredMn: requiredData.requiredMn,
      rhoRequired,
      rhoMin,
      rhoMax: applicableRhoMax,
      asRequired,
      asMin: rhoMin * normalized.b * layout.d!,
      asMax: applicableRhoMax * normalized.b * layout.d!,
      asFinal: layout.area,
      asProvided: layout.area,
      barsRequired: layout.totalBars,
      barsBeforeRounding: asRequired / base.barArea,
      rhoProvided,
      clearSpacing: layout.clearSpacing,
      minClearSpacingRequired: minimumTensionSpacing(normalized),
      spacingOk: layout.spacingOk,
      spacingMessage: layout.spacingMessage,
      tensionBarLayers: layout.rows.length,
      tensionBarsPerLayer: layout.rows.map((row) => row.count),
      tensionVerticalClearSpacing: layout.verticalClearSpacing,
      tensionLayers: analysis.tensionLayers,
      insideWidth: layout.insideWidth,
      rhoLimitOk: true,
      requiredRhoLimitOk: true,
      minimumSteelOk: layout.area + 1e-8 >= rhoMin * normalized.b * layout.d!,
      geometryOk: pairwiseGeometryCheck(layout, null),
      verticalSpacingOk: layout.verticalSpacingOk,
      compressionStateOk: true,
      equilibriumOk: analysis.equilibriumOk,
      forceResidual: analysis.forceResidual,
      concreteForce: analysis.concreteForce,
      tensionForce: analysis.tensionForce,
      compressionSteelForce: analysis.compressionForce,
      concreteMoment: analysis.concreteMoment,
      tensionMoment: analysis.tensionMoment,
      compressionSteelMoment: analysis.compressionMoment,
      Mn: analysis.Mn,
      phiMn: analysis.phiMn,
      strengthOk: analysis.phiMn! + 1e-8 >= normalized.Mu,
      strainOk: analysis.strainOk,
      iterationCount,
      iterationRows,
      warnings,
    };
    return result;
  }

  return designDoublyReinforced(
    normalized,
    base,
    beta1,
    rhoMin,
    trial,
    trialArea,
    firstCount,
    singlyLimitReason || "No singly reinforced bar arrangement satisfies the final strain-compatible strength check.",
    iterationRows,
    iterationCount,
  );
}

function designDoublyReinforced(
  input: NormalizedInput,
  base: FlexuralBeamResult,
  beta1: number,
  rhoMin: number,
  trial: ReturnType<typeof requiredSteel>,
  initialTensionArea: number,
  firstTensionCount: number,
  switchReason: string,
  previousRows: FlexuralBeamResult["iterationRows"],
  previousIterations: number,
): FlexuralBeamResult {
  const initialD = input.legacyEffectiveDepth
    ? Number(input.legacyEffectiveDepthValue)
    : input.h - input.cover - input.stirrupDiameter - input.barDiameter / 2;
  const dPrimeTrial = input.legacyEffectiveDepth && input.legacyDPrime !== null
    ? input.legacyDPrime
    : input.cover + input.stirrupDiameter + input.compressionBarDiameter / 2;
  const epsilonTDesign = EPSILON_TENSION_CONTROLLED;
  const cDesign = (EPSILON_CU * initialD) / (EPSILON_CU + epsilonTDesign);
  const aDesign = beta1 * cDesign;
  let as1 = (0.85 * input.fc * input.b * aDesign) / input.fy;
  let designRatioCapApplied = false;
  if (as1 / (input.b * initialD) > RHO_MAX) {
    as1 = RHO_MAX * input.b * initialD;
    designRatioCapApplied = true;
  }
  const mn1 = as1 * input.fy * (initialD - aDesign / 2) / 1e6;
  const mnRequired = input.Mu / PHI_TENSION;
  const mn2 = mnRequired - mn1;
  const epsilonSPrimeDesign = EPSILON_CU * (cDesign - dPrimeTrial) / cDesign;
  const fsPrimeDesign = clamp(epsilonSPrimeDesign * input.Es, -input.fy, input.fy);
  const as2 = mn2 > 0 && initialD > dPrimeTrial
    ? (mn2 * 1e6) / (input.fy * (initialD - dPrimeTrial))
    : 0;
  const asCompression = as2 > 0 && fsPrimeDesign > 0
    ? (as2 * input.fy) / fsPrimeDesign
    : Number.NaN;
  const asTotal = as1 + as2;
  const firstCompressionCount = Number.isFinite(asCompression)
    ? Math.max(1, Math.ceil(asCompression / steelArea(input.compressionBarDiameter)))
    : 0;
  const startTensionCount = Math.max(firstTensionCount, Math.ceil(asTotal / steelArea(input.barDiameter)));
  const iterationRows = [...previousRows];
  let iterationCount = previousIterations;

  if (!(mn2 > 0)) {
    return failureResult(
      input,
      base,
      "The singly-reinforced trial already reaches the required nominal moment, but its selected bar arrangement failed a geometry or spacing check. A compression-steel couple cannot repair that bar-layout failure; change b, h, cover, stirrup size, aggregate size, or bar diameter.",
      iterationRows,
      iterationCount,
    );
  }
  if (!(dPrimeTrial < cDesign)) {
    return failureResult(
      input,
      base,
      `The initial superposition trial places the compression-steel centroid below the neutral axis (d′=${dPrimeTrial.toFixed(1)} mm, c=${cDesign.toFixed(1)} mm); the selected top reinforcement would be in tension. Reduce cover/bar size, increase h, or revise the material and design inputs.`,
      iterationRows,
      iterationCount,
    );
  }
  if (!(fsPrimeDesign > 0) || !Number.isFinite(asCompression)) {
    return failureResult(
      input,
      base,
      "The compression steel has no positive compression stress in the design-strain trial, so the superposition compression area is not defined. Revise d′ or the section geometry.",
      iterationRows,
      iterationCount,
    );
  }
  if (startTensionCount > 96 || firstCompressionCount > 96) {
    return failureResult(
      input,
      base,
      "Not adequate: the required bar count is beyond the supported layout range. Increase the beam size or revise the reinforcement size.",
      iterationRows,
      iterationCount,
    );
  }

  type DoubleCandidate = {
    tension: GroupLayout;
    compression: GroupLayout;
    analysis: SectionAnalysis;
    asRequired: number;
    rhoRequired: number;
    rhoProvided: number;
    rhoRequiredLimitOk: boolean;
    rhoProvidedLimitOk: boolean;
    tensionCount: number;
    compressionCount: number;
  };
  let selected: DoubleCandidate | null = null;
  let lastReason = "The doubly reinforced design did not converge to an adequate provided-bar arrangement.";

  for (let extra = 0; extra <= MAX_DOUBLE_BAR_INCREMENTS && !selected; extra += 1) {
    const candidates: DoubleCandidate[] = [];
    for (let tensionExtra = 0; tensionExtra <= extra; tensionExtra += 1) {
      const compressionExtra = extra - tensionExtra;
      const tensionCount = startTensionCount + tensionExtra;
      const compressionCount = firstCompressionCount + compressionExtra;
      if (tensionCount > 96 || compressionCount > 96) continue;
      iterationCount += 1;
      const tension = buildGroupLayout(input, tensionCount, "tension");
      const compression = buildGroupLayout(input, compressionCount, "compression");
      if (!tension.valid || !compression.valid || !tension.d || !pairwiseGeometryCheck(tension, compression)) {
        const reason = !tension.valid ? tension.reason : !compression.valid
          ? compression.reason
          : "Tension and compression bars overlap inside the stirrup envelope.";
        lastReason = reason;
        iterationRows.push({
          trial: iterationCount,
          tensionBars: tension.rows.map((row) => row.count).join("+"),
          compressionBars: compression.rows.map((row) => row.count).join("+"),
          d: tension.d ?? initialD,
          asRequired: asTotal,
          phiMn: null,
          spacingOk: tension.valid && compression.valid,
          reason,
        });
        continue;
      }
      const asRequired = asTotal;
      const rhoRequired = asRequired / (input.b * tension.d);
      const rhoProvided = tension.area / (input.b * tension.d);
      const rhoRequiredLimitOk = rhoRequired <= RHO_MAX + 1e-12;
      const rhoProvidedLimitOk = rhoProvided <= RHO_MAX + 1e-12;
      const analysis = analyzeSection(input, beta1, tension, compression);
      const compressionAllActuallyCompression = analysis.compressionLayers.every((layer) => layer.state === "compression");
      const adequate = analysis.valid && analysis.strainOk && analysis.equilibriumOk &&
        analysis.phiMn !== null && analysis.phiMn + 1e-8 >= input.Mu &&
        tension.area + 1e-8 >= asRequired && compression.area + 1e-8 >= asCompression &&
        tension.area + 1e-8 >= rhoMin * input.b * tension.d &&
        rhoRequiredLimitOk && rhoProvidedLimitOk && compressionAllActuallyCompression;
      const reason = adequate
        ? "Adequate final provided-bar doubly reinforced trial."
        : !analysis.valid
          ? analysis.reason
          : !compressionAllActuallyCompression
            ? "At least one selected top-steel layer is actually in tension; increasing the tension group or revising d′ is required."
            : !rhoRequiredLimitOk || !rhoProvidedLimitOk
              ? "Required or rounded provided tension reinforcement exceeds the applicable ρmax limit."
              : analysis.phiMn !== null && analysis.phiMn < input.Mu
                ? `Final φMn=${analysis.phiMn.toFixed(2)} kN·m is below Mu=${input.Mu.toFixed(2)} kN·m.`
                : "Provided bars do not meet the theoretical tension/compression steel areas.";
      iterationRows.push({
        trial: iterationCount,
        tensionBars: tension.rows.map((row) => row.count).join("+"),
        compressionBars: compression.rows.map((row) => row.count).join("+"),
        d: tension.d,
        asRequired,
        phiMn: analysis.phiMn,
        spacingOk: tension.spacingOk && compression.spacingOk,
        reason,
      });
      if (adequate) {
        candidates.push({
          tension,
          compression,
          analysis,
          asRequired,
          rhoRequired,
          rhoProvided,
          rhoRequiredLimitOk,
          rhoProvidedLimitOk,
          tensionCount,
          compressionCount,
        });
      } else {
        lastReason = reason;
      }
    }
    if (candidates.length) {
      candidates.sort((left, right) => {
        const leftArea = left.tension.area + left.compression.area;
        const rightArea = right.tension.area + right.compression.area;
        return leftArea - rightArea || left.tensionCount + left.compressionCount - right.tensionCount - right.compressionCount;
      });
      selected = candidates[0];
    }
  }

  if (!selected) {
    return failureResult(
      input,
      base,
      lastReason,
      iterationRows,
      iterationCount,
      {
        asRequired: asTotal,
        barsBeforeRounding: asTotal / steelArea(input.barDiameter),
        compressionBarsBeforeRounding: asCompression / steelArea(input.compressionBarDiameter),
        asSinglyPortion: as1,
        mnSingly: mn1,
        mnRemaining: mn2,
        muRemaining: input.Mu - PHI_TENSION * mn1,
        asAdditionalTension: as2,
        asCompression,
        epsilonSPrime: epsilonSPrimeDesign,
        fsPrime: fsPrimeDesign,
      },
    );
  }

  const warnings = ["ρmax = 0.025 follows the special moment-frame beam limit in NSCP 2015 Section 418.6.3.1. Passing this section check does not establish full seismic-system compliance."];
  if (designRatioCapApplied) warnings.push("The singly reinforced contribution was capped at ρmax=0.025 before sizing the doubly reinforced section.");
  warnings.push("Final strain-compatible analysis deducts the concrete stress displaced by bars inside the Whitney compression block.");
  const dPrime = selected.compression.centroidFromCompressionFace;
  return {
    ...base,
    ok: true,
    message: `Adequate doubly reinforced section: φMn = ${selected.analysis.phiMn!.toFixed(2)} kN·m ≥ Mu = ${input.Mu.toFixed(2)} kN·m after final provided-bar strain and equilibrium checks.`,
    sectionType: "doubly",
    governingCase: "doubly-reinforced",
    d: selected.tension.d!,
    dExtremeTension: input.h - selected.tension.rows[0].yFromTensionFace,
    dPrime,
    beta1,
    phi: selected.analysis.phi,
    epsilonY: input.fy / input.Es,
    epsilonT: selected.analysis.epsilonT,
    a: selected.analysis.a,
    c: selected.analysis.c,
    Rn: trial.Rn,
    requiredMn: input.Mu / PHI_TENSION,
    rhoRequired: selected.rhoRequired,
    rhoProvided: selected.rhoProvided,
    rhoMin,
    rhoMax: RHO_MAX,
    asRequired: asTotal,
    asMin: rhoMin * input.b * selected.tension.d!,
    asMax: RHO_MAX * input.b * selected.tension.d!,
    asFinal: selected.tension.area,
    asProvided: selected.tension.area,
    barsRequired: selected.tension.totalBars,
    barsBeforeRounding: asTotal / base.barArea,
    compressionBarsRequired: selected.compression.totalBars,
    compressionBarsBeforeRounding: asCompression / base.compressionBarArea,
    clearSpacing: selected.tension.clearSpacing,
    minClearSpacingRequired: minimumTensionSpacing(input),
    spacingOk: selected.tension.spacingOk,
    spacingMessage: selected.tension.spacingMessage,
    tensionBarLayers: selected.tension.rows.length,
    tensionBarsPerLayer: selected.tension.rows.map((row) => row.count),
    tensionVerticalClearSpacing: selected.tension.verticalClearSpacing,
    tensionLayers: selected.analysis.tensionLayers,
    compressionBarLayers: selected.compression.rows.length,
    compressionBarsPerLayer: selected.compression.rows.map((row) => row.count),
    compressionVerticalClearSpacing: selected.compression.verticalClearSpacing,
    compressionLayers: selected.analysis.compressionLayers,
    compressionClearSpacing: selected.compression.clearSpacing,
    compressionSpacingOk: selected.compression.spacingOk,
    compressionSpacingMessage: selected.compression.spacingMessage,
    insideWidth: selected.tension.insideWidth,
    rhoLimitOk: selected.rhoProvidedLimitOk,
    requiredRhoLimitOk: selected.rhoRequiredLimitOk,
    minimumSteelOk: selected.tension.area + 1e-8 >= rhoMin * input.b * selected.tension.d!,
    geometryOk: pairwiseGeometryCheck(selected.tension, selected.compression),
    verticalSpacingOk: selected.tension.verticalSpacingOk && selected.compression.verticalSpacingOk,
    compressionStateOk: selected.analysis.compressionStateOk,
    equilibriumOk: selected.analysis.equilibriumOk,
    forceResidual: selected.analysis.forceResidual,
    concreteForce: selected.analysis.concreteForce,
    tensionForce: selected.analysis.tensionForce,
    compressionSteelForce: selected.analysis.compressionForce,
    concreteMoment: selected.analysis.concreteMoment,
    tensionMoment: selected.analysis.tensionMoment,
    compressionSteelMoment: selected.analysis.compressionMoment,
    Mn: selected.analysis.Mn,
    phiMn: selected.analysis.phiMn,
    strengthOk: selected.analysis.phiMn! + 1e-8 >= input.Mu,
    strainOk: selected.analysis.strainOk,
    asSinglyPortion: as1,
    mnSingly: mn1,
    mnRemaining: mn2,
    muRemaining: input.Mu - PHI_TENSION * mn1,
    asAdditionalTension: as2,
    asCompression,
    epsilonSPrime: selected.analysis.epsilonSPrime,
    fsPrime: selected.analysis.fsPrime,
    epsilonSPrimeDesign,
    fsPrimeDesign: fsPrimeDesign,
    compressionSteelYields: selected.analysis.compressionSteelYields,
    iterationCount,
    iterationRows,
    warnings: [
      `Doubly reinforced design selected because: ${switchReason}`,
      `The doubly reinforced trial used εt=${epsilonTDesign.toFixed(3)}; final φ is recalculated from provided-bar strain using NSCP 2015 Table 421.2.2 / ACI 318-14 Table 21.2.2.`,
      ...warnings,
    ],
  };
}

function failureResult(
  input: NormalizedInput,
  base: FlexuralBeamResult,
  message: string,
  iterationRows: FlexuralBeamResult["iterationRows"],
  iterationCount: number,
  partial: Partial<FlexuralBeamResult> = {},
): FlexuralBeamResult {
  const failureType = classifyFailure(message, iterationRows);
  const conciseMessage = failureSummary(failureType);
  return {
    ...base,
    ...partial,
    ok: false,
    message: conciseMessage,
    failureType,
    failureDetails: message,
    sectionType: "doubly",
    governingCase: "doubly-reinforced",
    iterationRows,
    iterationCount,
    warnings: [],
    rhoMax: RHO_MAX,
  };
}

function classifyFailure(
  message: string,
  iterationRows: FlexuralBeamResult["iterationRows"],
): Exclude<FlexuralFailureType, null> {
  const normalizedMessage = message.toLowerCase();
  if (normalizedMessage.includes("ρmax") || normalizedMessage.includes("reinforcement ratio")) return "reinforcement-limit";
  if (
    iterationRows.some((row) => row.reason.includes("group needs")) ||
    normalizedMessage.includes("fit inside the stirrups") ||
    normalizedMessage.includes("fit between the top and bottom cover") ||
    normalizedMessage.includes("geometry or spacing") ||
    normalizedMessage.includes("overlap") ||
    normalizedMessage.includes("spacing check")
  ) return "layout";
  if (normalizedMessage.includes("φmn") || normalizedMessage.includes("moment")) return "strength";
  if (normalizedMessage.includes("strain") || normalizedMessage.includes("εt") || normalizedMessage.includes("neutral axis") || normalizedMessage.includes("compression steel")) return "strain";
  if (normalizedMessage.includes("force-equilibrium") || normalizedMessage.includes("equilibrium")) return "equilibrium";
  return "other";
}

function failureSummary(failureType: Exclude<FlexuralFailureType, null>): string {
  switch (failureType) {
    case "layout":
      return "Not adequate: the selected bars do not fit while meeting minimum spacing and layer-clearance requirements.";
    case "strength":
      return "Not adequate: calculated flexural strength is below the factored moment demand.";
    case "reinforcement-limit":
      return "Not adequate: the required or provided reinforcement exceeds the applicable ratio limit.";
    case "strain":
      return "Not adequate: the strain-compatibility or compression-steel check failed.";
    case "equilibrium":
      return "Not adequate: tension and compression forces did not balance within tolerance.";
    default:
      return "Not adequate: no reinforcement arrangement passed all section checks.";
  }
}

function n(value: number | null | undefined, digits = 2): string {
  return value !== null && value !== undefined && Number.isFinite(value)
    ? value.toFixed(digits)
    : "\\text{not available}";
}

function rowBreakdown(layers: ReinforcementLayerResult[], face: "tension" | "compression"): string {
  return layers.map((layer) =>
    `${layer.count}\\times${n(layer.areaPerBar, 2)}\\text{ at }y_${layer.index}=${n(face === "tension" ? layer.yFromTensionFace : layer.yFromCompressionFace, 2)}\\text{ mm}`,
  ).join(";\\quad ");
}

function restoreLatexCommands(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const controlsRestored = value
    .replace(/\u0008/g, "\\b")
    .replace(/\t/g, "\\t")
    .replace(/\r/g, "\\r")
    .replace(/\u000b/g, "\\v")
    .replace(/maxleft/g, "\\max\\left")
    .replace(/leftlceil/g, "\\left\\lceil")
    .replace(/(?<!\\)left\(/g, "\\left(")
    .replace(/=min\(/g, "=\\min(");
  return controlsRestored.replace(
    /(?<!\\)\b(dfrac|qquad|quad|phi|rho|sqrt|left|right|pi|lceil|rceil|ge|sum|varepsilon|beta)\b/g,
    "\\$1",
  );
}

/**
 * Manual workflow for reinforcement design only. Capacity analysis remains an
 * internal acceptance check and is presented by the Beam Capacity Check tool.
 */
export function getDesignSolutionSteps(
  input: FlexuralBeamInput,
  result: FlexuralBeamResult,
): SolutionStep[] {
  const normalized = normalizeInput(input);
  const steps: SolutionStep[] = [];
  const trialD = normalized.legacyEffectiveDepth
    ? Number(input.d)
    : normalized.h - normalized.cover - normalized.stirrupDiameter - normalized.barDiameter / 2;
  const designDPrime = normalized.legacyEffectiveDepth && normalized.legacyDPrime !== null
    ? normalized.legacyDPrime
    : normalized.cover + normalized.stirrupDiameter + normalized.compressionBarDiameter / 2;
  const trial = requiredSteel(normalized, result.beta1, trialD);
  const tensionAreaPerBar = steelArea(normalized.barDiameter);
  const compressionAreaPerBar = steelArea(normalized.compressionBarDiameter);
  const referenceStrength = "NSCP 2015 Sections 421.2.2 and 422.2.2 / ACI 318-14 Sections 21.2.2 and 22.2.2.";
  const referenceSpacing = "NSCP 2015 Sections 425.2.1–425.2.2 / ACI 318-14 Sections 25.2.1–25.2.2.";

  steps.push({
    label: "Given design data",
    formula: "M_u,\ b,\ h,\ C_c,\ d_{st},\ d_b,\ f'_c,\ f_y,\ E_s,\ d_{agg}",
    substitution: `M_u=${n(normalized.Mu, 2)}\text{ kN m};\quad b=${n(normalized.b, 1)}\text{ mm};\quad h=${n(normalized.h, 1)}\text{ mm};\quad f'_c=${n(normalized.fc, 1)}\text{ MPa};\quad f_y=${n(normalized.fy, 1)}\text{ MPa}`,
    result: "The beam is designed for positive factored moment using the entered tension-bar size. Compression bars are added only when a singly reinforced design is insufficient.",
    reference: "NSCP 2015 Chapter 4 / ACI 318-14 Chapters 9, 21, 22, and 25.",
    status: "info",
  });

  steps.push({
    label: "Effective depth from the reinforcement geometry",
    formula: normalized.legacyEffectiveDepth
      ? "d=d_{legacy}"
      : "d_{trial}=h-C_c-d_{st}-\dfrac{d_b}{2};\qquad d=h-\bar y_s",
    substitution: normalized.legacyEffectiveDepth
      ? `d=${n(result.d, 2)}\text{ mm}`
      : `d_{trial}=${n(normalized.h, 1)}-${n(normalized.cover, 1)}-${n(normalized.stirrupDiameter, 1)}-\dfrac{${n(normalized.barDiameter, 1)}}{2}=${n(trialD, 2)}\text{ mm};\quad d_{final}=${n(result.d, 2)}\text{ mm}`,
    result: result.tensionBarLayers > 1
      ? `The adopted bars require ${result.tensionBarLayers} layers, so the final effective depth is measured to their area-weighted centroid.`
      : `The adopted tension bars fit in one layer; the effective depth is ${n(result.d, 2)} mm.`,
    resultMath: result.tensionLayers.length
      ? `\bar y_s=\dfrac{${result.tensionLayers.map((layer) => `(${n(layer.area, 2)})(${n(layer.yFromTensionFace, 2)})`).join("+")}}{${result.tensionLayers.map((layer) => n(layer.area, 2)).join("+")}}=${n(result.h - result.d, 2)}\text{ mm}`
      : undefined,
    explanation: normalized.legacyEffectiveDepth
      ? "A legacy caller supplied an effective depth, so that value is preserved as d."
      : "Cc is the clear cover from the concrete face to the outside of the stirrup.",
  });

  steps.push({
    label: "Required nominal moment and singly reinforced trial",
    formula: "M_{n,req}=\dfrac{M_u}{\phi};\qquad R_n=\dfrac{M_{n,req}}{b d^2};\qquad \rho=\dfrac{1-\sqrt{1-2mR_n/f_y}}{m};\quad m=\dfrac{f_y}{0.85f'_c}",
    substitution: `\phi=0.90;\quad M_{n,req}=\dfrac{${n(normalized.Mu, 2)}}{0.90}=${n(result.requiredMn, 2)}\text{ kN m};\quad R_n=${n(trial.Rn, 4)}\text{ MPa};\quad \rho=${n(trial.rho, 6)}`,
    result: result.sectionType === "singly"
      ? "The singly reinforced trial supplies the required design steel."
      : "The singly reinforced portion is insufficient, so the remaining moment is assigned to a tension-compression steel couple.",
    reference: referenceStrength,
  });

  steps.push({
    label: "Minimum and maximum reinforcement",
    formula: "\rho_{min}=\max\left(\dfrac{\sqrt{f'_c}}{4f_y},\dfrac{1.4}{f_y}\right);\quad A_{s,min}=\rho_{min}bd;\quad \rho_{max}=0.025",
    substitution: `\rho_{min}=${n(result.rhoMin, 6)};\quad A_{s,min}=${n(result.asMin, 2)}\text{ mm}^2;\quad \rho_{required}=${n(result.rhoRequired, 6)};\quad \rho_{provided}=${n(result.rhoProvided, 6)}`,
    result: `Minimum steel: ${result.minimumSteelOk ? "PASS" : "FAIL"}. Required ratio limit: ${result.requiredRhoLimitOk ? "PASS" : "FAIL"}. Provided ratio limit: ${result.rhoLimitOk ? "PASS" : "FAIL"}.`,
    reference: "NSCP 2015 Sections 409.6.1.2 and 418.6.3.1 / ACI 318-14 Sections 9.6.1.2 and 18.6.3.1.",
    status: result.minimumSteelOk && result.requiredRhoLimitOk && result.rhoLimitOk ? "pass" : "fail",
  });

  if (result.sectionType === "doubly") {
    const cDesign = 0.003 * trialD / (0.003 + 0.005);
    const aDesign = result.beta1 * cDesign;
    steps.push({
      label: "Beam 1: singly reinforced portion",
      formula: "c=\dfrac{0.003}{0.003+\varepsilon_t}d;\quad a=\beta_1c;\quad A_{s1}=\dfrac{0.85f'_cba}{f_y};\quad M_{n1}=A_{s1}f_y\left(d-\dfrac{a}{2}\right)",
      substitution: `\varepsilon_t=0.005;\quad c=${n(cDesign, 2)}\text{ mm};\quad a=${n(aDesign, 2)}\text{ mm};\quad A_{s1}=${n(result.asSinglyPortion, 2)}\text{ mm}^2`,
      result: "Beam 1 is the tension-controlled singly reinforced contribution used in the design superposition.",
      resultMath: `M_{n1}=${n(result.mnSingly, 2)}\text{ kN m}`,
      reference: referenceStrength,
    });

    steps.push({
      label: "Beam 2: additional tension steel",
      formula: "M_{n2}=M_{n,req}-M_{n1};\qquad A_{s2}=\dfrac{M_{n2}}{f_y(d-d')}",
      substitution: `M_{n2}=${n(result.requiredMn, 2)}-${n(result.mnSingly, 2)}=${n(result.mnRemaining, 2)}\text{ kN m};\quad A_{s2}=\dfrac{${n((result.mnRemaining ?? 0) * 1e6, 0)}}{${n(normalized.fy, 1)}[${n(trialD, 2)}-${n(designDPrime, 2)}]}=${n(result.asAdditionalTension, 2)}\text{ mm}^2`,
      result: "The total required bottom reinforcement is the sum of the Beam 1 steel and the additional Beam 2 tension steel.",
      resultMath: `A_s=A_{s1}+A_{s2}=${n(result.asSinglyPortion, 2)}+${n(result.asAdditionalTension, 2)}=${n(result.asRequired, 2)}\text{ mm}^2`,
      reference: referenceStrength,
    });

    steps.push({
      label: "Beam 2: required compression steel",
      formula: "d'=C_c+d_{st}+\dfrac{d'_b}{2};\quad \varepsilon'_s=0.003\dfrac{c-d'}{c};\quad f'_s=\min(E_s\varepsilon'_s,f_y);\quad A'_s=\dfrac{A_{s2}f_y}{f'_s}",
      substitution: `d'=${n(designDPrime, 2)}\text{ mm};\quad \varepsilon'_{s,design}=${n(result.epsilonSPrimeDesign, 6)};\quad f'_{s,design}=${n(result.fsPrimeDesign, 2)}\text{ MPa};\quad A'_s=${n(result.asCompression, 2)}\text{ mm}^2`,
      result: "Compression steel is sized from force equilibrium; its stress is limited to fy when the design strain would cause yielding.",
      reference: referenceStrength,
    });
  }

  steps.push({
    label: "Select whole bars",
    formula: "A_b=\dfrac{\pi d_b^2}{4};\quad n_{raw}=\dfrac{A_{s,required}}{A_b};\quad n=\left\lceil n_{raw}\right\rceil",
    substitution: `A_b=\dfrac{\pi(${n(normalized.barDiameter, 1)})^2}{4}=${n(tensionAreaPerBar, 2)}\text{ mm}^2;\quad n_{raw}=${n(result.barsBeforeRounding, 3)};\quad n=${result.barsRequired}` + (result.compressionBarsRequired > 0 ? `;\quad A'_b=${n(compressionAreaPerBar, 2)}\text{ mm}^2;\quad n'=${result.compressionBarsRequired}` : ""),
    result: `Adopt ${result.barsRequired} bottom bars (${result.tensionBarsPerLayer.join(" + ")} by layer)` + (result.compressionBarsRequired > 0 ? ` and ${result.compressionBarsRequired} top bars (${result.compressionBarsPerLayer.join(" + ")} by layer).` : "."),
    resultMath: `A_{s,provided}=${n(result.asProvided, 2)}\text{ mm}^2\ ${result.asProvided + 1e-8 >= result.asRequired ? "\ge" : "<"}\ A_{s,required}=${n(result.asRequired, 2)}\text{ mm}^2`,
    status: result.asProvided + 1e-8 >= result.asRequired ? "pass" : "fail",
  });

  const tensionSpacing = result.tensionLayers.map((layer) => layer.count === 1
    ? `\text{Layer ${layer.index}: one bar; no horizontal interbar gap}`
    : `\text{Layer ${layer.index}: }s_{clear}=\dfrac{${n(normalized.b, 1)}-2(${n(normalized.stirrupDiameter, 1)})-2(${n(normalized.cover, 1)})-${layer.count}(${n(layer.barDiameter, 1)})}{${layer.count - 1}}=${n(layer.uniformSpreadClearSpacing, 2)}\text{ mm}`,
  ).join(";\quad ");
  steps.push({
    label: "Horizontal clear spacing",
    formula: "s_{clear,min}=\max\left(25,d_b,\dfrac{4d_{agg}}{3}\right);\quad b_{inside}=b-2(C_c+d_{st});\quad s_{clear}=\dfrac{b-2d_{st}-2C_c-n d_b}{n-1}",
    substitution: `s_{clear,min}=\max\left(25,${n(normalized.barDiameter, 1)},\dfrac{4(${n(normalized.aggregateSize, 1)})}{3}\right)=${n(result.minClearSpacingRequired, 2)}\text{ mm};\quad b_{inside}=${n(result.insideWidth, 2)}\text{ mm};\quad ${tensionSpacing}`,
    result: `Every adopted tension-bar layer ${result.spacingOk ? "meets" : "does not meet"} the required horizontal clear spacing (${result.spacingOk ? "PASS" : "FAIL"}).`,
    explanation: "Clear spacing is the concrete gap between adjacent bar surfaces. For a one-bar layer, there is no adjacent-bar gap and no division by zero.",
    reference: referenceSpacing,
    status: result.spacingOk ? "pass" : "fail",
  });

  steps.push({
    label: "Vertical layer spacing and final design",
    formula: "s_{vertical,clear}\ge25\text{ mm};\qquad A_i=n_iA_{bar};\qquad \bar y_s=\dfrac{\sum A_i y_i}{\sum A_i}",
    substitution: result.tensionLayers.length > 1
      ? result.tensionLayers.slice(0, -1).map((layer) => `s_{v,${layer.index}-${layer.index + 1}}=${n(layer.verticalClearSpacingToNext, 1)}\text{ mm}`).join(";\quad ")
      : "\text{One tension layer; no vertical layer-spacing check is required}",
    result: result.ok
      ? `Design complete: ${result.barsRequired} bottom bars and ${result.compressionBarsRequired} top compression bars. The selected layers satisfy the design and detailing checks.`
      : result.message,
    explanation: "Use Beam Capacity Check for the separate provided-section strain, stress, neutral-axis, and moment-capacity analysis.",
    reference: referenceSpacing,
    status: result.ok ? "pass" : "fail",
  });

  return steps.map((step) => ({
    ...step,
    formula: restoreLatexCommands(step.formula) ?? step.formula,
    substitution: restoreLatexCommands(step.substitution) ?? step.substitution,
    resultMath: restoreLatexCommands(step.resultMath),
  }));
}

export function getSolutionSteps(
  input: FlexuralBeamInput,
  result: FlexuralBeamResult,
): SolutionStep[] {
  const normalized = normalizeInput(input);
  const steps: SolutionStep[] = [];
  const add = (step: SolutionStep) => steps.push(step);
  const coverStirrupOffset = normalized.cover + normalized.stirrupDiameter;
  const legacyNote = normalized.legacyEffectiveDepth
    ? "Legacy caller supplied d as an existing effective depth; it is preserved as d, never reinterpreted as h."
    : `h=${n(normalized.h, 1)} mm, Cc=${n(normalized.cover, 1)} mm, stirrup=${n(normalized.stirrupDiameter, 1)} mm.`;
  const trialD = normalized.legacyEffectiveDepth
    ? Number(input.d)
    : normalized.h - coverStirrupOffset - normalized.barDiameter / 2;
  const initialTrial = requiredSteel(normalized, result.beta1, trialD);
  const Ab = steelArea(normalized.barDiameter);

  add({
    label: "Given values and calculation scope",
    formula: "M_u,\\ b,\\ h,\\ f'_c,\\ f_y,\\ E_s,\\ C_c,\\ d_{st},\\ d_b,\\ d_{agg}",
    substitution: `M_u=${n(normalized.Mu, 2)}\\text{kN·m},\\ b=${n(normalized.b, 1)}\\text{ mm},\\ f'_c=${n(normalized.fc, 1)}\\text{ MPa},\\ f_y=${n(normalized.fy, 1)}\\text{ MPa},\\ E_s=${n(normalized.Es, 0)}\\text{ MPa},\\ d_{agg}=${n(normalized.aggregateSize, 1)}\\text{ mm}`,
    result: "Positive sagging moment; rectangular section; SI units; Pu = 0 assumed.",
    reference: "NSCP 2015 Section 409.3.3.1 / ACI 318-14 Section 9.3.3.1 (minimum tensile strain; Pu < 0.10f′cAg).",
    explanation: `${legacyNote} One cover input applies to all faces and is measured to the outside of the stirrup. The top face is in compression. Shear, anchorage, joints, and full seismic detailing are outside this section calculation.`,
    status: "info",
  });

  add({
    label: "Initial effective-depth geometry",
    formula: normalized.legacyEffectiveDepth
      ? "d=d_{legacy}\\quad(\\text{preserved as an effective depth})"
      : "d=h-C_c-d_{st}-\\dfrac{d_b}{2}",
    substitution: normalized.legacyEffectiveDepth
      ? `d=${n(input.d, 1)}\\text{ mm}`
      : `d=${n(normalized.h, 1)}-${n(normalized.cover, 1)}-${n(normalized.stirrupDiameter, 1)}-${n(normalized.barDiameter, 1)}/2=${n(trialD, 2)}\\text{ mm}`,
    result: `Initial one-layer trial depth d=${n(trialD, 2)} mm; final d is recomputed from the adopted layer centroid (${n(result.d, 2)} mm).`,
    explanation: "For multiple layers, the final d is measured to the area-weighted centroid of all tension bars, not just the outermost layer.",
    status: result.d > 0 ? "pass" : "fail",
  });

  add({
    label: "Compression-steel depth from cover",
    formula: normalized.legacyEffectiveDepth && normalized.legacyDPrime !== null
      ? "d'=d'_{legacy}\\quad(\\text{preserved as a compression-steel centroid depth})"
      : "d'=C_c+d_{st}+\\dfrac{d'_b}{2}",
    substitution: normalized.legacyEffectiveDepth && normalized.legacyDPrime !== null
      ? `d'=${n(normalized.legacyDPrime, 1)}\\text{ mm}`
      : `d'=${n(normalized.cover, 1)}+${n(normalized.stirrupDiameter, 1)}+${n(normalized.compressionBarDiameter, 1)}/2=${n(result.dPrime, 2)}\\text{ mm}`,
    result: result.sectionType === "doubly"
      ? `Final compression-steel centroid d'=${n(result.dPrime, 2)} mm from the extreme compression face.`
      : "No compression reinforcement is required for the accepted singly reinforced arrangement.",
    explanation: "d′ is measured from the extreme compression face to the centroid of the compression reinforcement.",
  });

  add({
    label: "Concrete stress-block factor",
    formula: "\\beta_1=\\max\\left(0.65,\\ 0.85-0.05\\dfrac{f'_c-28}{7}\\right)\\quad(f'_c>28\\text{ MPa});\\quad \\beta_1=0.85\\ (f'_c\\le28)",
    substitution: normalized.fc <= 28
      ? `f'_c=${n(normalized.fc, 1)}\\le28\\text{ MPa}`
      : `\\beta_1=\\max(0.65,0.85-0.05\\dfrac{${n(normalized.fc, 1)}-28}{7})`,
    result: "The concrete stress-block factor is dimensionless.",
    resultMath: `\\beta_1=${n(result.beta1, 3)}`,
    reference: "NSCP 2015 Section 422.2.2.4.3 / ACI 318-14 Section 22.2.2.4.3.",
  });

  add({
    label: "Trial tensile strain and assumed strength-reduction factor",
    formula: "\\varepsilon_{t,trial}=0.005\\quad\\Longrightarrow\\quad\\phi_{trial}=0.90",
    substitution: `\\phi_{trial}=0.90,\\quad M_{n,req}=\\dfrac{M_u}{\\phi_{trial}}=\\dfrac{${n(normalized.Mu, 2)}}{0.90}`,
    result: "The final tensile strain and strength-reduction factor are recalculated from the adopted reinforcement.",
    resultMath: `M_{n,req}=${n(result.requiredMn, 3)}\\text{kN·m};\\quad \\varepsilon_t=${n(result.epsilonT, 6)};\\quad \\phi=${n(result.phi, 3)}`,
    reference: "NSCP 2015 Table 421.2.2 / ACI 318-14 Table 21.2.2.",
    explanation: "The 0.90 value is only the initial tension-controlled design assumption. The displayed final φ is recalculated from the final provided bars and extreme tension-layer strain.",
  });

  add({
    label: "Minimum tensile strain condition",
    formula: "\\varepsilon_t\\ge0.004\\quad(P_u<0.10f'_cA_g)",
    substitution: `P_u=0\\text{ kN (assumed)};\\quad \\varepsilon_{t,final}=${n(result.epsilonT, 6)};\\quad \\varepsilon_{t,min}=${n(result.minimumTensileStrain, 3)}`,
    result: `Final provided section strain ${result.strainOk ? "meets" : "does not meet"} the minimum tensile-strain condition (${result.strainOk ? "PASS" : "FAIL"}).`,
    reference: "NSCP 2015 Section 409.3.3.1 / ACI 318-14 Section 9.3.3.1; Pu = 0 is assumed.",
    status: result.strainOk ? "pass" : "fail",
  });

  add({
    label: "Factored-moment conversion and required nominal moment",
    formula: "M_u(\\text{N·mm})=M_u(\\text{kN·m})10^6;\\quad M_{n,req}=M_u/\\phi_{trial}",
    substitution: `M_u=${n(normalized.Mu, 2)}\\times10^6=${n(normalized.Mu * 1e6, 0)}\\text{ N·mm};\\quad M_{n,req}=${n(normalized.Mu * 1e6, 0)}/0.90`,
    result: "The required nominal moment is shown in both kN·m and N·mm.",
    resultMath: `M_{n,req}=${n(result.requiredMn, 3)}\\text{kN·m}=${n(result.requiredMn * 1e6, 0)}\\text{N·mm}`,
    reference: "NSCP 2015 Section 203.3 / ACI 318-14 Chapter 5 (factored load effects).",
  });

  add({
    label: "Required nominal strength parameter Rn",
    formula: "R_n=\\dfrac{M_{n,req}}{b d^2}",
    substitution: `R_n=\\dfrac{${n(result.requiredMn * 1e6, 0)}}{${n(normalized.b, 1)}(${n(trialD, 2)})^2}`,
    result: "The trial nominal-strength parameter is:",
    resultMath: `R_n=${n(initialTrial.Rn, 4)}\\text{ MPa}`,
    reference: "NSCP 2015 Section 422.2.2 / ACI 318-14 Section 22.2.2.",
  });

  const m = normalized.fy / (0.85 * normalized.fc);
  add({
    label: "Singly reinforced quadratic for the trial rho",
    formula: "m=\\dfrac{f_y}{0.85f'_c};\\quad R_n=\\rho f_y\\left(1-\\dfrac{m\\rho}{2}\\right);\\quad \\rho=\\dfrac{1-\\sqrt{1-2mR_n/f_y}}{m}",
    substitution: `m=${n(normalized.fy, 1)}/[0.85(${n(normalized.fc, 1)})]=${n(m, 5)};\\quad \\Delta=1-2(${n(m, 5)})(${n(initialTrial.Rn, 4)})/${n(normalized.fy, 1)}=${n(initialTrial.discriminant, 6)};\\quad \\rho=[1-\\sqrt{${n(initialTrial.discriminant, 6)}}]/${n(m, 5)}`,
    result: Number.isFinite(initialTrial.rho)
      ? "The physical smaller root is used for the singly reinforced trial."
      : "The discriminant is negative, so no real singly reinforced root exists; use the doubly reinforced branch.",
    resultMath: Number.isFinite(initialTrial.rho)
      ? `\\rho_{trial}=${n(initialTrial.rho, 6)}\\quad(\\text{dimensionless})`
      : `\\Delta=${n(initialTrial.discriminant, 6)}<0`,
    reference: "NSCP 2015 Section 422.2.2 / ACI 318-14 Section 22.2.2.",
    status: Number.isFinite(initialTrial.rho) ? "pass" : "fail",
  });

  add({
    label: "Minimum reinforcement",
    formula: "\\rho_{min}=\\max\\left(\\dfrac{\\sqrt{f'_c}}{4f_y},\\dfrac{1.4}{f_y}\\right);\\quad A_{s,min}=\\rho_{min}bd",
    substitution: `\\rho_{min}=\\max(\\sqrt{${n(normalized.fc, 1)}}/[4(${n(normalized.fy, 1)})],1.4/${n(normalized.fy, 1)})=${n(result.rhoMin, 6)};\\quad A_{s,min}=${n(result.rhoMin, 6)}(${n(normalized.b, 1)})(${n(result.d, 2)})`,
    result: `Provided tension reinforcement ${result.minimumSteelOk ? "meets" : "does not meet"} the minimum-steel requirement (${result.minimumSteelOk ? "PASS" : "FAIL"}).`,
    resultMath: `\\rho_{min}=${n(result.rhoMin, 6)};\\quad A_{s,min}=${n(result.asMin, 2)}\\text{ mm}^2;\\quad A_{s,provided}=${n(result.asProvided, 2)}\\text{ mm}^2 ${result.minimumSteelOk ? "\\ge" : "<"} A_{s,min}`,
    reference: "NSCP 2015 Section 409.6.1.2 / ACI 318-14 Section 9.6.1.2.",
    status: result.minimumSteelOk ? "pass" : "fail",
  });

  add({
    label: "Maximum reinforcement ratio",
    formula: "\\rho_{max}=0.025;\\quad \\rho_{req}=\\dfrac{A_{s,req}}{bd};\\quad \\rho_{provided}=\\dfrac{A_{s,provided}}{bd}",
    substitution: `\\rho_{req}=${n(result.rhoRequired, 6)};\\quad \\rho_{provided}=${n(result.rhoProvided, 6)};\\quad \\rho_{max}=0.025`,
    result: `Required ratio ${result.requiredRhoLimitOk ? "passes" : "exceeds"} ρmax; rounded provided ratio ${result.rhoLimitOk ? "passes" : "exceeds"} ρmax. ${result.rhoLimitOk && result.requiredRhoLimitOk ? "PASS" : "FAIL"}. This is the special moment-frame beam limit; it does not establish complete seismic compliance.`,
    reference: "NSCP 2015 Section 418.6.3.1 / ACI 318-14 Section 18.6.3.1.",
    status: result.rhoLimitOk && result.requiredRhoLimitOk ? "pass" : "fail",
  });

  add({
    label: "Required steel area and bar count before rounding",
    formula: "A_{s,req}=\\max(\\rho b d,A_{s,min});\\quad A_b=\\dfrac{\\pi d_b^2}{4};\\quad n_{raw}=\\dfrac{A_{s,req}}{A_b};\\quad n=\\lceil n_{raw}\\rceil",
    substitution: `A_b=\\dfrac{\\pi(${n(normalized.barDiameter, 1)})^2}{4}=${n(Ab, 2)}\\text{ mm}^2;\\quad n_{raw}=\\dfrac{${n(result.asRequired, 2)}}{${n(Ab, 2)}}=${n(result.barsBeforeRounding, 4)}`,
    result: "The required steel area is rounded up to a whole number of tension bars.",
    resultMath: `A_{s,req}=${n(result.asRequired, 2)}\\text{ mm}^2;\\quad ${result.barsRequired}\\times${n(normalized.barDiameter, 1)}\\text{ mm bars};\\quad A_{s,provided}=${n(result.asProvided, 2)}\\text{ mm}^2`,
    reference: "NSCP 2015 Section 422.2.2 / ACI 318-14 Section 22.2.2.",
  });

  add({
    label: "Aggregate-based clear spacing and width inside stirrups",
    formula: "s_{clear,min}=\\max\\left(25\\text{ mm},d_{b,largest},\\dfrac{4d_{agg}}{3}\\right);\\quad b_{inside}=b-2(C_c+d_{st})",
    substitution: `s_{clear,min}=\\max\\left(25,${n(normalized.barDiameter, 1)},\\dfrac{4(${n(normalized.aggregateSize, 1)})}{3}\\right)=${n(result.minClearSpacingRequired, 2)}\\text{ mm};\\quad b_{inside}=${n(normalized.b, 1)}-2(${n(normalized.cover, 1)}+${n(normalized.stirrupDiameter, 1)})=${n(result.insideWidth, 2)}\\text{ mm}`,
    result: `The adopted tension reinforcement has ${result.barsRequired} tension bar${result.barsRequired === 1 ? "" : "s"} in ${result.tensionBarLayers} ${result.tensionBarLayers === 1 ? "layer" : "layers"}. The uniform-spacing limit is ${result.tensionLayers[0]?.maximumBarsByUniformSpacing ?? 0} bar${(result.tensionLayers[0]?.maximumBarsByUniformSpacing ?? 0) === 1 ? "" : "s"} per layer.`,
    resultMath: `n d_b+(n-1)s_{clear,min}\\le b_{inside};\\quad n_{max}=\\left\\lfloor\\dfrac{b_{inside}+s_{clear,min}}{d_b+s_{clear,min}}\\right\\rfloor=${result.tensionLayers[0]?.maximumBarsByUniformSpacing ?? 0}`,
    reference: "NSCP 2015 Section 425.2.1 / ACI 318-14 Section 25.2.1.",
    explanation: "Clear spacing is the concrete gap between adjacent bar surfaces; center-to-center spacing includes one full bar diameter.",
  });

  const layersForLayout = result.tensionLayers;
  add({
    label: "Tension layer-by-layer spacing and physical fit",
    formula: "s_{clear,provided}=\\dfrac{b_{inside}-n d_b}{n-1}=\\dfrac{b-2d_{st}-2C_c-n d_b}{n-1}\\quad(n\\ge2);\\qquad n=1:\\text{no interbar gap}",
    substitution: layersForLayout.map((layer) => layer.count === 1
      ? `\\text{Layer ${layer.index}: }1\\times${n(layer.barDiameter, 1)}\\text{ mm; centered; no division by zero}`
      : `\\text{Layer ${layer.index}: uniform-spread clear gap }\\dfrac{${n(layer.widthInsideStirrups, 1)}-${layer.count}(${n(layer.barDiameter, 1)})}{${layer.count - 1}}=${n(layer.uniformSpreadClearSpacing, 2)}\\text{ mm; actual clear gaps }${layer.clearGaps.map((gap) => n(gap, 2)).join(",")}\\text{ mm}`,
    ).join(";\\quad "),
    result: layersForLayout.length
      ? layersForLayout.map((layer) => `Layer ${layer.index}: ${layer.count} bar${layer.count === 1 ? "" : "s"}, ${n(layer.count * layer.barDiameter, 2)} mm total bar width, ${n(layer.remainingWidthForClearGaps, 2)} mm available for clear gaps${layer.clearSpacing === null ? "; no interbar gap" : `; minimum actual clear gap ${n(layer.clearSpacing, 2)} mm`}`).join(". ") + `. Horizontal spacing ${result.spacingOk ? "PASS" : "FAIL"}.`
      : "No selected tension layer is available.",
    reference: "NSCP 2015 Sections 425.2.1–425.2.2 / ACI 318-14 Sections 25.2.1–25.2.2.",
    explanation: layersForLayout.length > 1
      ? "Here d_st is the stirrup diameter and C_c is the clear cover to the stirrup outside. This calculates clear spacing provided, which must be at least s_clear,min. For unequal layer counts, each actual gap is checked; every upper row is directly above bars in the row below."
      : "Here d_st is the stirrup diameter and C_c is the clear cover to the stirrup outside. This calculates clear spacing provided, which must be at least s_clear,min. One layer is provided, so no vertical-spacing or upper-layer alignment check applies.",
    status: result.spacingOk ? "pass" : "fail",
  });

  add({
    label: "Area-weighted tension centroid and revised effective depth",
    formula: "A_i=n_iA_{bar,i};\\quad \\bar y=\\dfrac{\\sum A_i y_i}{\\sum A_i};\\quad d=h-\\bar y",
    substitution: layersForLayout.length
      ? `\\bar y=[${layersForLayout.map((layer) => `(${n(layer.area, 2)})(${n(layer.yFromTensionFace, 2)})`).join("+")}]/[${layersForLayout.map((layer) => n(layer.area, 2)).join("+")}]`
      : "\\bar y=\\text{not available}",
    result: "The effective depth is measured to the area-weighted centroid of the tension reinforcement.",
    resultMath: `\\bar{y}=${n(result.h - result.d, 3)}\\text{ mm};\\quad d=${n(result.h, 1)}-${n(result.h - result.d, 3)}=${n(result.d, 3)}\\text{ mm};\\quad d_{extreme}=${n(result.dExtremeTension, 3)}\\text{ mm}`,
  });

  if (result.sectionType === "doubly") {
    add({
      label: "Why the design switches to a doubly reinforced section",
      formula: "\\phi M_{n,single}<M_u\\;\\text{or an applicable required/provided design check fails}",
      substitution: `M_u=${n(result.input.Mu, 2)}\\text{ kN·m};\\quad A_{s,req}=${n(result.asRequired, 1)}\\text{ mm}^2`,
      result: result.ok
        ? result.warnings[0] ?? "The final singly reinforced branch was not adequate."
        : result.message,
      explanation: result.ok
        ? "The final adopted bars are checked separately using strain compatibility, force equilibrium, reinforcement limits, spacing, and design strength."
        : result.failureDetails ?? result.message,
      reference: "NSCP 2015 Sections 421.2.2, 422.2.1–422.2.2 / ACI 318-14 Table 21.2.2, Sections 22.2.1–22.2.2.",
      status: "info",
    });
    add({
      label: "Doubly reinforced superposition trial",
      formula: "c=\\dfrac{0.003}{0.003+\\varepsilon_{t,design}}d_{extreme};\\quad a=\\beta_1c;\\quad A_{s1}=\\dfrac{0.85f'_cba}{f_y}",
      substitution: `\\varepsilon_{t,design}=0.005;\\quad c_{design}=0.003/(0.003+0.005)(${n(result.dExtremeTension, 2)})=${n(0.003 * result.dExtremeTension / 0.008, 2)}\\text{ mm};\\quad a_{design}=(${n(result.beta1, 3)})(${n(0.003 * result.dExtremeTension / 0.008, 2)})=${n(result.beta1 * 0.003 * result.dExtremeTension / 0.008, 2)}\\text{ mm};\\quad A_{s1}=${n(result.asSinglyPortion, 2)}\\text{ mm}^2`,
      result: result.warnings.some((warning) => warning.includes("capped"))
        ? "The ρmax cap controls the singly reinforced contribution; this is not the final provided-section capacity."
        : "This is the theoretical singly reinforced contribution, not the final provided-section capacity.",
      resultMath: `M_{n1}=${n(result.mnSingly, 3)}\\text{kN·m}`,
      reference: "NSCP 2015 Section 422.2.1–422.2.2 / ACI 318-14 Sections 22.2.1–22.2.2.",
    });
    add({
      label: "Remaining nominal moment and additional tension steel",
      formula: "M_{n,req}=M_u/\\phi;\\quad M_{n2}=M_{n,req}-M_{n1};\\quad A_{s2}=\\dfrac{M_{n2}}{f_y(d-d')}",
      substitution: `M_{n,req}=${n(result.requiredMn, 3)};\\quad M_{n2}=${n(result.requiredMn, 3)}-${n(result.mnSingly, 3)}=${n(result.mnRemaining, 3)}\\text{kN·m};\\quad A_{s2}=${n(result.asAdditionalTension, 2)}\\text{ mm}^2`,
      result: "Factored and nominal moments remain separate; the two tension-steel contributions are added before bar rounding.",
      resultMath: `A_s=A_{s1}+A_{s2}=${n(result.asRequired, 2)}\\text{ mm}^2`,
      reference: "NSCP 2015 Section 422.2.2 / ACI 318-14 Section 22.2.2.",
    });
    add({
      label: "Compression-steel strain, stress, and theoretical area",
      formula: "\\varepsilon'_s=0.003\\dfrac{c-d'}{c};\\quad f'_s=\\min(E_s\\varepsilon'_s,f_y);\\quad A'_s=A_{s2}f_y/f'_s",
      substitution: `\\varepsilon'_{s,design}=0.003[c_{design}-d']/c_{design}=${n(result.epsilonSPrimeDesign, 6)};\\quad f'_{s,design}=\\min(E_s\\varepsilon'_{s,design},f_y)=${n(result.fsPrimeDesign, 2)}\\text{ MPa};\\quad A'_s=${n(result.asCompression, 2)}\\text{ mm}^2`,
      result: `The theoretical compression-steel ${result.compressionSteelYields ? "yields" : "does not yield"}; final provided-layer strains/stresses are listed below and drive capacity.`,
      reference: "NSCP 2015 Sections 422.2.1–422.2.2 / ACI 318-14 Sections 22.2.1–22.2.2.",
    });
    add({
      label: "Adopted compression layers and revised d′",
      formula: "A'_i=n'_i\\pi {d'_b}^2/4;\\quad d'=\\dfrac{\\sum A'_i y'_i}{\\sum A'_i}",
      substitution: rowBreakdown(result.compressionLayers, "compression"),
      result: `Compression reinforcement is arranged in ${result.compressionBarLayers} ${result.compressionBarLayers === 1 ? "layer" : "layers"}.`,
      resultMath: `${result.compressionBarsRequired}\\times${n(normalized.compressionBarDiameter, 1)}\\text{ mm bars};\\quad A'_{s,provided}=${n(result.compressionLayers.reduce((sum, layer) => sum + layer.area, 0), 2)}\\text{ mm}^2;\\quad d'=${n(result.dPrime, 2)}\\text{ mm}`,
      reference: "NSCP 2015 Sections 425.2.1–425.2.2 / ACI 318-14 Sections 25.2.1–25.2.2.",
    });
    add({
      label: "Compression-layer spacing and interference check",
      formula: "s'_{clear,min}=\\max(25,d'_b,4d_{agg}/3);\\quad clear_{vertical}\\ge25\\text{ mm}",
      substitution: result.compressionLayers.map((layer) =>
        `Layer ${layer.index}: ${layer.count}×${n(layer.barDiameter, 1)} mm; actual horizontal clear ${n(layer.clearSpacing, 2)} mm; vertical clear ${n(layer.verticalClearSpacingToNext, 1)} mm; aligned=${String(layer.directlyAbovePreviousLayer)}`,
      ).join(";\\quad "),
      result: `Compression spacing ${result.compressionSpacingOk ? "PASS" : "FAIL"}; tension/compression bar interference ${result.geometryOk ? "PASS" : "FAIL"}; top steel state ${result.compressionStateOk ? "compression in every layer" : "one or more top layers are actually in tension"}.`,
      reference: "NSCP 2015 Sections 425.2.1–425.2.2 / ACI 318-14 Sections 25.2.1–25.2.2.",
      status: result.compressionSpacingOk && result.geometryOk && result.compressionStateOk ? "pass" : "fail",
    });
    add({
      label: "Iteration record",
      formula: "\\text{Recompute layout}\\to(d,d')\\to(c,\\varepsilon, f_s,\\phi M_n)\\to\\text{checks}",
      substitution: `${result.iterationCount}\\text{ design trials};\\quad M_u=${n(result.input.Mu, 2)}\\text{ kN·m}`,
      result: `${result.iterationCount} design trial${result.iterationCount === 1 ? "" : "s"}; ${result.ok ? "the selected arrangement passed" : "no feasible arrangement was found"}.`,
      explanation: result.ok
        ? "The selected arrangement passed the final checks. The optional Design iterations table lists individual trials."
        : result.message,
      status: result.ok ? "pass" : "fail",
    });
  }

  const allLayers = [...result.tensionLayers, ...result.compressionLayers];
  add({
    label: "Final provided-section strain compatibility and stress state",
    formula: "\\varepsilon_i=0.003\\dfrac{c-y_i}{c};\\quad f_i=\\operatorname{clip}(E_s\\varepsilon_i,-f_y,f_y);\\quad a=\\beta_1c",
    substitution: `c=${n(result.c, 3)}\\text{ mm};\\quad a=${n(result.beta1, 3)}(${n(result.c, 3)})=${n(result.a, 3)}\\text{ mm};\\quad ${allLayers.map((layer) => `L${layer.index}: ${layer.count} bars, ε=${n(layer.strain, 6)}, f=${n(layer.stress, 2)} MPa`).join(";\\quad ")}`,
    result: "The final strength-reduction factor is based on the strain in the extreme tension layer.",
    resultMath: `\\varepsilon_t=${n(result.epsilonT, 6)};\\quad \\varepsilon_y=${n(result.epsilonY, 6)};\\quad \\phi=${n(result.phi, 4)}`,
    reference: "NSCP 2015 Sections 421.2.2, 422.2.1–422.2.2 / ACI 318-14 Table 21.2.2, Sections 22.2.1–22.2.2.",
  });

  add({
    label: "Final force equilibrium and moment capacity",
    formula: "C_c=0.85f'_cba;\\quad \\Sigma F=0;\\quad M_n=\\Sigma(T_i y_i)-C_c(a/2)-\\Sigma(C_{s,i}y_i)",
    substitution: `C_c=0.85(${n(normalized.fc, 1)})(${n(normalized.b, 1)})(${n(result.a, 3)})=${n(result.concreteForce, 1)}\\text{ N};\\quad T=${n(result.tensionForce, 1)}\\text{ N};\\quad C_s=${n(result.compressionSteelForce, 1)}\\text{ N};\\quad residual=${n(result.forceResidual, 4)}\\text{ N}`,
    result: `The provided section ${result.strengthOk ? "meets" : "does not meet"} the factored-moment requirement (${result.strengthOk ? "PASS" : "FAIL"}).`,
    resultMath: `M_n=${n(result.Mn, 3)}\\text{kN·m};\\quad \\phi M_n=${n(result.phiMn, 3)}\\text{kN·m} ${result.strengthOk ? "\\ge" : "<"} M_u=${n(normalized.Mu, 2)}\\text{kN·m}`,
    reference: "NSCP 2015 Sections 422.2.1–422.2.2 / ACI 318-14 Sections 22.2.1–22.2.2.",
    status: result.equilibriumOk && result.strengthOk ? "pass" : "fail",
  });

  add({
    label: "Final design checks and recommendation",
    formula: "Adequate=spacing\\land geometry\\land A_s\\ge A_{s,min}\\land \\rho_{limit}\\land equilibrium\\land(\\phi M_n\\ge M_u)",
    substitution: `horizontal spacing=${result.spacingOk ? "PASS" : "FAIL"};\\quad vertical spacing=${result.verticalSpacingOk ? "PASS" : "FAIL"};\\quad min steel=${result.minimumSteelOk ? "PASS" : "FAIL"};\\quad rho limit=${result.rhoLimitOk && result.requiredRhoLimitOk ? "PASS" : "FAIL/N.A."};\\quad equilibrium=${result.equilibriumOk ? "PASS" : "FAIL"};\\quad strength=${result.strengthOk ? "PASS" : "FAIL"}`,
    result: result.sectionType === "doubly"
      ? `Recommend ${result.tensionBarsPerLayer.join("+")} bottom ${n(normalized.barDiameter, 1)} mm bars and ${result.compressionBarsPerLayer.join("+")} top ${n(normalized.compressionBarDiameter, 1)} mm bars; ${result.ok ? "all checks shown above passed" : "design is not adequate; revise the inputs"}.`
      : `Recommend ${result.tensionBarsPerLayer.join("+")} bottom ${n(normalized.barDiameter, 1)} mm bars; ${result.ok ? "all checks shown above passed" : "design is not adequate; revise the inputs"}.`,
    reference: "NSCP 2015 Sections 409.6.1.2, 418.6.3.1, 421.2.2, 422.2, 425.2.1–425.2.2 / ACI 318-14 Sections 9.6.1.2, 18.6.3.1, 22.2, 25.2.",
    status: result.ok ? "pass" : "fail",
  });

  return steps;
}
