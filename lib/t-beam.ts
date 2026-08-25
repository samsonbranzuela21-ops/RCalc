export interface TBeamDesignInput {
  Mu: number; // factored moment, kN-m
  bw: number; // web width, mm
  hf: number; // flange thickness, mm
  d: number; // effective depth, mm
  span: number; // effective span, mm
  beamSpacing: number; // center-to-center spacing of adjacent beams, mm
  fc: number; // concrete compressive strength, MPa
  fy: number; // steel yield strength, MPa
  barDiameter: number; // selected tension-bar diameter, mm
}

export type TBeamCase = "flange" | "web";

export interface TBeamCapacity {
  a: number;
  c: number;
  epsilonT: number;
  phi: number;
  Mn: number;
  phiMn: number;
  sectionCase: TBeamCase;
  concreteWebForce: number;
  concreteFlangeForce: number;
}

export interface TBeamDesignResult extends TBeamCapacity {
  ok: boolean;
  message: string;
  beta1: number;
  beff: number;
  beffLimitSpan: number;
  beffLimitFlange: number;
  beffLimitSpacing: number;
  asCalculated: number;
  asMin: number;
  asRequired: number;
  asTensionControlledMax: number;
  barArea: number;
  barsRequired: number;
  barsPerLayer: number;
  numberOfLayers: number;
  asProvided: number;
  clearSpacing: number | null;
  minClearSpacingRequired: number;
  spacingOk: boolean | null;
  spacingMessage: string;
  designStatus: "PASS" | "FAIL";
}

export interface TBeamSolutionStep {
  label: string;
  formula: string;
  substitution?: string;
  result: string;
}

const ES = 200_000;
const PHI_COMPRESSION = 0.65;
const PHI_TENSION = 0.9;
const EPSILON_TENSION_CONTROLLED = 0.005;
const CLEAR_COVER = 40;
const ASSUMED_STIRRUP_DIAMETER = 10;

export function getBeta1(fc: number): number {
  if (fc <= 28) return 0.85;
  if (fc >= 56) return 0.65;
  return 0.85 - (0.05 * (fc - 28)) / 7;
}

export function getEffectiveFlangeWidth(
  span: number,
  bw: number,
  hf: number,
  beamSpacing: number
) {
  const beffLimitSpan = span / 4;
  const beffLimitFlange = bw + 16 * hf;
  const beffLimitSpacing = beamSpacing;
  const beff = Math.min(
    beffLimitSpan,
    beffLimitFlange,
    beffLimitSpacing
  );

  return {
    beff,
    beffLimitSpan,
    beffLimitFlange,
    beffLimitSpacing,
  };
}

function getPhi(epsilonT: number, fy: number): number {
  const epsilonY = fy / ES;

  if (epsilonT <= epsilonY) return PHI_COMPRESSION;
  if (epsilonT >= EPSILON_TENSION_CONTROLLED) return PHI_TENSION;

  return (
    PHI_COMPRESSION +
    (PHI_TENSION - PHI_COMPRESSION) *
      ((epsilonT - epsilonY) /
        (EPSILON_TENSION_CONTROLLED - epsilonY))
  );
}

function compressionForceAtDepth(
  a: number,
  beff: number,
  bw: number,
  hf: number,
  fc: number
): number {
  if (a <= hf) return 0.85 * fc * beff * a;

  return (
    0.85 *
    fc *
    (bw * a + (beff - bw) * hf)
  );
}

function steelAreaAtCompressionDepth(
  a: number,
  beff: number,
  bw: number,
  hf: number,
  fc: number,
  fy: number
): number {
  return compressionForceAtDepth(a, beff, bw, hf, fc) / fy;
}

export function getTBeamCapacity(
  As: number,
  input: Pick<TBeamDesignInput, "bw" | "hf" | "d" | "fc" | "fy"> & {
    beff: number;
    beta1: number;
  }
): TBeamCapacity {
  const { bw, hf, d, fc, fy, beff, beta1 } = input;
  const tensionForce = As * fy;
  const flangeOnlyCapacity = 0.85 * fc * beff * hf;

  let a: number;
  let sectionCase: TBeamCase;

  if (tensionForce <= flangeOnlyCapacity) {
    a = tensionForce / (0.85 * fc * beff);
    sectionCase = "flange";
  } else {
    a =
      (tensionForce / (0.85 * fc) - (beff - bw) * hf) /
      bw;
    sectionCase = "web";
  }

  a = Math.max(a, 0);
  const c = a / beta1;
  const epsilonT = c > 0 ? 0.003 * ((d - c) / c) : Infinity;
  const phi = getPhi(epsilonT, fy);

  let concreteWebForce: number;
  let concreteFlangeForce: number;
  let MnNmm: number;

  if (sectionCase === "flange") {
    concreteWebForce = 0.85 * fc * beff * a;
    concreteFlangeForce = 0;
    MnNmm = concreteWebForce * (d - a / 2);
  } else {
    concreteWebForce = 0.85 * fc * bw * a;
    concreteFlangeForce = 0.85 * fc * (beff - bw) * hf;
    MnNmm =
      concreteWebForce * (d - a / 2) +
      concreteFlangeForce * (d - hf / 2);
  }

  const Mn = MnNmm / 1_000_000;

  return {
    a,
    c,
    epsilonT,
    phi,
    Mn,
    phiMn: phi * Mn,
    sectionCase,
    concreteWebForce,
    concreteFlangeForce,
  };
}

export function designTBeam(input: TBeamDesignInput): TBeamDesignResult {
  const { Mu, bw, hf, d, span, beamSpacing, fc, fy, barDiameter } = input;
  const beta1 = getBeta1(fc);
  const flange = getEffectiveFlangeWidth(span, bw, hf, beamSpacing);
  const { beff } = flange;

  if (
    ![Mu, bw, hf, d, span, beamSpacing, fc, fy, barDiameter].every(
      (value) => Number.isFinite(value) && value > 0
    ) ||
    hf >= d ||
    beff < bw
  ) {
    throw new Error(
      "Enter valid positive values. The flange thickness must be less than d, and the effective flange width must not be less than bw."
    );
  }

  const asMin = Math.max(
    (0.25 * Math.sqrt(fc) * bw * d) / fy,
    (1.4 * bw * d) / fy
  );

  // For epsilon_t = 0.005 and epsilon_cu = 0.003, c/d = 0.375.
  const cTensionControlled = 0.375 * d;
  const aTensionControlled = beta1 * cTensionControlled;
  const asTensionControlledMax = steelAreaAtCompressionDepth(
    aTensionControlled,
    beff,
    bw,
    hf,
    fc,
    fy
  );
  const maximumTensionControlledCapacity = getTBeamCapacity(
    asTensionControlledMax,
    { bw, hf, d, fc, fy, beff, beta1 }
  );

  let low = 0;
  let high = asTensionControlledMax;

  for (let iteration = 0; iteration < 100; iteration += 1) {
    const trialAs = (low + high) / 2;
    const trial = getTBeamCapacity(trialAs, {
      bw,
      hf,
      d,
      fc,
      fy,
      beff,
      beta1,
    });

    if (trial.phiMn >= Mu) high = trialAs;
    else low = trialAs;
  }

  const demandWithinTensionControlledLimit =
    Mu <= maximumTensionControlledCapacity.phiMn;
  const asCalculated = demandWithinTensionControlledLimit
    ? high
    : asTensionControlledMax;
  const asRequired = Math.max(asCalculated, asMin);
  const barArea = (Math.PI * barDiameter ** 2) / 4;
  const barsRequired = Math.max(2, Math.ceil(asRequired / barArea));
  const asProvided = barsRequired * barArea;
  const capacity = getTBeamCapacity(asProvided, {
    bw,
    hf,
    d,
    fc,
    fy,
    beff,
    beta1,
  });

  const availableWidth =
    bw - 2 * (CLEAR_COVER + ASSUMED_STIRRUP_DIAMETER);
  const minClearSpacingRequired = Math.max(25, barDiameter);
  const maximumBarsThatFitPerLayer = Math.max(
    1,
    Math.floor(
      (availableWidth + minClearSpacingRequired) /
        (barDiameter + minClearSpacingRequired)
    )
  );
  const barsPerLayer = Math.min(
    barsRequired,
    maximumBarsThatFitPerLayer
  );
  const numberOfLayers = Math.ceil(barsRequired / barsPerLayer);
  const clearSpacing =
    barsPerLayer > 1
      ? (availableWidth - barsPerLayer * barDiameter) /
        (barsPerLayer - 1)
      : null;
  const spacingOk =
    numberOfLayers > 3
      ? false
      : clearSpacing === null
      ? true
      : clearSpacing >= minClearSpacingRequired;

  const strengthOk = capacity.phiMn >= Mu;
  const tensionControlled =
    capacity.epsilonT >= EPSILON_TENSION_CONTROLLED - 1e-9;
  const ok =
    demandWithinTensionControlledLimit &&
    strengthOk &&
    tensionControlled &&
    spacingOk !== false;

  let message: string;
  if (!demandWithinTensionControlledLimit) {
    message =
      "The required moment exceeds the tension-controlled capacity. Increase the section dimensions or use a separately designed doubly reinforced section.";
  } else if (!tensionControlled) {
    message =
      "The selected bars make the section transition- or compression-controlled. Select smaller bars, increase the section, or revise the reinforcement arrangement.";
  } else if (spacingOk === false) {
    message =
      "Strength is adequate, but the selected bars require more than three layers using the assumed 40 mm cover and 10 mm stirrup.";
  } else if (!strengthOk) {
    message = "The provided reinforcement does not satisfy phi Mn >= Mu.";
  } else {
    message =
      capacity.sectionCase === "flange"
        ? "Design passes. The equivalent compression block is entirely within the flange."
        : "Design passes. The equivalent compression block extends below the flange into the web.";
  }

  return {
    ...flange,
    ...capacity,
    ok,
    message,
    beta1,
    asCalculated,
    asMin,
    asRequired,
    asTensionControlledMax,
    barArea,
    barsRequired,
    barsPerLayer,
    numberOfLayers,
    asProvided,
    clearSpacing,
    minClearSpacingRequired,
    spacingOk,
    spacingMessage:
      spacingOk === false
        ? `Required clear spacing is at least ${minClearSpacingRequired.toFixed(
            0
          )} mm. Use larger bars, a wider web, or revise the reinforcement arrangement.`
        : `Bars are arranged in ${numberOfLayers} layer${
            numberOfLayers === 1 ? "" : "s"
          } for the spacing check.`,
    designStatus: ok ? "PASS" : "FAIL",
  };
}

function n(value: number, digits = 2): string {
  return value.toFixed(digits);
}

export function getTBeamSolutionSteps(
  input: TBeamDesignInput,
  result: TBeamDesignResult
): TBeamSolutionStep[] {
  const caseText =
    result.sectionCase === "flange"
      ? "a \\le h_f\\;\\text{(compression block within flange)}"
      : "a > h_f\\;\\text{(compression block extends into web)}";

  const equilibriumFormula =
    result.sectionCase === "flange"
      ? "A_s f_y = 0.85 f'_c b_f a"
      : "A_s f_y = 0.85 f'_c[b_w a+(b_f-b_w)h_f]";

  const momentFormula =
    result.sectionCase === "flange"
      ? "M_n=0.85f'_c b_f a(d-a/2)"
      : "M_n=0.85f'_c b_w a(d-a/2)+0.85f'_c(b_f-b_w)h_f(d-h_f/2)";

  return [
    {
      label: "Effective flange width",
      formula: "b_f=\\min(L/4,\\;b_w+16h_f,\\;s)",
      substitution: `b_f=\\min(${n(input.span)}/4,\\;${n(
        input.bw
      )}+16(${n(input.hf)}),\\;${n(input.beamSpacing)})`,
      result: `b_f=${n(result.beff)}\\;\\text{mm}`,
    },
    {
      label: "Whitney stress-block factor",
      formula:
        "\\beta_1=0.85-0.05\\left(\\dfrac{f'_c-28}{7}\\right),\\quad 0.65\\le\\beta_1\\le0.85",
      substitution: `f'_c=${n(input.fc)}\\;\\text{MPa}`,
      result: `\\beta_1=${n(result.beta1, 3)}`,
    },
    {
      label: "Minimum tension reinforcement",
      formula:
        "A_{s,min}=\\max\\left(\\dfrac{0.25\\sqrt{f'_c}}{f_y}b_wd,\\;\\dfrac{1.4}{f_y}b_wd\\right)",
      substitution: `A_{s,min}=\\max\\left(\\dfrac{0.25\\sqrt{${n(
        input.fc
      )}}}{${n(input.fy)}}(${n(input.bw)})(${n(
        input.d
      )}),\\;\\dfrac{1.4}{${n(input.fy)}}(${n(input.bw)})(${n(
        input.d
      )})\\right)`,
      result: `A_{s,min}=${n(result.asMin)}\\;\\text{mm}^2`,
    },
    {
      label: "Required reinforcement from strength",
      formula: equilibriumFormula,
      substitution: `\\phi M_n\\ge M_u,\\qquad M_u=${n(
        input.Mu
      )}\\;\\text{kN}\\cdot\\text{m}`,
      result: `A_{s,calc}=${n(result.asCalculated)}\\;\\text{mm}^2`,
    },
    {
      label: "Governing required steel and selected bars",
      formula: "A_s=\\max(A_{s,calc},A_{s,min})",
      substitution: `A_s=\\max(${n(result.asCalculated)},${n(
        result.asMin
      )})`,
      result: `A_s=${n(result.asRequired)}\\;\\text{mm}^2\\;\\rightarrow\\;${
        result.barsRequired
      }\\text{-}\\phi${input.barDiameter}\\;(A_{s,prov}=${n(
        result.asProvided
      )}\\;\\text{mm}^2)`,
    },
    {
      label: "Compression-block depth and section case",
      formula: equilibriumFormula,
      substitution: `a=${n(result.a)}\\;\\text{mm},\\qquad h_f=${n(
        input.hf
      )}\\;\\text{mm}`,
      result: caseText,
    },
    {
      label: "Tension strain and strength-reduction factor",
      formula:
        "c=a/\\beta_1,\\qquad \\varepsilon_t=0.003\\left(\\dfrac{d-c}{c}\\right)",
      substitution: `c=${n(result.a)}/${n(
        result.beta1,
        3
      )}=${n(result.c)}\\;\\text{mm}`,
      result: `\\varepsilon_t=${n(result.epsilonT, 5)},\\qquad\\phi=${n(
        result.phi,
        3
      )}`,
    },
    {
      label: "Nominal and design moment strength",
      formula: momentFormula,
      substitution: `M_n=${n(result.Mn)}\\;\\text{kN}\\cdot\\text{m}`,
      result: `\\phi M_n=${n(result.phiMn)}\\;\\text{kN}\\cdot\\text{m}\\;${
        result.phiMn >= input.Mu ? "\\ge" : "<"
      }\\;M_u=${n(input.Mu)}\\;\\text{kN}\\cdot\\text{m}`,
    },
  ];
}
