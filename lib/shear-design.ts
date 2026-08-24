export interface ShearDesignInput {
  Vu: number;          // factored shear force, kN
  b: number;            // width, mm
  d: number;             // effective depth, mm
  fc: number;            // f'c, MPa
  fy: number;            // fy of stirrups, MPa
  stirrupDiameter: number; // mm, single leg bar diameter
  legs: number;          // number of stirrup legs (usually 2)
}

export interface ShearDesignResult {
  Vc: number;           // nominal concrete shear capacity, kN
  phiVc: number;        // φVc, kN
  halfPhiVc: number;    // 0.5φVc, kN
  Vs: number;            // required steel shear capacity, kN
  VsMax: number;          // max allowed Vs, kN
  Av: number;             // stirrup area, mm²
  spacingRequired: number | null; // mm
  spacingMax: number;     // mm, code max spacing
  spacingFinal: number | null; // mm, governing spacing
  stirrupCase: "none" | "minimum" | "calculated" | "section-inadequate";
  ok: boolean;
  message: string;
}

export interface ShearSolutionStep {
  label: string;
  formula: string;
  substitution: string;
  result: string;
}

const PHI_SHEAR = 0.75;

export function designShearReinforcement(input: ShearDesignInput): ShearDesignResult {
  const { Vu, b, d, fc, fy, stirrupDiameter, legs } = input;

  // Concrete shear capacity, NSCP 2015 / ACI 318 simplified method (N)
  const VcN = 0.17 * Math.sqrt(fc) * b * d;
  const Vc = VcN / 1000; // kN
  const phiVc = PHI_SHEAR * Vc;
  const halfPhiVc = 0.5 * phiVc;

  // Max Vs allowed (section size limit), N
  const VsMaxN = 0.66 * Math.sqrt(fc) * b * d;
  const VsMax = VsMaxN / 1000; // kN

  const Ab = (Math.PI * stirrupDiameter * stirrupDiameter) / 4;
  const Av = legs * Ab; // mm²

  // Case 1: Vu <= 0.5 phiVc -> no stirrups needed
  if (Vu <= halfPhiVc) {
    return {
      Vc, phiVc, halfPhiVc, Vs: 0, VsMax, Av,
      spacingRequired: null,
      spacingMax: Math.min(d / 2, 600),
      spacingFinal: null,
      stirrupCase: "none",
      ok: true,
      message: "Vu ≤ 0.5φVc — no shear reinforcement required by calculation (nominal stirrups may still be provided per code practice).",
    };
  }

  // Required Vs
  const VsRequired = Vu / PHI_SHEAR - Vc; // kN, may be <= 0 if within phiVc

  // Section adequacy check
  if (VsRequired > VsMax) {
    return {
      Vc, phiVc, halfPhiVc, Vs: VsRequired, VsMax, Av,
      spacingRequired: null,
      spacingMax: Math.min(d / 2, 600),
      spacingFinal: null,
      stirrupCase: "section-inadequate",
      ok: false,
      message: "Vs required exceeds the maximum allowed (0.66√f'c·b·d) — section is too small. Increase b or d.",
    };
  }

  // Case 2: 0.5phiVc < Vu <= phiVc -> minimum stirrups only
  if (Vu <= phiVc) {
    const sMax = Math.min(d / 2, 600);
    return {
      Vc, phiVc, halfPhiVc, Vs: 0, VsMax, Av,
      spacingRequired: null,
      spacingMax: sMax,
      spacingFinal: sMax,
      stirrupCase: "minimum",
      ok: true,
      message: "0.5φVc < Vu ≤ φVc — provide minimum shear reinforcement at maximum code spacing.",
    };
  }

  // Case 3: Vu > phiVc -> design stirrups
  const VsN = VsRequired * 1000; // N
  const spacingRequiredMm = (Av * fy * d) / VsN;

  // Code max spacing depends on Vs magnitude
  const thresholdN = 0.33 * Math.sqrt(fc) * b * d;
  const sMax = VsN <= thresholdN ? Math.min(d / 2, 600) : Math.min(d / 4, 300);

  const spacingFinal = Math.min(spacingRequiredMm, sMax);

  return {
    Vc, phiVc, halfPhiVc, Vs: VsRequired, VsMax, Av,
    spacingRequired: spacingRequiredMm,
    spacingMax: sMax,
    spacingFinal,
    stirrupCase: "calculated",
    ok: true,
    message: "Vu > φVc — stirrups designed. Governing spacing is the smaller of required spacing and code maximum.",
  };
}

export function getShearSolutionSteps(
  input: ShearDesignInput,
  result: ShearDesignResult
): ShearSolutionStep[] {
  const { Vu, b, d, fc, fy, stirrupDiameter, legs } = input;

  const steps: ShearSolutionStep[] = [
    {
      label: "Nominal concrete shear capacity, Vc",
      formula: "V_c = 0.17\\sqrt{f'_c}\\, b\\, d",
      substitution: `V_c = 0.17\\sqrt{${fc}}(${b})(${d})`,
      result: `V_c = ${result.Vc.toFixed(2)} \\text{ kN}`,
    },
    {
      label: "Design concrete shear capacity, φVc",
      formula: "\\phi V_c = 0.75\\, V_c",
      substitution: `\\phi V_c = 0.75 \\times ${result.Vc.toFixed(2)}`,
      result: `\\phi V_c = ${result.phiVc.toFixed(2)} \\text{ kN}`,
    },
    {
      label: "Check against 0.5φVc",
      formula: "0.5\\,\\phi V_c",
      substitution: `0.5 \\times ${result.phiVc.toFixed(2)}`,
      result: `0.5\\phi V_c = ${result.halfPhiVc.toFixed(2)} \\text{ kN}`,
    },
    {
      label: "Compare Vu to φVc",
      formula: "\\text{Compare } V_u \\text{ to } 0.5\\phi V_c \\text{ and } \\phi V_c",
      substitution: `V_u = ${Vu} \\text{ kN vs. } 0.5\\phi V_c = ${result.halfPhiVc.toFixed(
        2
      )},\\ \\phi V_c = ${result.phiVc.toFixed(2)}`,
      result: `\\text{${result.stirrupCase.toUpperCase()}}`,
    },
  ];

  if (result.stirrupCase === "section-inadequate") {
    steps.push({
      label: "Required Vs vs. maximum allowed",
      formula: "V_s = \\dfrac{V_u}{\\phi} - V_c \\quad ; \\quad V_{s,max} = 0.66\\sqrt{f'_c}\\, b\\, d",
      substitution: `V_s = \\dfrac{${Vu}}{0.75} - ${result.Vc.toFixed(2)}`,
      result: `V_s = ${result.Vs.toFixed(2)} \\text{ kN} > V_{s,max} = ${result.VsMax.toFixed(
        2
      )} \\text{ kN — section inadequate}`,
    });
    return steps;
  }

  if (result.stirrupCase === "none") {
    return steps;
  }

  const Ab = (Math.PI * stirrupDiameter * stirrupDiameter) / 4;

  steps.push({
    label: "Stirrup area, Av",
    formula: "A_v = n_{legs} \\times \\dfrac{\\pi d_b^2}{4}",
    substitution: `A_v = ${legs} \\times \\dfrac{\\pi(${stirrupDiameter})^2}{4}`,
    result: `A_v = ${result.Av.toFixed(1)} \\text{ mm}^2`,
  });

  if (result.stirrupCase === "minimum") {
    steps.push({
      label: "Governing spacing (minimum reinforcement)",
      formula: "s_{max} = \\min\\left(\\dfrac{d}{2},\\ 600\\text{mm}\\right)",
      substitution: `s_{max} = \\min\\left(\\dfrac{${d}}{2},\\ 600\\right)`,
      result: `s = ${result.spacingFinal?.toFixed(0)} \\text{ mm}`,
    });
    return steps;
  }

  steps.push(
    {
      label: "Required Vs",
      formula: "V_s = \\dfrac{V_u}{\\phi} - V_c",
      substitution: `V_s = \\dfrac{${Vu}}{0.75} - ${result.Vc.toFixed(2)}`,
      result: `V_s = ${result.Vs.toFixed(2)} \\text{ kN}`,
    },
    {
      label: "Required stirrup spacing",
      formula: "s = \\dfrac{A_v f_y d}{V_s}",
      substitution: `s = \\dfrac{(${result.Av.toFixed(1)})(${fy})(${d})}{${(
        result.Vs * 1000
      ).toFixed(0)}}`,
      result: `s = ${result.spacingRequired?.toFixed(0)} \\text{ mm}`,
    },
    {
      label: "Code maximum spacing",
      formula: "s_{max} = \\min\\left(\\dfrac{d}{2}\\text{ or }\\dfrac{d}{4},\\ 600\\text{ or }300\\text{mm}\\right)",
      substitution: `\\text{based on } V_s \\text{ vs. } 0.33\\sqrt{f'_c}\\,b\\,d`,
      result: `s_{max} = ${result.spacingMax.toFixed(0)} \\text{ mm}`,
    },
    {
      label: "Governing spacing",
      formula: "s_{final} = \\min(s_{required},\\ s_{max})",
      substitution: `s_{final} = \\min(${result.spacingRequired?.toFixed(
        0
      )},\\ ${result.spacingMax.toFixed(0)})`,
      result: `s = ${result.spacingFinal?.toFixed(0)} \\text{ mm}`,
    }
  );

  return steps;
}