import { getLEffectiveFlangeWidth } from "@/lib/l-beam";
import { getBeta1, getEffectiveFlangeWidth, type TBeamCase } from "@/lib/t-beam";

const ES = 200_000;
const EPSILON_CU = 0.003;
const EPSILON_TENSION_CONTROLLED = 0.005;

export type FlangedBeamShape = "T" | "L";

export interface FlangedBeamAnalysisInput {
  shape: FlangedBeamShape;
  bw: number;
  hf: number;
  d: number;
  span: number;
  beamSpacing: number;
  fc: number;
  fy: number;
  barCount: number;
  barDiameter: number;
  Mu: number | null;
}

export interface FlangedBeamAnalysisResult {
  status: "PASS" | "FAIL" | "CAPACITY ONLY";
  message: string;
  beta1: number;
  beff: number;
  effectiveOverhang: number | null;
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

function phiFromStrain(epsilonT: number, epsilonY: number) {
  if (epsilonT <= epsilonY) return 0.65;
  if (epsilonT >= EPSILON_TENSION_CONTROLLED) return 0.9;
  return 0.65 + 0.25 * ((epsilonT - epsilonY) / (EPSILON_TENSION_CONTROLLED - epsilonY));
}

export function analyzeFlangedBeam(input: FlangedBeamAnalysisInput): FlangedBeamAnalysisResult {
  const { shape, bw, hf, d, span, beamSpacing, fc, fy, barCount, barDiameter, Mu } = input;
  const values = [bw, hf, d, span, beamSpacing, fc, fy, barCount, barDiameter];
  if (
    values.some((value) => !Number.isFinite(value) || value <= 0) ||
    !Number.isInteger(barCount) ||
    hf >= d ||
    beamSpacing <= bw ||
    (Mu !== null && (!Number.isFinite(Mu) || Mu <= 0))
  ) {
    throw new Error("Enter positive values, use a whole number of bars, require hf < d and beam spacing > bw, or leave Mu blank.");
  }

  let beff: number;
  let widthLimits: number[];
  let effectiveOverhang: number | null;
  if (shape === "T") {
    const flange = getEffectiveFlangeWidth(span, bw, hf, beamSpacing);
    beff = flange.beff;
    widthLimits = [flange.beffLimitSpan, flange.beffLimitFlange, flange.beffLimitSpacing];
    effectiveOverhang = null;
  } else {
    const flange = getLEffectiveFlangeWidth(span, bw, hf, beamSpacing);
    beff = flange.beff;
    widthLimits = [flange.overhangLimitSpan, flange.overhangLimitThickness, flange.overhangLimitSpacing];
    effectiveOverhang = flange.effectiveOverhang;
  }
  if (beff < bw) throw new Error("The effective flange width must not be less than bw.");
  const beta1 = getBeta1(fc);
  const barArea = Math.PI * barDiameter ** 2 / 4;
  const As = barCount * barArea;
  const epsilonY = fy / ES;

  function equilibrium(c: number) {
    const epsilonT = EPSILON_CU * (d - c) / c;
    const tensionStress = Math.min(fy, ES * Math.max(0, epsilonT));
    return compressionForce(beta1 * c, beff, bw, hf, fc) - As * tensionStress;
  }

  let low = d * 1e-9;
  let high = d * (1 - 1e-9);
  for (let iteration = 0; iteration < 160; iteration += 1) {
    const trial = (low + high) / 2;
    if (equilibrium(trial) > 0) high = trial;
    else low = trial;
  }

  const c = (low + high) / 2;
  const a = beta1 * c;
  const epsilonT = EPSILON_CU * (d - c) / c;
  const tensionStress = Math.min(fy, ES * epsilonT);
  const tensionForce = As * tensionStress;
  const sectionCase: TBeamCase = a <= hf ? "flange" : "web";
  const concreteWebForce = sectionCase === "flange"
    ? 0.85 * fc * beff * a
    : 0.85 * fc * bw * a;
  const concreteFlangeForce = sectionCase === "flange"
    ? 0
    : 0.85 * fc * (beff - bw) * hf;
  const Mn = (
    concreteWebForce * (d - a / 2) +
    concreteFlangeForce * (d - hf / 2)
  ) / 1_000_000;
  const phi = phiFromStrain(epsilonT, epsilonY);
  const phiMn = phi * Mn;
  const utilizationRatio = Mu === null ? null : Mu / phiMn;
  const status = Mu === null ? "CAPACITY ONLY" : phiMn >= Mu ? "PASS" : "FAIL";
  const message = Mu === null
    ? "The design flexural capacity has been calculated. Enter Mu to perform a demand-capacity check."
    : phiMn >= Mu
      ? "The provided section and reinforcement satisfy phi Mn >= Mu."
      : "The provided section and reinforcement do not satisfy phi Mn >= Mu.";

  return {
    status,
    message,
    beta1,
    beff,
    effectiveOverhang,
    widthLimits,
    barArea,
    As,
    a,
    c,
    epsilonY,
    epsilonT,
    tensionStress,
    tensionSteelYields: tensionStress >= fy - 1e-8,
    tensionForce,
    concreteWebForce,
    concreteFlangeForce,
    sectionCase,
    phi,
    Mn,
    phiMn,
    utilizationRatio,
  };
}

function n(value: number, digits = 2) {
  return value.toFixed(digits);
}

export function getFlangedBeamAnalysisSteps(
  input: FlangedBeamAnalysisInput,
  result: FlangedBeamAnalysisResult
): FlangedBeamAnalysisStep[] {
  const widthStep: FlangedBeamAnalysisStep = input.shape === "T"
    ? {
        label: "Effective flange width",
        formula: "b_f=\\min\\left(\\dfrac{L}{4},\\ b_w+16h_f,\\ s\\right)",
        substitution: `b_f=\\min\\left(\\dfrac{${n(input.span)}}{4},\\ ${n(input.bw)}+16(${n(input.hf)}),\\ ${n(input.beamSpacing)}\\right)`,
        result: `b_f=${n(result.beff)}\\;\\text{mm}`,
      }
    : {
        label: "Effective one-sided flange width",
        formula: "b_o=\\min\\left(\\dfrac{L}{12},\\ 6h_f,\\ \\dfrac{s-b_w}{2}\\right),\\qquad b_f=b_w+b_o",
        substitution: `b_o=\\min\\left(\\dfrac{${n(input.span)}}{12},\\ 6(${n(input.hf)}),\\ \\dfrac{${n(input.beamSpacing)}-${n(input.bw)}}{2}\\right)`,
        result: `b_o=${n(result.effectiveOverhang ?? 0)}\\;\\text{mm},\\qquad b_f=${n(result.beff)}\\;\\text{mm}`,
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
      substitution: `\\varepsilon_t=0.003\\left(\\dfrac{${n(input.d)}-${n(result.c)}}{${n(result.c)}}\\right),\\qquad f_s=\\min[200000(${n(result.epsilonT, 6)}),${n(input.fy)}]`,
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
      substitution: `\\varepsilon_y=\\dfrac{${n(input.fy)}}{200000}=${n(result.epsilonY, 6)},\\qquad \\varepsilon_t=${n(result.epsilonT, 6)}`,
      result: `\\phi=${n(result.phi, 3)},\\qquad \\phi M_n=${n(result.phiMn)}\\;\\text{kN}\\cdot\\text{m}`,
    },
  ];

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
