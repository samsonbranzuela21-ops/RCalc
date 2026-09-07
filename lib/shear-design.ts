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
  // Minimum Av/s per the ACI metric method (StructurePoint spSlab/spBeam manual).
  const spacingMinSteel = Av * fy / (Math.max(0.062 * Math.sqrt(fc), 0.35) * b);

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
      spacingFinal: Math.min(sMax, spacingMinSteel),
      stirrupCase: "minimum",
      ok: true,
      message: "0.5φVc < Vu ≤ φVc — provide minimum shear reinforcement; check both steel area and code spacing limits.",
    };
  }

  // Case 3: Vu > phiVc -> design stirrups
  const VsN = VsRequired * 1000; // N
  const spacingRequiredMm = (Av * fy * d) / VsN;

  // Code max spacing depends on Vs magnitude
  const thresholdN = 0.33 * Math.sqrt(fc) * b * d;
  const sMax = VsN <= thresholdN ? Math.min(d / 2, 600) : Math.min(d / 4, 300);

  const spacingFinal = Math.min(spacingRequiredMm, sMax, spacingMinSteel);

  return {
    Vc, phiVc, halfPhiVc, Vs: VsRequired, VsMax, Av,
    spacingRequired: spacingRequiredMm,
    spacingMax: sMax,
    spacingFinal,
    stirrupCase: "calculated",
    ok: true,
    message: "Vu > φVc — stirrups designed. Governing spacing is the smallest of strength, minimum steel area, and code spacing limits.",
  };
}

export function getShearSolutionSteps(
  input: ShearDesignInput,
  result: ShearDesignResult
): ShearSolutionStep[] {
  const { Vu, b, d, fc, fy, stirrupDiameter, legs } = input;
  const f = (n: number) => n.toFixed(2);
  const tex = String.raw;
  const steps: ShearSolutionStep[] = [];
  const add = (label: string, formula: string, substitution: string, answer: string) =>
    steps.push({ label, formula, substitution, result: answer });

  add("Given values and units", tex`1\text{ MPa}=1\text{ N/mm}^2,\quad 1\text{ kN}=1000\text{ N}`,
    tex`V_u=${Vu}\text{ kN},\ b=${b}\text{ mm},\ d=${d}\text{ mm},\ f'_c=${fc}\text{ MPa},\ f_y=${fy}\text{ MPa}`,
    tex`d_b=${stirrupDiameter}\text{ mm},\ n=${legs},\ \phi=0.75,\ \lambda=1`);
  add("Nominal concrete shear capacity", tex`V_c=\frac{0.17\lambda\sqrt{f'_c}bd}{1000}`,
    tex`V_c=\frac{0.17(1)\sqrt{${fc}}(${b})(${d})}{1000}=\frac{${f(result.Vc * 1000)}\text{ N}}{1000}`,
    tex`V_c=${f(result.Vc)}\text{ kN}`);
  add("Design concrete capacity and reinforcement threshold", tex`\phi V_c=0.75V_c,\quad V_{u,\mathrm{threshold}}=0.5\phi V_c`,
    tex`\phi V_c=0.75(${f(result.Vc)}),\quad 0.5\phi V_c=0.5(${f(result.phiVc)})`,
    tex`\phi V_c=${f(result.phiVc)}\text{ kN},\quad 0.5\phi V_c=${f(result.halfPhiVc)}\text{ kN}`);
  const none = result.stirrupCase === "none";
  const minimum = result.stirrupCase === "minimum";
  add("Determine the shear reinforcement case",
    tex`V_u\le0.5\phi V_c:\text{ none};\quad 0.5\phi V_c<V_u\le\phi V_c:\text{ minimum};\quad V_u>\phi V_c:\text{ design}`,
    none ? tex`${Vu}\le${f(result.halfPhiVc)}\text{ kN}` : minimum ? tex`${f(result.halfPhiVc)}<${Vu}\le${f(result.phiVc)}\text{ kN}` : tex`${Vu}>${f(result.phiVc)}\text{ kN}`,
    tex`\text{${none ? "No shear reinforcement required by calculation" : minimum ? "Minimum reinforcement required" : "Calculate required steel contribution"}}`);
  if (none) {
    add("Final concrete-only capacity check", tex`\phi V_n=\phi V_c\ge V_u`,
      tex`${f(result.phiVc)}\text{ kN}\ge${Vu}\text{ kN}`,
      tex`\text{Pass; nominal detailing requirements are outside this calculation}`);
    return steps;
  }
  add("Required stirrup shear contribution", tex`V_{s,\mathrm{req}}=\max\left(0,\frac{V_u}{\phi}-V_c\right)`,
    tex`V_{s,\mathrm{req}}=\max\left(0,\frac{${Vu}}{0.75}-${f(result.Vc)}\right)`,
    tex`V_{s,\mathrm{req}}=${f(result.Vs)}\text{ kN}`);
  add("Maximum steel contribution and section adequacy", tex`V_{s,\max}=\frac{0.66\sqrt{f'_c}bd}{1000}`,
    tex`V_{s,\max}=\frac{0.66\sqrt{${fc}}(${b})(${d})}{1000}=${f(result.VsMax)}\text{ kN}`,
    tex`${f(result.Vs)}${result.ok ? "\\le" : ">"}${f(result.VsMax)}\text{ kN}:\quad\text{${result.ok ? "Section adequate" : "Section inadequate"}}`);
  if (result.stirrupCase === "section-inadequate") {
    add("Final design conclusion", tex`\phi V_{n,\max}=\phi(V_c+V_{s,\max})`,
      tex`\phi V_{n,\max}=0.75(${f(result.Vc)}+${f(result.VsMax)})=${f(0.75 * (result.Vc + result.VsMax))}\text{ kN}<${Vu}\text{ kN}`,
      tex`\text{Increase b or d and recalculate; no stirrup spacing is selected}`);
    return steps;
  }
  add("Area of one stirrup leg and total area", tex`A_b=\frac{\pi d_b^2}{4},\quad A_v=nA_b`,
    tex`A_b=\frac{\pi(${stirrupDiameter})^2}{4}=${f(result.Av / legs)}\text{ mm}^2,\quad A_v=${legs}(${f(result.Av / legs)})`,
    tex`A_v=${f(result.Av)}\text{ mm}^2`);
  if (result.spacingRequired !== null) {
    add("Spacing required for shear strength", tex`V_s=\frac{A_vf_yd}{1000s}\quad\Rightarrow\quad s_{\mathrm{strength}}=\frac{A_vf_yd}{1000V_{s,\mathrm{req}}}`,
      tex`s_{\mathrm{strength}}=\frac{(${f(result.Av)})(${fy})(${d})}{1000(${f(result.Vs)})}`,
      tex`s_{\mathrm{strength}}=${f(result.spacingRequired)}\text{ mm}`);
  } else {
    add("Strength spacing does not govern", tex`V_{s,\mathrm{req}}=0`,
      tex`V_u=${Vu}\text{ kN}\le\phi V_c=${f(result.phiVc)}\text{ kN}`,
      tex`\text{Select spacing using minimum steel and detailing limits}`);
  }
  const minRatio = Math.max(0.062 * Math.sqrt(fc), 0.35) * b / fy;
  const minSpacing = result.Av / minRatio;
  add("Minimum shear reinforcement", tex`\frac{A_{v,\min}}s=\max\left(\frac{0.062\sqrt{f'_c}b}{f_y},\frac{0.35b}{f_y}\right)`,
    tex`\frac{A_{v,\min}}s=\max\left(\frac{0.062\sqrt{${fc}}(${b})}{${fy}},\frac{0.35(${b})}{${fy}}\right)`,
    tex`\frac{A_{v,\min}}s=${minRatio.toFixed(4)}\text{ mm}^2/\text{mm}`);
  add("Spacing limit from minimum steel area", tex`s_{\mathrm{min\ steel}}=\frac{A_v}{A_{v,\min}/s}`,
    tex`s_{\mathrm{min\ steel}}=\frac{${f(result.Av)}}{${minRatio.toFixed(4)}}`,
    tex`s_{\mathrm{min\ steel}}=${f(minSpacing)}\text{ mm}`);
  const threshold = 0.33 * Math.sqrt(fc) * b * d / 1000;
  const highShear = result.Vs > threshold;
  add("Select the code spacing branch", tex`V_{s,\mathrm{threshold}}=\frac{0.33\sqrt{f'_c}bd}{1000}`,
    tex`V_{s,\mathrm{threshold}}=\frac{0.33\sqrt{${fc}}(${b})(${d})}{1000}=${f(threshold)}\text{ kN}`,
    tex`V_{s,\mathrm{req}}=${f(result.Vs)}${highShear ? ">" : "\\le"}${f(threshold)}\text{ kN}`);
  const divisor = highShear ? 4 : 2;
  const cap = highShear ? 300 : 600;
  add("Code maximum spacing", tex`s_{\max}=\min\left(\frac d{${divisor}},${cap}\text{ mm}\right)`,
    tex`s_{\max}=\min\left(\frac{${d}}{${divisor}},${cap}\right)=\min(${f(d / divisor)},${cap})`,
    tex`s_{\max}=${f(result.spacingMax)}\text{ mm}`);
  const spacing = result.spacingFinal!;
  add("Governing stirrup spacing", result.spacingRequired === null ? tex`s=\min(s_{\mathrm{min\ steel}},s_{\max})` : tex`s=\min(s_{\mathrm{strength}},s_{\mathrm{min\ steel}},s_{\max})`,
    tex`s=\min(${result.spacingRequired === null ? "" : `${f(result.spacingRequired)},`}${f(minSpacing)},${f(result.spacingMax)})`,
    tex`s=${f(spacing)}\text{ mm (upper limit; round down for detailing)}`);
  const providedVs = result.Av * fy * d / spacing / 1000;
  const capacity = 0.75 * (result.Vc + Math.min(providedVs, result.VsMax));
  add("Provided steel contribution at governing spacing", tex`V_{s,\mathrm{provided}}=\frac{A_vf_yd}{1000s}`,
    tex`V_{s,\mathrm{provided}}=\frac{(${f(result.Av)})(${fy})(${d})}{1000(${f(spacing)})}`,
    tex`V_{s,\mathrm{provided}}=${f(providedVs)}\text{ kN}`);
  add("Verify minimum steel area", tex`A_{v,\min}=(A_{v,\min}/s)s\le A_v`,
    tex`A_{v,\min}=(${minRatio.toFixed(4)})(${f(spacing)})=${f(minRatio * spacing)}\text{ mm}^2`,
    tex`${f(minRatio * spacing)}\le${f(result.Av)}\text{ mm}^2:\quad\text{Pass}`);
  add("Final design shear capacity check", tex`\phi V_n=\phi\left[V_c+\min(V_{s,\mathrm{provided}},V_{s,\max})\right]\ge V_u`,
    tex`\phi V_n=0.75[${f(result.Vc)}+\min(${f(providedVs)},${f(result.VsMax)})]=${f(capacity)}\text{ kN}`,
    tex`${f(capacity)}\ge${Vu}\text{ kN}:\quad\text{Pass; use ${legs}-leg, ${stirrupDiameter} mm stirrups at }s\le${f(spacing)}\text{ mm}`);
  return steps;
}
