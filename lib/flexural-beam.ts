export interface FlexuralBeamInput {
  Mu: number;
  b: number;
  d: number;
  fc: number;
  fy: number;
  barDiameter: number;
  dPrime: number;
  compressionBarDiameter: number;
}

export type SectionType = "singly" | "doubly";

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
  governingCase: "minimum" | "calculated" | "doubly-reinforced";
  sectionType: SectionType;
  ok: boolean;
  message: string;

  clearSpacing: number | null;
  minClearSpacingRequired: number;
  spacingOk: boolean | null;
  spacingMessage: string;
  tensionBarLayers: number;
  tensionBarsPerLayer: number[];
  tensionVerticalClearSpacing: number | null;

  dPrime: number | null;
  a: number | null;
  c: number | null;
  epsilonSPrime: number | null;
  fsPrime: number | null;
  compressionSteelYields: boolean | null;
  mnSingly: number | null;
  muRemaining: number | null;
  asSinglyPortion: number | null;
  asAdditionalTension: number | null;
  asCompression: number | null;
  compressionBarsRequired: number;
  compressionClearSpacing: number | null;
  compressionSpacingOk: boolean | null;
  compressionSpacingMessage: string;
  compressionBarLayers: number;
  compressionBarsPerLayer: number[];
  compressionVerticalClearSpacing: number | null;
}

export interface SolutionStep {
  label: string;
  formula: string;
  substitution: string;
  result: string;
}

const PHI = 0.9;
const ES = 200_000;

// These assumptions are retained from your original spacing check.
const ASSUMED_CLEAR_COVER = 40;
const ASSUMED_STIRRUP_DIAMETER = 10;

function beta1Factor(fc: number): number {
  if (fc <= 28) return 0.85;
  return Math.max(0.65, 0.85 - 0.05 * ((fc - 28) / 7));
}

function emptyDoublyResults(): Pick<
  FlexuralBeamResult,
  | "dPrime"
  | "a"
  | "c"
  | "epsilonSPrime"
  | "fsPrime"
  | "compressionSteelYields"
  | "mnSingly"
  | "muRemaining"
  | "asSinglyPortion"
  | "asAdditionalTension"
  | "asCompression"
  | "compressionBarsRequired"
  | "compressionClearSpacing"
  | "compressionSpacingOk"
  | "compressionSpacingMessage"
  | "compressionBarLayers"
  | "compressionBarsPerLayer"
  | "compressionVerticalClearSpacing"
> {
  return {
    dPrime: null,
    a: null,
    c: null,
    epsilonSPrime: null,
    fsPrime: null,
    compressionSteelYields: null,
    mnSingly: null,
    muRemaining: null,
    asSinglyPortion: null,
    asAdditionalTension: null,
    asCompression: null,
    compressionBarsRequired: 0,
    compressionClearSpacing: null,
    compressionSpacingOk: null,
    compressionSpacingMessage: "N/A — singly reinforced section.",
    compressionBarLayers: 0,
    compressionBarsPerLayer: [],
    compressionVerticalClearSpacing: null,
  };
}

interface BarLayout {
  clearSpacing: number | null;
  minClearSpacingRequired: number;
  spacingOk: boolean | null;
  spacingMessage: string;
  layers: number;
  barsPerLayer: number[];
  verticalClearSpacing: number | null;
}

function designBarLayout(
  b: number,
  barDiameter: number,
  barsRequired: number
): BarLayout {
  const minClearSpacingRequired = Math.max(barDiameter, 25);
  const insideWidth =
    b - 2 * (ASSUMED_CLEAR_COVER + ASSUMED_STIRRUP_DIAMETER);

  if (insideWidth < barDiameter) {
    return {
      clearSpacing: null,
      minClearSpacingRequired,
      spacingOk: false,
      spacingMessage: "The available width inside the stirrups is smaller than one bar.",
      layers: 0,
      barsPerLayer: [],
      verticalClearSpacing: null,
    };
  }

  if (barsRequired <= 1) {
    return {
      clearSpacing: null,
      minClearSpacingRequired,
      spacingOk: null,
      spacingMessage: "Only 1 bar — no spacing check needed.",
      layers: 1,
      barsPerLayer: [1],
      verticalClearSpacing: null,
    };
  }

  const maxBarsPerLayer = Math.max(
    1,
    Math.floor(
      (insideWidth + minClearSpacingRequired) /
        (barDiameter + minClearSpacingRequired)
    )
  );
  const requiredLayers = Math.ceil(barsRequired / maxBarsPerLayer);

  if (requiredLayers > 2) {
    const barsPerLayer = [
      Math.ceil(barsRequired / 2),
      Math.floor(barsRequired / 2),
    ];
    const largestLayer = barsPerLayer[0];
    const clearSpacing =
      largestLayer > 1
        ? (insideWidth - largestLayer * barDiameter) / (largestLayer - 1)
        : null;

    return {
      clearSpacing,
      minClearSpacingRequired,
      spacingOk: false,
      spacingMessage: `${barsRequired} bars need more than two layers to satisfy the required spacing. The shown ${barsPerLayer.join(" + ")} two-layer arrangement is NOT OK; use larger bars or increase b.`,
      layers: 2,
      barsPerLayer,
      verticalClearSpacing: minClearSpacingRequired,
    };
  }

  const barsPerLayer =
    requiredLayers === 1
      ? [barsRequired]
      : [Math.ceil(barsRequired / 2), Math.floor(barsRequired / 2)];
  const largestLayer = Math.max(...barsPerLayer);
  const clearSpacing =
    largestLayer > 1
      ? (insideWidth - largestLayer * barDiameter) / (largestLayer - 1)
      : null;
  const spacingOk =
    clearSpacing === null || clearSpacing >= minClearSpacingRequired;
  const verticalClearSpacing =
    requiredLayers === 2 ? minClearSpacingRequired : null;

  const spacingMessage =
    requiredLayers === 1
      ? `Clear spacing ${clearSpacing?.toFixed(1)} mm ≥ ${minClearSpacingRequired.toFixed(0)} mm — OK, bars fit in one layer.`
      : clearSpacing === null
        ? `Bars arranged in two layers (${barsPerLayer.join(" + ")}), with one bar in each layer. Vertical clear spacing is ${verticalClearSpacing?.toFixed(0)} mm — OK.`
        : `Bars arranged in two layers (${barsPerLayer.join(" + ")}). Horizontal clear spacing is ${clearSpacing.toFixed(1)} mm and vertical clear spacing is ${verticalClearSpacing?.toFixed(0)} mm — OK.`;

  return {
    clearSpacing,
    minClearSpacingRequired,
    spacingOk,
    spacingMessage,
    layers: requiredLayers,
    barsPerLayer,
    verticalClearSpacing,
  };
}

export function designSinglyReinforcedBeam(
  input: FlexuralBeamInput
): FlexuralBeamResult {
  const {
    Mu,
    b,
    d,
    fc,
    fy,
    barDiameter,
    dPrime,
    compressionBarDiameter,
  } = input;

  const MuNmm = Mu * 1e6;
  const requiredMn = MuNmm / PHI;
  const Rn = MuNmm / (PHI * b * d * d);
  const m = fy / (0.85 * fc);
  const discriminant = 1 - (2 * m * Rn) / fy;

  const beta1 = beta1Factor(fc);
  const rhoMin = Math.max(1.4 / fy, Math.sqrt(fc) / (4 * fy));
  const rhoB = ((0.85 * fc * beta1) / fy) * (600 / (600 + fy));
  const rhoMax = 0.75 * rhoB;
  const asMin = rhoMin * b * d;
  const asMax = rhoMax * b * d;

  const rhoRequired =
    discriminant >= 0
      ? (1 / m) * (1 - Math.sqrt(discriminant))
      : Number.NaN;
  const asRequired = Number.isFinite(rhoRequired)
    ? rhoRequired * b * d
    : Number.NaN;

  const needsDoublyReinforcedDesign =
    !Number.isFinite(rhoRequired) || rhoRequired > rhoMax;

  if (!needsDoublyReinforcedDesign) {
    const governingCase = rhoRequired < rhoMin ? "minimum" : "calculated";
    const asFinal = governingCase === "minimum" ? asMin : asRequired;
    const message =
      governingCase === "minimum"
        ? "ρ required is below ρmin — using As,min governs."
        : "Section is adequately singly reinforced.";

    const Ab = (Math.PI * barDiameter * barDiameter) / 4;
    const barsRequired = Math.ceil(asFinal / Ab);
    const spacing = designBarLayout(b, barDiameter, barsRequired);

    return {
      Rn,
      rhoRequired,
      rhoMin,
      rhoMax,
      beta1,
      asRequired,
      asMin,
      asMax,
      asFinal,
      barsRequired,
      governingCase,
      sectionType: "singly",
      ok: true,
      message,
      clearSpacing: spacing.clearSpacing,
      minClearSpacingRequired: spacing.minClearSpacingRequired,
      spacingOk: spacing.spacingOk,
      spacingMessage: spacing.spacingMessage,
      tensionBarLayers: spacing.layers,
      tensionBarsPerLayer: spacing.barsPerLayer,
      tensionVerticalClearSpacing: spacing.verticalClearSpacing,
      ...emptyDoublyResults(),
    };
  }

  // Maximum singly reinforced portion.
  const asSinglyPortion = asMax;
  const a = (asSinglyPortion * fy) / (0.85 * fc * b);
  const c = a / beta1;
  const mnSinglyNmm = asSinglyPortion * fy * (d - a / 2);
  const mnSingly = mnSinglyNmm / 1e6;
  const mnRemainingNmm = Math.max(requiredMn - mnSinglyNmm, 0);
  const muRemaining = (PHI * mnRemainingNmm) / 1e6;

  // Compression-steel stress from strain compatibility.
  const epsilonSPrime = (0.003 * (c - dPrime)) / c;
  const epsilonY = fy / ES;
  const compressionSteelIsInCompression = epsilonSPrime > 0;
  const fsPrime = compressionSteelIsInCompression
    ? Math.min(fy, ES * epsilonSPrime)
    : 0;
  const compressionSteelYields =
    compressionSteelIsInCompression && epsilonSPrime >= epsilonY;

  if (!compressionSteelIsInCompression || fsPrime <= 0 || dPrime >= d) {
    const tensionBars = Math.ceil(asSinglyPortion / ((Math.PI * barDiameter ** 2) / 4));
    const tensionSpacing = designBarLayout(b, barDiameter, tensionBars);

    return {
      Rn,
      rhoRequired,
      rhoMin,
      rhoMax,
      beta1,
      asRequired,
      asMin,
      asMax,
      asFinal: asSinglyPortion,
      barsRequired: tensionBars,
      governingCase: "doubly-reinforced",
      sectionType: "doubly",
      ok: false,
      message:
        "Doubly reinforced design is required, but d′ is at or below the neutral axis. Enter a smaller d′ so the upper steel is in compression.",
      clearSpacing: tensionSpacing.clearSpacing,
      minClearSpacingRequired: tensionSpacing.minClearSpacingRequired,
      spacingOk: tensionSpacing.spacingOk,
      spacingMessage: tensionSpacing.spacingMessage,
      tensionBarLayers: tensionSpacing.layers,
      tensionBarsPerLayer: tensionSpacing.barsPerLayer,
      tensionVerticalClearSpacing: tensionSpacing.verticalClearSpacing,
      dPrime,
      a,
      c,
      epsilonSPrime,
      fsPrime,
      compressionSteelYields: false,
      mnSingly,
      muRemaining,
      asSinglyPortion,
      asAdditionalTension: null,
      asCompression: null,
      compressionBarsRequired: 0,
      compressionClearSpacing: null,
      compressionSpacingOk: null,
      compressionSpacingMessage: "N/A — d′ must be smaller than c.",
      compressionBarLayers: 0,
      compressionBarsPerLayer: [],
      compressionVerticalClearSpacing: null,
    };
  }

  // Additional moment is resisted by the steel couple As'fs'(d-d').
  const asCompression = mnRemainingNmm / (fsPrime * (d - dPrime));
  const asAdditionalTension = (asCompression * fsPrime) / fy;
  const asFinal = asSinglyPortion + asAdditionalTension;

  const tensionBarArea = (Math.PI * barDiameter ** 2) / 4;
  const compressionBarArea = (Math.PI * compressionBarDiameter ** 2) / 4;
  const barsRequired = Math.ceil(asFinal / tensionBarArea);
  const compressionBarsRequired = Math.ceil(asCompression / compressionBarArea);

  const tensionSpacing = designBarLayout(b, barDiameter, barsRequired);
  const compressionSpacing = designBarLayout(
    b,
    compressionBarDiameter,
    compressionBarsRequired
  );
  return {
    Rn,
    rhoRequired,
    rhoMin,
    rhoMax,
    beta1,
    asRequired,
    asMin,
    asMax,
    asFinal,
    barsRequired,
    governingCase: "doubly-reinforced",
    sectionType: "doubly",
    ok: true,
    message:
      "Singly reinforced capacity is exceeded — doubly reinforced design provided.",
    clearSpacing: tensionSpacing.clearSpacing,
    minClearSpacingRequired: tensionSpacing.minClearSpacingRequired,
    spacingOk: tensionSpacing.spacingOk,
    spacingMessage: tensionSpacing.spacingMessage,
    tensionBarLayers: tensionSpacing.layers,
    tensionBarsPerLayer: tensionSpacing.barsPerLayer,
    tensionVerticalClearSpacing: tensionSpacing.verticalClearSpacing,
    dPrime,
    a,
    c,
    epsilonSPrime,
    fsPrime,
    compressionSteelYields,
    mnSingly,
    muRemaining,
    asSinglyPortion,
    asAdditionalTension,
    asCompression,
    compressionBarsRequired,
    compressionClearSpacing: compressionSpacing.clearSpacing,
    compressionSpacingOk: compressionSpacing.spacingOk,
    compressionSpacingMessage: compressionSpacing.spacingMessage,
    compressionBarLayers: compressionSpacing.layers,
    compressionBarsPerLayer: compressionSpacing.barsPerLayer,
    compressionVerticalClearSpacing: compressionSpacing.verticalClearSpacing,
  };
}

export function getSolutionSteps(
  input: FlexuralBeamInput,
  result: FlexuralBeamResult
): SolutionStep[] {
  const {
    Mu,
    b,
    d,
    fc,
    fy,
    barDiameter,
    dPrime,
    compressionBarDiameter,
  } = input;
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
        fc <= 28
          ? ""
          : `\\beta_1 = 0.85 - 0.05 \\left[\\dfrac{${fc} - 28}{7}\\right]`,
      result: `\\beta_1 = ${result.beta1.toFixed(3)}`,
    },
    {
      label: "Required steel ratio, ρ",
      formula:
        "\\rho = \\dfrac{1}{m}\\left[1 - \\sqrt{1 - \\dfrac{2mR_n}{f_y}}\\right]",
      substitution: `\\rho = \\dfrac{1}{${m.toFixed(4)}}\\left[1 - \\sqrt{1 - \\dfrac{2(${m.toFixed(4)})(${result.Rn.toFixed(3)})}{${fy}}}\\right]`,
      result: Number.isFinite(result.rhoRequired)
        ? `\\rho = ${result.rhoRequired.toFixed(5)}`
        : "\\text{Required moment is beyond the singly reinforced equation limit}",
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
      substitution: `\\rho_b = \\dfrac{0.85(${fc})(${result.beta1.toFixed(3)})}{${fy}}\\left[\\dfrac{600}{600+${fy}}\\right]`,
      result: `\\rho_{max} = ${result.rhoMax.toFixed(5)}`,
    },
    {
      label: "Governing design",
      formula:
        "\\text{Compare } \\rho \\text{ with } \\rho_{min} \\text{ and } \\rho_{max}",
      substitution: `\\rho = ${
        Number.isFinite(result.rhoRequired)
          ? result.rhoRequired.toFixed(5)
          : "\\text{beyond singly limit}"
      },\\quad \\rho_{min}=${result.rhoMin.toFixed(5)},\\quad \\rho_{max}=${result.rhoMax.toFixed(5)}`,
      result:
        result.sectionType === "doubly"
          ? "\\text{DOUBLY REINFORCED DESIGN REQUIRED}"
          : `\\text{${result.governingCase.toUpperCase()}}`,
    },
  ];

  if (result.sectionType === "singly") {
    steps.push(
      {
        label: "Required steel area, As",
        formula: "A_s = \\rho \\, b \\, d",
        substitution: `A_s = (${
          result.governingCase === "minimum"
            ? result.rhoMin.toFixed(5)
            : result.rhoRequired.toFixed(5)
        })(${b})(${d})`,
        result: `A_s = ${result.asFinal.toFixed(0)} \\text{ mm}^2`,
      },
      {
        label: "Number of bars",
        formula: "n = \\dfrac{A_s}{A_b}, \\quad A_b = \\dfrac{\\pi d_b^2}{4}",
        substitution: `n = \\dfrac{${result.asFinal.toFixed(0)}}{\\pi(${barDiameter})^2/4}`,
        result: `n = ${result.barsRequired} \\text{ bars} \\times ${barDiameter}\\text{mm}`,
      }
    );
  } else {
    steps.push(
      {
        label: "Maximum singly reinforced steel portion",
        formula: "A_{s1} = \\rho_{max}bd",
        substitution: `A_{s1}=(${result.rhoMax.toFixed(5)})(${b})(${d})`,
        result: `A_{s1}=${result.asSinglyPortion?.toFixed(0)}\\text{ mm}^2`,
      },
      {
        label: "Compression block and neutral axis",
        formula:
          "a=\\dfrac{A_{s1}f_y}{0.85f'_c b},\\qquad c=\\dfrac{a}{\\beta_1}",
        substitution: `a=\\dfrac{(${result.asSinglyPortion?.toFixed(0)})(${fy})}{0.85(${fc})(${b})},\\qquad c=\\dfrac{${result.a?.toFixed(2)}}{${result.beta1.toFixed(3)}}`,
        result: `a=${result.a?.toFixed(2)}\\text{ mm},\\qquad c=${result.c?.toFixed(2)}\\text{ mm}`,
      },
      {
        label: "Moment carried by the singly reinforced portion",
        formula: "M_{n1}=A_{s1}f_y\\left(d-\\dfrac{a}{2}\\right)",
        substitution: `M_{n1}=(${result.asSinglyPortion?.toFixed(0)})(${fy})\\left(${d}-\\dfrac{${result.a?.toFixed(2)}}{2}\\right)`,
        result: `M_{n1}=${result.mnSingly?.toFixed(2)}\\text{ kN·m}`,
      },
      {
        label: "Remaining factored moment",
        formula: "M_{u2}=M_u-\\phi M_{n1}",
        substitution: `M_{u2}=${Mu}-0.90(${result.mnSingly?.toFixed(2)})`,
        result: `M_{u2}=${result.muRemaining?.toFixed(2)}\\text{ kN·m}`,
      },
      {
        label: "Compression steel strain and stress",
        formula:
          "\\varepsilon'_s=0.003\\left(\\dfrac{c-d'}{c}\\right),\\qquad f'_s=\\min(E_s\\varepsilon'_s,f_y)",
        substitution: `\\varepsilon'_s=0.003\\left(\\dfrac{${result.c?.toFixed(2)}-${dPrime}}{${result.c?.toFixed(2)}}\\right),\\qquad E_s=200000\\text{ MPa}`,
        result:
          result.fsPrime && result.fsPrime > 0
            ? `\\varepsilon'_s=${result.epsilonSPrime?.toFixed(6)},\\qquad f'_s=${result.fsPrime.toFixed(2)}\\text{ MPa}\\quad(${result.compressionSteelYields ? "\\text{yields}" : "\\text{does not yield}"})`
            : "\\text{Upper steel is not in compression; reduce }d'",
      }
    );

    if (result.asCompression !== null && result.asAdditionalTension !== null) {
      steps.push(
        {
          label: "Required compression steel",
          formula:
            "A'_s=\\dfrac{M_{u2}}{\\phi f'_s(d-d')}",
          substitution: `A'_s=\\dfrac{${result.muRemaining?.toFixed(2)}\\times10^6}{0.90(${result.fsPrime?.toFixed(2)})(${d}-${dPrime})}`,
          result: `A'_s=${result.asCompression.toFixed(0)}\\text{ mm}^2`,
        },
        {
          label: "Additional and total tension steel",
          formula:
            "A_{s2}=A'_s\\dfrac{f'_s}{f_y},\\qquad A_s=A_{s1}+A_{s2}",
          substitution: `A_{s2}=(${result.asCompression.toFixed(0)})\\dfrac{${result.fsPrime?.toFixed(2)}}{${fy}},\\qquad A_s=${result.asSinglyPortion?.toFixed(0)}+${result.asAdditionalTension.toFixed(0)}`,
          result: `A_{s2}=${result.asAdditionalTension.toFixed(0)}\\text{ mm}^2,\\qquad A_s=${result.asFinal.toFixed(0)}\\text{ mm}^2`,
        },
        {
          label: "Required tension and compression bars",
          formula:
            "n_s=\\left\\lceil\\dfrac{A_s}{\\pi d_b^2/4}\\right\\rceil,\\qquad n'_s=\\left\\lceil\\dfrac{A'_s}{\\pi {d'_b}^2/4}\\right\\rceil",
          substitution: `n_s=\\left\\lceil\\dfrac{${result.asFinal.toFixed(0)}}{\\pi(${barDiameter})^2/4}\\right\\rceil,\\qquad n'_s=\\left\\lceil\\dfrac{${result.asCompression.toFixed(0)}}{\\pi(${compressionBarDiameter})^2/4}\\right\\rceil`,
          result: `n_s=${result.barsRequired}\\text{–}${barDiameter}\\text{mm},\\qquad n'_s=${result.compressionBarsRequired}\\text{–}${compressionBarDiameter}\\text{mm}`,
        }
      );
    }
  }

  steps.push({
    label: "Bar spacing check (NSCP 2015 / ACI 318 §25.2.1)",
    formula: "s_{clear} \\ge \\max(d_b,\\ 25\\text{ mm})",
    substitution:
      result.clearSpacing !== null
        ? `s_{clear}=${result.clearSpacing.toFixed(1)}\\text{ mm},\\quad \\text{arrangement: ${result.tensionBarsPerLayer.join("+")} bar(s) in ${result.tensionBarLayers} layer(s)}`
        : result.barsRequired <= 1
          ? "\\text{Only 1 tension bar — horizontal spacing is not applicable}"
          : `\\text{One tension bar per layer; arrangement: ${result.tensionBarsPerLayer.join("+")}}`,
    result:
      result.spacingOk === null
        ? "\\text{N/A}"
        : result.spacingOk
          ? result.tensionBarLayers === 2
            ? `\\text{TENSION BARS: OK — two layers, }s_v=${result.tensionVerticalClearSpacing?.toFixed(0)}\\text{ mm}`
            : "\\text{TENSION LAYER: OK}"
          : "\\text{TENSION LAYER: NOT OK — bars too crowded}",
  });

  if (result.sectionType === "doubly" && result.asCompression !== null) {
    steps.push({
      label: "Compression-bar spacing check",
      formula: "s'_{clear} \\ge \\max(d'_b,\\ 25\\text{ mm})",
      substitution:
        result.compressionClearSpacing !== null
          ? `s'_{clear}=${result.compressionClearSpacing.toFixed(1)}\\text{ mm},\\quad \\text{arrangement: ${result.compressionBarsPerLayer.join("+")} bar(s) in ${result.compressionBarLayers} layer(s)}`
          : result.compressionBarsRequired <= 1
            ? "\\text{Only 1 compression bar — horizontal spacing is not applicable}"
            : `\\text{One compression bar per layer; arrangement: ${result.compressionBarsPerLayer.join("+")}}`,
      result:
        result.compressionSpacingOk === null
          ? "\\text{N/A}"
          : result.compressionSpacingOk
            ? result.compressionBarLayers === 2
              ? `\\text{COMPRESSION BARS: OK — two layers, }s'_v=${result.compressionVerticalClearSpacing?.toFixed(0)}\\text{ mm}`
              : "\\text{COMPRESSION LAYER: OK}"
            : "\\text{COMPRESSION LAYER: NOT OK — bars too crowded}",
    });
  }

  return steps;
}
