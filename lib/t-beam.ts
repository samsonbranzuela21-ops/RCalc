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
  const flangeSteps: TBeamSolutionStep[] = result.flangeWidthMode === "given"
    ? [{
        label: "Given effective flange width",
        formula: "b_f=b_{f,\\mathrm{given}}",
        substitution: "b_f=" + n(input.bf!) + "\\;\\text{mm}",
        result: "b_f=" + n(result.beff) + "\\;\\text{mm}",
      }]
    : [
        {
          label: "Effective left overhang",
          formula: "b_{o,L}=\\min(\\ell_n/8,8h_f,s_{w,L}/2)",
          substitution: "b_{o,L}=\\min(" + n(result.spanLimit!) + "," +
            n(result.thicknessLimit!) + "," + n(result.leftSpacingLimit!) + ")",
          result: "b_{o,L}=" + n(result.leftOverhang!) + "\\;\\text{mm}",
        },
        {
          label: "Effective right overhang",
          formula: "b_{o,R}=\\min(\\ell_n/8,8h_f,s_{w,R}/2)",
          substitution: "b_{o,R}=\\min(" + n(result.spanLimit!) + "," +
            n(result.thicknessLimit!) + "," + n(result.rightSpacingLimit!) + ")",
          result: "b_{o,R}=" + n(result.rightOverhang!) + "\\;\\text{mm}",
        },
        {
          label: "Effective flange width (interior T-beam)",
          formula: "b_f=b_w+b_{o,L}+b_{o,R}",
          substitution: "b_f=" + n(input.bw) + "+" + n(result.leftOverhang!) +
            "+" + n(result.rightOverhang!),
          result: "b_f=" + n(result.beff) + "\\;\\text{mm}",
        },
      ];
  if (result.sectionType === "doubly") {
    const trialPhi = getPhi(result.targetTensionStrain, input.fy, result.Es);
    const trialMn = result.singlyTrialPhiMn / trialPhi;
    const cf = result.concreteFlangeForce / 1000;
    const cw = result.concreteWebForce / 1000;
    const tf = result.tensionLayers.reduce((sum, layer) => sum + layer.netForce, 0) / 1000;
    const cs = result.compressionLayers.reduce((sum, layer) => sum + layer.netForce, 0) / 1000;
    const layerSteps: TBeamSolutionStep[] = [
      ...result.tensionLayers.map((layer, index) => ({
        label: "Tension layer " + (index + 1) + ": strain, stress and force",
        formula: "\\varepsilon_s=0.003(c-d_i)/c,\\quad f_s=\\max(-f_y,\\min(f_y,E_s\\varepsilon_s))",
        substitution: "d_i=" + n(layer.depth) + "\\;\\text{mm},\\quad A_{s,i}=" + n(layer.area) + "\\;\\text{mm}^2",
        result: "\\varepsilon_s=" + n(layer.strain, 5) + ",\\quad f_s=" + n(layer.stress) +
          "\\;\\text{MPa},\\quad F_{s,i}=" + n(layer.netForce / 1000) + "\\;\\text{kN}",
      })),
      ...result.compressionLayers.map((layer, index) => ({
        label: "Compression layer " + (index + 1) + ": strain, yield and net force",
        formula: "F'_{s,i}=A'_{s,i}(f'_{s,i}-0.85f'_c\\eta_i)",
        substitution: "d'_i=" + n(layer.depth) + "\\;\\text{mm},\\quad A'_{s,i}=" + n(layer.area) +
          "\\;\\text{mm}^2,\\quad \\varepsilon'_{s,i}=" + n(layer.strain, 5),
        result: "f'_{s,i}=" + n(layer.stress) + "\\;\\text{MPa},\\quad F'_{s,i}=" +
          n(layer.netForce / 1000) + "\\;\\text{kN},\\quad " +
          (Math.abs(layer.stress) >= input.fy - 1e-9 ? "\\text{yields}" : "\\text{elastic}"),
      })),
    ];
    return [
      ...flangeSteps,
      {
        label: "Trial tension-controlled neutral axis",
        formula: "c_t=0.003d/(0.003+\\varepsilon_{t,trial}),\\quad a_t=\\beta_1c_t",
        substitution: "d=" + n(input.d) + "\\;\\text{mm},\\quad \\varepsilon_{t,trial}=" +
          n(result.targetTensionStrain, 5) + ",\\quad \\beta_1=" + n(result.beta1, 3),
        result: "c_t=" + n(result.trialC) + "\\;\\text{mm},\\quad a_t=" + n(result.trialA) + "\\;\\text{mm}",
      },
      {
        label: "Singly reinforced trial and flange/web assumption",
        formula: result.trialA <= input.hf
          ? "C_c=0.85f'_cb_fa\\;(a\\le h_f)"
          : "C_c=0.85f'_c[b_wa+(b_f-b_w)h_f]\\;(a>h_f)",
        substitution: "a_t=" + n(result.trialA) + "\\;\\text{mm},\\quad h_f=" + n(input.hf) +
          "\\;\\text{mm},\\quad M_{n,trial}=" + n(trialMn) + "\\;\\text{kN}\\cdot\\text{m}",
        result: "\\phi_{trial}M_{n,trial}=" + n(result.singlyTrialPhiMn) + "<M_u=" + n(input.Mu),
      },
      {
        label: "Compression steel strain and yield check",
        formula: "\\varepsilon'_s=0.003(c_t-d')/c_t,\\quad f'_s=\\min(f_y,E_s\\varepsilon'_s)",
        substitution: "d'=" + n(result.dPrime) + "\\;\\text{mm},\\quad E_s=" + n(result.Es) + "\\;\\text{MPa}",
        result: "f'_{s,trial}=" + n(result.compressionDesignStress) + "\\;\\text{MPa},\\quad " +
          (result.compressionDesignStress >= input.fy - 1e-9 ? "\\text{yields}" : "\\text{does not yield}"),
      },
      {
        label: "Trial supplementary compression and tension steel",
        formula: "F'_s=(M_u/\\phi_{trial}-M_{n,trial})10^6/(d-d'),\\quad A'_{s,calc}=F'_s/(f'_s-0.85f'_c\\eta),\\quad A_{s,2}=F'_s/f_y",
        substitution: "M_u=" + n(input.Mu) + "\\;\\text{kN}\\cdot\\text{m},\\quad d-d'=" +
          n(input.d - result.dPrime) + "\\;\\text{mm}",
        result: "A'_{s,calc}=" + n(result.asCompressionCalculated) + "\\;\\text{mm}^2,\\quad A_{s,2}=" +
          n(result.asAdditionalTension) + "\\;\\text{mm}^2,\\quad \\eta=\\text{bar-area fraction in concrete block}",
      },
      {
        label: "Selected reinforcement in web",
        formula: "A_s=n_s\\pi d_b^2/4,\\quad A'_s=n'_s\\pi d_b'^2/4",
        substitution: "n_s=" + result.barsRequired + ",\\quad n'_s=" + result.compressionBarsRequired,
        result: "A_s=" + n(result.asProvided) + "\\;\\text{mm}^2,\\quad A'_s=" +
          n(result.asCompression) + "\\;\\text{mm}^2",
      },
      {
        label: "Final neutral axis and compression-block case",
        formula: "C_c+\\sum F'_{s,i}+\\sum F_{s,i}=0,\\quad a=\\beta_1c",
        substitution: "c=" + n(result.c) + "\\;\\text{mm},\\quad a=" + n(result.a) +
          "\\;\\text{mm},\\quad h_f=" + n(input.hf) + "\\;\\text{mm}",
        result: result.sectionCase === "flange" ? "a\\le h_f\\;\\text{(flange only)}" : "a>h_f\\;\\text{(flange and web)}",
      },
      {
        label: "Flange and web concrete resultants",
        formula: result.sectionCase === "flange"
          ? "C_c=0.85f'_cb_fa"
          : "C_f=0.85f'_c(b_f-b_w)h_f,\\quad C_w=0.85f'_cb_wa",
        substitution: "b_f=" + n(result.beff) + "\\;\\text{mm},\\quad a=" + n(result.a) + "\\;\\text{mm}",
        result: result.sectionCase === "flange"
          ? "C_c=" + n(cw) + "\\;\\text{kN}"
          : "C_f=" + n(cf) + "\\;\\text{kN},\\quad C_w=" + n(cw) + "\\;\\text{kN}",
      },
      ...layerSteps,
      {
        label: "Final force equilibrium",
        formula: result.sectionCase === "flange"
          ? "C_c+\\sum F'_s+\\sum F_s=0"
          : "C_f+C_w+\\sum F'_s+\\sum F_s=0",
        substitution: n(cf) + "+" + n(cw) + "+(" + n(cs) + ")+(" + n(tf) + ")",
        result: "\\sum F=" + n(cf + cw + cs + tf, 6) + "\\;\\text{kN}",
      },
      {
        label: "Nominal moment, strain and strength factor",
        formula: result.sectionCase === "flange"
          ? "M_n=-[C_c(a/2)+\\sum F_id_i]/10^6,\\quad \\varepsilon_t=0.003(d-c)/c"
          : "M_n=-[C_w(a/2)+C_f(h_f/2)+\\sum F_id_i]/10^6,\\quad \\varepsilon_t=0.003(d-c)/c",
        substitution: "\\varepsilon_t=" + n(result.epsilonT, 5) + ",\\quad \\phi=" + n(result.phi, 3),
        result: "M_n=" + n(result.Mn) + "\\;\\text{kN}\\cdot\\text{m}",
      },
      {
        label: "Design strength check",
        formula: "\\phi M_n\\ge M_u",
        substitution: n(result.phi, 3) + "(" + n(result.Mn) + ")\\ge " + n(input.Mu),
        result: "\\phi M_n=" + n(result.phiMn) + "\\;\\text{kN}\\cdot\\text{m}\\;\\text{PASS}",
      },
    ];
  }
  const caseText =
    result.sectionCase === "flange"
      ? "a \\le h_f\\;\\text{(compression block within flange)}"
      : "a > h_f\\;\\text{(compression block extends into web)}";

  const equilibriumFormula =
    result.sectionCase === "flange"
      ? "A_s f_y = 0.85 f'_c b_f a"
      : "A_s f_y = 0.85 f'_c[b_w a+(b_f-b_w)h_f]";

  const momentFormula =
    result.sectionCase === "flange"
      ? "M_n=0.85f'_c b_f a(d-a/2)"
      : "M_n=0.85f'_c b_w a(d-a/2)+0.85f'_c(b_f-b_w)h_f(d-h_f/2)";

 const steps: TBeamSolutionStep[] = [
    ...flangeSteps,
    {
      label: "Whitney stress-block factor",
      formula:
        "\\beta_1=0.85-0.05\\left(\\dfrac{f'_c-28}{7}\\right),\\quad 0.65\\le\\beta_1\\le0.85",
      substitution: `f'_c=${n(input.fc)}\\;\\text{MPa}`,
      result: `\\beta_1=${n(result.beta1, 3)}`,
    },
    {
      label: "Minimum tension reinforcement",
      formula:
        "A_{s,min}=\\max\\left(\\dfrac{0.25\\sqrt{f'_c}}{f_y}b_wd,\\;\\dfrac{1.4}{f_y}b_wd\\right)",
      substitution: `A_{s,min}=\\max\\left(\\dfrac{0.25\\sqrt{${n(
        input.fc
      )}}}{${n(input.fy)}}(${n(input.bw)})(${n(
        input.d
      )}),\\;\\dfrac{1.4}{${n(input.fy)}}(${n(input.bw)})(${n(
        input.d
      )})\\right)`,
      result: `A_{s,min}=${n(result.asMin)}\\;\\text{mm}^2`,
    },
    {
      label: "Required reinforcement from strength",
      formula: equilibriumFormula,
      substitution: `\\phi M_n\\ge M_u,\\qquad M_u=${n(
        input.Mu
      )}\\;\\text{kN}\\cdot\\text{m}`,
      result: `A_{s,calc}=${n(result.asCalculated)}\\;\\text{mm}^2`,
    },
    {
      label: "Governing required steel and selected bars",
      formula: "A_s=\\max(A_{s,calc},A_{s,min})",
      substitution: `A_s=\\max(${n(result.asCalculated)},${n(
        result.asMin
      )})`,
      result: `A_s=${n(result.asRequired)}\\;\\text{mm}^2\\;\\rightarrow\\;${
        result.barsRequired
      }\\text{-}\\phi${input.barDiameter}\\;(A_{s,prov}=${n(
        result.asProvided
      )}\\;\\text{mm}^2)`,
    },
    {
      label: "Compression-block depth and section case",
      formula: equilibriumFormula,
      substitution: `a=${n(result.a)}\\;\\text{mm},\\qquad h_f=${n(
        input.hf
      )}\\;\\text{mm}`,
      result: caseText,
    },
    {
      label: "Tension strain and strength-reduction factor",
      formula:
        "c=a/\\beta_1,\\qquad \\varepsilon_t=0.003\\left(\\dfrac{d-c}{c}\\right)",
      substitution: `c=${n(result.a)}/${n(
        result.beta1,
        3
      )}=${n(result.c)}\\;\\text{mm}`,
      result: `\\varepsilon_t=${n(result.epsilonT, 5)},\\qquad\\phi=${n(
        result.phi,
        3
      )}`,
    },
    {
      label: "Nominal and design moment strength",
      formula: momentFormula,
      substitution: `M_n=${n(result.Mn)}\\;\\text{kN}\\cdot\\text{m}`,
      result: `\\phi M_n=${n(result.phiMn)}\\;\\text{kN}\\cdot\\text{m}\\;${
        result.phiMn >= input.Mu ? "\\ge" : "<"
      }\\;M_u=${n(input.Mu)}\\;\\text{kN}\\cdot\\text{m}`,
    },
  ];
  if (result.tensionLayers.length > 1) {
    const preliminaryStep = steps.find((step) => step.label === "Required reinforcement from strength");
    if (preliminaryStep) preliminaryStep.label = "Preliminary steel at the outer tension depth";
    const neutralAxisIndex = steps.findIndex((step) => step.label === "Compression-block depth and section case");
    steps[neutralAxisIndex] = {
      label: "Final neutral axis and section case",
      formula: "C_c+\\sum F_{s,i}=0,\\quad a=\\beta_1c",
      substitution: "c=" + n(result.c) + "\\;\\text{mm},\\quad a=" + n(result.a) +
        "\\;\\text{mm},\\quad h_f=" + n(input.hf) + "\\;\\text{mm}",
      result: caseText,
    };
    const layerSteps = result.tensionLayers.map((layer, index): TBeamSolutionStep => ({
      label: "Tension layer " + (index + 1) + ": strain, stress and force",
      formula: "\\varepsilon_{s,i}=0.003(c-d_i)/c,\\quad f_{s,i}=\\max(-f_y,\\min(f_y,E_s\\varepsilon_{s,i}))",
      substitution: "d_i=" + n(layer.depth) + "\\;\\text{mm},\\quad A_{s,i}=" + n(layer.area) + "\\;\\text{mm}^2",
      result: "\\varepsilon_{s,i}=" + n(layer.strain, 5) + ",\\quad f_{s,i}=" +
        n(layer.stress) + "\\;\\text{MPa},\\quad F_{s,i}=" + n(layer.netForce / 1000) + "\\;\\text{kN}",
    }));
    steps.splice(neutralAxisIndex + 1, 0, ...layerSteps);
    const last = steps[steps.length - 1];
    last.formula = result.sectionCase === "flange"
      ? "M_n=-[C_c(a/2)+\\sum F_{s,i}d_i]/10^6"
      : "M_n=-[C_w(a/2)+C_f(h_f/2)+\\sum F_{s,i}d_i]/10^6";
  }
  return steps;
}
