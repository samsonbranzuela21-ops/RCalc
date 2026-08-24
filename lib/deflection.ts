export type SupportCondition =
  | "simply-supported"
  | "one-end-continuous"
  | "both-ends-continuous"
  | "cantilever";

export type LimitCase =
  | "supporting-not-likely-damaged"
  | "supporting-likely-damaged";

export type DurationFactor = 1.0 | 1.2 | 1.4 | 2.0;

export interface DeflectionInput {
  L: number;              // span, m
  b: number;              // width, mm
  h: number;              // overall depth, mm
  d: number;              // effective depth, mm
  fc: number;              // f'c, MPa
  As: number;              // provided tension steel area, mm²
  wD: number;              // service dead load, kN/m
  wL: number;              // service live load, kN/m
  sustainedLLFactor: number; // fraction of live load that is sustained (0–1)
  rhoPrime: number;         // ρ' = As'/(b·d), for long-term multiplier (0 if none)
  xi: DurationFactor;       // time-dependent factor
  supportCondition: SupportCondition;
  limitCase: LimitCase;
}

export interface DeflectionResult {
  Ec: number;
  Es: number;
  n: number;
  fr: number;
  Ig: number;
  Mcr: number;
  rho: number;
  kd: number;
  Icr: number;

  MaD: number;
  MaDL: number;
  MaSus: number;

  IeD: number;
  IeDL: number;
  IeSus: number;

  deltaD: number;
  deltaDL: number;
  deltaL: number;   // immediate deflection due to live load only

  deltaSus: number;
  lambdaDelta: number;
  deltaLtAdditional: number;
  deltaTotalLongTerm: number;

  limitLabel: string;
  checksImmediateLL: boolean;
  allowableImmediateLL: number | null;
  immediateLLok: boolean | null;

  checksLongTerm: boolean;
  allowableLongTerm: number | null;
  longTermOk: boolean | null;

  ok: boolean;
  message: string;
}

export interface DeflectionSolutionStep {
  label: string;
  formula: string;
  substitution: string;
  result: string;
}

// Approximate coefficients for uniform load, standard framing conditions
const MOMENT_COEFF: Record<SupportCondition, number> = {
  "simply-supported": 1 / 8,
  "one-end-continuous": 1 / 10,
  "both-ends-continuous": 1 / 16,
  cantilever: 1 / 2,
};

const DEFLECTION_COEFF: Record<SupportCondition, number> = {
  "simply-supported": 5 / 384,
  "one-end-continuous": 2.1 / 384,
  "both-ends-continuous": 1 / 384,
  cantilever: 1 / 8,
};

const LIMIT_INFO: Record<
  LimitCase,
  { label: string; type: "immediate" | "long-term"; divisor: number }
> = {
  "supporting-likely-damaged": {
    label: "Roof or floor — supporting/attached to nonstructural elements LIKELY to be damaged by large deflections",
    type: "long-term",
    divisor: 480,
  },
  "supporting-not-likely-damaged": {
    label: "Roof or floor — supporting/attached to nonstructural elements NOT likely to be damaged by large deflections",
    type: "long-term",
    divisor: 240,
  },
};

function effectiveMomentOfInertia(Mcr: number, Ma: number, Ig: number, Icr: number): number {
  if (Ma <= Mcr) return Ig;
  const ratio = Mcr / Ma;
  const Ie = ratio ** 3 * Ig + (1 - ratio ** 3) * Icr;
  return Math.min(Ie, Ig);
}

export function checkDeflection(input: DeflectionInput): DeflectionResult {
  const {
    L, b, h, d, fc, As, wD, wL, sustainedLLFactor, rhoPrime, xi,
    supportCondition, limitCase,
  } = input;

  const Ec = 4700 * Math.sqrt(fc);   // MPa
  const Es = 200000;                  // MPa
  const n = Es / Ec;
  const fr = 0.62 * Math.sqrt(fc);    // MPa

  const Ig = (b * h ** 3) / 12;       // mm^4
  const yt = h / 2;
  const Mcr = (fr * Ig) / yt;         // N·mm

  const rho = As / (b * d);
  const kd = d * (Math.sqrt((n * rho) ** 2 + 2 * n * rho) - n * rho);
  const Icr = (b * kd ** 3) / 3 + n * As * (d - kd) ** 2;

  const Lmm = L * 1000;
  const Cm = MOMENT_COEFF[supportCondition];
  const Cd = DEFLECTION_COEFF[supportCondition];

  // Loads in N/mm (numerically equal to kN/m)
  const wD_ = wD;
  const wL_ = wL;
  const wSus_ = wD + sustainedLLFactor * wL;

  const MaD = Cm * wD_ * Lmm ** 2;
  const MaDL = Cm * (wD_ + wL_) * Lmm ** 2;
  const MaSus = Cm * wSus_ * Lmm ** 2;

  const IeD = effectiveMomentOfInertia(Mcr, MaD, Ig, Icr);
  const IeDL = effectiveMomentOfInertia(Mcr, MaDL, Ig, Icr);
  const IeSus = effectiveMomentOfInertia(Mcr, MaSus, Ig, Icr);

  const deltaD = (Cd * wD_ * Lmm ** 4) / (Ec * IeD);
  const deltaDL = (Cd * (wD_ + wL_) * Lmm ** 4) / (Ec * IeDL);
  const deltaL = deltaDL - deltaD;

  const deltaSus = (Cd * wSus_ * Lmm ** 4) / (Ec * IeSus);
  const lambdaDelta = xi / (1 + 50 * rhoPrime);
  const deltaLtAdditional = lambdaDelta * deltaSus;
  const deltaTotalLongTerm = deltaDL + deltaLtAdditional;

  const limitInfo = LIMIT_INFO[limitCase];
  const checksImmediateLL = limitInfo.type === "immediate";
  const checksLongTerm = limitInfo.type === "long-term";

  const allowableImmediateLL = checksImmediateLL ? Lmm / limitInfo.divisor : null;
  const allowableLongTerm = checksLongTerm ? Lmm / limitInfo.divisor : null;

  const immediateLLok = checksImmediateLL ? deltaL <= (allowableImmediateLL as number) : null;
  const longTermOk = checksLongTerm ? deltaTotalLongTerm <= (allowableLongTerm as number) : null;

  const ok = checksImmediateLL ? !!immediateLLok : !!longTermOk;

  const message = ok
    ? "Computed deflection is within the allowable serviceability limit."
    : "Computed deflection EXCEEDS the allowable serviceability limit — increase stiffness (b, h, or d) or reduce span/load.";

  return {
    Ec, Es, n, fr, Ig, Mcr, rho, kd, Icr,
    MaD, MaDL, MaSus,
    IeD, IeDL, IeSus,
    deltaD, deltaDL, deltaL,
    deltaSus, lambdaDelta, deltaLtAdditional, deltaTotalLongTerm,
    limitLabel: limitInfo.label,
    checksImmediateLL, allowableImmediateLL, immediateLLok,
    checksLongTerm, allowableLongTerm, longTermOk,
    ok, message,
  };
}

export function getDeflectionSolutionSteps(
  input: DeflectionInput,
  r: DeflectionResult
): DeflectionSolutionStep[] {
  const { L, b, h, d, fc, As, wD, wL } = input;
  const Lmm = L * 1000;

  const steps: DeflectionSolutionStep[] = [
    {
      label: "Modulus of elasticity, Ec, and modular ratio, n",
      formula: "E_c = 4700\\sqrt{f'_c}, \\quad n = E_s/E_c",
      substitution: `E_c = 4700\\sqrt{${fc}}`,
      result: `E_c = ${r.Ec.toFixed(0)} \\text{ MPa}, \\ n = ${r.n.toFixed(2)}`,
    },
    {
      label: "Modulus of rupture and cracking moment, Mcr",
      formula: "f_r = 0.62\\sqrt{f'_c}, \\quad M_{cr} = \\dfrac{f_r I_g}{y_t}",
      substitution: `f_r = 0.62\\sqrt{${fc}}, \\quad I_g = \\dfrac{${b}(${h})^3}{12}`,
      result: `M_{cr} = ${(r.Mcr / 1e6).toFixed(3)} \\text{ kN·m}`,
    },
    {
      label: "Cracked transformed section, Icr",
      formula: "\\rho = \\dfrac{A_s}{bd}, \\quad kd = d\\left[\\sqrt{(n\\rho)^2+2n\\rho}-n\\rho\\right]",
      substitution: `\\rho = \\dfrac{${As}}{${b}(${d})} = ${r.rho.toFixed(5)}`,
      result: `kd = ${r.kd.toFixed(1)} \\text{ mm}, \\ I_{cr} = ${(r.Icr / 1e6).toFixed(1)} \\times 10^6 \\text{ mm}^4`,
    },
    {
      label: "Service moments (dead, dead+live, sustained)",
      formula: "M_a = C_m \\, w \\, L^2",
      substitution: `w_D = ${wD} \\text{ kN/m}, \\ w_L = ${wL} \\text{ kN/m}`,
      result: `M_{a,D} = ${(r.MaD / 1e6).toFixed(2)}, \\ M_{a,D+L} = ${(r.MaDL / 1e6).toFixed(2)}, \\ M_{a,sus} = ${(r.MaSus / 1e6).toFixed(2)} \\text{ kN·m}`,
    },
    {
      label: "Effective moment of inertia, Ie (Branson's equation)",
      formula: "I_e = \\left(\\dfrac{M_{cr}}{M_a}\\right)^3 I_g + \\left[1-\\left(\\dfrac{M_{cr}}{M_a}\\right)^3\\right]I_{cr}",
      substitution: "\\text{evaluated separately for each load stage}",
      result: `I_{e,D} = ${(r.IeD / 1e6).toFixed(1)}, \\ I_{e,D+L} = ${(r.IeDL / 1e6).toFixed(1)}, \\ I_{e,sus} = ${(r.IeSus / 1e6).toFixed(1)} \\ (\\times10^6\\text{mm}^4)`,
    },
    {
      label: "Immediate deflections",
      formula: "\\delta = C_d \\dfrac{wL^4}{E_c I_e}, \\quad \\delta_L = \\delta_{D+L} - \\delta_D",
      substitution: `\\delta_D = ${r.deltaD.toFixed(2)} \\text{ mm}, \\ \\delta_{D+L} = ${r.deltaDL.toFixed(2)} \\text{ mm}`,
      result: `\\delta_L \\text{ (immediate, live load only)} = ${r.deltaL.toFixed(2)} \\text{ mm}`,
    },
    {
      label: "Long-term deflection multiplier",
      formula: "\\lambda_\\Delta = \\dfrac{\\xi}{1+50\\rho'}",
      substitution: `\\lambda_\\Delta = \\dfrac{${input.xi}}{1+50(${input.rhoPrime})}`,
      result: `\\lambda_\\Delta = ${r.lambdaDelta.toFixed(3)}`,
    },
    {
      label: "Additional long-term deflection and total",
      formula: "\\delta_{lt} = \\lambda_\\Delta \\, \\delta_{sus}, \\quad \\delta_{total} = \\delta_{D+L} + \\delta_{lt}",
      substitution: `\\delta_{sus} = ${r.deltaSus.toFixed(2)} \\text{ mm}`,
      result: `\\delta_{lt} = ${r.deltaLtAdditional.toFixed(2)} \\text{ mm}, \\ \\delta_{total} = ${r.deltaTotalLongTerm.toFixed(2)} \\text{ mm}`,
    },
    {
      label: `Check against allowable — ${r.limitLabel}`,
      formula: "\\delta_{allow} = \\dfrac{L}{\\text{divisor}}",
      substitution: r.checksImmediateLL
        ? `\\delta_L = ${r.deltaL.toFixed(2)} \\text{ mm vs. allowable} = ${r.allowableImmediateLL?.toFixed(2)} \\text{ mm}`
        : `\\delta_{total} = ${r.deltaTotalLongTerm.toFixed(2)} \\text{ mm vs. allowable} = ${r.allowableLongTerm?.toFixed(2)} \\text{ mm}`,
      result: r.ok ? "\\text{OK}" : "\\text{NOT OK}",
    },
  ];

  return steps;
}