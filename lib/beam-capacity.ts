export interface BeamCapacityInput {
  b: number;
  d: number;
  dPrime: number;
  fc: number;
  fy: number;
  As: number;
  AsPrime: number;
  Mu?: number | null;
}

export interface BeamCapacityResult {
  isDoublyReinforced: boolean;
  beta1: number;
  a: number;
  c: number;
  fsPrime: number | null;
  compressionSteelYields: boolean | null;
  epsilonT: number;
  epsilonY: number;
  phi: number;
  ductilityClass:
    | "tension-controlled"
    | "transition"
    | "compression-controlled";
  rho: number;
  rhoMin: number;
  rhoMax: number;
  Mn: number;
  phiMn: number;
  Mu: number | null;
  utilizationRatio: number | null;
  ok: boolean | null;
  message: string;
}

export interface BeamCapacitySolutionStep {
  label: string;
  formula: string;
  substitution: string;
  result: string;
}

const ES = 200000;

function beta1Factor(fc: number): number {
  if (fc <= 28) return 0.85;
  return Math.max(0.65, 0.85 - 0.05 * ((fc - 28) / 7));
}

function phiFromStrain(
  epsilonT: number,
  epsilonY: number
): {
  phi: number;
  ductilityClass: BeamCapacityResult["ductilityClass"];
} {
  if (epsilonT >= 0.005) {
    return { phi: 0.9, ductilityClass: "tension-controlled" };
  }
  if (epsilonT <= epsilonY) {
    return { phi: 0.65, ductilityClass: "compression-controlled" };
  }
  const phi =
    0.65 + (epsilonT - epsilonY) * (0.25 / (0.005 - epsilonY));
  return { phi, ductilityClass: "transition" };
}

export function checkBeamCapacity(
  input: BeamCapacityInput
): BeamCapacityResult {
  const { b, d, dPrime, fc, fy, As, AsPrime, Mu = null } = input;

  const beta1 = beta1Factor(fc);
  const epsilonY = fy / ES;
  const isDoublyReinforced = AsPrime > 0;

  const rho = As / (b * d);
  const rhoMin = Math.max(1.4 / fy, Math.sqrt(fc) / (4 * fy));
  const rhoB =
    ((0.85 * fc * beta1) / fy) * (600 / (600 + fy));
  const rhoMax = 0.75 * rhoB;

  let a: number;
  let c: number;
  let fsPrime: number | null = null;
  let compressionSteelYields: boolean | null = null;

  if (!isDoublyReinforced) {
    a = (As * fy) / (0.85 * fc * b);
    c = a / beta1;
  } else {
    const aAssumed =
      (As * fy - AsPrime * (fy - 0.85 * fc)) /
      (0.85 * fc * b);
    const cAssumed = aAssumed / beta1;
    const epsilonSPrimeAssumed =
      (0.003 * (cAssumed - dPrime)) / cAssumed;

    if (epsilonSPrimeAssumed >= epsilonY) {
      a = aAssumed;
      c = cAssumed;
      fsPrime = fy;
      compressionSteelYields = true;
    } else {
      const A = 0.85 * fc * b * beta1;
      const B =
        0.003 * ES * AsPrime - 0.85 * fc * AsPrime - As * fy;
      const C = -0.003 * ES * AsPrime * dPrime;
      const discriminant = B * B - 4 * A * C;
      c = (-B + Math.sqrt(discriminant)) / (2 * A);
      a = beta1 * c;
      fsPrime = (ES * 0.003 * (c - dPrime)) / c;
      compressionSteelYields = false;
    }
  }

  const epsilonT = (0.003 * (d - c)) / c;
  const { phi, ductilityClass } = phiFromStrain(
    epsilonT,
    epsilonY
  );

  let MnNmm: number;
  if (!isDoublyReinforced) {
    MnNmm = As * fy * (d - a / 2);
  } else {
    const Cc = 0.85 * fc * b * a;
    const CsPrime = AsPrime * ((fsPrime as number) - 0.85 * fc);
    MnNmm =
      Cc * (d - a / 2) + CsPrime * (d - dPrime);
  }

  const Mn = MnNmm / 1e6;
  const phiMn = phi * Mn;
  const appliedMu =
    Mu !== null && Number.isFinite(Mu) && Mu > 0 ? Mu : null;
  const hasMu = appliedMu !== null;
  const utilizationRatio = hasMu ? appliedMu / phiMn : null;
  const ok = hasMu ? phiMn >= appliedMu : null;

  let message: string;
  if (ductilityClass === "compression-controlled") {
    message =
      "Section is compression-controlled (brittle) — not recommended; increase steel ductility or reduce As.";
  } else if (!hasMu) {
    message = `Design capacity calculated — φMn = ${phiMn.toFixed(1)} kN·m. Enter Mu to perform an adequacy check.`;
  } else if (!ok) {
    message = `Section is INADEQUATE — φMn (${phiMn.toFixed(1)} kN·m) < Mu (${appliedMu.toFixed(1)} kN·m).`;
  } else {
    message = `Section is adequate — φMn (${phiMn.toFixed(1)} kN·m) ≥ Mu (${appliedMu.toFixed(1)} kN·m).`;
  }

  return {
    isDoublyReinforced,
    beta1,
    a,
    c,
    fsPrime,
    compressionSteelYields,
    epsilonT,
    epsilonY,
    phi,
    ductilityClass,
    rho,
    rhoMin,
    rhoMax,
    Mn,
    phiMn,
    Mu: appliedMu,
    utilizationRatio,
    ok,
    message,
  };
}

export function getBeamCapacitySolutionSteps(
  input: BeamCapacityInput,
  r: BeamCapacityResult
): BeamCapacitySolutionStep[] {
  const { b, d, dPrime, fc, fy, As, AsPrime } = input;

  const steps: BeamCapacitySolutionStep[] = [
    {
      label: "β1 factor",
      formula:
        fc <= 28
          ? "\\beta_1 = 0.85 \\quad (f'_c \\le 28 \\text{ MPa})"
          : "\\beta_1 = 0.85 - 0.05\\left[\\dfrac{f'_c-28}{7}\\right]",
      substitution:
        fc <= 28
          ? ""
          : `\\beta_1 = 0.85 - 0.05\\left[\\dfrac{${fc}-28}{7}\\right]`,
      result: `\\beta_1 = ${r.beta1.toFixed(3)}`,
    },
  ];

  if (!r.isDoublyReinforced) {
    steps.push(
      {
        label: "Depth of equivalent stress block, a",
        formula: "a = \\dfrac{A_s f_y}{0.85 f'_c b}",
        substitution: `a = \\dfrac{(${As})(${fy})}{0.85(${fc})(${b})}`,
        result: `a = ${r.a.toFixed(1)} \\text{ mm}`,
      },
      {
        label: "Neutral axis depth, c",
        formula: "c = \\dfrac{a}{\\beta_1}",
        substitution: `c = \\dfrac{${r.a.toFixed(1)}}{${r.beta1.toFixed(3)}}`,
        result: `c = ${r.c.toFixed(1)} \\text{ mm}`,
      }
    );
  } else {
    steps.push(
      {
        label: "Assume compression steel yields — solve for a",
        formula:
          "a = \\dfrac{A_s f_y - A_s'(f_y - 0.85f'_c)}{0.85 f'_c b}",
        substitution: `a = \\dfrac{(${As})(${fy}) - (${AsPrime})(${fy}-0.85(${fc}))}{0.85(${fc})(${b})}`,
        result: `a = ${r.a.toFixed(1)} \\text{ mm}, \\quad c = ${r.c.toFixed(1)} \\text{ mm}`,
      },
      {
        label: "Check compression steel strain",
        formula:
          "\\varepsilon_s' = \\dfrac{0.003(c-d')}{c} \\ ; \\ \\text{yields if } \\varepsilon_s' \\ge \\varepsilon_y",
        substitution: `d' = ${dPrime} \\text{ mm}, \\quad \\varepsilon_y = ${r.epsilonY.toFixed(5)}`,
        result: r.compressionSteelYields
          ? `\\text{Compression steel YIELDS} \\Rightarrow f_s' = f_y = ${fy} \\text{ MPa}`
          : `\\text{Compression steel does NOT yield} \\Rightarrow f_s' = ${r.fsPrime?.toFixed(1)} \\text{ MPa (recomputed via quadratic)}`,
      }
    );
  }

  steps.push(
    {
      label: "Tension steel strain and ductility check",
      formula: "\\varepsilon_t = \\dfrac{0.003(d-c)}{c}",
      substitution: `\\varepsilon_t = \\dfrac{0.003(${d}-${r.c.toFixed(1)})}{${r.c.toFixed(1)}}`,
      result: `\\varepsilon_t = ${r.epsilonT.toFixed(5)} \\Rightarrow \\text{${r.ductilityClass.toUpperCase().replace("-", " ")}}, \\ \\phi = ${r.phi.toFixed(3)}`,
    },
    {
      label: "Nominal moment capacity, Mn",
      formula: r.isDoublyReinforced
        ? "M_n = 0.85f'_c\\,b\\,a\\left(d-\\dfrac{a}{2}\\right) + A_s'(f_s'-0.85f'_c)(d-d')"
        : "M_n = A_s f_y\\left(d - \\dfrac{a}{2}\\right)",
      substitution: r.isDoublyReinforced
        ? `M_n = 0.85(${fc})(${b})(${r.a.toFixed(1)})\\left(${d}-\\dfrac{${r.a.toFixed(1)}}{2}\\right) + (${AsPrime})(${r.fsPrime?.toFixed(1)}-0.85(${fc}))(${d}-${dPrime})`
        : `M_n = (${As})(${fy})\\left(${d} - \\dfrac{${r.a.toFixed(1)}}{2}\\right)`,
      result: `M_n = ${r.Mn.toFixed(2)} \\text{ kN·m}`,
    },
    {
      label: "Design moment capacity, φMn",
      formula: "\\phi M_n = \\phi \\times M_n",
      substitution: `\\phi M_n = ${r.phi.toFixed(3)} \\times ${r.Mn.toFixed(2)}`,
      result: `\\phi M_n = ${r.phiMn.toFixed(2)} \\text{ kN·m}`,
    }
  );

  if (r.Mu !== null && r.ok !== null) {
    steps.push({
      label: "Adequacy check",
      formula: "\\phi M_n \\ge M_u \\ ?",
      substitution: `\\phi M_n = ${r.phiMn.toFixed(2)} \\text{ kN·m vs. } M_u = ${r.Mu.toFixed(2)} \\text{ kN·m}`,
      result: r.ok
        ? "\\text{OK — section adequate}"
        : "\\text{NOT OK — section inadequate}",
    });
  }

  return steps;
}
