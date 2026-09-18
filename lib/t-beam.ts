export interface TBeamDesignInput {
  Mu: number; // factored moment, kN-m
  bw: number; // web width, mm
  hf: number; // flange thickness, mm
  d: number; // effective depth, mm
  flangeWidthMode?: "calculated" | "given";
  bf?: number; // given effective flange width, mm
  span?: number; // beam clear span for calculated flange width, mm
  clearSpacingLeft?: number; // clear face-to-face distance to left adjacent web, mm
  clearSpacingRight?: number; // clear face-to-face distance to right adjacent web, mm
  fc: number; // concrete compressive strength, MPa
  fy: number; // steel yield strength, MPa
  barDiameter: number; // selected tension-bar diameter, mm
  Es?: number;
  targetTensionStrain?: number | null;
  compressionBarDiameter?: number;
  clearCover?: number;
  stirrupDiameter?: number;
  aggregateSize?: number;
}

export interface TBeamSteelLayerResult {
  barCount: number;
  diameter: number;
  depth: number;
  area: number;
  strain: number;
  stress: number;
  netForce: number;
}

export type TBeamCase = "flange" | "web";

export interface TBeamCapacity {
  a: number;
  c: number;
  epsilonT: number;
  phi: number;
  Mn: number;
  phiMn: number;
  sectionCase: TBeamCase;
  concreteWebForce: number;
  concreteFlangeForce: number;
}

export interface TBeamDesignResult extends TBeamCapacity {
  sectionType: "singly" | "doubly";
  Es: number;
  targetTensionStrain: number;
  compressionBarDiameter: number;
  compressionBarsRequired: number;
  compressionBarsPerLayer: number;
  asCompression: number;
  asCompressionCalculated: number;
  asAdditionalTension: number;
  compressionDesignStress: number;
  compressionSteelYields: boolean;
  dPrime: number;
  tensionLayers: TBeamSteelLayerResult[];
  compressionLayers: TBeamSteelLayerResult[];
  trialC: number;
  trialA: number;
  singlyTrialPhiMn: number;
  ok: boolean;
  message: string;
  beta1: number;
  beff: number;
  flangeWidthMode: "calculated" | "given";
  leftOverhang: number | null;
  rightOverhang: number | null;
  spanLimit: number | null;
  thicknessLimit: number | null;
  leftSpacingLimit: number | null;
  rightSpacingLimit: number | null;
  asCalculated: number;
  asMin: number;
  asRequired: number;
  asTensionControlledMax: number;
  barArea: number;
  barsRequired: number;
  barsPerLayer: number;
  numberOfLayers: number;
  asProvided: number;
  clearSpacing: number | null;
  minClearSpacingRequired: number;
  spacingOk: boolean | null;
  spacingMessage: string;
  designStatus: "PASS" | "FAIL";
}

export interface TBeamSolutionStep {
  label: string;
  formula: string;
  substitution?: string;
  result: string;
}

const ES = 200_000;
const PHI_COMPRESSION = 0.65;
const PHI_TENSION = 0.9;
const EPSILON_TENSION_CONTROLLED = 0.005;
const CLEAR_COVER = 40;
const ASSUMED_STIRRUP_DIAMETER = 10;

export function getBeta1(fc: number): number {
  if (fc <= 28) return 0.85;
  if (fc >= 56) return 0.65;
  return 0.85 - (0.05 * (fc - 28)) / 7;
}

export function getEffectiveFlangeWidth(
  span: number,
  bw: number,
  hf: number,
  clearSpacingLeft: number,
  clearSpacingRight: number
) {
  const spanLimit = span / 8;
  const thicknessLimit = 8 * hf;
  const leftSpacingLimit = clearSpacingLeft / 2;
  const rightSpacingLimit = clearSpacingRight / 2;
  const leftOverhang = Math.min(spanLimit, thicknessLimit, leftSpacingLimit);
  const rightOverhang = Math.min(spanLimit, thicknessLimit, rightSpacingLimit);
  return {
    beff: bw + leftOverhang + rightOverhang,
    leftOverhang, rightOverhang, spanLimit, thicknessLimit,
    leftSpacingLimit, rightSpacingLimit,
  };
}

function getPhi(epsilonT: number, fy: number, Es = ES): number {
  const epsilonY = fy / Es;

  if (epsilonT <= epsilonY) return PHI_COMPRESSION;
  if (epsilonT >= EPSILON_TENSION_CONTROLLED) return PHI_TENSION;

  return (
    PHI_COMPRESSION +
    (PHI_TENSION - PHI_COMPRESSION) *
      ((epsilonT - epsilonY) /
        (EPSILON_TENSION_CONTROLLED - epsilonY))
  );
}

function compressionForceAtDepth(
  a: number,
  beff: number,
  bw: number,
  hf: number,
  fc: number
): number {
  if (a <= hf) return 0.85 * fc * beff * a;

  return (
    0.85 *
    fc *
    (bw * a + (beff - bw) * hf)
  );
}

function steelAreaAtCompressionDepth(
  a: number,
  beff: number,
  bw: number,
  hf: number,
  fc: number,
  fy: number
): number {
  return compressionForceAtDepth(a, beff, bw, hf, fc) / fy;
}

export function getTBeamCapacity(
  As: number,
  input: Pick<TBeamDesignInput, "bw" | "hf" | "d" | "fc" | "fy"> & {
    beff: number;
    beta1: number;
    Es?: number;
  }
): TBeamCapacity {
  const { bw, hf, d, fc, fy, beff, beta1 } = input;
  const tensionForce = As * fy;
  const flangeOnlyCapacity = 0.85 * fc * beff * hf;

  let a: number;
  let sectionCase: TBeamCase;

  if (tensionForce <= flangeOnlyCapacity) {
    a = tensionForce / (0.85 * fc * beff);
    sectionCase = "flange";
  } else {
    a =
      (tensionForce / (0.85 * fc) - (beff - bw) * hf) /
      bw;
    sectionCase = "web";
  }

  a = Math.max(a, 0);
  const c = a / beta1;
  const epsilonT = c > 0 ? 0.003 * ((d - c) / c) : Infinity;
  const phi = getPhi(epsilonT, fy, input.Es);

  let concreteWebForce: number;
  let concreteFlangeForce: number;
  let MnNmm: number;

  if (sectionCase === "flange") {
    concreteWebForce = 0.85 * fc * beff * a;
    concreteFlangeForce = 0;
    MnNmm = concreteWebForce * (d - a / 2);
  } else {
    concreteWebForce = 0.85 * fc * bw * a;
    concreteFlangeForce = 0.85 * fc * (beff - bw) * hf;
    MnNmm =
      concreteWebForce * (d - a / 2) +
      concreteFlangeForce * (d - hf / 2);
  }

  const Mn = MnNmm / 1_000_000;

  return {
    a,
    c,
    epsilonT,
    phi,
    Mn,
    phiMn: phi * Mn,
    sectionCase,
    concreteWebForce,
    concreteFlangeForce,
  };
}

function designTBeamSingly(input: TBeamDesignInput): TBeamDesignResult {
  const { Mu, bw, hf, d, fc, fy, barDiameter } = input;
  const Es = input.Es ?? ES;
  const targetTensionStrain = input.targetTensionStrain ?? EPSILON_TENSION_CONTROLLED;
  const clearCover = input.clearCover ?? CLEAR_COVER;
  const stirrupDiameter = input.stirrupDiameter ?? ASSUMED_STIRRUP_DIAMETER;
  const aggregateSize = input.aggregateSize ?? 19;
  const compressionBarDiameter = input.compressionBarDiameter ?? barDiameter;
  const dPrime = clearCover + stirrupDiameter + compressionBarDiameter / 2;
  const beta1 = getBeta1(fc);
  const flangeWidthMode = input.flangeWidthMode ?? "calculated";

  if (
    ![Mu, bw, hf, d, fc, fy, barDiameter, Es, clearCover,
      stirrupDiameter, aggregateSize, compressionBarDiameter].every(
      (value) => Number.isFinite(value) && value > 0
    ) ||
    hf >= d ||
    !Number.isFinite(targetTensionStrain) ||
    targetTensionStrain < 0.004 ||
    fy / Es >= 0.004 ||
    dPrime >= d ||
    bw - 2 * (clearCover + stirrupDiameter) < Math.max(barDiameter, compressionBarDiameter)
  ) {
    throw new Error(
      "Enter positive geometry and material values, require hf < d, fy/Es < 0.004, target strain at least 0.004, and compression steel cover that fits above d."
    );
  }
  if (flangeWidthMode !== "calculated" && flangeWidthMode !== "given") {
    throw new Error("Select whether bf is given or calculated.");
  }
  if (flangeWidthMode === "given") {
    if (!Number.isFinite(input.bf) || input.bf! < bw) {
      throw new Error("Enter a given effective flange width bf that is at least bw.");
    }
  } else {
    if (!Number.isFinite(input.span) || input.span! <= 0) {
      throw new Error("Enter a positive beam clear span to calculate bf.");
    }
    if (!Number.isFinite(input.clearSpacingLeft) || input.clearSpacingLeft! <= 0) {
      throw new Error("Enter a positive left-side clear spacing to the adjacent web.");
    }
    if (!Number.isFinite(input.clearSpacingRight) || input.clearSpacingRight! <= 0) {
      throw new Error("Enter a positive right-side clear spacing to the adjacent web.");
    }
  }
  const flange = flangeWidthMode === "given"
    ? {
        beff: input.bf!,
        leftOverhang: null, rightOverhang: null, spanLimit: null,
        thicknessLimit: null, leftSpacingLimit: null, rightSpacingLimit: null,
      }
    : getEffectiveFlangeWidth(input.span!, bw, hf,
        input.clearSpacingLeft!, input.clearSpacingRight!);
  const { beff } = flange;

  const asMin = Math.max(
    (0.25 * Math.sqrt(fc) * bw * d) / fy,
    (1.4 * bw * d) / fy
  );

  const cTensionControlled = 0.003 * d / (0.003 + targetTensionStrain);
  const aTensionControlled = beta1 * cTensionControlled;
  const asTensionControlledMax = steelAreaAtCompressionDepth(
    aTensionControlled,
    beff,
    bw,
    hf,
    fc,
    fy
  );
  const maximumTensionControlledCapacity = getTBeamCapacity(
    asTensionControlledMax,
    { bw, hf, d, fc, fy, beff, beta1, Es }
  );

  let low = 0;
  let high = asTensionControlledMax;

  for (let iteration = 0; iteration < 100; iteration += 1) {
    const trialAs = (low + high) / 2;
    const trial = getTBeamCapacity(trialAs, {
      bw,
      hf,
      d,
      fc,
      fy,
      beff,
      beta1,
      Es,
    });

    if (trial.phiMn >= Mu) high = trialAs;
    else low = trialAs;
  }

  const demandWithinTensionControlledLimit =
    Mu <= maximumTensionControlledCapacity.phiMn;
  const asCalculated = demandWithinTensionControlledLimit
    ? high
    : asTensionControlledMax;
  const asRequired = Math.max(asCalculated, asMin);
  const barArea = (Math.PI * barDiameter ** 2) / 4;
  const barsRequired = Math.max(2, Math.ceil(asRequired / barArea));
  const asProvided = barsRequired * barArea;
  const availableWidth =
    bw - 2 * (clearCover + stirrupDiameter);
  const minClearSpacingRequired = Math.max(25, barDiameter, 4 * aggregateSize / 3);
  const maximumBarsThatFitPerLayer = Math.max(
    1,
    Math.floor(
      (availableWidth + minClearSpacingRequired) /
        (barDiameter + minClearSpacingRequired)
    )
  );
  const barsPerLayer = Math.min(
    barsRequired,
    maximumBarsThatFitPerLayer
  );
  const numberOfLayers = Math.ceil(barsRequired / barsPerLayer);
  const clearSpacing =
    barsPerLayer > 1
      ? (availableWidth - barsPerLayer * barDiameter) /
        (barsPerLayer - 1)
      : null;
  const detailedCapacity = numberOfLayers <= 3
    ? evaluateTBeamBars(input, beff, beta1,
        layerCounts(barsRequired, maximumBarsThatFitPerLayer), [], dPrime)
    : null;
  const capacity = detailedCapacity ?? getTBeamCapacity(asProvided, {
    bw, hf, d, fc, fy, beff, beta1, Es,
  });
  const spacingOk =
    numberOfLayers > 3
      ? false
      : d - (numberOfLayers - 1) * (barDiameter + 25) - barDiameter / 2 < hf
      ? false
      : clearSpacing === null
      ? true
      : clearSpacing >= minClearSpacingRequired;

  const strengthOk = capacity.phiMn >= Mu;
  const tensionControlled =
    capacity.epsilonT >= targetTensionStrain - 1e-9;
  const ok =
    demandWithinTensionControlledLimit &&
    strengthOk &&
    tensionControlled &&
    spacingOk !== false;

  let message: string;
  if (!demandWithinTensionControlledLimit) {
    message =
      "The required moment exceeds the tension-controlled capacity. Increase the section dimensions or use a separately designed doubly reinforced section.";
  } else if (!tensionControlled) {
    message =
      "The selected bars make the section transition- or compression-controlled. Select smaller bars, increase the section, or revise the reinforcement arrangement.";
  } else if (spacingOk === false) {
    message =
      "The selected bars do not fit in three web layers with the entered cover, stirrup, and aggregate size.";
  } else if (!strengthOk) {
    message = "The provided reinforcement does not satisfy phi Mn >= Mu.";
  } else {
    message =
      capacity.sectionCase === "flange"
        ? "Design passes. The equivalent compression block is entirely within the flange."
        : "Design passes. The equivalent compression block extends below the flange into the web.";
  }

  return {
    ...flange,
    ...capacity,
    flangeWidthMode,
    sectionType: "singly",
    Es,
    targetTensionStrain,
    compressionBarDiameter,
    compressionBarsRequired: 0,
    compressionBarsPerLayer: 0,
    asCompression: 0,
    asCompressionCalculated: 0,
    asAdditionalTension: 0,
    compressionDesignStress: 0,
    compressionSteelYields: false,
    dPrime,
    tensionLayers: detailedCapacity?.tensionLayers ?? [{ barCount: barsRequired, diameter: barDiameter, depth: d,
      area: asProvided, strain: -capacity.epsilonT, stress: -fy, netForce: -asProvided * fy }],
    compressionLayers: [],
    trialC: cTensionControlled,
    trialA: aTensionControlled,
    singlyTrialPhiMn: maximumTensionControlledCapacity.phiMn,
    ok,
    message,
    beta1,
    asCalculated,
    asMin,
    asRequired,
    asTensionControlledMax,
    barArea,
    barsRequired,
    barsPerLayer,
    numberOfLayers,
    asProvided,
    clearSpacing,
    minClearSpacingRequired,
    spacingOk,
    spacingMessage:
      spacingOk === false
        ? `Required clear spacing is at least ${minClearSpacingRequired.toFixed(
            0
          )} mm. Use larger bars, a wider web, or revise the reinforcement arrangement.`
        : `Bars are arranged in ${numberOfLayers} layer${
            numberOfLayers === 1 ? "" : "s"
          } for the spacing check.`,
    designStatus: ok ? "PASS" : "FAIL",
  };
}

function barFractionInBlock(a: number, depth: number, diameter: number): number {
  const t = (a - depth) / (diameter / 2);
  if (t <= -1) return 0;
  if (t >= 1) return 1;
  return (Math.acos(-t) + t * Math.sqrt(1 - t * t)) / Math.PI;
}

function layerCounts(total: number, perLayer: number): number[] {
  const counts: number[] = [];
  for (let remaining = total; remaining > 0; remaining -= perLayer) counts.push(Math.min(perLayer, remaining));
  return counts;
}

function evaluateTBeamBars(
  input: TBeamDesignInput,
  beff: number,
  beta1: number,
  tensionCounts: number[],
  compressionCounts: number[],
  dPrime: number
): (TBeamCapacity & { tensionLayers: TBeamSteelLayerResult[]; compressionLayers: TBeamSteelLayerResult[] }) | null {
  const { bw, hf, d, fc, fy, barDiameter } = input;
  const compressionDiameter = input.compressionBarDiameter ?? barDiameter;
  const Es = input.Es ?? ES;
  const tensionDepths = tensionCounts.map((_, index) => d - index * (barDiameter + 25));
  const compressionDepths = compressionCounts.map((_, index) => dPrime + index * (compressionDiameter + 25));
  const topTension = tensionDepths.at(-1)!;
  if (topTension - barDiameter / 2 < hf ||
    (compressionDepths.length > 0 &&
      compressionDepths.at(-1)! + compressionDiameter / 2 + 25 > topTension - barDiameter / 2)) return null;
  const rows = [
    ...tensionCounts.map((count, index) => ({ count, diameter: barDiameter, depth: tensionDepths[index] })),
    ...compressionCounts.map((count, index) => ({ count, diameter: compressionDiameter, depth: compressionDepths[index] })),
  ];
  const resolve = (c: number) => {
    const a = beta1 * c;
    const layers = rows.map((row): TBeamSteelLayerResult => {
      const area = row.count * Math.PI * row.diameter ** 2 / 4;
      const strain = 0.003 * (c - row.depth) / c;
      const stress = Math.max(-fy, Math.min(fy, Es * strain));
      const netForce = area * (stress - 0.85 * fc * barFractionInBlock(a, row.depth, row.diameter));
      return { barCount: row.count, diameter: row.diameter, depth: row.depth, area, strain, stress, netForce };
    });
    const force = compressionForceAtDepth(a, beff, bw, hf, fc) +
      layers.reduce((sum, layer) => sum + layer.netForce, 0);
    return { a, layers, force };
  };
  let low = d * 1e-9;
  let high = d * (1 - 1e-9);
  if (resolve(low).force >= 0 || resolve(high).force <= 0) return null;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const mid = (low + high) / 2;
    if (resolve(mid).force > 0) high = mid;
    else low = mid;
  }
  const c = (low + high) / 2;
  const { a, layers } = resolve(c);
  const sectionCase: TBeamCase = a <= hf ? "flange" : "web";
  const concreteWebForce = sectionCase === "flange" ? 0.85 * fc * beff * a : 0.85 * fc * bw * a;
  const concreteFlangeForce = sectionCase === "flange" ? 0 : 0.85 * fc * (beff - bw) * hf;
  const epsilonT = 0.003 * (d - c) / c;
  const phi = getPhi(epsilonT, fy, Es);
  const Mn = -(concreteWebForce * a / 2 + concreteFlangeForce * hf / 2 +
    layers.reduce((sum, layer) => sum + layer.netForce * layer.depth, 0)) / 1e6;
  return {
    a, c, epsilonT, phi, Mn, phiMn: phi * Mn, sectionCase,
    concreteWebForce, concreteFlangeForce,
    tensionLayers: layers.slice(0, tensionCounts.length),
    compressionLayers: layers.slice(tensionCounts.length),
  };
}

export function designTBeam(input: TBeamDesignInput): TBeamDesignResult {
  const singly = designTBeamSingly(input);
  if (singly.ok || (singly.spacingOk === false &&
    input.Mu <= singly.singlyTrialPhiMn)) return singly;
  const { bw, d, fc, fy, Mu, barDiameter } = input;
  const compressionBarDiameter = input.compressionBarDiameter ?? barDiameter;
  const clearCover = input.clearCover ?? CLEAR_COVER;
  const stirrupDiameter = input.stirrupDiameter ?? ASSUMED_STIRRUP_DIAMETER;
  const aggregateSize = input.aggregateSize ?? 19;
  const Es = input.Es ?? ES;
  const dPrime = clearCover + stirrupDiameter + compressionBarDiameter / 2;
  const availableWidth = bw - 2 * (clearCover + stirrupDiameter);
  const tensionSpacing = Math.max(25, barDiameter, 4 * aggregateSize / 3);
  const compressionSpacing = Math.max(25, compressionBarDiameter, 4 * aggregateSize / 3);
  const maxTensionPerLayer = Math.floor((availableWidth + tensionSpacing) / (barDiameter + tensionSpacing));
  const maxCompressionPerLayer = Math.floor((availableWidth + compressionSpacing) / (compressionBarDiameter + compressionSpacing));
  if (maxTensionPerLayer < 1 || maxCompressionPerLayer < 1 || dPrime >= singly.trialC) {
    throw new Error("Compression steel cannot fit in the web or lies outside the trial compression zone; revise the section or cover.");
  }
  const trialA = singly.trialA;
  const trialC = singly.trialC;
  const trialCompressionStrain = 0.003 * (trialC - dPrime) / trialC;
  const compressionDesignStress = Math.min(fy, Es * trialCompressionStrain);
  const netDesignStress = compressionDesignStress -
    0.85 * fc * barFractionInBlock(trialA, dPrime, compressionBarDiameter);
  if (netDesignStress <= 0) {
    throw new Error("Compression steel has no positive net compression force at the trial neutral axis; revise its depth.");
  }
  const trialPhi = getPhi(singly.targetTensionStrain, fy, Es);
  const additionalForce = Math.max(0, (Mu / trialPhi - singly.singlyTrialPhiMn / trialPhi) * 1e6 / (d - dPrime));
  const asCompressionCalculated = additionalForce / netDesignStress;
  const asAdditionalTension = additionalForce / fy;
  const tensionBarArea = Math.PI * barDiameter ** 2 / 4;
  const compressionBarArea = Math.PI * compressionBarDiameter ** 2 / 4;
  const minimumTensionBars = Math.max(2, Math.ceil(singly.asMin / tensionBarArea));
  let selected: ReturnType<typeof evaluateTBeamBars> = null;
  let selectedTensionBars = 0;
  let selectedCompressionBars = 0;
  let selectedArea = Infinity;
  for (let tensionBars = minimumTensionBars; tensionBars <= maxTensionPerLayer * 3; tensionBars += 1) {
    const tensionRows = layerCounts(tensionBars, maxTensionPerLayer);
    for (let compressionBars = 1; compressionBars <= maxCompressionPerLayer * 3; compressionBars += 1) {
      const totalArea = tensionBars * tensionBarArea + compressionBars * compressionBarArea;
      if (totalArea >= selectedArea) continue;
      const compressionRows = layerCounts(compressionBars, maxCompressionPerLayer);
      const evaluated = evaluateTBeamBars(input, singly.beff, singly.beta1, tensionRows, compressionRows, dPrime);
      if (!evaluated || evaluated.compressionLayers.some((layer) => layer.netForce <= 0) ||
        evaluated.tensionLayers.some((layer) => layer.stress >= 0) ||
        evaluated.epsilonT < singly.targetTensionStrain - 1e-9 || evaluated.phiMn < Mu) continue;
      selected = evaluated;
      selectedTensionBars = tensionBars;
      selectedCompressionBars = compressionBars;
      selectedArea = totalArea;
    }
  }
  if (!selected) {
    throw new Error("No T-beam tension/compression bar arrangement within three web layers meets the target strain and moment. Increase bw or d, or revise the bar sizes.");
  }
  const capacity = selected;
  const tensionPerLayer = Math.min(selectedTensionBars, maxTensionPerLayer);
  const numberOfLayers = capacity.tensionLayers.length;
  const asProvided = selectedTensionBars * tensionBarArea;
  const asCompression = selectedCompressionBars * compressionBarArea;
  const clearSpacing = tensionPerLayer > 1
    ? (availableWidth - tensionPerLayer * barDiameter) / (tensionPerLayer - 1) : null;
  return {
    ...singly,
    ...capacity,
    sectionType: "doubly",
    ok: true,
    designStatus: "PASS",
    message: "Doubly reinforced T-beam design passes after strain-compatible verification of the selected bars.",
    barsRequired: selectedTensionBars,
    barsPerLayer: tensionPerLayer,
    numberOfLayers,
    asCalculated: singly.asTensionControlledMax + asAdditionalTension,
    asRequired: asProvided,
    asProvided,
    compressionBarsRequired: selectedCompressionBars,
    compressionBarsPerLayer: Math.min(selectedCompressionBars, maxCompressionPerLayer),
    asCompression,
    asCompressionCalculated,
    asAdditionalTension,
    compressionDesignStress,
    compressionSteelYields: capacity.compressionLayers.every((layer) => layer.stress >= fy - 1e-9),
    clearSpacing,
    spacingOk: true,
    spacingMessage: "Tension and compression rows fit inside the web with required clear spacing.",
  };
}

function n(value: number, digits = 2): string {
  return value.toFixed(digits);
}

export function getTBeamSolutionSteps(
  input: TBeamDesignInput,
  result: TBeamDesignResult
): TBeamSolutionStep[] {
  const steps: TBeamSolutionStep[] = [];
  if (result.flangeWidthMode === "given") {
    steps.push({
      label: "Given effective flange width",
      formula: "b_f=b_{f,\\mathrm{given}}",
      substitution: "b_f=" + n(result.beff) + "\\;\\mathrm{mm}",
      result: "b_f=" + n(result.beff) + "\\;\\mathrm{mm}\\ge b_w=" + n(input.bw) + "\\;\\mathrm{mm}",
    });
  } else {
    const spanLimit = result.spanLimit!;
    const thicknessLimit = result.thicknessLimit!;
    steps.push(
      {
        label: "Effective left overhang",
        formula: "b_{o,L}=\\min(\\ell_n/8,8h_f,s_{w,L}/2)",
        substitution: "b_{o,L}=\\min(" + n(input.span!) + "/8,8(" + n(input.hf) +
          ")," + n(input.clearSpacingLeft!) + "/2)",
        result: "b_{o,L}=\\min(" + n(spanLimit) + "," + n(thicknessLimit) +
          "," + n(result.leftSpacingLimit!) + ")=" + n(result.leftOverhang!) + "\\;\\mathrm{mm}",
      },
      {
        label: "Effective right overhang",
        formula: "b_{o,R}=\\min(\\ell_n/8,8h_f,s_{w,R}/2)",
        substitution: "b_{o,R}=\\min(" + n(input.span!) + "/8,8(" + n(input.hf) +
          ")," + n(input.clearSpacingRight!) + "/2)",
        result: "b_{o,R}=\\min(" + n(spanLimit) + "," + n(thicknessLimit) +
          "," + n(result.rightSpacingLimit!) + ")=" + n(result.rightOverhang!) + "\\;\\mathrm{mm}",
      },
      {
        label: "Effective flange width",
        formula: "b_f=b_w+b_{o,L}+b_{o,R}",
        substitution: "b_f=" + n(input.bw) + "+" + n(result.leftOverhang!) +
          "+" + n(result.rightOverhang!),
        result: "b_f=" + n(result.beff) + "\\;\\mathrm{mm}",
      },
    );
  }

  const minTerm1 = 0.25 * Math.sqrt(input.fc) * input.bw * input.d / input.fy;
  const minTerm2 = 1.4 * input.bw * input.d / input.fy;
  const trialPhi = getPhi(result.targetTensionStrain, input.fy, result.Es);
  const flangeMoment = 0.85 * input.fc * result.beff * input.hf *
    (input.d - input.hf / 2) / 1e6;
  const nominalDemand = input.Mu / trialPhi;
  const requiredInFlange = nominalDemand <= flangeMoment;
  const residualWebMoment = nominalDemand - flangeMoment;
  const webDepth = input.d - input.hf;
  const radical = requiredInFlange
    ? input.d ** 2 - 2 * nominalDemand * 1e6 / (0.85 * input.fc * result.beff)
    : webDepth ** 2 - 2 * residualWebMoment * 1e6 / (0.85 * input.fc * input.bw);
  const demandBlockDepth = radical >= 0
    ? (requiredInFlange ? input.d : input.hf + webDepth) - Math.sqrt(radical)
    : null;
  const demandSteelArea = demandBlockDepth === null ? null :
    steelAreaAtCompressionDepth(demandBlockDepth, result.beff,
      input.bw, input.hf, input.fc, input.fy);
  const trialMn = result.singlyTrialPhiMn / trialPhi;
  const trialConcreteForce = compressionForceAtDepth(
    result.trialA, result.beff, input.bw, input.hf, input.fc
  );
  const trialCase = result.trialA <= input.hf ? "flange" : "web";
  const barArea = Math.PI * input.barDiameter ** 2 / 4;
  const compressionBarArea = Math.PI * result.compressionBarDiameter ** 2 / 4;
  const cover = input.clearCover ?? CLEAR_COVER;
  const stirrup = input.stirrupDiameter ?? ASSUMED_STIRRUP_DIAMETER;
  const aggregate = input.aggregateSize ?? 19;
  const insideWidth = input.bw - 2 * (cover + stirrup);
  const steelLayers = [...result.tensionLayers, ...result.compressionLayers];
  const cw = result.concreteWebForce / 1000;
  const cf = result.concreteFlangeForce / 1000;
  const steelForce = steelLayers.reduce((sum, layer) => sum + layer.netForce, 0) / 1000;
  const concreteMoment = (result.concreteWebForce * result.a / 2 +
    result.concreteFlangeForce * input.hf / 2) / 1e6;
  const steelMoment = steelLayers.reduce((sum, layer) =>
    sum + layer.netForce * layer.depth, 0) / 1e6;

  steps.push(
    {
      label: "Flange-only moment screening",
      formula: "M_f=0.85f'_cb_fh_f(d-h_f/2)/10^6,\\quad M_{n,u}=M_u/\\phi_t",
      substitution: "M_f=0.85(" + n(input.fc) + ")(" + n(result.beff) + ")(" +
        n(input.hf) + ")(" + n(input.d) + "-" + n(input.hf) + "/2)/10^6,\\quad " +
        "M_{n,u}=" + n(input.Mu) + "/" + n(trialPhi, 3),
      result: "M_f=" + n(flangeMoment) + "\\;\\mathrm{kN}\\cdot\\mathrm{m}" +
        (requiredInFlange ? "\\ge " : "<") + "M_{n,u}=" +
        n(nominalDemand) + "\\;\\mathrm{kN}\\cdot\\mathrm{m}\\quad\\text{" +
        (requiredInFlange ? "Within flange" : "Flange and web") + "}",
    },
    ...(requiredInFlange ? [{
      label: "Required compression-block depth within flange",
      formula: "M_u=\\phi_t(0.85f'_cb_fa(d-a/2))/10^6",
      substitution: n(nominalDemand) + "=0.85(" + n(input.fc) + ")(" +
        n(result.beff) + ")a(" + n(input.d) + "-a/2)/10^6",
      result: demandBlockDepth === null
        ? "\\text{No real singly reinforced block depth at the trial }\\phi"
        : "a=" + n(demandBlockDepth) + "\\;\\mathrm{mm}\\le h_f=" +
          n(input.hf) + "\\;\\mathrm{mm}",
    }] : [{
      label: "Required compression-block depth in web",
      formula: "M_1=M_u/\\phi_t-M_f,\\quad M_1=0.85f'_cb_w(a-h_f)" +
        "[d-h_f-(a-h_f)/2]/10^6",
      substitution: "M_1=" + n(nominalDemand) + "-" + n(flangeMoment) +
        "=" + n(residualWebMoment) + "=0.85(" + n(input.fc) + ")(" +
        n(input.bw) + ")(a-" + n(input.hf) + ")(" + n(input.d) + "-" +
        n(input.hf) + "-(a-" + n(input.hf) + ")/2)/10^6",
      result: demandBlockDepth === null
        ? "\\text{No real singly reinforced block depth at the trial }\\phi"
        : "a=" + n(demandBlockDepth) + "\\;\\mathrm{mm}>h_f=" +
          n(input.hf) + "\\;\\mathrm{mm}",
    }]),
    ...(demandSteelArea === null ? [] : [{
      label: requiredInFlange ? "Required steel from flange equilibrium" :
        "Required steel from flange and web equilibrium",
      formula: requiredInFlange
        ? "A_{s,\\mathrm{calc}}=0.85f'_cb_fa/f_y"
        : "A_{s,\\mathrm{calc}}=0.85f'_c[b_fh_f+b_w(a-h_f)]/f_y",
      substitution: requiredInFlange
        ? "A_{s,\\mathrm{calc}}=0.85(" + n(input.fc) + ")( " +
          n(result.beff) + ")( " + n(demandBlockDepth!) + ")/" + n(input.fy)
        : "A_{s,\\mathrm{calc}}=0.85(" + n(input.fc) + ")[" +
          n(result.beff) + "(" + n(input.hf) + ")+" + n(input.bw) +
          "(" + n(demandBlockDepth!) + "-" + n(input.hf) + ")]/" + n(input.fy),
      result: "A_{s,\\mathrm{calc}}=" + n(demandSteelArea) + "\\;\\mathrm{mm}^2" +
        (result.sectionType === "doubly"
          ? "\\quad\\text{(singly trial; final design verified separately)}" : ""),
    }]),
    {
      label: "Whitney stress-block factor",
      formula: "\\beta_1=\\min\\left(0.85,\\max\\left(0.65,0.85-0.05\\dfrac{f'_c-28}{7}\\right)\\right)",
      substitution: "f'_c=" + n(input.fc) + "\\;\\mathrm{MPa}",
      result: "\\beta_1=" + n(result.beta1, 3),
    },
    {
      label: "Minimum tension reinforcement",
      formula: "A_{s,\\min}=\\max\\left(\\dfrac{0.25\\sqrt{f'_c}b_wd}{f_y},\\dfrac{1.4b_wd}{f_y}\\right)",
      substitution: "A_{s,\\min}=\\max(" + n(minTerm1) + "," + n(minTerm2) + ")",
      result: "A_{s,\\min}=" + n(result.asMin) + "\\;\\mathrm{mm}^2",
    },
    {
      label: "Trial tension strain, neutral axis, and block depth",
      formula: "c_t=\\dfrac{0.003d}{0.003+\\varepsilon_{t,\\mathrm{trial}}},\\quad a_t=\\beta_1c_t",
      substitution: "c_t=\\dfrac{0.003(" + n(input.d) + ")}{0.003+" +
        n(result.targetTensionStrain, 5) + "},\\quad a_t=" + n(result.beta1, 3) +
        "(" + n(result.trialC) + ")",
      result: "c_t=" + n(result.trialC) + "\\;\\mathrm{mm},\\quad a_t=" +
        n(result.trialA) + "\\;\\mathrm{mm}",
    },
    {
      label: "Trial flange-only or flange-plus-web assumption",
      formula: "a_t\\le h_f\\Rightarrow C_c=0.85f'_cb_fa_t,\\quad a_t>h_f\\Rightarrow C_c=0.85f'_c[b_wa_t+(b_f-b_w)h_f]",
      substitution: "a_t=" + n(result.trialA) + "\\;\\mathrm{mm},\\quad h_f=" +
        n(input.hf) + "\\;\\mathrm{mm}",
      result: "\\text{" + (trialCase === "flange" ? "Within flange" : "Flange and web") +
        "},\\quad C_{c,t}=" + n(trialConcreteForce / 1000) + "\\;\\mathrm{kN}",
    },
    {
      label: "Maximum singly reinforced trial steel and moment",
      formula: "A_{s1}=C_{c,t}/f_y,\\quad \\phi_tM_{n,t}=\\phi_tM_n(A_{s1})",
      substitution: "A_{s1}=" + n(trialConcreteForce / 1000, 3) + "(10^3)/" +
        n(input.fy) + ",\\quad \\phi_t=" + n(trialPhi, 3),
      result: "A_{s1}=" + n(result.asTensionControlledMax) +
        "\\;\\mathrm{mm}^2,\\quad M_{n,t}=" + n(trialMn) +
        "\\;\\mathrm{kN}\\cdot\\mathrm{m},\\quad \\phi_tM_{n,t}=" +
        n(result.singlyTrialPhiMn) + "\\;\\mathrm{kN}\\cdot\\mathrm{m}",
    },
  );

  if (result.sectionType === "doubly") {
    const trialStrain = 0.003 * (result.trialC - result.dPrime) / result.trialC;
    const eta = barFractionInBlock(result.trialA, result.dPrime, result.compressionBarDiameter);
    const netStress = result.compressionDesignStress - 0.85 * input.fc * eta;
    const additionalForce = result.asAdditionalTension * input.fy;
    steps.push(
      {
        label: "Doubly reinforced design decision",
        formula: "M_u\\le\\phi_tM_{n,t}\\;\\text{for a sufficient singly reinforced trial}",
        substitution: "M_u=" + n(input.Mu) + ",\\quad \\phi_tM_{n,t}=" +
          n(result.singlyTrialPhiMn) + "\\;\\mathrm{kN}\\cdot\\mathrm{m}",
        result: "\\text{Adopt compression reinforcement and verify the selected layout}",
      },
      {
        label: "Compression-bar depth",
        formula: "d'=C_c+d_{st}+d'_b/2",
        substitution: "d'=" + n(cover) + "+" + n(stirrup) + "+" +
          n(result.compressionBarDiameter) + "/2",
        result: "d'=" + n(result.dPrime) + "\\;\\mathrm{mm}",
      },
      {
        label: "Compression steel strain and yield check",
        formula: "\\varepsilon'_s=0.003\\dfrac{c_t-d'}{c_t},\\quad f'_s=\\min(f_y,E_s\\varepsilon'_s)",
        substitution: "\\varepsilon'_s=0.003\\dfrac{" + n(result.trialC) + "-" +
          n(result.dPrime) + "}{" + n(result.trialC) + "}=" + n(trialStrain, 5) +
          ",\\quad E_s\\varepsilon'_s=" + n(result.Es * trialStrain) + "\\;\\mathrm{MPa}",
        result: "f'_{s,t}=" + n(result.compressionDesignStress) +
          "\\;\\mathrm{MPa},\\quad \\text{" +
          (result.compressionDesignStress >= input.fy - 1e-9 ? "yields" : "does not yield") + "}",
      },
      {
        label: "Supplementary steel couple and displaced concrete",
        formula: "F'_s=\\max\\left(0,\\dfrac{(M_u/\\phi_t-M_{n,t})10^6}{d-d'}\\right),\\quad f'_{s,net}=f'_s-0.85f'_c\\eta",
        substitution: "\\eta=" + n(eta, 4) + ",\\quad f'_{s,net}=" +
          n(result.compressionDesignStress) + "-0.85(" + n(input.fc) +
          ")(" + n(eta, 4) + ")=" + n(netStress) + "\\;\\mathrm{MPa}",
        result: "F'_s=" + n(additionalForce / 1000) + "\\;\\mathrm{kN}",
      },
      {
        label: "Calculated additional tension and compression steel",
        formula: "A_{s2}=F'_s/f_y,\\quad A'_{s,\\mathrm{calc}}=F'_s/f'_{s,net}",
        substitution: "A_{s2}=" + n(additionalForce) + "/" + n(input.fy) +
          ",\\quad A'_{s,\\mathrm{calc}}=" + n(additionalForce) + "/" + n(netStress),
        result: "A_{s2}=" + n(result.asAdditionalTension) +
          "\\;\\mathrm{mm}^2,\\quad A'_{s,\\mathrm{calc}}=" +
          n(result.asCompressionCalculated) + "\\;\\mathrm{mm}^2",
      },
      {
        label: "Total preliminary tension steel",
        formula: "A_{s,\\mathrm{calc}}=A_{s1}+A_{s2},\\quad A_{s,\\mathrm{trial}}=\\max(A_{s,\\mathrm{calc}},A_{s,\\min})",
        substitution: "A_{s,\\mathrm{calc}}=" + n(result.asTensionControlledMax) +
          "+" + n(result.asAdditionalTension),
        result: "A_{s,\\mathrm{calc}}=" + n(result.asCalculated) +
          "\\;\\mathrm{mm}^2\\quad\\text{(bar layout checked separately)}",
      },
    );
  } else {
    steps.push({
      label: "Required singly reinforced steel from moment demand",
      formula: "\\phi M_n(A_{s,\\mathrm{calc}})=M_u,\\quad A_{s,\\mathrm{req}}=\\max(A_{s,\\mathrm{calc}},A_{s,\\min})",
      substitution: "M_u=" + n(input.Mu) +
        "\\;\\mathrm{kN}\\cdot\\mathrm{m},\\quad A_{s,\\mathrm{calc}}=" +
        n(result.asCalculated) + "\\;\\mathrm{mm}^2",
      result: "A_{s,\\mathrm{req}}=\\max(" + n(result.asCalculated) +
        "," + n(result.asMin) + ")=" + n(result.asRequired) + "\\;\\mathrm{mm}^2",
    });
  }

  steps.push({
    label: "Selected bar areas and counts",
    formula: "A_b=\\pi d_b^2/4,\\quad A_{s,\\mathrm{prov}}=n_sA_b" +
      (result.sectionType === "doubly" ? ",\\quad A'_{s,\\mathrm{prov}}=n'_s\\pi d_b'^2/4" : ""),
    substitution: "A_b=\\pi(" + n(input.barDiameter) + ")^2/4=" +
      n(barArea, 2) + "\\;\\mathrm{mm}^2,\\quad n_s=" + result.barsRequired +
      (result.sectionType === "doubly" ? ",\\quad A'_b=" +
        n(compressionBarArea, 2) + "\\;\\mathrm{mm}^2,\\quad n'_s=" +
        result.compressionBarsRequired : ""),
    result: "A_{s,\\mathrm{prov}}=" + n(result.asProvided) +
      "\\;\\mathrm{mm}^2" + (result.sectionType === "doubly"
        ? ",\\quad A'_{s,\\mathrm{prov}}=" + n(result.asCompression) + "\\;\\mathrm{mm}^2" : ""),
  });

  const seismicMaximumArea = 0.025 * input.bw * input.d;
  steps.push({
    label: "Special moment-frame steel limit (if applicable)",
    formula: "\\rho=A_{s,\\mathrm{prov}}/(b_wd),\\quad " +
      "\\rho_{\\max}=0.025,\\quad A_{s,\\max}=0.025b_wd",
    substitution: "A_{s,\\max}=0.025(" + n(input.bw) + ")( " +
      n(input.d) + ")=" + n(seismicMaximumArea) +
      "\\;\\mathrm{mm}^2,\\quad A_{s,\\mathrm{prov}}=" +
      n(result.asProvided) + "\\;\\mathrm{mm}^2",
    result: "\\rho=" + n(result.asProvided / (input.bw * input.d), 4) +
      (result.asProvided <= seismicMaximumArea ? "\\le " : ">") +
      "0.025\\quad\\text{" + (result.asProvided <= seismicMaximumArea
        ? "Meets conditional limit" : "Exceeds conditional limit; revise if seismic rule applies") + "}",
  });

  steps.push({
    label: "Web width and minimum clear spacing",
    formula: "b_{\\mathrm{inside}}=b_w-2(C_c+d_{st}),\\quad s_{\\min}=\\max(25,d_b,4d_{agg}/3)",
    substitution: "b_{\\mathrm{inside}}=" + n(input.bw) + "-2(" +
      n(cover) + "+" + n(stirrup) + "),\\quad d_{agg}=" + n(aggregate) + "\\;\\mathrm{mm}",
    result: "b_{\\mathrm{inside}}=" + n(insideWidth) +
      "\\;\\mathrm{mm},\\quad s_{\\min}=" + n(result.minClearSpacingRequired) + "\\;\\mathrm{mm}",
  });

  for (const [role, layers] of [
    ["Tension", result.tensionLayers],
    ["Compression", result.compressionLayers],
  ] as const) {
    layers.forEach((layer, index) => {
      const gap = layer.barCount > 1
        ? (insideWidth - layer.barCount * layer.diameter) / (layer.barCount - 1)
        : null;
      steps.push({
        label: role + " layer " + (index + 1) + ": placement and clear gap",
        formula: "s_{\\mathrm{clear},i}=\\dfrac{b_{\\mathrm{inside}}-n_id_{b,i}}{n_i-1}\\quad(n_i>1)",
        substitution: "n_i=" + layer.barCount + ",\\quad d_{b,i}=" +
          n(layer.diameter) + "\\;\\mathrm{mm},\\quad d_i=" +
          n(layer.depth) + "\\;\\mathrm{mm}",
        result: gap === null
          ? "\\text{Single bar in row; horizontal interbar gap not applicable}"
          : "s_{\\mathrm{clear},i}=" + n(gap) + "\\;\\mathrm{mm}" +
            (gap >= Math.max(25, layer.diameter, 4 * aggregate / 3) ? "\\ge " : "<") +
            n(Math.max(25, layer.diameter, 4 * aggregate / 3)) + "\\;\\mathrm{mm}",
      });
    });
  }

  steps.push({
    label: "Final neutral axis and compression-block case",
    formula: "C_c+\\sum_iF_{s,i}=0,\\quad a=\\beta_1c",
    substitution: "c=" + n(result.c) + "\\;\\mathrm{mm},\\quad a=" +
      n(result.beta1, 3) + "(" + n(result.c) + ")=" + n(result.a) +
      "\\;\\mathrm{mm},\\quad h_f=" + n(input.hf) + "\\;\\mathrm{mm}",
    result: "\\text{" + (result.sectionCase === "flange"
      ? "Compression block within flange" : "Compression block extends into web") + "}",
  });

  steps.push({
    label: "Flange and web concrete resultants",
    formula: result.sectionCase === "flange"
      ? "C_c=0.85f'_cb_fa"
      : "C_w=0.85f'_cb_wa,\\quad C_f=0.85f'_c(b_f-b_w)h_f",
    substitution: result.sectionCase === "flange"
      ? "C_c=0.85(" + n(input.fc) + ")(" + n(result.beff) +
        ")(" + n(result.a) + ")"
      : "C_w=0.85(" + n(input.fc) + ")(" + n(input.bw) +
        ")(" + n(result.a) + "),\\quad C_f=0.85(" +
        n(input.fc) + ")(" + n(result.beff - input.bw) +
        ")(" + n(input.hf) + ")",
    result: result.sectionCase === "flange"
      ? "C_c=" + n(cw) + "\\;\\mathrm{kN}"
      : "C_w=" + n(cw) + "\\;\\mathrm{kN},\\quad C_f=" +
        n(cf) + "\\;\\mathrm{kN}",
  });

  for (const [role, layers] of [
    ["Tension", result.tensionLayers],
    ["Compression", result.compressionLayers],
  ] as const) {
    layers.forEach((layer, index) => {
      const eta = barFractionInBlock(result.a, layer.depth, layer.diameter);
      const yieldText = Math.abs(layer.stress) >= input.fy - 1e-9 ? "yields" : "elastic";
      steps.push({
        label: role + " layer " + (index + 1) + ": final strain, stress, and force",
        formula: "\\varepsilon_{s,i}=0.003\\dfrac{c-d_i}{c},\\quad f_{s,i}=\\max(-f_y,\\min(f_y,E_s\\varepsilon_{s,i})),\\quad F_{s,i}=A_{s,i}(f_{s,i}-0.85f'_c\\eta_i)",
        substitution: "d_i=" + n(layer.depth) + "\\;\\mathrm{mm},\\quad A_{s,i}=" +
          n(layer.area) + "\\;\\mathrm{mm}^2,\\quad \\eta_i=" + n(eta, 4) +
          ",\\quad \\varepsilon_{s,i}=" + n(layer.strain, 5),
        result: "f_{s,i}=" + n(layer.stress) + "\\;\\mathrm{MPa},\\quad F_{s,i}=" +
          n(layer.netForce / 1000) + "\\;\\mathrm{kN},\\quad \\text{" + yieldText + "}",
      });
    });
  }

  steps.push(
    {
      label: "Final force equilibrium",
      formula: "C_c+\\sum_iF_{s,i}=0",
      substitution: result.sectionCase === "flange"
        ? n(cw) + "+(" + n(steelForce) + ")"
        : n(cw) + "+" + n(cf) + "+(" + n(steelForce) + ")",
      result: "\\sum F=" + n(cw + cf + steelForce, 6) + "\\;\\mathrm{kN}",
    },
    {
      label: "Extreme tension strain and strength-reduction factor",
      formula: "\\varepsilon_t=0.003\\dfrac{d-c}{c},\\quad \\phi=\\begin{cases}0.65&\\varepsilon_t\\le\\varepsilon_y\\\\0.65+0.25\\dfrac{\\varepsilon_t-\\varepsilon_y}{0.005-\\varepsilon_y}&\\varepsilon_y<\\varepsilon_t<0.005\\\\0.90&\\varepsilon_t\\ge0.005\\end{cases}",
      substitution: "\\varepsilon_y=f_y/E_s=" + n(input.fy) + "/" +
        n(result.Es) + "=" + n(input.fy / result.Es, 5) +
        ",\\quad \\varepsilon_t=0.003\\dfrac{" + n(input.d) +
        "-" + n(result.c) + "}{" + n(result.c) + "}",
      result: "\\varepsilon_t=" + n(result.epsilonT, 5) +
        ",\\quad \\phi=" + n(result.phi, 3),
    },
    {
      label: "Nominal moment strength from the final force system",
      formula: result.sectionCase === "flange"
        ? "M_n=-\\dfrac{C_c(a/2)+\\sum_iF_{s,i}d_i}{10^6}"
        : "M_n=-\\dfrac{C_w(a/2)+C_f(h_f/2)+\\sum_iF_{s,i}d_i}{10^6}",
      substitution: "M_n=-[" + n(concreteMoment) + "+(" +
        n(steelMoment) + ")]\\;\\mathrm{kN}\\cdot\\mathrm{m}",
      result: "M_n=" + n(result.Mn) + "\\;\\mathrm{kN}\\cdot\\mathrm{m}",
    },
    {
      label: "Design moment and final status",
      formula: "\\phi M_n\\ge M_u",
      substitution: "\\phi M_n=" + n(result.phi, 3) + "(" +
        n(result.Mn) + ")=" + n(result.phiMn) +
        "\\;\\mathrm{kN}\\cdot\\mathrm{m},\\quad M_u=" +
        n(input.Mu) + "\\;\\mathrm{kN}\\cdot\\mathrm{m}",
      result: "\\phi M_n" + (result.phiMn >= input.Mu ? "\\ge " : "<") +
        "M_u\\quad\\text{" + (result.ok ? "DESIGN PASSES" : "REVISE DESIGN") + "}",
    },
  );

  return steps;
}
