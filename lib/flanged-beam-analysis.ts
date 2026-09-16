import { getBeta1, type TBeamCase } from "@/lib/t-beam";

const DEFAULT_ES = 200_000;
const EPSILON_CU = 0.003;
const EPSILON_TENSION_CONTROLLED = 0.005;

export type FlangedBeamShape = "T" | "L";
export interface FlangedBeamLayerInput { barCount: number; barDiameter: number; depth: number }
export interface TBeamDepthGeometry {
  h: number;
  clearCover: number;
  stirrupDiameter: number;
}
export interface TBeamOverallHeightInput extends TBeamDepthGeometry {
  bw: number;
  hf: number;
  tensionLayers: Array<Pick<FlangedBeamLayerInput, "barCount" | "barDiameter">>;
  compressionLayers?: Array<Pick<FlangedBeamLayerInput, "barCount" | "barDiameter">>;
}
export interface FlangedBeamLayerResult extends FlangedBeamLayerInput {
  area: number;
  strain: number;
  stress: number;
  yields: boolean;
  force: number;
  netForce: number;
  displacedFraction: number;
}

export interface FlangedBeamAnalysisInput {
  shape: FlangedBeamShape;
  bw: number;
  hf: number;
  d: number;
  flangeWidthMode?: "calculated" | "given";
  bf?: number;
  span?: number;
  clearSpacingLeft?: number;
  clearSpacingRight?: number;
  fc: number;
  fy: number;
  Es?: number;
  barCount: number;
  barDiameter: number;
  tensionLayers?: FlangedBeamLayerInput[];
  compressionLayers?: FlangedBeamLayerInput[];
  depthGeometry?: TBeamDepthGeometry;
  Mu: number | null;
}

export interface FlangedBeamAnalysisResult {
  status: "PASS" | "FAIL" | "CAPACITY ONLY";
  message: string;
  beta1: number;
  Es: number;
  beff: number;
  flangeWidthMode: "calculated" | "given";
  effectiveOverhang: number | null;
  leftOverhang: number | null;
  rightOverhang: number | null;
  widthLimits: number[];
  barArea: number;
  As: number;
  a: number;
  c: number;
  epsilonY: number;
  epsilonT: number;
  tensionStress: number;
  tensionSteelYields: boolean;
  tensionForce: number;
  concreteWebForce: number;
  concreteFlangeForce: number;
  sectionCase: TBeamCase;
  phi: number;
  Mn: number;
  phiMn: number;
  utilizationRatio: number | null;
  dExtreme: number;
  d: number;
  tensionLayers: FlangedBeamLayerResult[];
  compressionLayers: FlangedBeamLayerResult[];
  compressionSteelArea: number;
  compressionSteelForce: number;
  equilibriumResidual: number;
  strainLimitOk: boolean;
  flangeTrialA: number | null;
  webTrialA: number | null;
  yieldTrialAccepted: boolean;
}

export interface FlangedBeamAnalysisStep {
  label: string;
  formula: string;
  substitution?: string;
  result: string;
}

function compressionForce(a: number, beff: number, bw: number, hf: number, fc: number) {
  if (a <= hf) return 0.85 * fc * beff * a;
  return 0.85 * fc * (bw * a + (beff - bw) * hf);
}

function fractionInsideStressBlock(a: number, layer: FlangedBeamLayerInput): number {
  const radius = layer.barDiameter / 2;
  const t = (a - layer.depth) / radius;
  if (t <= -1) return 0;
  if (t >= 1) return 1;
  return (Math.acos(-t) + t * Math.sqrt(1 - t * t)) / Math.PI;
}

/** Derive bar centroids from the top face using 25 mm clear vertical spacing. */
export function deriveTBeamLayersFromOverallHeight(input: TBeamOverallHeightInput): {
  tensionLayers: FlangedBeamLayerInput[];
  compressionLayers: FlangedBeamLayerInput[];
} {
  const { h, bw, hf, clearCover, stirrupDiameter } = input;
  const all = [...input.tensionLayers, ...(input.compressionLayers ?? [])];
  if (![h, bw, hf, clearCover, stirrupDiameter].every((value) => Number.isFinite(value) && value > 0) ||
    h <= hf || !input.tensionLayers.length ||
    all.some((layer) => !Number.isInteger(layer.barCount) || layer.barCount <= 0 ||
      !Number.isFinite(layer.barDiameter) || layer.barDiameter <= 0)) {
    throw new Error("Enter a valid overall height, flange and web, cover, stirrup, and positive bar layers.");
  }
  const insideWeb = bw - 2 * (clearCover + stirrupDiameter);
  if (all.some((layer) => layer.barDiameter > insideWeb)) {
    throw new Error("Bar diameter and cover must fit inside the web width.");
  }
  let lowerEdge = h - clearCover - stirrupDiameter;
  const tensionLayers = input.tensionLayers.map((layer) => {
    const depth = lowerEdge - layer.barDiameter / 2;
    lowerEdge = depth - layer.barDiameter / 2 - 25;
    return { ...layer, depth };
  });
  let upperEdge = clearCover + stirrupDiameter;
  const compressionLayers = (input.compressionLayers ?? []).map((layer) => {
    const depth = upperEdge + layer.barDiameter / 2;
    upperEdge = depth + layer.barDiameter / 2 + 25;
    return { ...layer, depth };
  });
  if (tensionLayers.some((layer) => layer.depth - layer.barDiameter / 2 < hf) ||
    compressionLayers.some((layer) => layer.depth + layer.barDiameter / 2 >= h) ||
    (compressionLayers.length > 0 &&
      compressionLayers.at(-1)!.depth + compressionLayers.at(-1)!.barDiameter / 2 + 25 >
      tensionLayers.at(-1)!.depth - tensionLayers.at(-1)!.barDiameter / 2)) {
    throw new Error("The bar layers do not fit: tension bars must lie below the flange, and compression and tension rows need 25 mm clear vertical spacing.");
  }
  return { tensionLayers, compressionLayers };
}

function phiFromStrain(epsilonT: number, epsilonY: number) {
  if (epsilonT <= epsilonY) return 0.65;
  if (epsilonT >= EPSILON_TENSION_CONTROLLED) return 0.9;
  return 0.65 + 0.25 * ((epsilonT - epsilonY) / (EPSILON_TENSION_CONTROLLED - epsilonY));
}

export function analyzeFlangedBeam(input: FlangedBeamAnalysisInput): FlangedBeamAnalysisResult {
  const { shape, bw, hf, d, fc, fy, barCount, barDiameter, Mu } = input;
  const Es = input.Es ?? DEFAULT_ES;
  const flangeWidthMode = shape === "T" ? input.flangeWidthMode ?? "calculated" : "calculated";
  const values = [bw, hf, d, fc, fy, Es];
  if (
    values.some((value) => !Number.isFinite(value) || value <= 0) ||
    (!input.tensionLayers && hf >= d) ||
    (Mu !== null && (!Number.isFinite(Mu) || Mu <= 0))
  ) {
    throw new Error("Enter positive section and material values, use a whole number of bars, require hf < d, or leave Mu blank.");
  }
  if (fy / Es >= EPSILON_TENSION_CONTROLLED) {
    throw new Error("fy and Es must give a yield strain below 0.005 for this ACI 318-14 strength-factor interpolation.");
  }
  const tensionInput = input.tensionLayers ?? [{ barCount, barDiameter, depth: d }];
  const compressionInput = input.compressionLayers ?? [];
  if (!tensionInput.length || [ ...tensionInput, ...compressionInput ].some((layer) =>
    !Number.isInteger(layer.barCount) || layer.barCount <= 0 ||
    !Number.isFinite(layer.barDiameter) || layer.barDiameter <= 0 ||
    !Number.isFinite(layer.depth) || layer.depth <= 0
  ) || tensionInput.some((layer) => layer.depth <= hf) ||
    compressionInput.some((layer) => layer.depth >= Math.min(...tensionInput.map((tension) => tension.depth)))) {
    throw new Error("Provide positive bar layers: tension steel must be below the flange and compression steel above the tension steel.");
  }
  if (!input.tensionLayers && (!Number.isInteger(barCount) || barCount <= 0 || !Number.isFinite(barDiameter) || barDiameter <= 0)) {
    throw new Error("Enter a positive whole number of tension bars and a positive bar diameter.");
  }
  if (flangeWidthMode !== "calculated" && flangeWidthMode !== "given") {
    throw new Error("Select whether the T-beam flange width is given or calculated.");
  }
  if (flangeWidthMode === "given") {
    if (!Number.isFinite(input.bf) || input.bf! < bw) {
      throw new Error("Enter a given effective flange width bf that is at least bw.");
    }
  } else if (
    !Number.isFinite(input.span) || input.span! <= 0 ||
    !Number.isFinite(input.clearSpacingLeft) || input.clearSpacingLeft! <= 0
  ) {
    throw new Error("Enter a positive clear span ln and left-side clear spacing to calculate the flange width.");
  }
  if (shape === "T" && flangeWidthMode === "calculated" &&
    (!Number.isFinite(input.clearSpacingRight) || input.clearSpacingRight! <= 0)) {
    throw new Error("Enter a positive right-side clear spacing to the adjacent web for a T-beam.");
  }

  let beff: number;
  let widthLimits: number[];
  let effectiveOverhang: number | null;
  let leftOverhang: number | null = null;
  let rightOverhang: number | null = null;
  if (shape === "T") {
    if (flangeWidthMode === "given") {
      beff = input.bf!;
      widthLimits = [];
    } else {
      const spanLimit = input.span! / 8;
      const thicknessLimit = 8 * hf;
      const leftSpacingLimit = input.clearSpacingLeft! / 2;
      const rightSpacingLimit = input.clearSpacingRight! / 2;
      leftOverhang = Math.min(spanLimit, thicknessLimit, leftSpacingLimit);
      rightOverhang = Math.min(spanLimit, thicknessLimit, rightSpacingLimit);
      beff = bw + leftOverhang + rightOverhang;
      widthLimits = [spanLimit, thicknessLimit, leftSpacingLimit, rightSpacingLimit];
    }
    effectiveOverhang = null;
  } else {
    widthLimits = [input.span! / 12, 6 * hf, input.clearSpacingLeft! / 2];
    effectiveOverhang = Math.min(...widthLimits);
    beff = bw + effectiveOverhang;
  }
  if (beff < bw) throw new Error("The effective flange width must not be less than bw.");
  const beta1 = getBeta1(fc);
  const barArea = Math.PI * barDiameter ** 2 / 4;
  const layerArea = (layer: FlangedBeamLayerInput) => layer.barCount * Math.PI * layer.barDiameter ** 2 / 4;
  const As = tensionInput.reduce((sum, layer) => sum + layerArea(layer), 0);
  const effectiveDepth = tensionInput.reduce((sum, layer) => sum + layerArea(layer) * layer.depth, 0) / As;
  const compressionSteelArea = compressionInput.reduce((sum, layer) => sum + layerArea(layer), 0);
  const dExtreme = Math.max(...tensionInput.map((layer) => layer.depth));
  const epsilonY = fy / Es;
  // First test the rectangular/flange-only assumption with yielded tension steel.
  // If a exceeds hf, the overhang carries its full hf block and the web carries a.
  const flangeTrialA = shape === "T" ? As * fy / (0.85 * fc * beff) : null;
  const webTrialA = flangeTrialA !== null && flangeTrialA > hf
    ? (As * fy / (0.85 * fc) - (beff - bw) * hf) / bw
    : null;
  const yieldTrialA = webTrialA ?? flangeTrialA;
  const trialC = yieldTrialA === null ? null : yieldTrialA / beta1;
  const yieldTrialAccepted = shape === "T" && trialC !== null && trialC > 0 && trialC < dExtreme &&
    compressionInput.length === 0 && tensionInput.every((layer) =>
      EPSILON_CU * (layer.depth - trialC) / trialC >= epsilonY &&
      fractionInsideStressBlock(yieldTrialA!, layer) === 0);

  function equilibrium(c: number) {
    const a = beta1 * c;
    const steel = [...tensionInput, ...compressionInput].reduce((sum, layer) => {
      const stress = Math.max(-fy, Math.min(fy, Es * EPSILON_CU * (c - layer.depth) / c));
      // Subtract only the concrete area occupied by the round bar inside the block.
      return sum + layerArea(layer) * (stress - 0.85 * fc * fractionInsideStressBlock(a, layer));
    }, 0);
    return compressionForce(a, beff, bw, hf, fc) + steel;
  }

  let c: number;
  if (yieldTrialAccepted) {
    // Exact closed-form solution for the verified singly reinforced yield case.
    c = trialC!;
  } else {
    // Elastic steel, compression layers, or steel within the block require
    // compatible per-layer stresses and a re-solved concrete/steel equilibrium.
    let low = dExtreme * 1e-9;
    let high = dExtreme * (1 - 1e-9);
    if (equilibrium(low) >= 0 || equilibrium(high) <= 0) throw new Error("The selected layers do not produce a valid flexural force equilibrium.");
    for (let iteration = 0; iteration < 160; iteration += 1) {
      const trial = (low + high) / 2;
      if (equilibrium(trial) > 0) high = trial;
      else low = trial;
    }
    c = (low + high) / 2;
  }
  const a = beta1 * c;
  const solveLayer = (layer: FlangedBeamLayerInput): FlangedBeamLayerResult => {
    const area = layerArea(layer);
    const strain = EPSILON_CU * (c - layer.depth) / c;
    const stress = Math.max(-fy, Math.min(fy, Es * strain));
    const displacedFraction = fractionInsideStressBlock(a, layer);
    return { ...layer, area, strain, stress, yields: Math.abs(Es * strain) >= fy,
      force: area * stress, netForce: area * (stress - 0.85 * fc * displacedFraction), displacedFraction };
  };
  const tensionLayers = tensionInput.map(solveLayer);
  const compressionLayers = compressionInput.map(solveLayer);
  const extremeLayer = tensionLayers.find((layer) => layer.depth === dExtreme)!;
  const epsilonT = -extremeLayer.strain;
  const tensionStress = -extremeLayer.stress;
  const tensionForce = -tensionLayers.reduce((sum, layer) => sum + layer.netForce, 0);
  const sectionCase: TBeamCase = a <= hf ? "flange" : "web";
  const concreteWebForce = sectionCase === "flange"
    ? 0.85 * fc * beff * a
    : 0.85 * fc * bw * a;
  const concreteFlangeForce = sectionCase === "flange"
    ? 0
    : 0.85 * fc * (beff - bw) * hf;
  const compressionSteelForce = compressionLayers.reduce((sum, layer) => sum + layer.netForce, 0);
  const concreteMoment = concreteWebForce * a / 2 + concreteFlangeForce * hf / 2;
  const steelMoment = [...tensionLayers, ...compressionLayers].reduce((sum, layer) => sum + layer.netForce * layer.depth, 0);
  const Mn = -(concreteMoment + steelMoment) / 1_000_000;
  const phi = phiFromStrain(epsilonT, epsilonY);
  const phiMn = phi * Mn;
  const strainLimitOk = epsilonT >= 0.004 - 1e-12;
  const utilizationRatio = Mu === null ? null : Mu / phiMn;
  const status = Mu === null ? "CAPACITY ONLY" : phiMn >= Mu && strainLimitOk ? "PASS" : "FAIL";
  const message = Mu === null
    ? strainLimitOk ? "The design flexural capacity has been calculated. Enter Mu to perform a demand-capacity check."
      : "Flexural capacity is calculated, but the extreme tension strain is below the ACI 318-14 beam minimum of 0.004."
    : !strainLimitOk
      ? "The extreme tension strain is below the ACI 318-14 beam minimum of 0.004; the section is not adequate."
    : phiMn >= Mu
      ? "The provided section and reinforcement satisfy phi Mn >= Mu."
      : "The provided section and reinforcement do not satisfy phi Mn >= Mu.";

  return {
    status,
    message,
    beta1,
    Es,
    beff,
    flangeWidthMode,
    effectiveOverhang,
    leftOverhang,
    rightOverhang,
    widthLimits,
    barArea,
    As,
    a,
    c,
    epsilonY,
    epsilonT,
    tensionStress,
    tensionSteelYields: extremeLayer.yields,
    tensionForce,
    concreteWebForce,
    concreteFlangeForce,
    sectionCase,
    phi,
    Mn,
    phiMn,
    utilizationRatio,
    dExtreme,
    d: effectiveDepth,
    tensionLayers,
    compressionLayers,
    compressionSteelArea,
    compressionSteelForce,
    equilibriumResidual: equilibrium(c),
    strainLimitOk,
    flangeTrialA,
    webTrialA,
    yieldTrialAccepted,
  };
}

function n(value: number, digits = 2) {
  return value.toFixed(digits);
}

export function getFlangedBeamAnalysisSteps(
  input: FlangedBeamAnalysisInput,
  result: FlangedBeamAnalysisResult
): FlangedBeamAnalysisStep[] {
  if (input.shape === "T") return getLayeredTBeamSteps(input, result);
  return getLBeamAnalysisSteps(input, result);
}

function getLBeamAnalysisSteps(
  input: FlangedBeamAnalysisInput,
  result: FlangedBeamAnalysisResult
): FlangedBeamAnalysisStep[] {
  const widthStep: FlangedBeamAnalysisStep = {
    label: "Effective one-sided flange width",
    formula: "b_o=\\min(6h_f,\\ s_w/2,\\ \\ell_n/12),\\quad b_f=b_w+b_o",
    substitution: `s_w=${n(input.clearSpacingLeft!)}\\;\\mathrm{mm},\\quad b_o=\\min(${n(6 * input.hf)},\\ ${n(input.clearSpacingLeft! / 2)},\\ ${n(input.span! / 12)})`,
    result: `b_o=${n(result.effectiveOverhang ?? 0)}\\;\\mathrm{mm},\\quad b_f=${n(input.bw)}+${n(result.effectiveOverhang ?? 0)}=${n(result.beff)}\\;\\mathrm{mm}`,
  };
  const equilibrium = result.sectionCase === "flange"
    ? "C_c=0.85f'_c b_fa"
    : "C_c=0.85f'_c\\left[b_wa+(b_f-b_w)h_f\\right]";
  const moment = result.sectionCase === "flange"
    ? "M_n=C_c\\left(d-\\dfrac{a}{2}\\right)"
    : "M_n=C_w\\left(d-\\dfrac{a}{2}\\right)+C_f\\left(d-\\dfrac{h_f}{2}\\right)";

  const steps: FlangedBeamAnalysisStep[] = [
    widthStep,
    {
      label: "Provided tension reinforcement",
      formula: "A_b=\\dfrac{\\pi d_b^2}{4},\\qquad A_s=n_bA_b",
      substitution: `A_b=\\dfrac{\\pi(${n(input.barDiameter)})^2}{4}=${n(result.barArea)}\\;\\text{mm}^2,\\qquad A_s=${input.barCount}(${n(result.barArea)})`,
      result: `A_s=${n(result.As)}\\;\\text{mm}^2`,
    },
    {
      label: "Whitney stress-block factor",
      formula: "\\beta_1=\\max\\left[0.65,\\ 0.85-0.05\\left(\\dfrac{f'_c-28}{7}\\right)\\right]",
      substitution: `f'_c=${n(input.fc)}\\;\\text{MPa}`,
      result: `\\beta_1=${n(result.beta1, 3)}`,
    },
    {
      label: "Strain compatibility and steel stress",
      formula: "a=\\beta_1c,\\qquad \\varepsilon_t=0.003\\left(\\dfrac{d-c}{c}\\right),\\qquad f_s=\\min(E_s\\varepsilon_t,f_y)",
      substitution: `\\varepsilon_t=0.003\\left(\\dfrac{${n(input.d)}-${n(result.c)}}{${n(result.c)}}\\right),\\qquad f_s=\\min[${n(result.Es, 0)}(${n(result.epsilonT, 6)}),${n(input.fy)}]`,
      result: `c=${n(result.c)}\\;\\text{mm},\\quad a=${n(result.a)}\\;\\text{mm},\\quad \\varepsilon_t=${n(result.epsilonT, 6)},\\quad f_s=${n(result.tensionStress)}\\;\\text{MPa}`,
    },
    {
      label: "Internal-force equilibrium",
      formula: `${equilibrium},\\qquad T=A_sf_s,\\qquad C_c=T`,
      substitution: `T=(${n(result.As)})(${n(result.tensionStress)})=${n(result.tensionForce / 1000)}\\;\\text{kN}`,
      result: `C_c=${n((result.concreteWebForce + result.concreteFlangeForce) / 1000)}\\;\\text{kN}=T,\\qquad ${result.sectionCase === "flange" ? "a\\le h_f" : "a>h_f"}`,
    },
    {
      label: "Nominal moment strength",
      formula: moment,
      substitution: result.sectionCase === "flange"
        ? `M_n=(${n(result.concreteWebForce / 1000)})\\left(${n(input.d)}-\\dfrac{${n(result.a)}}{2}\\right)\\dfrac{1}{1000}`
        : `C_w=${n(result.concreteWebForce / 1000)}\\;\\text{kN},\\qquad C_f=${n(result.concreteFlangeForce / 1000)}\\;\\text{kN}`,
      result: `M_n=${n(result.Mn)}\\;\\text{kN}\\cdot\\text{m}`,
    },
    {
      label: "Strength-reduction factor",
      formula: "\\varepsilon_y=\\dfrac{f_y}{E_s},\\qquad \\phi=\\begin{cases}0.65&\\varepsilon_t\\le\\varepsilon_y\\\\0.65+0.25\\dfrac{\\varepsilon_t-\\varepsilon_y}{0.005-\\varepsilon_y}&\\varepsilon_y<\\varepsilon_t<0.005\\\\0.90&\\varepsilon_t\\ge0.005\\end{cases}",
      substitution: `\\varepsilon_y=\\dfrac{${n(input.fy)}}{${n(result.Es, 0)}}=${n(result.epsilonY, 6)},\\qquad \\varepsilon_t=${n(result.epsilonT, 6)}`,
      result: `\\phi=${n(result.phi, 3)},\\qquad \\phi M_n=${n(result.phiMn)}\\;\\text{kN}\\cdot\\text{m}`,
    },
  ];

  steps.push({
    label: "Minimum tensile strain for a nonprestressed beam",
    formula: "\\varepsilon_t\\ge0.004",
    substitution: "\\varepsilon_t=" + n(result.epsilonT, 6) + "\\quad\\mathrm{versus}\\quad0.004",
    result: result.strainLimitOk ? "\\mathrm{PASS}" : "\\mathrm{FAIL:\\ section\\ is\\ too\\ brittle}",
  });
  if (input.Mu !== null) {
    steps.push({
      label: "Demand-capacity check",
      formula: "\\phi M_n\\ge M_u",
      substitution: `${n(result.phiMn)}\\;\\text{kN}\\cdot\\text{m}\\;${result.phiMn >= input.Mu ? "\\ge" : "<"}\\;${n(input.Mu)}\\;\\text{kN}\\cdot\\text{m}`,
      result: `\\dfrac{M_u}{\\phi M_n}=${n(result.utilizationRatio ?? 0, 3)}\\quad\\therefore\\quad\\text{${result.status}}`,
    });
  }
  return steps;
}

function getLayeredTBeamSteps(input: FlangedBeamAnalysisInput, r: FlangedBeamAnalysisResult): FlangedBeamAnalysisStep[] {
  const f = (value: number, digits = 2) => value.toFixed(digits);
  const width: FlangedBeamAnalysisStep[] = r.flangeWidthMode === "given"
    ? [{ label: "Given effective flange width", formula: "b_f=b_{f,\\mathrm{given}}",
      substitution: `b_f=${f(input.bf!)}\\;\\mathrm{mm}`, result: `b_f=${f(r.beff)}\\;\\mathrm{mm}` }]
    : [
      { label: "Left-side effective overhang",
        formula: "b_{o,L}=\\min(8h_f,\\ s_{w,L}/2,\\ \\ell_n/8)",
        substitution: `s_{w,L}=${f(input.clearSpacingLeft!)}\\;\\mathrm{mm},\\quad b_{o,L}=\\min(${f(8 * input.hf)},\\ ${f(input.clearSpacingLeft! / 2)},\\ ${f(input.span! / 8)})`,
        result: `b_{o,L}=${f(r.leftOverhang!)}\\;\\mathrm{mm}` },
      { label: "Right-side effective overhang",
        formula: "b_{o,R}=\\min(8h_f,\\ s_{w,R}/2,\\ \\ell_n/8)",
        substitution: `s_{w,R}=${f(input.clearSpacingRight!)}\\;\\mathrm{mm},\\quad b_{o,R}=\\min(${f(8 * input.hf)},\\ ${f(input.clearSpacingRight! / 2)},\\ ${f(input.span! / 8)})`,
        result: `b_{o,R}=${f(r.rightOverhang!)}\\;\\mathrm{mm}` },
      { label: "Total effective flange width",
        formula: "b_f=b_w+b_{o,L}+b_{o,R}",
        substitution: `b_f=${f(input.bw)}+${f(r.leftOverhang!)}+${f(r.rightOverhang!)}`,
        result: `b_f=${f(r.beff)}\\;\\mathrm{mm}` },
    ];
  const layers = [...r.tensionLayers.map((layer, index) => ({ ...layer, symbol: `s${index + 1}` })),
    ...r.compressionLayers.map((layer, index) => ({ ...layer, symbol: `s'${index + 1}` }))];
  const layerSteps = layers.flatMap((layer) => [{
    label: `Layer ${layer.symbol}: steel area and depth`,
    formula: `A_{${layer.symbol}}=n_{${layer.symbol}}\\pi d_{b,${layer.symbol}}^2/4`,
    substitution: `A_{${layer.symbol}}=${layer.barCount}\\pi(${f(layer.barDiameter)})^2/4,\\quad d_{${layer.symbol}}=${f(layer.depth)}\\;\\mathrm{mm}`,
    result: `A_{${layer.symbol}}=${f(layer.area)}\\;\\mathrm{mm}^2`,
  }, {
    label: `Layer ${layer.symbol}: strain, stress and force`,
    formula: `\\varepsilon_{${layer.symbol}}=0.003(c-d_{${layer.symbol}})/c,\\quad f_{${layer.symbol}}=\\operatorname{clip}(E_s\\varepsilon_{${layer.symbol}},-f_y,f_y)`,
    substitution: `\\varepsilon_{${layer.symbol}}=0.003(${f(r.c)}-${f(layer.depth)})/${f(r.c)}=${f(layer.strain, 6)},\\quad f_{${layer.symbol}}=${f(layer.stress)}\\;\\mathrm{MPa}`,
    result: `F_{${layer.symbol}}=${f(layer.force / 1000)}\\;\\mathrm{kN},\\quad F_{${layer.symbol},\\mathrm{net}}=${f(layer.netForce / 1000)}\\;\\mathrm{kN}\\quad(${layer.yields ? "\\mathrm{yielded}" : "\\mathrm{elastic}"})`,
  }]);
  const assumedA = r.flangeTrialA!;
  const selectedTrialA = r.webTrialA ?? assumedA;
  const selectedTrialC = selectedTrialA / r.beta1;
  const trialStrains = r.tensionLayers.map((layer) => 0.003 * (layer.depth - selectedTrialC) / selectedTrialC);
  const trialReasons: string[] = [];
  if (trialStrains.some((strain) => strain < r.epsilonY)) trialReasons.push("one or more tension layers remain elastic");
  if (r.compressionLayers.length) trialReasons.push("compression steel changes equilibrium");
  if (r.tensionLayers.some((layer) => layer.depth - layer.barDiameter / 2 < selectedTrialA))
    trialReasons.push("a steel layer intersects the concrete block");
  if (selectedTrialC <= 0 || selectedTrialC >= r.dExtreme) trialReasons.push("the trial neutral axis is outside the tension region");
  const trialSteps: FlangedBeamAnalysisStep[] = [
    {
      label: "Assume flange-only compression and yielded tension steel",
      formula: "T_y=A_sf_y,\\quad C_f=0.85f'_cb_fa_f,\\quad a_f=A_sf_y/(0.85f'_cb_f)",
      substitution: "a_f=(" + f(r.As) + ")(" + f(input.fy) + ")/[0.85(" + f(input.fc) + ")(" + f(r.beff) + ")]",
      result: "a_f=" + f(assumedA) + "\\;\\mathrm{mm}",
    },
    {
      label: "Check flange-only trial",
      formula: "a_f\\le h_f\\Rightarrow\\mathrm{flange\\ block};\\quad a_f>h_f\\Rightarrow\\mathrm{flange+web\\ block}",
      substitution: "a_f=" + f(assumedA) + "\\;\\mathrm{mm},\\quad h_f=" + f(input.hf) + "\\;\\mathrm{mm}",
      result: r.webTrialA === null ? "\\text{Preliminary flange geometry passes; check steel before accepting.}" :
        "\\text{Invalid: flange-only assumption fails; re-solve using flange and web.}",
    },
  ];
  if (r.webTrialA !== null) trialSteps.push({
    label: "Re-solve a for flange-plus-web compression",
    formula: "A_sf_y=0.85f'_c[b_wa_w+(b_f-b_w)h_f],\\quad a_w=\\dfrac{A_sf_y/(0.85f'_c)-(b_f-b_w)h_f}{b_w}",
    substitution: "a_w=\\dfrac{(" + f(r.As) + ")(" + f(input.fy) + ")/[0.85(" + f(input.fc) + ")]-(" +
      f(r.beff) + "-" + f(input.bw) + ")(" + f(input.hf) + ")}{" + f(input.bw) + "}",
    result: "a_{w,\\mathrm{trial}}=" + f(r.webTrialA) + "\\;\\mathrm{mm}>h_f=" + f(input.hf) +
      "\\;\\mathrm{mm},\\quad c_{\\mathrm{trial}}=" + f(selectedTrialC) + "\\;\\mathrm{mm}",
  });
  trialSteps.push({
    label: "Check steel-yield and layer assumptions at the selected trial",
    formula: "\\varepsilon_{si,\\mathrm{trial}}=0.003(d_i-c_{\\mathrm{trial}})/c_{\\mathrm{trial}},\\quad\\varepsilon_y=f_y/E_s",
    substitution: "c_{\\mathrm{trial}}=" + f(selectedTrialC) + "\\;\\mathrm{mm},\\quad\\varepsilon_y=" +
      f(r.epsilonY, 6) + ",\\quad" +
      trialStrains.map((strain, index) => "\\varepsilon_{s" + (index + 1) + ",\\mathrm{trial}}=" + f(strain, 6)).join(",\\quad"),
    result: r.yieldTrialAccepted ? "\\text{Valid: all tension layers yield and no steel is inside the block.}" :
      "\\text{Trial not final: " + trialReasons.join("; ") + ". Re-solve by strain compatibility.}",
  });
  if (!r.yieldTrialAccepted) trialSteps.push({
    label: "Re-solve equilibrium with actual steel stresses",
    formula: "a=\\beta_1c,\\quad C_c(a)+\\sum A_{si}[f_{si}(c)-0.85f'_c\\eta_i(a)]=0,\\quad f_{si}=\\operatorname{clip}(E_s\\varepsilon_{si},-f_y,f_y)",
    substitution: "c=" + f(r.c) + "\\;\\mathrm{mm},\\quad a=" + f(r.a) +
      "\\;\\mathrm{mm},\\quad C_c=" + f((r.concreteWebForce + r.concreteFlangeForce) / 1000) + "\\;\\mathrm{kN}",
    result: "\\text{Final block: " + (r.sectionCase === "web" ? "flange and web" : "flange only") +
      "; force residual = " + f(r.equilibriumResidual / 1000, 6) + " kN.}",
  });
  const concreteFormula = r.sectionCase === "flange"
    ? "C_c=0.85f'_c b_f a"
    : "C_c=0.85f'_c[b_wa+(b_f-b_w)h_f]";
  const steps: FlangedBeamAnalysisStep[] = [
    ...width,
    ...(input.depthGeometry ? [{
      label: "Bar-layer depths from overall height",
      formula: "d_1=h-c_c-d_{st}-d_{b1}/2,\\quad d_{i+1}=d_i-(d_{bi}+d_{b,i+1})/2-25;\\quad d'_1=c_c+d_{st}+d'_{b1}/2,\\quad d'_{j+1}=d'_j+(d'_{bj}+d'_{b,j+1})/2+25",
      substitution: "h=" + f(input.depthGeometry.h) + "\\;\\mathrm{mm},\\quad c_c=" +
        f(input.depthGeometry.clearCover) + "\\;\\mathrm{mm},\\quad d_{st}=" +
        f(input.depthGeometry.stirrupDiameter) + "\\;\\mathrm{mm}",
      result: r.tensionLayers.map((layer, index) => "d_{" + (index + 1) + "}=" + f(layer.depth) + "\\;\\mathrm{mm}").concat(
        r.compressionLayers.map((layer, index) => "d'_{" + (index + 1) + "}=" + f(layer.depth) + "\\;\\mathrm{mm}")
      ).join(",\\quad "),
    }] : []),
    { label: "Whitney stress-block factor",
      formula: "\\beta_1=\\max[0.65,\\ 0.85-0.05(f'_c-28)/7]\\quad(f'_c>28\\;\\mathrm{MPa});\\quad\\beta_1=0.85\\quad(f'_c\\le28\\;\\mathrm{MPa})",
      substitution: "f'_c=" + f(input.fc) + "\\;\\mathrm{MPa}",
      result: "\\beta_1=" + f(r.beta1, 3) },
    { label: "Given geometry and material behavior", formula: "b_w,\\ h_f,\\ d_i,\\ f'_c,\\ f_y,\\ E_s,\\ \\varepsilon_{cu}=0.003",
      substitution: `b_w=${f(input.bw)}\\;\\mathrm{mm},\\ h_f=${f(input.hf)}\\;\\mathrm{mm},\\ f'_c=${f(input.fc)}\\;\\mathrm{MPa},\\ f_y=${f(input.fy)}\\;\\mathrm{MPa},\\ E_s=${f(r.Es, 0)}\\;\\mathrm{MPa}`,
      result: `\\varepsilon_y=f_y/E_s=${f(r.epsilonY, 6)}` },
    ...layerSteps.filter((_, index) => index % 2 === 0),
    { label: "Combined effective depth of the tension layers",
      formula: "d=\\sum A_{si}d_i/\\sum A_{si}",
      substitution: "d=(" + r.tensionLayers.map((layer) => f(layer.area) + "(" + f(layer.depth) + ")").join("+") + ")/" + f(r.As),
      result: "d=" + f(r.d) + "\\;\\mathrm{mm}" },
    ...trialSteps,
    { label: "Determine stress-block region and solve force equilibrium", formula: `${concreteFormula},\\quad C_c+\\sum F_{si,\\mathrm{net}}=0,\\quad F_{si,\\mathrm{net}}=A_{si}(f_{si}-0.85f'_c\\eta_i)`,
      substitution: `a=\\beta_1c=${f(r.beta1, 3)}(${f(r.c)})=${f(r.a)}\\;\\mathrm{mm},\\quad h_f=${f(input.hf)}\\;\\mathrm{mm},\\quad ${r.sectionCase === "flange" ? "a\\le h_f" : "a>h_f"}`,
      result: `c=${f(r.c)}\\;\\mathrm{mm},\\quad C_c=${f((r.concreteWebForce + r.concreteFlangeForce) / 1000)}\\;\\mathrm{kN};\\quad \\mathrm{residual}=${f(r.equilibriumResidual / 1000, 6)}\\;\\mathrm{kN}` },
    ...layers.map((layer) => ({
      label: "Concrete displaced by layer " + layer.symbol,
      formula: layer.displacedFraction > 0 && layer.displacedFraction < 1
        ? "t_i=(a-d_i)/(d_{bi}/2),\\quad\\eta_i=[\\arccos(-t_i)+t_i\\sqrt{1-t_i^2}]/\\pi"
        : "\\eta_i=1\\ (a\\ge d_i+d_{bi}/2),\\quad\\eta_i=0\\ (a\\le d_i-d_{bi}/2)",
      substitution: "a=" + f(r.a) + "\\;\\mathrm{mm},\\quad d_{" + layer.symbol + "}=" + f(layer.depth) + "\\;\\mathrm{mm},\\quad d_{b," + layer.symbol + "}=" + f(layer.barDiameter) + "\\;\\mathrm{mm},\\quad\\eta_{" + layer.symbol + "}=" + f(layer.displacedFraction, 4),
      result: "F_{" + layer.symbol + ",\\mathrm{net}}=" + f(layer.netForce / 1000) + "\\;\\mathrm{kN}",
    })),
    ...layerSteps.filter((_, index) => index % 2 === 1),
    { label: "Steel yield checks and governing tensile strain", formula: "|\\varepsilon_{si}|\\ge\\varepsilon_y\\Rightarrow\\mathrm{yield};\\quad\\varepsilon_t=0.003(d_{\\mathrm{extreme}}-c)/c",
      substitution: `d_{\\mathrm{extreme}}=${f(r.dExtreme)}\\;\\mathrm{mm},\\quad c=${f(r.c)}\\;\\mathrm{mm},\\quad\\varepsilon_y=${f(r.epsilonY, 6)}`,
      result: `\\varepsilon_t=${f(r.epsilonT, 6)},\\quad \\mathrm{extreme\\ tension\\ steel\\ ${r.tensionSteelYields ? "yields" : "is\\ elastic"}}` },
    { label: "Concrete compression resultants and centroids", formula: r.sectionCase === "flange"
      ? "C_c=0.85f'_cb_fa,\\quad y_c=a/2"
      : "C_w=0.85f'_cb_wa,\\quad C_f=0.85f'_c(b_f-b_w)h_f,\\quad y_w=a/2,\\ y_f=h_f/2",
      substitution: `C_w=${f(r.concreteWebForce / 1000)}\\;\\mathrm{kN},\\quad C_f=${f(r.concreteFlangeForce / 1000)}\\;\\mathrm{kN}`,
      result: `y_w=${f(r.a / 2)}\\;\\mathrm{mm}${r.sectionCase === "web" ? `,\\quad y_f=${f(input.hf / 2)}\\;\\mathrm{mm}` : ""}` },
    ...(r.yieldTrialAccepted ? [{
      label: r.sectionCase === "web" ? "Flange and web moment components" : "Flange-only moment component",
      formula: r.sectionCase === "web"
        ? "M_n=C_w(d-a/2)+C_f(d-h_f/2)"
        : "M_n=C_c(d-a/2)",
      substitution: r.sectionCase === "web"
        ? "M_n=[(" + f(r.concreteWebForce / 1000) + ")(" + f(r.d) + "-" + f(r.a) +
          "/2)+(" + f(r.concreteFlangeForce / 1000) + ")(" + f(r.d) + "-" + f(input.hf) + "/2)]/1000"
        : "M_n=[(" + f(r.concreteWebForce / 1000) + ")(" + f(r.d) + "-" + f(r.a) + "/2)]/1000",
      result: "M_n=" + f(r.Mn) + "\\;\\mathrm{kN}\\cdot\\mathrm{m}",
    }] : []),
    { label: "Nominal moment from every force about the top face", formula: "M_n=-[C_w(a/2)+C_f(h_f/2)+\\sum F_{si,\\mathrm{net}}d_i]/10^6",
      substitution: `M_n=-[(${f(r.concreteWebForce)})(${f(r.a / 2)})+(${f(r.concreteFlangeForce)})(${f(input.hf / 2)})+${layers.map((layer) => `(${f(layer.netForce)})(${f(layer.depth)})`).join("+")}]/10^6`,
      result: `M_n=${f(r.Mn)}\\;\\mathrm{kN}\\cdot\\mathrm{m}` },
    { label: "Strength reduction factor and design capacity", formula: "\\phi=\\begin{cases}0.65&\\varepsilon_t\\le\\varepsilon_y\\\\0.65+0.25(\\varepsilon_t-\\varepsilon_y)/(0.005-\\varepsilon_y)&\\varepsilon_y<\\varepsilon_t<0.005\\\\0.90&\\varepsilon_t\\ge0.005\\end{cases}",
      substitution: `\\varepsilon_t=${f(r.epsilonT, 6)},\\quad \\varepsilon_y=${f(r.epsilonY, 6)},\\quad \\phi=${f(r.phi, 3)}`,
      result: `\\phi M_n=${f(r.phi, 3)}(${f(r.Mn)})=${f(r.phiMn)}\\;\\mathrm{kN}\\cdot\\mathrm{m}` },
  ];
  steps.push({
    label: "Minimum tensile strain for a nonprestressed beam",
    formula: "\\varepsilon_t\\ge0.004",
    substitution: "\\varepsilon_t=" + f(r.epsilonT, 6) + "\\quad\\mathrm{versus}\\quad0.004",
    result: r.strainLimitOk ? "\\mathrm{PASS}" : "\\mathrm{FAIL:\\ section\\ is\\ too\\ brittle}",
  });
  if (input.Mu !== null) steps.push({ label: "Demand-capacity check", formula: "\\phi M_n\\ge M_u",
    substitution: `${f(r.phiMn)}\\;\\mathrm{kN}\\cdot\\mathrm{m}\\quad ${r.phiMn >= input.Mu ? "\\ge" : "<"}\\quad ${f(input.Mu)}\\;\\mathrm{kN}\\cdot\\mathrm{m}`,
    result: `M_u/(\\phi M_n)=${f(r.utilizationRatio ?? 0, 3)},\\quad\\mathrm{${r.status}}` });
  return steps;
}
