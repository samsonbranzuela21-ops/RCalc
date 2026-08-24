export interface FlexuralBeamInput {
  Mu: number;   // factored moment, kN·m
  b: number;    // width, mm
  d: number;    // effective depth, mm
  fc: number;   // f'c, MPa
  fy: number;   // fy, MPa
  barDiameter: number; // mm
}

export interface FlexuralBeamResult {
  Rn: number;
  rhoRequired: number;
  rhoMin: number;
  rhoMax: number;
  beta1: number;
  asRequired: number;
  asMin: number;
  asMax: number;
  asFinal: number;
  barsRequired: number;
  governingCase: "minimum" | "calculated" | "over-reinforced";
  ok: boolean;
  message: string;

  // Bar spacing check — NSCP 2015 / ACI 318 §25.2.1
  clearSpacing: number | null; // mm, null if only 1 bar (no spacing to check)
  minClearSpacingRequired: number; // mm — max(db, 25)
  spacingOk: boolean | null; // null if only 1 bar
  spacingMessage: string;
}

export interface SolutionStep {
  label: string;
  formula: string;
  substitution: string;
  result: string;
}

const PHI = 0.9;

// Assumed for spacing check only — this calculator doesn't model cover/stirrups directly.
const ASSUMED_CLEAR_COVER = 40; // mm, typical NSCP beam clear cover
const ASSUMED_STIRRUP_DIAMETER = 10; // mm, typical stirrup diameter

function beta1Factor(fc: number): number {
  if (fc <= 28) return 0.85;
  return Math.max(0.65, 0.85 - 0.05 * ((fc - 28) / 7));
}

function checkBarSpacing(
  b: number,
  barDiameter: number,
  barsRequired: number
): Pick<FlexuralBeamResult, "clearSpacing" | "minClearSpacingRequired" | "spacingOk" | "spacingMessage"> {
  const minClearSpacingRequired = Math.max(barDiameter, 25);

  if (barsRequired <= 1) {
    return {
      clearSpacing: null,
      minClearSpacingRequired,
      spacingOk: null,
      spacingMessage: "Only 1 bar — no spacing check needed.",
    };
  }

  const edgeToFirstBarCenter = ASSUMED_CLEAR_COVER + ASSUMED_STIRRUP_DIAMETER + barDiameter / 2;
  const usableWidth = b - 2 * edgeToFirstBarCenter;
  const centerSpacing = usableWidth / (barsRequired - 1);
  const clearSpacing = centerSpacing - barDiameter;
  const spacingOk = clearSpacing >= minClearSpacingRequired;

  const spacingMessage = spacingOk
    ? `Clear spacing ${clearSpacing.toFixed(1)} mm ≥ ${minClearSpacingRequired.toFixed(0)} mm — OK, bars fit in one layer.`
    : `Clear spacing ${clearSpacing.toFixed(1)} mm < ${minClearSpacingRequired.toFixed(0)} mm required — bars too crowded for one layer. Use fewer/larger bars, increase b, or place bars in two layers.`;

  return { clearSpacing, minClearSpacingRequired, spacingOk, spacingMessage };
}

export function designSinglyReinforcedBeam(input: FlexuralBeamInput): FlexuralBeamResult {
  const { Mu, b, d, fc, fy, barDiameter } = input;

  const MuNmm = Mu * 1e6;
  const Rn = MuNmm / (PHI * b * d * d);

  const m = fy / (0.85 * fc);
  const discriminant = 1 - (2 * m * Rn) / fy;

  const beta1 = beta1Factor(fc);
  const rhoMin = Math.max(1.4 / fy, Math.sqrt(fc) / (4 * fy));
  const rhoB = ((0.85 * fc * beta1) / fy) * (600 / (600 + fy));
  const rhoMax = 0.75 * rhoB;

  const asMin = rhoMin * b * d;
  const asMax = rhoMax * b * d;

  if (discriminant < 0) {
    return {
      Rn, rhoRequired: NaN, rhoMin, rhoMax, beta1,
      asRequired: NaN, asMin, asMax, asFinal: NaN, barsRequired: 0,
      governingCase: "over-reinforced",
      ok: false,
      message:
        "Section is inadequate for Mu — increase b, d, or f'c, or design as doubly reinforced (compression steel required).",
      clearSpacing: null,
      minClearSpacingRequired: Math.max(barDiameter, 25),
      spacingOk: null,
      spacingMessage: "N/A — section inadequate.",
    };
  }

  const rhoRequired = (1 / m) * (1 - Math.sqrt(discriminant));
  const asRequired = rhoRequired * b * d;

  let asFinal: number;
  let governingCase: FlexuralBeamResult["governingCase"];
  let message: string;

  if (rhoRequired < rhoMin) {
    asFinal = asMin;
    governingCase = "minimum";
    message = "ρ required is below ρmin — using As,min governs.";
  } else if (rhoRequired > rhoMax) {
    asFinal = asMax;
    governingCase = "over-reinforced";
    message =
      "ρ required exceeds ρmax (0.75ρb) — section needs compression reinforcement (doubly reinforced design).";
  } else {
    asFinal = asRequired;
    governingCase = "calculated";
    message = "Section is adequately singly reinforced.";
  }

  const Ab = (Math.PI * barDiameter * barDiameter) / 4;
  const barsRequired = Math.ceil(asFinal / Ab);

  const spacing = checkBarSpacing(b, barDiameter, barsRequired);

  return {
    Rn, rhoRequired, rhoMin, rhoMax, beta1,
    asRequired, asMin, asMax, asFinal, barsRequired,
    governingCase,
    ok: governingCase !== "over-reinforced",
    message,
    ...spacing,
  };
}

export function getSolutionSteps(
  input: FlexuralBeamInput,
  result: FlexuralBeamResult
): SolutionStep[] {
  const { Mu, b, d, fc, fy, barDiameter } = input;
  const m = fy / (0.85 * fc);
  const MuNmm = Mu * 1e6;

  const steps: SolutionStep[] = [
    {
      label: "Convert Mu to N·mm",
      formula: "M_u = M_u(\\text{kN·m}) \\times 10^6",
      substitution: `M_u = ${Mu} \\times 10^6`,
      result: `M_u = ${MuNmm.toLocaleString()} \\text{ N·mm}`,
    },
    {
      label: "Required nominal resistance, Rn",
      formula: "R_n = \\dfrac{M_u}{\\phi \\, b \\, d^2}",
      substitution: `R_n = \\dfrac{${MuNmm.toLocaleString()}}{0.90 \\times ${b} \\times ${d}^2}`,
      result: `R_n = ${result.Rn.toFixed(3)} \\text{ MPa}`,
    },
    {
      label: "Steel ratio coefficient, m",
      formula: "m = \\dfrac{f_y}{0.85 f'_c}",
      substitution: `m = \\dfrac{${fy}}{0.85 \\times ${fc}}`,
      result: `m = ${m.toFixed(4)}`,
    },
    {
      label: "β1 factor",
      formula:
        fc <= 28
          ? "\\beta_1 = 0.85 \\quad (f'_c \\le 28 \\text{ MPa})"
          : "\\beta_1 = 0.85 - 0.05 \\left[\\dfrac{f'_c - 28}{7}\\right]",
      substitution:
        fc <= 28 ? "" : `\\beta_1 = 0.85 - 0.05 \\left[\\dfrac{${fc} - 28}{7}\\right]`,
      result: `\\beta_1 = ${result.beta1.toFixed(3)}`,
    },
    {
      label: "Required steel ratio, ρ",
      formula:
        "\\rho = \\dfrac{1}{m}\\left[1 - \\sqrt{1 - \\dfrac{2mR_n}{f_y}}\\right]",
      substitution: `\\rho = \\dfrac{1}{${m.toFixed(4)}}\\left[1 - \\sqrt{1 - \\dfrac{2(${m.toFixed(
        4
      )})(${result.Rn.toFixed(3)})}{${fy}}}\\right]`,
      result: isNaN(result.rhoRequired)
        ? "\\text{No real solution — section inadequate}"
        : `\\rho = ${result.rhoRequired.toFixed(5)}`,
    },
    {
      label: "ρmin check",
      formula:
        "\\rho_{min} = \\max\\left(\\dfrac{1.4}{f_y},\\ \\dfrac{\\sqrt{f'_c}}{4f_y}\\right)",
      substitution: `\\rho_{min} = \\max\\left(\\dfrac{1.4}{${fy}},\\ \\dfrac{\\sqrt{${fc}}}{4(${fy})}\\right)`,
      result: `\\rho_{min} = ${result.rhoMin.toFixed(5)}`,
    },
    {
      label: "ρmax check (0.75ρb)",
      formula:
        "\\rho_b = \\dfrac{0.85 f'_c \\beta_1}{f_y}\\left[\\dfrac{600}{600+f_y}\\right] \\ ; \\ \\rho_{max} = 0.75\\rho_b",
      substitution: `\\rho_b = \\dfrac{0.85(${fc})(${result.beta1.toFixed(
        3
      )})}{${fy}}\\left[\\dfrac{600}{600+${fy}}\\right]`,
      result: `\\rho_{max} = ${result.rhoMax.toFixed(5)}`,
    },
    {
      label: "Governing case",
      formula: "\\text{Compare } \\rho \\text{ to } \\rho_{min} \\text{ and } \\rho_{max}",
      substitution: `\\rho = ${
        isNaN(result.rhoRequired) ? "\\text{N/A}" : result.rhoRequired.toFixed(5)
      } \\text{ vs. } \\rho_{min} = ${result.rhoMin.toFixed(
        5
      )},\\ \\rho_{max} = ${result.rhoMax.toFixed(5)}`,
      result: `\\text{${result.governingCase.toUpperCase()}}`,
    },
    {
      label: "Required steel area, As",
      formula: "A_s = \\rho \\, b \\, d",
      substitution: isNaN(result.asFinal)
        ? "\\text{N/A}"
        : `A_s = (${
            result.governingCase === "minimum"
              ? result.rhoMin.toFixed(5)
              : result.governingCase === "over-reinforced"
              ? result.rhoMax.toFixed(5)
              : result.rhoRequired.toFixed(5)
          })(${b})(${d})`,
      result: isNaN(result.asFinal)
        ? "\\text{N/A}"
        : `A_s = ${result.asFinal.toFixed(0)} \\text{ mm}^2`,
    },
    {
      label: "Number of bars",
      formula: "n = \\dfrac{A_s}{A_b}, \\quad A_b = \\dfrac{\\pi d_b^2}{4}",
      substitution: `n = \\dfrac{${
        isNaN(result.asFinal) ? "\\text{N/A}" : result.asFinal.toFixed(0)
      }}{\\pi(${barDiameter})^2/4}`,
      result: `n = ${result.barsRequired} \\text{ bars} \\times ${barDiameter}\\text{mm}`,
    },
    {
      label: "Bar spacing check (NSCP 2015 / ACI 318 §25.2.1)",
      formula: "s_{clear} \\ge \\max(d_b,\\ 25\\text{mm})",
      substitution:
        result.clearSpacing !== null
          ? `s_{clear} = ${result.clearSpacing.toFixed(1)} \\text{ mm (assumed ${ASSUMED_CLEAR_COVER}mm cover, ${ASSUMED_STIRRUP_DIAMETER}mm stirrup)}`
          : "\\text{Only 1 bar — not applicable}",
      result:
        result.spacingOk === null
          ? "\\text{N/A}"
          : result.spacingOk
          ? "\\text{OK}"
          : "\\text{NOT OK — bars too crowded}",
    },
  ];

  return steps;
}