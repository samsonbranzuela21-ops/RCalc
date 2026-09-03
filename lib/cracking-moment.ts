export type CrackingSectionMode =
  | "rectangle"
  | "custom";

export type BendingDirection =
  | "positive"
  | "negative";

export type ReinforcementMode =
  | "none"
  | "bottom"
  | "top"
  | "both";

export interface CrackingMomentInput {
  mode: CrackingSectionMode;
  direction: BendingDirection;
  reinforcementMode: ReinforcementMode;

  fc: number;
  lambda: number;

  b?: number;
  h?: number;
  modularRatio?: number;

  bottomBarCount?: number;
  bottomBarDiameter?: number;
  topBarCount?: number;
  topBarDiameter?: number;

  d?: number;
  dPrime?: number;

  Ig?: number;
  yt?: number;
}

export interface CrackingMomentResult {
  mode: CrackingSectionMode;
  direction: BendingDirection;
  reinforcementMode: ReinforcementMode;

  fr: number;
  As: number;
  AsPrime: number;

  grossArea: number;
  transformedTensionArea: number;
  transformedCompressionArea: number;
  transformedArea: number;

  tensionSteelY: number | null;
  compressionSteelY: number | null;

  neutralAxisFromTop: number;
  grossInertia: number;
  inertia: number;
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

function requirePositive(
  value: number | undefined,
  label: string
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `Enter a valid positive value for ${label}.`
    );
  }

  return value;
}

function requirePositiveInteger(
  value: number | undefined,
  label: string
): number {
  const checked = requirePositive(value, label);

  if (!Number.isInteger(checked)) {
    throw new Error(
      `${label} must be a whole number.`
    );
  }

  return checked;
}

function hasBottomSteel(
  mode: ReinforcementMode
) {
  return mode === "bottom" || mode === "both";
}

function hasTopSteel(
  mode: ReinforcementMode
) {
  return mode === "top" || mode === "both";
}

export function calculateCrackingMoment(
  input: CrackingMomentInput
): CrackingMomentResult {
  const {
    mode,
    direction,
    reinforcementMode,
    fc,
    lambda,
  } = input;

  requirePositive(fc, "f'c");

  if (
    !Number.isFinite(lambda) ||
    lambda <= 0 ||
    lambda > 1
  ) {
    throw new Error(
      "Enter a valid concrete factor λ."
    );
  }

  const fr =
    0.62 * lambda * Math.sqrt(fc);

  if (mode === "custom") {
    const inertia = requirePositive(
      input.Ig,
      "Ig"
    );

    const yt = requirePositive(
      input.yt,
      "yt"
    );

    const sectionModulus =
      inertia / yt;

    const McrNmm =
      fr * sectionModulus;

    const Mcr =
      McrNmm / 1_000_000;

    return {
      mode,
      direction,
      reinforcementMode: "none",

      fr,
      As: 0,
      AsPrime: 0,

      grossArea: 0,
      transformedTensionArea: 0,
      transformedCompressionArea: 0,
      transformedArea: 0,

      tensionSteelY: null,
      compressionSteelY: null,

      neutralAxisFromTop: 0,
      grossInertia: inertia,
      inertia,
      yt,
      sectionModulus,

      McrNmm,
      Mcr,

      message:
        `Cracking moment: ` +
        `Mcr = ${Mcr.toFixed(2)} kN·m.`,
    };
  }

  const b =
    requirePositive(input.b, "b");

  const h =
    requirePositive(input.h, "h");

  const grossArea =
    b * h;

  const grossInertia =
    (b * h ** 3) / 12;

  const includesBottom =
    hasBottomSteel(reinforcementMode);

  const includesTop =
    hasTopSteel(reinforcementMode);

  let modularRatio = 1;
  let As = 0;
  let AsPrime = 0;
  let d = 0;
  let dPrime = 0;

  if (reinforcementMode !== "none") {
    modularRatio = requirePositive(
      input.modularRatio,
      "modular ratio n"
    );

    if (modularRatio <= 1) {
      throw new Error(
        "The modular ratio n must be greater than 1."
      );
    }
  }

  /*
   * Bottom steel area:
   * As = number of bars × area of one bar
   */
  if (includesBottom) {
    const numberOfBars =
      requirePositiveInteger(
        input.bottomBarCount,
        "The number of bottom bars"
      );

    const barDiameter =
      requirePositive(
        input.bottomBarDiameter,
        "bottom-bar diameter"
      );

    As =
      numberOfBars *
      (Math.PI * barDiameter ** 2) /
      4;

    d = requirePositive(
      input.d,
      "effective depth d"
    );

    if (d >= h) {
      throw new Error(
        "The effective depth d must be less than h."
      );
    }
  }

  /*
   * Top steel area:
   * As' = number of bars × area of one bar
   */
  if (includesTop) {
    const numberOfBars =
      requirePositiveInteger(
        input.topBarCount,
        "The number of top bars"
      );

    const barDiameter =
      requirePositive(
        input.topBarDiameter,
        "top-bar diameter"
      );

    AsPrime =
      numberOfBars *
      (Math.PI * barDiameter ** 2) /
      4;

    dPrime = requirePositive(
      input.dPrime,
      "top-steel depth d'"
    );

    if (dPrime >= h) {
      throw new Error(
        "The depth d' must be less than h."
      );
    }
  }

  /*
   * Positive moment:
   * bottom steel is in tension
   *
   * Negative moment:
   * top steel is in tension
   */
  const tensionSteelArea =
    direction === "positive"
      ? includesBottom
        ? As
        : 0
      : includesTop
        ? AsPrime
        : 0;

  const compressionSteelArea =
    direction === "positive"
      ? includesTop
        ? AsPrime
        : 0
      : includesBottom
        ? As
        : 0;

  const tensionSteelY =
    direction === "positive"
      ? includesBottom
        ? d
        : null
      : includesTop
        ? dPrime
        : null;

  const compressionSteelY =
    direction === "positive"
      ? includesTop
        ? dPrime
        : null
      : includesBottom
        ? d
        : null;

  /*
   * Transformed steel areas
   */
  const transformedTensionArea =
    modularRatio * tensionSteelArea;

  const transformedCompressionArea =
    (modularRatio - 1) *
    compressionSteelArea;

  const transformedArea =
    grossArea +
    transformedTensionArea +
    transformedCompressionArea;

  /*
   * Neutral axis from top face
   */
  const neutralAxisFromTop =
    (
      grossArea * (h / 2) +
      transformedTensionArea *
        (tensionSteelY ?? 0) +
      transformedCompressionArea *
        (compressionSteelY ?? 0)
    ) / transformedArea;

  /*
   * Transformed moment of inertia
   */
  const concreteInertia =
    grossInertia +
    grossArea *
      (h / 2 - neutralAxisFromTop) ** 2;

  const tensionSteelInertia =
    transformedTensionArea *
    (
      (tensionSteelY ??
        neutralAxisFromTop) -
      neutralAxisFromTop
    ) ** 2;

  const compressionSteelInertia =
    transformedCompressionArea *
    (
      (compressionSteelY ??
        neutralAxisFromTop) -
      neutralAxisFromTop
    ) ** 2;

  const inertia =
    concreteInertia +
    tensionSteelInertia +
    compressionSteelInertia;

  /*
   * Distance to active tension face
   */
  const yt =
    direction === "positive"
      ? h - neutralAxisFromTop
      : neutralAxisFromTop;

  const sectionModulus =
    inertia / yt;

  const McrNmm =
    fr * sectionModulus;

  const Mcr =
    McrNmm / 1_000_000;

  return {
    mode,
    direction,
    reinforcementMode,

    fr,
    As,
    AsPrime,

    grossArea,
    transformedTensionArea,
    transformedCompressionArea,
    transformedArea,

    tensionSteelY,
    compressionSteelY,

    neutralAxisFromTop,
    grossInertia,
    inertia,
    yt,
    sectionModulus,

    McrNmm,
    Mcr,

    message:
      `${
        direction === "positive"
          ? "Positive"
          : "Negative"
      } cracking moment: ` +
      `Mcr = ${Mcr.toFixed(2)} kN·m.`,
  };
}

function fixed(
  value: number,
  digits = 2
) {
  return value.toFixed(digits);
}

export function getCrackingMomentSteps(
  input: CrackingMomentInput,
  result: CrackingMomentResult
): CrackingMomentStep[] {
  const steps: CrackingMomentStep[] = [
    {
      label: "Modulus of rupture",

      formula:
        "f_r=0.62\\lambda\\sqrt{f'_c}",

      substitution:
        `f_r=0.62(${fixed(
          input.lambda
        )})\\sqrt{${fixed(input.fc)}}`,

      result:
        `f_r=${fixed(
          result.fr,
          3
        )}\\;\\text{MPa}`,
    },
  ];

  if (input.mode === "custom") {
    steps.push(
      {
        label: "Section properties",

        formula:
          "I=I_{input},\\qquad y_t=y_{t,input}",

        result:
          `I=${fixed(
            result.inertia,
            0
          )}\\;\\text{mm}^4,` +
          `\\qquad y_t=${fixed(
            result.yt
          )}\\;\\text{mm}`,
      },
      {
        label: "Section modulus",

        formula:
          "S=\\dfrac{I}{y_t}",

        substitution:
          `S=\\dfrac{${fixed(
            result.inertia,
            0
          )}}{${fixed(result.yt)}}`,

        result:
          `S=${fixed(
            result.sectionModulus,
            0
          )}\\;\\text{mm}^3`,
      },
      {
        label: "Cracking moment",

        formula:
          "M_{cr}=f_rS",

        substitution:
          `M_{cr}=(${fixed(
            result.fr,
            3
          )})(${fixed(
            result.sectionModulus,
            0
          )})`,

        result:
          `M_{cr}=${fixed(
            result.Mcr
          )}\\;\\text{kN}\\cdot\\text{m}`,
      }
    );

    return steps;
  }

  const b = input.b ?? 0;
  const h = input.h ?? 0;

  /*
   * Show bottom bar area calculation
   */
  if (
    hasBottomSteel(
      input.reinforcementMode
    )
  ) {
    steps.push({
      label:
        "Area of bottom reinforcement",

      formula:
        "A_s=N_b" +
        "\\left(\\dfrac{\\pi d_b^2}{4}\\right)",

      substitution:
        `A_s=(${fixed(
          input.bottomBarCount ?? 0,
          0
        )})` +
        `\\left[` +
        `\\dfrac{\\pi(${fixed(
          input.bottomBarDiameter ?? 0
        )})^2}{4}` +
        `\\right]`,

      result:
        `A_s=${fixed(
          result.As,
          2
        )}\\;\\text{mm}^2`,
    });
  }

  /*
   * Show top bar area calculation
   */
  if (
    hasTopSteel(
      input.reinforcementMode
    )
  ) {
    steps.push({
      label:
        "Area of top reinforcement",

      formula:
        "A'_s=N'_b" +
        "\\left(\\dfrac{\\pi {d'_b}^2}{4}\\right)",

      substitution:
        `A'_s=(${fixed(
          input.topBarCount ?? 0,
          0
        )})` +
        `\\left[` +
        `\\dfrac{\\pi(${fixed(
          input.topBarDiameter ?? 0
        )})^2}{4}` +
        `\\right]`,

      result:
        `A'_s=${fixed(
          result.AsPrime,
          2
        )}\\;\\text{mm}^2`,
    });
  }

  steps.push({
    label:
      "Gross concrete properties",

    formula:
      "A_g=bh," +
      "\\qquad I_g=\\dfrac{bh^3}{12}",

    substitution:
      `A_g=(${fixed(b)})(${fixed(h)}),` +
      `\\qquad I_g=` +
      `\\dfrac{(${fixed(b)})` +
      `(${fixed(h)})^3}{12}`,

    result:
      `A_g=${fixed(
        result.grossArea,
        0
      )}\\;\\text{mm}^2,` +
      `\\qquad I_g=${fixed(
        result.grossInertia,
        0
      )}\\;\\text{mm}^4`,
  });

  if (
    input.reinforcementMode !== "none"
  ) {
    const tensionArea =
      input.direction === "positive"
        ? result.As
        : result.AsPrime;

    const compressionArea =
      input.direction === "positive"
        ? result.AsPrime
        : result.As;

    steps.push({
      label:
        "Transformed steel areas",

      formula:
        "A_{st}=nA_s," +
        "\\qquad A_{sc}=(n-1)A'_s",

      substitution:
        `A_{st}=(${fixed(
          input.modularRatio ?? 0
        )})(${fixed(tensionArea, 2)}),` +
        `\\qquad A_{sc}=(${fixed(
          (input.modularRatio ?? 0) - 1
        )})(${fixed(compressionArea, 2)})`,

      result:
        `A_{st}=${fixed(
          result.transformedTensionArea,
          2
        )}\\;\\text{mm}^2,` +
        `\\qquad A_{sc}=${fixed(
          result.transformedCompressionArea,
          2
        )}\\;\\text{mm}^2`,
    });
  }

  const tensionMoment =
    result.transformedTensionArea > 0
      ? `+(${fixed(
          result.transformedTensionArea,
          2
        )})(${fixed(
          result.tensionSteelY ?? 0
        )})`
      : "";

  const compressionMoment =
    result.transformedCompressionArea > 0
      ? `+(${fixed(
          result.transformedCompressionArea,
          2
        )})(${fixed(
          result.compressionSteelY ?? 0
        )})`
      : "";

  steps.push({
    label:
      "Neutral-axis location",

    formula:
      "\\bar y=" +
      "\\dfrac{\\sum Ay}{\\sum A}",

    substitution:
      `\\bar y=\\dfrac{` +
      `(${fixed(
        result.grossArea,
        0
      )})(${fixed(h / 2)})` +
      `${tensionMoment}` +
      `${compressionMoment}` +
      `}{${fixed(
        result.transformedArea,
        2
      )}}`,

    result:
      `\\bar y=${fixed(
        result.neutralAxisFromTop
      )}\\;\\text{mm}`,
  });

  steps.push({
    label:
      "Transformed moment of inertia",

    formula:
      "I_{tr}=I_g+" +
      "A_g\\left(\\dfrac h2-\\bar y\\right)^2+" +
      "A_{st}(y_{st}-\\bar y)^2+" +
      "A_{sc}(y_{sc}-\\bar y)^2",

    result:
      `I_{tr}=${fixed(
        result.inertia,
        0
      )}\\;\\text{mm}^4`,
  });

  steps.push({
    label:
      "Distance to tension face",

    formula:
      input.direction === "positive"
        ? "y_t=h-\\bar y"
        : "y_t=\\bar y",

    substitution:
      input.direction === "positive"
        ? `y_t=${fixed(h)}-${fixed(
            result.neutralAxisFromTop
          )}`
        : `y_t=${fixed(
            result.neutralAxisFromTop
          )}`,

    result:
      `y_t=${fixed(
        result.yt
      )}\\;\\text{mm}`,
  });

  steps.push({
    label:
      "Elastic section modulus",

    formula:
      "S=\\dfrac{I_{tr}}{y_t}",

    substitution:
      `S=\\dfrac{${fixed(
        result.inertia,
        0
      )}}{${fixed(result.yt)}}`,

    result:
      `S=${fixed(
        result.sectionModulus,
        0
      )}\\;\\text{mm}^3`,
  });

  steps.push({
    label:
      "Cracking moment",

    formula:
      "M_{cr}=\\dfrac{f_rI_{tr}}{y_t}=f_rS",

    substitution:
      `M_{cr}=(${fixed(
        result.fr,
        3
      )})(${fixed(
        result.sectionModulus,
        0
      )})`,

    result:
      `M_{cr}=${fixed(
        result.McrNmm,
        0
      )}\\;\\text{N}\\cdot\\text{mm}` +
      `=${fixed(
        result.Mcr
      )}\\;\\text{kN}\\cdot\\text{m}`,
  });

  return steps;
}