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
  compressionSteelInTension: boolean | null;
  compressionSteelTensionYields: boolean | null;
  epsilonSPrime: number | null;
  tensionSteelYields: boolean;
  tensionStress: number;
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
  rhoAdequate: boolean;
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
  resultKind?: "math" | "text";
}

const ES = 200000;
const CONCRETE_STRAIN = 0.003;
const ELASTIC_STRESS_COEFFICIENT = CONCRETE_STRAIN * ES;

function beta1Factor(fc: number): number {
  if (fc <= 28) return 0.85;
  return Math.max(0.65, 0.85 - 0.05 * ((fc - 28) / 7));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function positiveQuadraticRoot(
  a: number,
  b: number,
  c: number
): number | null {
  const discriminant = b * b - 4 * a * c;
  if (a === 0 || discriminant < 0) return null;

  const root = (-b + Math.sqrt(discriminant)) / (2 * a);
  return Number.isFinite(root) && root > 0 ? root : null;
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
  const rhoAdequate = rho >= rhoMin && rho <= rhoMax;

  let a: number;
  let c: number;
  let fsPrime: number | null = null;
  let compressionSteelYields: boolean | null = null;
  let compressionSteelInTension: boolean | null = null;
  let compressionSteelTensionYields: boolean | null = null;
  let epsilonSPrime: number | null = null;

  if (!isDoublyReinforced) {
    const aAssumed = (As * fy) / (0.85 * fc * b);
    const cAssumed = aAssumed / beta1;
    const epsilonTAssumed =
      (CONCRETE_STRAIN * (d - cAssumed)) / cAssumed;

    if (epsilonTAssumed >= epsilonY) {
      a = aAssumed;
      c = cAssumed;
    } else {
      // Re-solve C = T with elastic tension steel:
      // As[Es(0.003)(d-c)/c] = 0.85fc'(beta1 c)b.
      const cElastic = positiveQuadraticRoot(
        0.85 * fc * b * beta1,
        As * ELASTIC_STRESS_COEFFICIENT,
        -As * ELASTIC_STRESS_COEFFICIENT * d
      );

      c = cElastic ?? cAssumed;
      a = beta1 * c;
    }
  } else {
    const aAssumed =
      (As * fy - AsPrime * fy) /
      (0.85 * fc * b);
    const cAssumed = aAssumed / beta1;

    // Try the possible steel states from the module algorithm. The force
    // equilibrium is Cc + Cs' = T, where Cs' is the full top-steel force.
    const k = 0.85 * fc * b * beta1;
    const s = ELASTIC_STRESS_COEFFICIENT;
    const candidates: Array<{
      c: number;
      bottomYields: boolean;
      topYields: boolean;
      topInTension: boolean;
    }> = [];
    const addCandidate = (
      bottomYields: boolean,
      topYields: boolean,
      topInTension: boolean,
      candidateC: number | null
    ) => {
      if (candidateC === null || candidateC <= 0 || candidateC >= d) {
        return;
      }

      const tensionStress =
        (s * (d - candidateC)) / candidateC;
      const compressionStress =
        (s * (candidateC - dPrime)) / candidateC;
      const bottomActuallyYields = tensionStress >= fy;
      const topActuallyYields = Math.abs(compressionStress) >= fy;
      const topActuallyInTension = compressionStress < 0;

      if (
        bottomActuallyYields === bottomYields &&
        topActuallyYields === topYields &&
        topActuallyInTension === topInTension
      ) {
        candidates.push({
          c: candidateC,
          bottomYields,
          topYields,
          topInTension,
        });
      }
    };

    // Bottom steel yields; top steel yields in compression.
    addCandidate(
      true,
      true,
      false,
      (As * fy - AsPrime * fy) / k
    );
    // Bottom steel is elastic; top steel yields in compression.
    addCandidate(
      false,
      true,
      false,
      positiveQuadraticRoot(k, As * s + AsPrime * fy, -As * s * d)
    );
    // Bottom steel yields; top steel is elastic, in compression or tension.
    const bottomYieldTopElasticC = positiveQuadraticRoot(
      k,
      AsPrime * s - As * fy,
      -AsPrime * s * dPrime
    );
    addCandidate(
      true,
      false,
      false,
      bottomYieldTopElasticC
    );
    addCandidate(
      true,
      false,
      true,
      bottomYieldTopElasticC
    );
    const bottomElasticTopElasticC = positiveQuadraticRoot(
      k,
      AsPrime * s + As * s,
      -(AsPrime * s * dPrime + As * s * d)
    );
    addCandidate(
      false,
      false,
      false,
      bottomElasticTopElasticC
    );
    addCandidate(
      false,
      false,
      true,
      bottomElasticTopElasticC
    );
    // Top steel yields in tension (c < d').
    addCandidate(
      true,
      true,
      true,
      (As * fy + AsPrime * fy) / k
    );
    addCandidate(
      false,
      true,
      true,
      positiveQuadraticRoot(k, As * s - AsPrime * fy, -As * s * d)
    );

    const selected = candidates[0] ?? {
      c: cAssumed,
      bottomYields: true,
      topYields: true,
      topInTension: false,
    };
    c = selected.c;
    a = beta1 * c;
    const compressionStress =
      (s * (c - dPrime)) / c;
    fsPrime = selected.topYields
      ? selected.topInTension
        ? -fy
        : fy
      : clamp(compressionStress, -fy, fy);
    epsilonSPrime = (CONCRETE_STRAIN * (c - dPrime)) / c;
    compressionSteelYields = selected.topYields && !selected.topInTension;
    compressionSteelInTension = compressionStress < 0;
    compressionSteelTensionYields = selected.topYields && selected.topInTension;
  }

  const epsilonT = (CONCRETE_STRAIN * (d - c)) / c;
  const tensionStress = clamp(ES * epsilonT, -fy, fy);
  const tensionSteelYields = ES * epsilonT >= fy;
  const { phi, ductilityClass } = phiFromStrain(
    epsilonT,
    epsilonY
  );

  let MnNmm: number;
  if (!isDoublyReinforced) {
    MnNmm = As * tensionStress * (d - a / 2);
  } else {
    const Cc = 0.85 * fc * b * a;
    const CsPrime = AsPrime * (fsPrime as number);
    MnNmm =
      Cc * (d - a / 2) + CsPrime * (d - dPrime);
  }

  const Mn = MnNmm / 1e6;
  const phiMn = phi * Mn;
  const appliedMu =
    Mu !== null && Number.isFinite(Mu) && Mu > 0 ? Mu : null;
  const hasMu = appliedMu !== null;
  const utilizationRatio = hasMu ? appliedMu / phiMn : null;
  const ok = hasMu ? phiMn >= appliedMu && rhoAdequate : null;

  let message: string;
  if (ductilityClass === "compression-controlled") {
    message =
      "Section is compression-controlled (brittle) - not recommended; increase steel ductility or reduce As.";
  } else if (!hasMu) {
    message = rhoAdequate
      ? `Design capacity calculated - phi Mn = ${phiMn.toFixed(1)} kN-m. Enter Mu to perform an adequacy check.`
      : "Section is INADEQUATE - reinforcement ratio is outside the permitted range.";
  } else if (!ok) {
    message = `Section is INADEQUATE - phi Mn (${phiMn.toFixed(1)} kN-m) < Mu (${appliedMu.toFixed(1)} kN-m).`;
  } else {
    message = `Section is adequate - phi Mn (${phiMn.toFixed(1)} kN-m) >= Mu (${appliedMu.toFixed(1)} kN-m).`;
  }

  return {
    isDoublyReinforced,
    beta1,
    a,
    c,
    fsPrime,
    compressionSteelYields,
    compressionSteelInTension,
    compressionSteelTensionYields,
    epsilonSPrime,
    tensionSteelYields,
    tensionStress,
    epsilonT,
    epsilonY,
    phi,
    ductilityClass,
    rho,
    rhoMin,
    rhoMax,
    rhoAdequate,
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
  const assumedA = r.isDoublyReinforced
    ? (As * fy - AsPrime * fy) / (0.85 * fc * b)
    : (As * fy) / (0.85 * fc * b);
  const assumedC = assumedA / r.beta1;
  const assumedCIsValid = Number.isFinite(assumedC) && assumedC > 0;
  const assumedEpsilonT = assumedCIsValid
    ? (CONCRETE_STRAIN * (d - assumedC)) / assumedC
    : Number.NaN;
  const assumedEpsilonSPrime = assumedCIsValid
    ? (CONCRETE_STRAIN * (assumedC - dPrime)) / assumedC
    : Number.NaN;
  const assumedTensionYields =
    assumedCIsValid && assumedEpsilonT >= r.epsilonY;
  const assumedCompressionYields =
    assumedCIsValid && assumedEpsilonSPrime >= r.epsilonY;
  const tensionStressFormula = r.tensionSteelYields
    ? "f_s=f_y"
    : "f_s=600(d-c)/c";
  const compressionStressFormula = r.compressionSteelYields
    ? "f'_s=f_y"
    : r.compressionSteelTensionYields
      ? "f'_s=-f_y"
      : "f'_s=600(c-d')/c";
  const finalTopSteelDescription = r.compressionSteelYields
    ? "top steel yields in compression"
    : r.compressionSteelTensionYields
      ? "top steel yields in tension"
      : r.compressionSteelInTension
        ? "top steel is in tension and remains elastic"
        : "top steel is in compression and remains elastic";

  const steps: BeamCapacitySolutionStep[] = [
    {
      label: "Given data and section classification",
      formula: "b,\ d,\ d',\ f'_c,\ f_y,\ A_s,\ A'_s,\ E_s=200{,}000\\text{ MPa}",
      substitution: `b=${b}\\text{ mm},\\ d=${d}\\text{ mm},\\ d'=${dPrime}\\text{ mm},\\ f'_c=${fc}\\text{ MPa},\\ f_y=${fy}\\text{ MPa},\\ A_s=${As}\\text{ mm}^2,\\ A'_s=${AsPrime}\\text{ mm}^2`,
      result: r.isDoublyReinforced ? "Doubly reinforced section: top compression steel and bottom tension steel." : "Singly reinforced section: bottom tension steel only.",
      resultKind: "text",
    },
    {
      label: "Steel yield strain",
      formula: "\\varepsilon_y=\\dfrac{f_y}{E_s}",
      substitution: `\\varepsilon_y=\\dfrac{${fy}}{200000}`,
      result: `\\varepsilon_y=${r.epsilonY.toFixed(6)}`,
    },
    {
      label: "Tension steel area and reinforcement ratio checks",
      formula: "\\rho=\\dfrac{A_s}{bd},\\quad \\rho_{min}=\\max\\left(\\dfrac{1.4}{f_y},\\dfrac{\\sqrt{f'_c}}{4f_y}\\right),\\quad \\rho_{max}=0.75\\rho_b",
      substitution: `\\rho=\\dfrac{${As}}{(${b})(${d})}=${r.rho.toFixed(6)},\\quad \\rho_{min}=${r.rhoMin.toFixed(6)},\\quad \\rho_{max}=${r.rhoMax.toFixed(6)}`,
      result: `\\rho_{min}\\le\\rho\\le\\rho_{max}: ${r.rho >= r.rhoMin && r.rho <= r.rhoMax ? "PASS" : "FAIL"}`,
    },
    {
      label: "Beta1 factor",
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
        label: "Assume tension steel yields - calculate a and c",
        formula: "a = \\dfrac{A_s f_y}{0.85 f'_c b}",
        substitution: `a = \\dfrac{(${As})(${fy})}{0.85(${fc})(${b})}`,
        result: `a = ${assumedA.toFixed(1)} \\text{ mm}`,
      },
      {
        label: "Initial neutral axis depth, c",
        formula: "c = \\dfrac{a}{\\beta_1}",
        substitution: `c = \\dfrac{${assumedA.toFixed(1)}}{${r.beta1.toFixed(3)}}`,
        result: `c = ${assumedC.toFixed(1)} \\text{ mm}`,
      },
      {
        label: "Check the tension-steel yield assumption",
        formula: "\\varepsilon_t=\\dfrac{0.003(d-c)}{c};\\quad \\varepsilon_t\\ge\\varepsilon_y\\Rightarrow f_s=f_y",
        substitution: `\\varepsilon_t=\\dfrac{0.003(${d}-${assumedC.toFixed(1)})}{${assumedC.toFixed(1)}}=${assumedEpsilonT.toFixed(6)},\\quad \\varepsilon_y=${r.epsilonY.toFixed(6)}`,
        result: assumedTensionYields
          ? "Initial assumption is valid: tension steel yields."
          : "Initial assumption fails: tension steel does not yield; re-solve c using elastic f_s.",
        resultKind: "text",
      }
    );
    if (!assumedTensionYields) {
      steps.push({
        label: "Re-solve c from C = T with elastic tension steel",
        formula:
          "A_s f_s=0.85f'_c b\\beta_1c,\\quad f_s=E_s\\varepsilon_s=\\dfrac{600(d-c)}{c}",
        substitution: `(${As})\\left[\\dfrac{600(${d}-c)}{c}\\right]=0.85(${fc})(${b})(${r.beta1.toFixed(3)})c`,
        result: `c = ${r.c.toFixed(1)} mm; a = ${r.a.toFixed(1)} mm; f_s = ${r.tensionStress.toFixed(1)} MPa.`,
        resultKind: "text",
      });
    }
  } else {
    steps.push(
      {
        label: "Assume tension and compression steel yield - solve for a",
        formula:
          "a = \\dfrac{A_s f_y - A'_s f_y}{0.85 f'_c b}",
        substitution: `a = \\dfrac{(${As})(${fy}) - (${AsPrime})(${fy})}{0.85(${fc})(${b})}`,
        result: `a = ${assumedA.toFixed(1)} \\text{ mm}, \\quad c = ${assumedC.toFixed(1)} \\text{ mm}`,
      },
      {
        label: "Check the steel yield assumptions",
        formula:
          "\\varepsilon_t=\\dfrac{0.003(d-c)}{c},\\quad \\varepsilon_s'=\\dfrac{0.003(c-d')}{c}",
        substitution: assumedCIsValid
          ? `\\varepsilon_t=${assumedEpsilonT.toFixed(6)},\\quad \\varepsilon_s'=${assumedEpsilonSPrime.toFixed(6)},\\quad \\varepsilon_y=${r.epsilonY.toFixed(6)}`
          : `\\text{Initial }c=${assumedC.toFixed(1)}\\text{ mm is not positive; the assumed state is invalid.}`,
        result: assumedCIsValid
          ? `Initial assumptions: tension steel ${assumedTensionYields ? "yields" : "does not yield"}; compression steel ${assumedCompressionYields ? "yields" : "does not yield"}.`
          : "Initial yield assumptions are invalid because they produce no positive neutral-axis depth; repeat C = T using the actual steel states.",
        resultKind: "text",
      },
      {
        label: "Final C = T solution for the actual steel stresses",
        formula:
          `0.85f'_c b\\beta_1c+A'_s f'_s=A_s f_s;\\quad ${tensionStressFormula},\\quad ${compressionStressFormula}`,
        substitution: `c=${r.c.toFixed(1)}\\text{ mm},\\quad f_s=${r.tensionStress.toFixed(1)}\\text{ MPa},\\quad f_s'=${r.fsPrime?.toFixed(1)}\\text{ MPa}`,
        result: `a = ${r.a.toFixed(1)} mm. Tension steel ${r.tensionSteelYields ? "yields" : "does not yield"}; ${finalTopSteelDescription}.`,
        resultKind: "text",
      }
    );
  }

  steps.push(
    {
      label: "Tension steel strain and ductility check",
      formula: "\\varepsilon_t = \\dfrac{0.003(d-c)}{c}",
      substitution: `\\varepsilon_t = \\dfrac{0.003(${d}-${r.c.toFixed(1)})}{${r.c.toFixed(1)}}`,
      result: `epsilon_t = ${r.epsilonT.toFixed(5)}; f_s = ${r.tensionStress.toFixed(1)} MPa. Tension steel ${r.tensionSteelYields ? "yields" : "does not yield"}.`,
      resultKind: "text",
    },
    {
      label: "Tension steel yield comparison",
      formula: "f_s=E_s\\varepsilon_t\\ (|f_s|\\le f_y);\\quad |\\varepsilon_t|\\ge\\varepsilon_y\\Rightarrow\\text{yield}",
      substitution: `E_s\\varepsilon_t=200000(${r.epsilonT.toFixed(5)})=${r.tensionStress.toFixed(1)}\\text{ MPa},\\quad f_y=${fy}\\text{ MPa}`,
      result: `${r.tensionSteelYields ? "Tension steel yields at the bottom." : "Tension steel remains elastic at the bottom; capacity stress is limited to the calculated elastic stress."}`,
      resultKind: "text",
    },
    {
      label: "Ductility region and strength reduction factor",
      formula: "\\varepsilon_t\\ge0.005\\Rightarrow\\phi=0.90;\\quad\\varepsilon_t\\le\\varepsilon_y\\Rightarrow\\phi=0.65;\\quad\\text{otherwise transition interpolation}",
      substitution: `\\varepsilon_t=${r.epsilonT.toFixed(5)},\\quad\\varepsilon_y=${r.epsilonY.toFixed(6)}`,
      result: `Ductility class: ${r.ductilityClass.replace("-", " ")}; phi = ${r.phi.toFixed(3)}.`,
      resultKind: "text",
    },
    {
      label: "Nominal moment capacity, Mn",
      formula: r.isDoublyReinforced
        ? "M_n = 0.85f'_c\\,b\\,a\\left(d-\\dfrac{a}{2}\\right) + A'_s f'_s(d-d')"
        : "M_n = A_s f_s\\left(d - \\dfrac{a}{2}\\right)",
      substitution: r.isDoublyReinforced
        ? `M_n = 0.85(${fc})(${b})(${r.a.toFixed(1)})\\left(${d}-\\dfrac{${r.a.toFixed(1)}}{2}\\right) + (${AsPrime})(${r.fsPrime?.toFixed(1)})(${d}-${dPrime})`
        : `M_n = (${As})(${r.tensionStress.toFixed(1)})\\left(${d} - \\dfrac{${r.a.toFixed(1)}}{2}\\right)`,
      result: `M_n = ${r.Mn.toFixed(2)} \\text{ kN·m}`,
    },
    {
      label: "Internal force equilibrium and moment components",
      formula: r.isDoublyReinforced
        ? "C_c=0.85f'_cba,\\quad C'_s=A'_s f'_s,\\quad T=A_sf_s;\\quad M_n=C_c(d-a/2)+C'_s(d-d')"
        : "C_c=0.85f'_cba,\\quad T=A_sf_s,\\quad C_c=T;\\quad M_n=T(d-a/2)",
      substitution: r.isDoublyReinforced
        ? `C_c=0.85(${fc})(${b})(${r.a.toFixed(1)}),\\quad C'_s=(${AsPrime})(${r.fsPrime?.toFixed(1)}),\\quad T=(${As})(${r.tensionStress.toFixed(1)})`
        : `C_c=0.85(${fc})(${b})(${r.a.toFixed(1)})=T=(${As})(${r.tensionStress.toFixed(1)})`,
      result: "Resultant forces and lever arms are included in the nominal moment above; signs follow tension/compression state.",
      resultKind: "text",
    },
    {
      label: "Design moment capacity (phi Mn)",
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
        ? "OK - section adequate."
        : "NOT OK - section inadequate.",
      resultKind: "text",
    });
  }

  return steps;
}
