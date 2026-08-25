export type CrackingSectionMode = "rectangle" | "custom";

export interface CrackingMomentInput {
  mode: CrackingSectionMode;
  fc: number;
  lambda: number;
  b?: number;
  h?: number;
  Ig?: number;
  yt?: number;
}

export interface CrackingMomentResult {
  mode: CrackingSectionMode;
  fr: number;
  Ig: number;
  yt: number;
  sectionModulus: number;
  McrNmm: number;
  Mcr: number;
  message: string;
}

export interface CrackingMomentStep {
  label: string;
  formula: string;
  substitution?: string;
  result: string;
}

export function calculateCrackingMoment(
  input: CrackingMomentInput
): CrackingMomentResult {
  const { mode, fc, lambda } = input;

  if (
    !Number.isFinite(fc) ||
    fc <= 0 ||
    !Number.isFinite(lambda) ||
    lambda <= 0 ||
    lambda > 1
  ) {
    throw new Error("Enter a valid f'c and a concrete factor λ from 0 to 1.0.");
  }

  let Ig: number;
  let yt: number;

  if (mode === "rectangle") {
    const b = input.b ?? 0;
    const h = input.h ?? 0;

    if (
      !Number.isFinite(b) ||
      b <= 0 ||
      !Number.isFinite(h) ||
      h <= 0
    ) {
      throw new Error("Enter valid positive values for b and h.");
    }

    Ig = (b * h ** 3) / 12;
    yt = h / 2;
  } else {
    Ig = input.Ig ?? 0;
    yt = input.yt ?? 0;

    if (
      !Number.isFinite(Ig) ||
      Ig <= 0 ||
      !Number.isFinite(yt) ||
      yt <= 0
    ) {
      throw new Error("Enter valid positive values for Ig and yt.");
    }
  }

  const fr = 0.62 * lambda * Math.sqrt(fc);
  const sectionModulus = Ig / yt;
  const McrNmm = fr * sectionModulus;
  const Mcr = McrNmm / 1_000_000;

  return {
    mode,
    fr,
    Ig,
    yt,
    sectionModulus,
    McrNmm,
    Mcr,
    message: `First flexural cracking is estimated at Mcr = ${Mcr.toFixed(
      2
    )} kN·m.`,
  };
}

function n(value: number, digits = 2) {
  return value.toFixed(digits);
}

export function getCrackingMomentSteps(
  input: CrackingMomentInput,
  result: CrackingMomentResult
): CrackingMomentStep[] {
  const steps: CrackingMomentStep[] = [
    {
      label: "Modulus of rupture",
      formula: "f_r=0.62\\lambda\\sqrt{f'_c}",
      substitution: `f_r=0.62(${n(input.lambda, 2)})\\sqrt{${n(
        input.fc
      )}}`,
      result: `f_r=${n(result.fr, 3)}\\;\\text{MPa}`,
    },
  ];

  if (input.mode === "rectangle") {
    steps.push(
      {
        label: "Gross moment of inertia",
        formula: "I_g=\\dfrac{bh^3}{12}",
        substitution: `I_g=\\dfrac{(${n(input.b ?? 0)})(${n(
          input.h ?? 0
        )})^3}{12}`,
        result: `I_g=${n(result.Ig, 0)}\\;\\text{mm}^4`,
      },
      {
        label: "Distance to extreme tension fiber",
        formula: "y_t=\\dfrac{h}{2}",
        substitution: `y_t=\\dfrac{${n(input.h ?? 0)}}{2}`,
        result: `y_t=${n(result.yt)}\\;\\text{mm}`,
      }
    );
  } else {
    steps.push({
      label: "User-supplied gross section properties",
      formula: "I_g=I_{g,input},\\qquad y_t=y_{t,input}",
      result: `I_g=${n(result.Ig, 0)}\\;\\text{mm}^4,\\qquad y_t=${n(
        result.yt
      )}\\;\\text{mm}`,
    });
  }

  steps.push(
    {
      label: "Gross elastic section modulus",
      formula: "S_g=\\dfrac{I_g}{y_t}",
      substitution: `S_g=\\dfrac{${n(result.Ig, 0)}}{${n(result.yt)}}`,
      result: `S_g=${n(result.sectionModulus, 0)}\\;\\text{mm}^3`,
    },
    {
      label: "Cracking moment",
      formula: "M_{cr}=\\dfrac{f_rI_g}{y_t}=f_rS_g",
      substitution: `M_{cr}=(${n(result.fr, 3)})(${n(
        result.sectionModulus,
        0
      )})`,
      result: `M_{cr}=${n(result.McrNmm, 0)}\\;\\text{N}\\cdot\\text{mm}=${n(
        result.Mcr
      )}\\;\\text{kN}\\cdot\\text{m}`,
    }
  );

  return steps;
}
