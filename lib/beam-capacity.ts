export interface BeamCapacityInput {
  b: number;
  d: number;
  dPrime: number;
  fc: number;
  fy: number;
  As: number;
  AsPrime: number;
  /** Optional discrete tension layers. Depth is measured from the compression face. */
  tensionLayers?: Array<{ area: number; depth: number; barCount?: number }>;
  detailing?: {
    depthsFromOverall: boolean;
    overallDepth: number;
    clearCover: number;
    stirrupDiameter: number;
    tensionBarDiameter: number;
    compressionBarDiameter: number;
    tensionBarsPerLayer: number[];
    compressionBarsPerLayer: number[];
  };
  Mu?: number | null;
}

export interface BeamCapacityTensionLayerResult {
  index: number;
  area: number;
  depth: number;
  strain: number;
  stress: number;
  yields: boolean;
  force: number;
  barCount: number | null;
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
  As: number;
  d: number;
  dExtremeTension: number;
  tensionLayers: BeamCapacityTensionLayerResult[];
}

export interface BeamCapacitySolutionStep {
  label: string;
  formula: string;
  substitution: string;
  result: string;
  resultKind?: "math" | "text";
  reference?: string;
  explanation?: string;
  status?: "pass" | "fail" | "info";
}

const ES = 200000;
const CONCRETE_STRAIN = 0.003;
const ELASTIC_STRESS_COEFFICIENT = CONCRETE_STRAIN * ES;
const RHO_MAX = 0.025;

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

function bracketedRoot(
  fn: (value: number) => number,
  minimum: number,
  maximum: number,
): number | null {
  const divisions = 800;
  let left = minimum;
  let leftValue = fn(left);
  for (let index = 1; index <= divisions; index += 1) {
    const right = minimum + ((maximum - minimum) * index) / divisions;
    const rightValue = fn(right);
    if (Number.isFinite(leftValue) && Number.isFinite(rightValue) && leftValue * rightValue <= 0) {
      let low = left;
      let high = right;
      for (let iteration = 0; iteration < 100; iteration += 1) {
        const midpoint = (low + high) / 2;
        const midpointValue = fn(midpoint);
        if (Math.abs(midpointValue) < 1e-7) return midpoint;
        if (fn(low) * midpointValue <= 0) high = midpoint;
        else low = midpoint;
      }
      return (low + high) / 2;
    }
    left = right;
    leftValue = rightValue;
  }
  return null;
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
  const { b, d: enteredD, dPrime, fc, fy, As: enteredAs, AsPrime, Mu = null } = input;
  const suppliedLayers = (input.tensionLayers ?? []).filter(
    (layer) => Number.isFinite(layer.area) && layer.area > 0 && Number.isFinite(layer.depth) && layer.depth > 0,
  );
  const tensionLayerInput = suppliedLayers.length > 0
    ? suppliedLayers
    : [{ area: enteredAs, depth: enteredD, barCount: undefined }];
  const As = tensionLayerInput.reduce((sum, layer) => sum + layer.area, 0);
  const d = tensionLayerInput.reduce((sum, layer) => sum + layer.area * layer.depth, 0) / As;
  const dExtremeTension = Math.max(...tensionLayerInput.map((layer) => layer.depth));
  const hasMultipleTensionLayers = tensionLayerInput.length > 1;

  const beta1 = beta1Factor(fc);
  const epsilonY = fy / ES;
  const isDoublyReinforced = AsPrime > 0;

  const rho = As / (b * d);
  const rhoMin = Math.max(1.4 / fy, Math.sqrt(fc) / (4 * fy));
  const rhoMax = RHO_MAX;
  const rhoAdequate = rho >= rhoMin && rho <= rhoMax;

  let a: number;
  let c: number;
  let fsPrime: number | null = null;
  let compressionSteelYields: boolean | null = null;
  let compressionSteelInTension: boolean | null = null;
  let compressionSteelTensionYields: boolean | null = null;
  let epsilonSPrime: number | null = null;

  if (hasMultipleTensionLayers) {
    const equilibriumResidual = (candidateC: number) => {
      const concreteCompression = 0.85 * fc * b * beta1 * candidateC;
      const compressionSteelStress = isDoublyReinforced
        ? clamp((ELASTIC_STRESS_COEFFICIENT * (candidateC - dPrime)) / candidateC, -fy, fy)
        : 0;
      const tensionSteelForce = tensionLayerInput.reduce((sum, layer) => {
        const stress = clamp((ELASTIC_STRESS_COEFFICIENT * (layer.depth - candidateC)) / candidateC, -fy, fy);
        return sum + layer.area * stress;
      }, 0);
      return concreteCompression + AsPrime * compressionSteelStress - tensionSteelForce;
    };
    c = bracketedRoot(equilibriumResidual, 1e-6, dExtremeTension * (1 - 1e-9)) ?? dExtremeTension / 2;
    a = beta1 * c;
    if (isDoublyReinforced) {
      epsilonSPrime = (CONCRETE_STRAIN * (c - dPrime)) / c;
      fsPrime = clamp(ES * epsilonSPrime, -fy, fy);
      compressionSteelInTension = fsPrime < 0;
      compressionSteelYields = fsPrime >= fy - 1e-9;
      compressionSteelTensionYields = fsPrime <= -fy + 1e-9;
    }
  } else if (!isDoublyReinforced) {
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

  const tensionLayers = tensionLayerInput.map((layer, index) => {
    const strain = (CONCRETE_STRAIN * (layer.depth - c)) / c;
    const stress = clamp(ES * strain, -fy, fy);
    return {
      index: index + 1,
      area: layer.area,
      depth: layer.depth,
      strain,
      stress,
      yields: Math.abs(stress) >= fy - 1e-9,
      force: layer.area * stress,
      barCount: Number.isFinite(layer.barCount) && (layer.barCount ?? 0) > 0
        ? Number(layer.barCount)
        : null,
    };
  });
  const extremeLayer = tensionLayers.reduce((deepest, layer) => layer.depth > deepest.depth ? layer : deepest);
  const epsilonT = extremeLayer.strain;
  const tensionStress = clamp(ES * epsilonT, -fy, fy);
  const tensionSteelYields = ES * epsilonT >= fy;
  const { phi, ductilityClass } = phiFromStrain(
    epsilonT,
    epsilonY
  );

  let MnNmm: number;
  if (hasMultipleTensionLayers) {
    const concreteCompression = 0.85 * fc * b * a;
    const compressionSteelForce = isDoublyReinforced ? AsPrime * (fsPrime as number) : 0;
    MnNmm = tensionLayers.reduce((sum, layer) => sum + layer.force * layer.depth, 0)
      - concreteCompression * a / 2
      - compressionSteelForce * dPrime;
  } else if (!isDoublyReinforced) {
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
      "Section is compression-controlled (brittle) — increase section ductility or reduce Aₛ.";
  } else if (!hasMu) {
    message = rhoAdequate
      ? `Design capacity calculated: φMₙ = ${phiMn.toFixed(1)} kN·m. Enter Mᵤ to perform an adequacy check.`
      : `Section is INADEQUATE: ρ = ${rho.toFixed(5)} is outside the permitted range ${rhoMin.toFixed(5)} ≤ ρ ≤ 0.025.`;
  } else if (!rhoAdequate) {
    message = `Section is INADEQUATE: ρ = ${rho.toFixed(5)} is outside the permitted range ${rhoMin.toFixed(5)} ≤ ρ ≤ 0.025.`;
  } else if (phiMn < appliedMu) {
    message = `Section is INADEQUATE: φMₙ = ${phiMn.toFixed(1)} kN·m < Mᵤ = ${appliedMu.toFixed(1)} kN·m.`;
  } else {
    message = `Section is adequate: φMₙ = ${phiMn.toFixed(1)} kN·m ≥ Mᵤ = ${appliedMu.toFixed(1)} kN·m.`;
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
    As,
    d,
    dExtremeTension,
    tensionLayers,
  };
}

export function getBeamCapacitySolutionSteps(
  input: BeamCapacityInput,
  r: BeamCapacityResult
): BeamCapacitySolutionStep[] {
  const { b, dPrime, fc, fy, AsPrime } = input;
  const d = r.d;
  const As = r.As;
  const hasMultipleTensionLayers = r.tensionLayers.length > 1;
  const hasLayerBarCounts = r.tensionLayers.every((layer) => layer.barCount !== null);
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
  const detailing = input.detailing;

  const steps: BeamCapacitySolutionStep[] = [
    {
      label: "Given data and section classification",
      formula: "b,\\ d,\\ d',\\ f'_c,\\ f_y,\\ A_s,\\ A'_s,\\ E_s=200{,}000\\text{ MPa}",
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
      formula: "\\rho=\\dfrac{A_s}{bd},\\quad \\rho_{min}=\\max\\left(\\dfrac{1.4}{f_y},\\dfrac{\\sqrt{f'_c}}{4f_y}\\right),\\quad \\rho_{max}=0.025",
      substitution: `\\rho=\\dfrac{${As}}{(${b})(${d})}=${r.rho.toFixed(6)},\\quad \\rho_{min}=${r.rhoMin.toFixed(6)},\\quad \\rho_{max}=0.025`,
      result: `\\rho_{min}\\le\\rho\\le\\rho_{max}: ${r.rho >= r.rhoMin && r.rho <= r.rhoMax ? "PASS" : "FAIL"}`,
      reference: "NSCP 2015 Sections 409.6.1.2 and 418.6.3.1 / ACI 318-14 Sections 9.6.1.2 and 18.6.3.1.",
      explanation: "The maximum reinforcement ratio used by this calculator is the fixed special moment-frame beam limit of 0.025.",
      status: r.rhoAdequate ? "pass" : "fail",
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

  if (detailing?.depthsFromOverall) {
    const firstTensionDepth = detailing.overallDepth - detailing.clearCover - detailing.stirrupDiameter - detailing.tensionBarDiameter / 2;
    const tensionDepthFormula = detailing.tensionBarsPerLayer.length > 1
      ? "d_1=h-C_c-d_{st}-\\dfrac{d_b}{2};\\quad d_2=d_1-(d_b+25\\text{ mm})"
      : "d=h-C_c-d_{st}-\\dfrac{d_b}{2}";
    let depthFormula = tensionDepthFormula;
    let depthSubstitution = detailing.tensionBarsPerLayer.length > 1
      ? `d_1=${detailing.overallDepth}-${detailing.clearCover}-${detailing.stirrupDiameter}-${detailing.tensionBarDiameter}/2=${firstTensionDepth.toFixed(1)}\\text{ mm};\\quad d_2=${firstTensionDepth.toFixed(1)}-(${detailing.tensionBarDiameter}+25)=${r.tensionLayers[1].depth.toFixed(1)}\\text{ mm}`
      : `d=${detailing.overallDepth}-${detailing.clearCover}-${detailing.stirrupDiameter}-${detailing.tensionBarDiameter}/2=${r.d.toFixed(1)}\\text{ mm}`;
    if (r.isDoublyReinforced) {
      const firstCompressionDepth = detailing.clearCover + detailing.stirrupDiameter + detailing.compressionBarDiameter / 2;
      depthFormula += detailing.compressionBarsPerLayer.length > 1
        ? ";\\quad d'_1=C_c+d_{st}+\\dfrac{d'_b}{2};\\quad d'_2=d'_1+(d'_b+25\\text{ mm});\\quad d'=\\dfrac{\\sum n'_i d'_i}{\\sum n'_i}"
        : ";\\quad d'=C_c+d_{st}+\\dfrac{d'_b}{2}";
      depthSubstitution += detailing.compressionBarsPerLayer.length > 1
        ? `;\\quad d'_1=${detailing.clearCover}+${detailing.stirrupDiameter}+${detailing.compressionBarDiameter}/2=${firstCompressionDepth.toFixed(1)}\\text{ mm};\\quad d'_2=${firstCompressionDepth.toFixed(1)}+(${detailing.compressionBarDiameter}+25)=${(firstCompressionDepth + detailing.compressionBarDiameter + 25).toFixed(1)}\\text{ mm};\\quad d'=${dPrime.toFixed(1)}\\text{ mm}`
        : `;\\quad d'=${detailing.clearCover}+${detailing.stirrupDiameter}+${detailing.compressionBarDiameter}/2=${dPrime.toFixed(1)}\\text{ mm}`;
    }
    steps.splice(1, 0, {
      label: "Reinforcement-layer depths from the section geometry",
      formula: depthFormula,
      substitution: depthSubstitution,
      result: detailing.tensionBarsPerLayer.length > 1
        ? `${r.tensionLayers.map((layer) => `d_${layer.index}=${layer.depth.toFixed(1)}\\text{ mm}`).join(",\\quad ")};\\quad s_{v,clear}=25\\text{ mm}`
        : `d=${r.d.toFixed(1)}\\text{ mm}`,
      reference: "NSCP 2015 Section 425.2.2 / ACI 318-14 Section 25.2.2.",
      explanation: "Each depth is measured from the extreme compression face to that bar layer. For two equal-diameter rows, the center-to-center distance is the bar diameter plus the fixed 25 mm clear gap.",
    });

  }

  if (detailing) {
    const largestTensionRow = Math.max(...detailing.tensionBarsPerLayer);
    const insideWidth = b - 2 * (detailing.clearCover + detailing.stirrupDiameter);
    const minimumClear = Math.max(25, detailing.tensionBarDiameter);
    const providedClear = largestTensionRow > 1
      ? (insideWidth - largestTensionRow * detailing.tensionBarDiameter) / (largestTensionRow - 1)
      : null;
    const spacingPass = providedClear === null
      ? insideWidth >= detailing.tensionBarDiameter
      : providedClear >= minimumClear;
    steps.push({
      label: "Clear spacing of the entered tension-bar arrangement",
      formula: "b_{inside}=b-2(C_c+d_{st});\\quad s_{clear,min}=\\max(25\\text{ mm},d_b);\\quad s_{clear}=\\dfrac{b_{inside}-n d_b}{n-1}",
      substitution: providedClear === null
        ? `b_{inside}=${b}-2(${detailing.clearCover}+${detailing.stirrupDiameter})=${insideWidth.toFixed(1)}\\text{ mm};\\quad n=1\\text{ in the largest row}`
        : `b_{inside}=${b}-2(${detailing.clearCover}+${detailing.stirrupDiameter})=${insideWidth.toFixed(1)}\\text{ mm};\\quad s_{clear}=\\dfrac{${insideWidth.toFixed(1)}-${largestTensionRow}(${detailing.tensionBarDiameter})}{${largestTensionRow}-1}=${providedClear.toFixed(1)}\\text{ mm};\\quad s_{clear,min}=${minimumClear.toFixed(1)}\\text{ mm}`,
      result: spacingPass ? "The entered tension-bar arrangement satisfies the minimum clear spacing." : "The entered tension-bar arrangement does not satisfy the minimum clear spacing.",
      resultKind: "text",
      reference: "NSCP 2015 Section 425.2.1 / ACI 318-14 Section 25.2.1.",
      explanation: "Clear spacing is measured between adjacent bar surfaces. Each row is checked using the largest entered bar count.",
      status: spacingPass ? "pass" : "fail",
    });

    if (r.isDoublyReinforced && detailing.compressionBarsPerLayer.length > 0) {
      const largestCompressionRow = Math.max(...detailing.compressionBarsPerLayer);
      const minimumCompressionClear = Math.max(25, detailing.compressionBarDiameter);
      const providedCompressionClear = largestCompressionRow > 1
        ? (insideWidth - largestCompressionRow * detailing.compressionBarDiameter) / (largestCompressionRow - 1)
        : null;
      const compressionSpacingPass = providedCompressionClear === null
        ? insideWidth >= detailing.compressionBarDiameter
        : providedCompressionClear >= minimumCompressionClear;
      steps.push({
        label: "Clear spacing of the entered compression-bar arrangement",
        formula: "s'_{clear,min}=\\max(25\\text{ mm},d'_b);\\quad s'_{clear}=\\dfrac{b_{inside}-n'd'_b}{n'-1}",
        substitution: providedCompressionClear === null
          ? `b_{inside}=${insideWidth.toFixed(1)}\\text{ mm};\\quad n'=1\\text{ in the largest row}`
          : `s'_{clear}=\\dfrac{${insideWidth.toFixed(1)}-${largestCompressionRow}(${detailing.compressionBarDiameter})}{${largestCompressionRow}-1}=${providedCompressionClear.toFixed(1)}\\text{ mm};\\quad s'_{clear,min}=${minimumCompressionClear.toFixed(1)}\\text{ mm}`,
        result: compressionSpacingPass ? "The entered compression-bar arrangement satisfies the minimum clear spacing." : "The entered compression-bar arrangement does not satisfy the minimum clear spacing.",
        resultKind: "text",
        reference: "NSCP 2015 Section 425.2.1 / ACI 318-14 Section 25.2.1.",
        explanation: "The same inside-stirrup width is used for the top reinforcement rows.",
        status: compressionSpacingPass ? "pass" : "fail",
      });
    }
  }

  if (hasMultipleTensionLayers) {
    steps.splice(detailing?.depthsFromOverall ? 2 : 1, 0, {
      label: "Individual layer depths and combined effective depth",
      formula: "A_{si}=n_iA_{bi},\\quad d=\\dfrac{\\sum n_iA_{bi}d_i}{\\sum n_iA_{bi}}",
      substitution: hasLayerBarCounts
        ? `d=\\dfrac{${r.tensionLayers.map((layer) => `(${layer.barCount})(${(layer.area / Number(layer.barCount)).toFixed(2)})(${layer.depth.toFixed(1)})`).join("+")}}{${r.tensionLayers.map((layer) => `(${layer.barCount})(${(layer.area / Number(layer.barCount)).toFixed(2)})`).join("+")}}=${r.d.toFixed(2)}\\text{ mm}`
        : `d=\\dfrac{${r.tensionLayers.map((layer) => `(${layer.area.toFixed(2)})(${layer.depth.toFixed(1)})`).join("+")}}{${r.tensionLayers.map((layer) => layer.area.toFixed(2)).join("+")}}=${r.d.toFixed(2)}\\text{ mm}`,
      result: `${r.tensionLayers.map((layer) => `d_${layer.index}=${layer.depth.toFixed(1)}\\text{ mm}`).join(",\\quad ")},\\quad d=${r.d.toFixed(1)}\\text{ mm}`,
    });
    steps.push({
      label: "Solve force equilibrium using each tension layer",
      formula: "0.85f'_cb\\beta_1c+A'_sf'_s=\\sum A_{si}f_{si},\\quad f_{si}=\\operatorname{clip}\\left[600\\dfrac{d_i-c}{c},-f_y,f_y\\right]",
      substitution: `c=${r.c.toFixed(2)}\\text{ mm};\\quad ${r.tensionLayers.map((layer) => `f_{s${layer.index}}=${layer.stress.toFixed(1)}\\text{ MPa}`).join(";\\quad ")}`,
      result: r.tensionLayers.map((layer) => `Layer ${layer.index}: depth d${layer.index === 1 ? "₁" : "₂"} = ${layer.depth.toFixed(1)} mm, strain εₛ${layer.index === 1 ? "₁" : "₂"} = ${layer.strain.toFixed(6)}, stress fₛ${layer.index === 1 ? "₁" : "₂"} = ${layer.stress.toFixed(1)} MPa.`).join(" "),
      resultKind: "text",
    });
  } else if (!r.isDoublyReinforced) {
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
        result: `c = ${r.c.toFixed(1)} mm; a = ${r.a.toFixed(1)} mm; fₛ = ${r.tensionStress.toFixed(1)} MPa.`,
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
      formula: hasMultipleTensionLayers ? "\\varepsilon_t = \\dfrac{0.003(d_{extreme}-c)}{c}" : "\\varepsilon_t = \\dfrac{0.003(d-c)}{c}",
      substitution: `\\varepsilon_t = \\dfrac{0.003(${r.dExtremeTension.toFixed(1)}-${r.c.toFixed(1)})}{${r.c.toFixed(1)}}`,
      result: `Extreme tension depth = ${r.dExtremeTension.toFixed(1)} mm; εₜ = ${r.epsilonT.toFixed(5)}; fₛ = ${r.tensionStress.toFixed(1)} MPa. Steel ${r.tensionSteelYields ? "yields" : "does not yield"}.`,
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
      result: `Ductility class: ${r.ductilityClass.replace("-", " ")}; φ = ${r.phi.toFixed(3)}.`,
      resultKind: "text",
    },
    {
      label: "Nominal moment capacity, Mₙ",
      formula: hasMultipleTensionLayers
        ? "M_n=\\sum A_{si}f_{si}d_i-0.85f'_cba\\dfrac{a}{2}-A'_sf'_sd'"
        : r.isDoublyReinforced
        ? "M_n = 0.85f'_c\\,b\\,a\\left(d-\\dfrac{a}{2}\\right) + A'_s f'_s(d-d')"
        : "M_n = A_s f_s\\left(d - \\dfrac{a}{2}\\right)",
      substitution: hasMultipleTensionLayers
        ? `M_n=${r.tensionLayers.map((layer) => `(${layer.area.toFixed(2)})(${layer.stress.toFixed(1)})(${layer.depth.toFixed(1)})`).join("+")}-0.85(${fc})(${b})(${r.a.toFixed(1)})\\dfrac{${r.a.toFixed(1)}}{2}` + (r.isDoublyReinforced ? `-(${AsPrime})(${r.fsPrime?.toFixed(1)})(${dPrime})` : "")
        : r.isDoublyReinforced
        ? `M_n = 0.85(${fc})(${b})(${r.a.toFixed(1)})\\left(${d}-\\dfrac{${r.a.toFixed(1)}}{2}\\right) + (${AsPrime})(${r.fsPrime?.toFixed(1)})(${d}-${dPrime})`
        : `M_n = (${As})(${r.tensionStress.toFixed(1)})\\left(${d} - \\dfrac{${r.a.toFixed(1)}}{2}\\right)`,
      result: `M_n = ${r.Mn.toFixed(2)} \\text{ kN·m}`,
    },
    {
      label: "Internal force equilibrium and moment components",
      formula: hasMultipleTensionLayers
        ? "C_c+C'_s=\\sum T_i,\\quad T_i=A_{si}f_{si}"
        : r.isDoublyReinforced
        ? "C_c=0.85f'_cba,\\quad C'_s=A'_s f'_s,\\quad T=A_sf_s;\\quad M_n=C_c(d-a/2)+C'_s(d-d')"
        : "C_c=0.85f'_cba,\\quad T=A_sf_s,\\quad C_c=T;\\quad M_n=T(d-a/2)",
      substitution: hasMultipleTensionLayers
        ? `C_c=0.85(${fc})(${b})(${r.a.toFixed(1)}),\\quad ${r.isDoublyReinforced ? `C'_s=(${AsPrime})(${r.fsPrime?.toFixed(1)}),\\quad ` : ""}${r.tensionLayers.map((layer) => `T_${layer.index}=(${layer.area.toFixed(2)})(${layer.stress.toFixed(1)})`).join(",\\quad ")}`
        : r.isDoublyReinforced
        ? `C_c=0.85(${fc})(${b})(${r.a.toFixed(1)}),\\quad C'_s=(${AsPrime})(${r.fsPrime?.toFixed(1)}),\\quad T=(${As})(${r.tensionStress.toFixed(1)})`
        : `C_c=0.85(${fc})(${b})(${r.a.toFixed(1)})=T=(${As})(${r.tensionStress.toFixed(1)})`,
      result: "Resultant forces and lever arms are included in the nominal moment above; signs follow tension/compression state.",
      resultKind: "text",
    },
    {
      label: "Design moment capacity, φMₙ",
      formula: "\\phi M_n = \\phi \\times M_n",
      substitution: `\\phi M_n = ${r.phi.toFixed(3)} \\times ${r.Mn.toFixed(2)}`,
      result: `\\phi M_n = ${r.phiMn.toFixed(2)} \\text{ kN·m}`,
      reference: "NSCP 2015 Table 421.2.2 and Section 422.2.2 / ACI 318-14 Table 21.2.2 and Section 22.2.2.",
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
      reference: "NSCP 2015 Section 409.5 / ACI 318-14 Section 9.5.",
      explanation: "The section is adequate only when its reduced nominal strength is at least the entered factored moment and the reinforcement-ratio check passes.",
      status: r.ok ? "pass" : "fail",
    });
  }

  return steps;
}
