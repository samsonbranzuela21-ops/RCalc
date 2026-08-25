import {
  getBeta1,
  getTBeamCapacity,
  type TBeamCapacity,
} from "@/lib/t-beam";

export interface LBeamDesignInput {
  Mu: number;
  bw: number;
  hf: number;
  d: number;
  span: number;
  beamSpacing: number;
  fc: number;
  fy: number;
  barDiameter: number;
}

export interface LBeamDesignResult extends TBeamCapacity {
  ok: boolean;
  message: string;
  designStatus: "PASS" | "FAIL";
  beta1: number;
  beff: number;
  effectiveOverhang: number;
  overhangLimitSpan: number;
  overhangLimitThickness: number;
  overhangLimitSpacing: number;
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
  spacingOk: boolean;
  spacingMessage: string;
}

export interface LBeamSolutionStep {
  label: string;
  formula: string;
  substitution?: string;
  result: string;
}

const CLEAR_COVER = 40;
const ASSUMED_STIRRUP_DIAMETER = 10;

export function getLEffectiveFlangeWidth(
  span: number,
  bw: number,
  hf: number,
  beamSpacing: number
) {
  const clearDistanceToNextWeb = beamSpacing - bw;
  const overhangLimitSpan = span / 12;
  const overhangLimitThickness = 6 * hf;
  const overhangLimitSpacing = clearDistanceToNextWeb / 2;
  const effectiveOverhang = Math.min(
    overhangLimitSpan,
    overhangLimitThickness,
    overhangLimitSpacing
  );

  return {
    beff: bw + effectiveOverhang,
    effectiveOverhang,
    overhangLimitSpan,
    overhangLimitThickness,
    overhangLimitSpacing,
  };
}

function compressionForce(
  a: number,
  beff: number,
  bw: number,
  hf: number,
  fc: number
) {
  if (a <= hf) return 0.85 * fc * beff * a;
  return 0.85 * fc * (bw * a + (beff - bw) * hf);
}

export function designLBeam(input: LBeamDesignInput): LBeamDesignResult {
  const { Mu, bw, hf, d, span, beamSpacing, fc, fy, barDiameter } = input;

  if (
    !Object.values(input).every(
      (value) => Number.isFinite(value) && value > 0
    ) ||
    hf >= d ||
    beamSpacing <= bw
  ) {
    throw new Error(
      "Enter valid positive values. Require hf < d and beam spacing greater than bw."
    );
  }

  const beta1 = getBeta1(fc);
  const flange = getLEffectiveFlangeWidth(span, bw, hf, beamSpacing);
  const { beff } = flange;
  const asMin = Math.max(
    (0.25 * Math.sqrt(fc) * bw * d) / fy,
    (1.4 * bw * d) / fy
  );

  // epsilon_t = 0.005 with epsilon_cu = 0.003 gives c/d = 0.375.
  const cTensionControlled = 0.375 * d;
  const aTensionControlled = beta1 * cTensionControlled;
  const asTensionControlledMax =
    compressionForce(aTensionControlled, beff, bw, hf, fc) / fy;
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
  const maximumBarsPerLayer = Math.max(
    1,
    Math.floor(
      (availableWidth + minClearSpacingRequired) /
        (barDiameter + minClearSpacingRequired)
    )
  );
  const barsPerLayer = Math.min(barsRequired, maximumBarsPerLayer);
  const numberOfLayers = Math.ceil(barsRequired / barsPerLayer);
  const clearSpacing =
    barsPerLayer > 1
      ? (availableWidth - barsPerLayer * barDiameter) /
        (barsPerLayer - 1)
      : null;
  const spacingOk =
    numberOfLayers <= 3 &&
    (clearSpacing === null || clearSpacing >= minClearSpacingRequired);
  const strengthOk = capacity.phiMn >= Mu;
  const tensionControlled = capacity.epsilonT >= 0.005 - 1e-9;
  const ok =
    demandWithinTensionControlledLimit &&
    strengthOk &&
    tensionControlled &&
    spacingOk;

  let message: string;
  if (!demandWithinTensionControlledLimit) {
    message =
      "The required moment exceeds the tension-controlled capacity. Increase the section dimensions or use a separately designed doubly reinforced section.";
  } else if (!tensionControlled) {
    message =
      "The selected bars make the section transition- or compression-controlled. Select smaller bars, increase the section, or revise the reinforcement arrangement.";
  } else if (!spacingOk) {
    message =
      "Strength is adequate, but the selected bars require an impractical arrangement using the assumed 40 mm cover and 10 mm stirrup.";
  } else if (!strengthOk) {
    message = "The provided reinforcement does not satisfy phi Mn >= Mu.";
  } else {
    message =
      capacity.sectionCase === "flange"
        ? "Design passes. The equivalent compression block is entirely within the flange."
        : "Design passes. The equivalent compression block extends below the flange into the web.";
  }

  return {
    ...capacity,
    ...flange,
    ok,
    message,
    designStatus: ok ? "PASS" : "FAIL",
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
    spacingMessage: spacingOk
      ? `Bars are arranged in ${numberOfLayers} layer${
          numberOfLayers === 1 ? "" : "s"
        } for the spacing check.`
      : `Required clear spacing is at least ${minClearSpacingRequired.toFixed(
          0
        )} mm. Use larger bars, a wider web, or revise the reinforcement arrangement.`,
  };
}

function n(value: number, digits = 2) {
  return value.toFixed(digits);
}

export function getLBeamSolutionSteps(
  input: LBeamDesignInput,
  result: LBeamDesignResult
): LBeamSolutionStep[] {
  const equilibrium =
    result.sectionCase === "flange"
      ? "A_s f_y=0.85f'_c b_fa"
      : "A_s f_y=0.85f'_c[b_wa+(b_f-b_w)h_f]";
  const moment =
    result.sectionCase === "flange"
      ? "M_n=0.85f'_cb_fa(d-a/2)"
      : "M_n=0.85f'_cb_wa(d-a/2)+0.85f'_c(b_f-b_w)h_f(d-h_f/2)";

  return [
    {
      label: "Effective one-sided flange overhang",
      formula:
        "b_o=\\min\\left(L/12,\\;6h_f,\\;(s-b_w)/2\\right),\\qquad b_f=b_w+b_o",
      substitution: `b_o=\\min\\left(${n(input.span)}/12,\\;6(${n(
        input.hf
      )}),\\;(${n(input.beamSpacing)}-${n(input.bw)})/2\\right)`,
      result: `b_o=${n(result.effectiveOverhang)}\\;\\text{mm},\\qquad b_f=${n(
        result.beff
      )}\\;\\text{mm}`,
    },
    {
      label: "Whitney stress-block factor",
      formula:
        "\\beta_1=0.85-0.05\\left(\\dfrac{f'_c-28}{7}\\right),\\quad0.65\\le\\beta_1\\le0.85",
      substitution: `f'_c=${n(input.fc)}\\;\\text{MPa}`,
      result: `\\beta_1=${n(result.beta1, 3)}`,
    },
    {
      label: "Minimum tension reinforcement",
      formula:
        "A_{s,min}=\\max\\left(\\dfrac{0.25\\sqrt{f'_c}}{f_y}b_wd,\\;\\dfrac{1.4}{f_y}b_wd\\right)",
      result: `A_{s,min}=${n(result.asMin)}\\;\\text{mm}^2`,
    },
    {
      label: "Required tension reinforcement",
      formula: equilibrium,
      substitution: `\\phi M_n\\ge M_u=${n(
        input.Mu
      )}\\;\\text{kN}\\cdot\\text{m}`,
      result: `A_{s,calc}=${n(result.asCalculated)}\\;\\text{mm}^2`,
    },
    {
      label: "Selected reinforcement",
      formula: "A_s=\\max(A_{s,calc},A_{s,min})",
      substitution: `A_s=${n(result.asRequired)}\\;\\text{mm}^2`,
      result: `${result.barsRequired}\\text{-}\\phi${input.barDiameter},\\qquad A_{s,prov}=${n(
        result.asProvided
      )}\\;\\text{mm}^2`,
    },
    {
      label: "Compression-block depth and case",
      formula: equilibrium,
      substitution: `a=${n(result.a)}\\;\\text{mm},\\qquad h_f=${n(
        input.hf
      )}\\;\\text{mm}`,
      result:
        result.sectionCase === "flange"
          ? "a\\le h_f\\;\\text{ (within flange)}"
          : "a>h_f\\;\\text{ (flange and web)}",
    },
    {
      label: "Tension strain and strength-reduction factor",
      formula:
        "c=a/\\beta_1,\\qquad\\varepsilon_t=0.003\\left(\\dfrac{d-c}{c}\\right)",
      result: `c=${n(result.c)}\\;\\text{mm},\\qquad\\varepsilon_t=${n(
        result.epsilonT,
        5
      )},\\qquad\\phi=${n(result.phi, 3)}`,
    },
    {
      label: "Design moment strength",
      formula: moment,
      substitution: `M_n=${n(result.Mn)}\\;\\text{kN}\\cdot\\text{m}`,
      result: `\\phi M_n=${n(result.phiMn)}\\;\\text{kN}\\cdot\\text{m}\\;${
        result.phiMn >= input.Mu ? "\\ge" : "<"
      }\\;M_u=${n(input.Mu)}\\;\\text{kN}\\cdot\\text{m}`,
    },
  ];
}
