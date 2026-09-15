export type SectionShape = "rectangular" | "t" | "l" | "custom";
export type BendingDirection = "positive" | "negative";
export type ReinforcementLayout = "none" | "singly" | "doubly";
export type CompressionSteelTransform = "n-minus-1" | "2n-minus-1";
export type MomentBasis = "gross" | "uncracked";
export type CurvatureBasis = "before-cracking" | "after-cracking";
export type LayerRole = "tension" | "compression";

export interface ReinforcementLayerInput {
  count: number;
  diameter: number;
  depth: number;
}

export interface CrackingMomentInput {
  sectionShape: SectionShape;
  direction: BendingDirection;
  reinforcementLayout: ReinforcementLayout;
  compressionSteelTransform: CompressionSteelTransform;
  momentBasis: MomentBasis;
  curvatureBasis: CurvatureBasis;
  fc: number;
  lambda: number;
  Es: number;
  EcOverride?: number;
  b?: number;
  h?: number;
  bf?: number;
  bw?: number;
  hf?: number;
  Ig?: number;
  grossCentroid?: number;
  tensionLayers: ReinforcementLayerInput[];
  compressionLayers: ReinforcementLayerInput[];
}

export interface ReinforcementLayerResult extends ReinforcementLayerInput {
  role: LayerRole;
  area: number;
  barInertia: number;
  transformFactor: number;
  transformedArea: number;
  crackedTransformFactor: number;
  crackedTransformedArea: number;
}

export interface CrackedConcretePartResult {
  area: number;
  centroidFromCompressionFace: number;
  centroidalInertia: number;
}

export interface CrackingMomentResult {
  input: CrackingMomentInput;
  fr: number;
  Ec: number;
  modularRatio: number;
  grossArea: number;
  grossCentroidFromTop: number;
  grossInertia: number;
  grossYt: number;
  uncrackedArea: number;
  uncrackedCentroidFromTop: number;
  uncrackedInertia: number;
  uncrackedYt: number;
  selectedCentroidFromTop: number;
  layers: ReinforcementLayerResult[];
  crackedConcreteParts: CrackedConcretePartResult[];
  crackedNeutralAxisFromCompressionFace: number;
  crackedCentroidFromTop: number;
  crackedInertia: number;
  totalTensionSteelArea: number;
  totalCompressionSteelArea: number;
  codeMcrNmm: number;
  codeMcr: number;
  uncrackedMcrNmm: number;
  uncrackedMcr: number;
  selectedInertia: number;
  selectedYt: number;
  McrNmm: number;
  Mcr: number;
  beforeCrackingCurvaturePerMm: number;
  afterCrackingCurvaturePerMm: number;
  curvaturePerMm: number;
  curvaturePerM: number;
  message: string;
}

export interface CrackingMomentStep {
  label: string;
  formula: string;
  substitution?: string;
  result: string;
  note?: string;
}

interface ConcretePart {
  area: number;
  centroid: number;
  centroidalInertia: number;
}

function positive(value: number | undefined, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Enter a valid positive value for ${label}.`);
  }
  return value;
}

function validateLayer(layer: ReinforcementLayerInput, index: number, role: LayerRole, h: number) {
  const prefix = `${role === "tension" ? "Tension" : "Compression"} layer ${index + 1}`;
  if (!Number.isInteger(layer.count) || layer.count <= 0) {
    throw new Error(`${prefix} must have a positive whole number of bars.`);
  }
  positive(layer.diameter, `${prefix} bar diameter`);
  positive(layer.depth, `${prefix} depth`);
  if (layer.depth >= h) {
    throw new Error(`${prefix} depth must be less than the overall depth h.`);
  }
}

function concreteParts(input: CrackingMomentInput): { parts: ConcretePart[]; h: number } {
  const h = positive(input.h, "overall depth h");
  if (input.sectionShape === "rectangular") {
    const b = positive(input.b, "width b");
    return {
      h,
      parts: [{ area: b * h, centroid: h / 2, centroidalInertia: b * h ** 3 / 12 }],
    };
  }

  const bf = positive(input.bf, "flange width bf");
  const bw = positive(input.bw, "web width bw");
  const hf = positive(input.hf, "flange thickness hf");
  if (bf <= bw) throw new Error("Flange width bf must be greater than web width bw.");
  if (hf >= h) throw new Error("Flange thickness hf must be less than overall depth h.");
  const webDepth = h - hf;
  return {
    h,
    parts: [
      { area: bf * hf, centroid: hf / 2, centroidalInertia: bf * hf ** 3 / 12 },
      { area: bw * webDepth, centroid: hf + webDepth / 2, centroidalInertia: bw * webDepth ** 3 / 12 },
    ],
  };
}

function layerResult(
  layer: ReinforcementLayerInput,
  role: LayerRole,
  modularRatio: number,
  compressionTransform: CompressionSteelTransform,
): ReinforcementLayerResult {
  const area = layer.count * Math.PI * layer.diameter ** 2 / 4;
  // Retain the physical bar I for layer metadata only. The transformed
  // section idealizes each layer as a centroidal point area, so this I is
  // intentionally excluded from both Ig and INA.
  const barInertia = layer.count * Math.PI * layer.diameter ** 4 / 64;
  const transformFactor = role === "compression" && compressionTransform === "2n-minus-1"
    ? 2 * modularRatio - 1
    : modularRatio - 1;
  const crackedTransformFactor = role === "tension"
    ? modularRatio
    : transformFactor;
  return {
    ...layer,
    role,
    area,
    barInertia,
    transformFactor,
    transformedArea: transformFactor * area,
    crackedTransformFactor,
    crackedTransformedArea: crackedTransformFactor * area,
  };
}

function compressedConcreteParts(
  input: CrackingMomentInput,
  h: number,
  c: number,
): CrackedConcretePartResult[] {
  const segments = input.sectionShape === "rectangular"
    ? [{ start: 0, end: h, width: input.b ?? 0 }]
    : input.direction === "positive"
      ? [
          { start: 0, end: input.hf ?? 0, width: input.bf ?? 0 },
          { start: input.hf ?? 0, end: h, width: input.bw ?? 0 },
        ]
      : [
          { start: 0, end: h - (input.hf ?? 0), width: input.bw ?? 0 },
          { start: h - (input.hf ?? 0), end: h, width: input.bf ?? 0 },
        ];

  return segments.flatMap((segment) => {
    const end = Math.min(c, segment.end);
    if (end <= segment.start) return [];
    const depth = end - segment.start;
    return [{
      area: segment.width * depth,
      centroidFromCompressionFace: segment.start + depth / 2,
      centroidalInertia: segment.width * depth ** 3 / 12,
    }];
  });
}

function solveCrackedSection(
  input: CrackingMomentInput,
  h: number,
  layers: ReinforcementLayerResult[],
) {
  const distanceFromCompressionFace = (depthFromTop: number) => input.direction === "positive"
    ? depthFromTop
    : h - depthFromTop;
  const residual = (c: number) => {
    const concreteFirstMoment = compressedConcreteParts(input, h, c).reduce(
      (sum, part) => sum + part.area * (part.centroidFromCompressionFace - c),
      0,
    );
    const steelFirstMoment = layers.reduce(
      (sum, layer) => sum + layer.crackedTransformedArea * (distanceFromCompressionFace(layer.depth) - c),
      0,
    );
    return concreteFirstMoment + steelFirstMoment;
  };

  let low = 0;
  let high = h;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const midpoint = (low + high) / 2;
    if (residual(midpoint) > 0) low = midpoint;
    else high = midpoint;
  }
  const c = (low + high) / 2;
  const concreteParts = compressedConcreteParts(input, h, c);
  const tolerance = Math.max(1e-7, h * 1e-9);
  for (const layer of layers) {
    const distance = distanceFromCompressionFace(layer.depth);
    if (layer.role === "tension" && distance <= c + tolerance) {
      throw new Error("A tension-steel layer lies on the compression side of the cracked neutral axis. Check the bending direction and layer roles.");
    }
    if (layer.role === "compression" && distance >= c - tolerance) {
      throw new Error("A compression-steel layer lies on the tension side of the cracked neutral axis. Check the bending direction and layer roles.");
    }
  }
  const inertia = concreteParts.reduce(
    (sum, part) => sum + part.centroidalInertia + part.area * (part.centroidFromCompressionFace - c) ** 2,
    0,
  ) + layers.reduce((sum, layer) => {
    const distance = distanceFromCompressionFace(layer.depth);
    // Reinforcement is transformed into a concentrated concrete-equivalent
    // area at its centroid. Its centroidal/intrinsic I is therefore zero;
    // only the parallel-axis term A_tr d^2 contributes.
    return sum + layer.crackedTransformedArea * (distance - c) ** 2;
  }, 0);

  return {
    concreteParts,
    neutralAxisFromCompressionFace: c,
    centroidFromTop: input.direction === "positive" ? c : h - c,
    inertia,
  };
}

export function calculateCrackingMoment(input: CrackingMomentInput): CrackingMomentResult {
  const fc = positive(input.fc, "f'c");
  const Es = positive(input.Es, "Es");
  if (!Number.isFinite(input.lambda) || input.lambda <= 0 || input.lambda > 1) {
    throw new Error("Enter a concrete modification factor lambda between 0 and 1.");
  }

  const hasEcOverride = input.EcOverride !== undefined;
  const Ec = hasEcOverride ? positive(input.EcOverride, "entered Ec") : 4700 * Math.sqrt(fc);
  if (input.lambda < 1 && input.reinforcementLayout !== "none" && !hasEcOverride && input.sectionShape !== "custom") {
    throw new Error("Enter Ec for lightweight concrete when reinforcement is included in the transformed-section calculation.");
  }
  const modularRatio = Es / Ec;
  if (modularRatio <= 1) throw new Error("The modular ratio n = Es/Ec must be greater than 1.");
  const fr = 0.62 * input.lambda * Math.sqrt(fc);
  const curvatureBasis = input.curvatureBasis ?? "before-cracking";

  if (input.sectionShape === "custom") {
    if (curvatureBasis === "after-cracking") {
      throw new Error("After-cracking curvature requires rectangular, T-, or L-beam geometry and reinforcement.");
    }
    const h = positive(input.h, "overall depth h");
    const grossInertia = positive(input.Ig, "gross inertia Ig");
    const grossCentroidFromTop = positive(input.grossCentroid, "gross centroid depth");
    if (grossCentroidFromTop >= h) throw new Error("Gross centroid depth must be less than overall depth h.");
    const grossYt = input.direction === "positive" ? h - grossCentroidFromTop : grossCentroidFromTop;
    const codeMcrNmm = fr * grossInertia / grossYt;
    return {
      input: { ...input, curvatureBasis, reinforcementLayout: "none", momentBasis: "gross", tensionLayers: [], compressionLayers: [] },
      fr,
      Ec,
      modularRatio,
      grossArea: 0,
      grossCentroidFromTop,
      grossInertia,
      grossYt,
      uncrackedArea: 0,
      uncrackedCentroidFromTop: grossCentroidFromTop,
      uncrackedInertia: grossInertia,
      uncrackedYt: grossYt,
      selectedCentroidFromTop: grossCentroidFromTop,
      layers: [],
      crackedConcreteParts: [],
      crackedNeutralAxisFromCompressionFace: 0,
      crackedCentroidFromTop: 0,
      crackedInertia: 0,
      totalTensionSteelArea: 0,
      totalCompressionSteelArea: 0,
      codeMcrNmm,
      codeMcr: codeMcrNmm / 1_000_000,
      uncrackedMcrNmm: codeMcrNmm,
      uncrackedMcr: codeMcrNmm / 1_000_000,
      selectedInertia: grossInertia,
      selectedYt: grossYt,
      McrNmm: codeMcrNmm,
      Mcr: codeMcrNmm / 1_000_000,
      beforeCrackingCurvaturePerMm: codeMcrNmm / (Ec * grossInertia),
      afterCrackingCurvaturePerMm: 0,
      curvaturePerMm: codeMcrNmm / (Ec * grossInertia),
      curvaturePerM: codeMcrNmm / (Ec * grossInertia) * 1000,
      message: "Cracking moment based on the entered gross-section properties.",
    };
  }

  const { parts, h } = concreteParts(input);
  const grossArea = parts.reduce((sum, part) => sum + part.area, 0);
  const grossCentroidFromTop = parts.reduce((sum, part) => sum + part.area * part.centroid, 0) / grossArea;
  const grossInertia = parts.reduce(
    (sum, part) => sum + part.centroidalInertia + part.area * (part.centroid - grossCentroidFromTop) ** 2,
    0,
  );
  const grossYt = input.direction === "positive" ? h - grossCentroidFromTop : grossCentroidFromTop;

  const tensionInputs = input.reinforcementLayout === "none" ? [] : input.tensionLayers;
  const compressionInputs = input.reinforcementLayout === "doubly" ? input.compressionLayers : [];
  if (input.reinforcementLayout !== "none" && tensionInputs.length === 0) {
    throw new Error("Add at least one tension reinforcement layer.");
  }
  if (input.reinforcementLayout === "doubly" && compressionInputs.length === 0) {
    throw new Error("Add at least one compression reinforcement layer.");
  }
  tensionInputs.forEach((layer, index) => validateLayer(layer, index, "tension", h));
  compressionInputs.forEach((layer, index) => validateLayer(layer, index, "compression", h));

  const layers = [
    ...tensionInputs.map((layer) => layerResult(layer, "tension", modularRatio, input.compressionSteelTransform)),
    ...compressionInputs.map((layer) => layerResult(layer, "compression", modularRatio, input.compressionSteelTransform)),
  ];
  const uncrackedArea = grossArea + layers.reduce((sum, layer) => sum + layer.transformedArea, 0);
  const distanceFromTensionFace = (depthFromTop: number) => input.direction === "positive"
    ? h - depthFromTop
    : depthFromTop;
  const uncrackedYt = (
    grossArea * grossYt +
    layers.reduce((sum, layer) => sum + layer.transformedArea * distanceFromTensionFace(layer.depth), 0)
  ) / uncrackedArea;
  const uncrackedCentroidFromTop = input.direction === "positive" ? h - uncrackedYt : uncrackedYt;
  const uncrackedInertia = grossInertia + grossArea * (grossYt - uncrackedYt) ** 2 +
    layers.reduce(
      (sum, layer) => sum + layer.transformedArea * (distanceFromTensionFace(layer.depth) - uncrackedYt) ** 2,
      0,
    );
  const codeMcrNmm = fr * grossInertia / grossYt;
  const uncrackedMcrNmm = fr * uncrackedInertia / uncrackedYt;
  const useUncrackedSection = input.momentBasis === "uncracked" && input.reinforcementLayout !== "none";
  const selectedInertia = useUncrackedSection ? uncrackedInertia : grossInertia;
  const selectedYt = useUncrackedSection ? uncrackedYt : grossYt;
  const selectedCentroidFromTop = useUncrackedSection ? uncrackedCentroidFromTop : grossCentroidFromTop;
  const McrNmm = fr * selectedInertia / selectedYt;
  if (curvatureBasis === "after-cracking" && layers.length === 0) {
    throw new Error("After-cracking curvature requires reinforcement.");
  }
  const crackedSection = layers.length ? solveCrackedSection(input, h, layers) : null;
  const beforeCrackingCurvaturePerMm = McrNmm / (Ec * selectedInertia);
  const afterCrackingCurvaturePerMm = crackedSection ? McrNmm / (Ec * crackedSection.inertia) : 0;
  const curvaturePerMm = curvatureBasis === "after-cracking"
    ? afterCrackingCurvaturePerMm
    : beforeCrackingCurvaturePerMm;

  return {
    input: { ...input, curvatureBasis },
    fr,
    Ec,
    modularRatio,
    grossArea,
    grossCentroidFromTop,
    grossInertia,
    grossYt,
    uncrackedArea,
    uncrackedCentroidFromTop,
    uncrackedInertia,
    uncrackedYt,
    selectedCentroidFromTop,
    layers,
    crackedConcreteParts: crackedSection?.concreteParts ?? [],
    crackedNeutralAxisFromCompressionFace: crackedSection?.neutralAxisFromCompressionFace ?? 0,
    crackedCentroidFromTop: crackedSection?.centroidFromTop ?? 0,
    crackedInertia: crackedSection?.inertia ?? 0,
    totalTensionSteelArea: layers.filter((layer) => layer.role === "tension").reduce((sum, layer) => sum + layer.area, 0),
    totalCompressionSteelArea: layers.filter((layer) => layer.role === "compression").reduce((sum, layer) => sum + layer.area, 0),
    codeMcrNmm,
    codeMcr: codeMcrNmm / 1_000_000,
    uncrackedMcrNmm,
    uncrackedMcr: uncrackedMcrNmm / 1_000_000,
    selectedInertia,
    selectedYt,
    McrNmm,
    Mcr: McrNmm / 1_000_000,
    beforeCrackingCurvaturePerMm,
    afterCrackingCurvaturePerMm,
    curvaturePerMm,
    curvaturePerM: curvaturePerMm * 1000,
    message: useUncrackedSection
      ? "Mcr uses the before-cracking centroid and inertia including transformed reinforcement."
      : "Mcr uses the ACI 318-14 / NSCP 2015 concrete-only gross section.",
  };
}

function f(value: number, digits = 2) {
  return value.toFixed(digits);
}

function sumExpression(terms: string[]) {
  return terms.length ? terms.join("+") : "0";
}

export function getCrackingMomentSteps(input: CrackingMomentInput, result: CrackingMomentResult): CrackingMomentStep[] {
  const steps: CrackingMomentStep[] = [
    {
      label: "Code basis and material properties",
      formula: input.EcOverride === undefined
        ? "f_r=0.62\\lambda\\sqrt{f'_c},\\qquad E_c=4700\\sqrt{f'_c},\\qquad n=\\dfrac{E_s}{E_c}"
        : "f_r=0.62\\lambda\\sqrt{f'_c},\\qquad E_c=E_{c,\\,input},\\qquad n=\\dfrac{E_s}{E_c}",
      substitution: input.EcOverride === undefined
        ? `f_r=0.62(${f(input.lambda)})\\sqrt{${f(input.fc)}},\\quad E_c=4700\\sqrt{${f(input.fc)}},\\quad n=\\dfrac{${f(input.Es, 0)}}{${f(result.Ec, 0)}}`
        : `f_r=0.62(${f(input.lambda)})\\sqrt{${f(input.fc)}},\\quad E_c=${f(result.Ec, 0)}\\;\\text{MPa},\\quad n=\\dfrac{${f(input.Es, 0)}}{${f(result.Ec, 0)}}`,
      result: `f_r=${f(result.fr, 3)}\\;\\text{MPa},\\quad E_c=${f(result.Ec, 0)}\\;\\text{MPa},\\quad n=${f(result.modularRatio, 3)}`,
      note: "ACI 318-14 Sections 19.2.3.1 and 19.2.2.1; corresponding NSCP 2015 Sections 419.2.3.1 and 419.2.2.1.",
    },
  ];

  if (input.sectionShape === "custom") {
    steps.push(
      {
        label: "Entered gross-section properties",
        formula: "I_g=I_{g,\\,input},\\qquad \\bar y_g=\\bar y_{g,\\,input}",
        result: `I_g=${f(result.grossInertia, 0)}\\;\\text{mm}^4,\\qquad \\bar y_g=${f(result.grossCentroidFromTop)}\\;\\text{mm}`,
      },
      {
        label: "Distance to the tension face",
        formula: input.direction === "positive" ? "y_{t,g}=h-\\bar y_g" : "y_{t,g}=\\bar y_g",
        substitution: input.direction === "positive" ? `y_{t,g}=${f(input.h ?? 0)}-${f(result.grossCentroidFromTop)}` : `y_{t,g}=${f(result.grossCentroidFromTop)}`,
        result: `y_{t,g}=${f(result.grossYt)}\\;\\text{mm}`,
      },
      {
        label: "Cracking moment",
        formula: "M_{cr}=\\dfrac{f_rI_g}{Y_g}",
        substitution: `M_{cr}=\\dfrac{(${f(result.fr, 3)})(${f(result.grossInertia, 0)})}{${f(result.grossYt)}}`,
        result: `M_{cr}=${f(result.McrNmm, 0)}\\;\\text{N}\\cdot\\text{mm}=${f(result.Mcr, 3)}\\;\\text{kN}\\cdot\\text{m}`,
      },
      {
        label: "Curvature just before cracking",
        formula: "\\phi_{cr}^{-}=\\dfrac{M_{cr}}{E_cI_g}",
        substitution: `\\phi_{cr}^{-}=\\dfrac{${f(result.McrNmm, 0)}}{(${f(result.Ec, 0)})(${f(result.selectedInertia, 0)})}`,
        result: `\\boxed{\\phi_{cr}^{-}=${result.curvaturePerMm.toExponential(4)}\\;\\text{mm}^{-1}=${result.curvaturePerM.toExponential(4)}\\;\\text{m}^{-1}}`,
      },
    );
    return steps;
  }

  const h = input.h ?? 0;
  const useSteelForBeforeCracking = input.momentBasis === "uncracked" && result.layers.length > 0;
  if (input.sectionShape === "rectangular") {
    steps.push({
      label: "Concrete-only gross section",
      formula: "A_c=bh,\\qquad \\bar y_c=\\dfrac h2,\\qquad I_c=\\dfrac{bh^3}{12}",
      substitution: `A_c=(${f(input.b ?? 0)})(${f(h)}),\\quad \\bar y_c=\\dfrac{${f(h)}}2,\\quad I_c=\\dfrac{(${f(input.b ?? 0)})(${f(h)})^3}{12}`,
      result: `A_c=${f(result.grossArea, 0)}\\;\\text{mm}^2,\\quad \\bar y_c=${f(result.grossCentroidFromTop)}\\;\\text{mm},\\quad I_c=${f(result.grossInertia, 0)}\\;\\text{mm}^4`,
    });
  } else {
    const bf = input.bf ?? 0;
    const bw = input.bw ?? 0;
    const hf = input.hf ?? 0;
    const hw = h - hf;
    const Af = bf * hf;
    const Aw = bw * hw;
    steps.push(
      {
        label: "Flange and web areas",
        formula: "A_f=b_fh_f,\\quad y_f=\\dfrac{h_f}{2},\\quad A_w=b_w(h-h_f),\\quad y_w=h_f+\\dfrac{h-h_f}{2}",
        substitution: `A_f=(${f(bf)})(${f(hf)}),\\quad A_w=(${f(bw)})(${f(h)}-${f(hf)})`,
        result: `A_f=${f(Af, 0)}\\;\\text{mm}^2,\\quad y_f=${f(hf / 2)}\\;\\text{mm},\\quad A_w=${f(Aw, 0)}\\;\\text{mm}^2,\\quad y_w=${f(hf + hw / 2)}\\;\\text{mm}`,
      },
      {
        label: "Concrete-only gross centroid",
        formula: "A_c=A_f+A_w,\\qquad \\bar y_c=\\dfrac{A_fy_f+A_wy_w}{A_c}",
        substitution: `\\bar y_c=\\dfrac{(${f(Af, 0)})(${f(hf / 2)})+(${f(Aw, 0)})(${f(hf + hw / 2)})}{${f(result.grossArea, 0)}}`,
        result: `A_c=${f(result.grossArea, 0)}\\;\\text{mm}^2,\\qquad \\bar y_c=${f(result.grossCentroidFromTop)}\\;\\text{mm}`,
      },
      {
        label: "Concrete-only gross moment of inertia",
        formula: "I_c=\\sum\\left(I_{c,j}+A_j\\Delta y_j^2\\right)",
        substitution: `I_c=\\dfrac{(${f(bf)})(${f(hf)})^3}{12}+(${f(Af, 0)})(${f(hf / 2)}-${f(result.grossCentroidFromTop)})^2+\\dfrac{(${f(bw)})(${f(hw)})^3}{12}+(${f(Aw, 0)})(${f(hf + hw / 2)}-${f(result.grossCentroidFromTop)})^2`,
        result: `I_c=${f(result.grossInertia, 0)}\\;\\text{mm}^4`,
      },
    );
  }

  const curvatureSign = result.input.curvatureBasis === "after-cracking" ? "+" : "-";
  if (!useSteelForBeforeCracking) {
    steps.push({
      label: "Concrete-only before-cracking Yg",
      formula: input.direction === "positive" ? "Y_g=h-\\bar y_c" : "Y_g=\\bar y_c",
      substitution: input.direction === "positive" ? `Y_g=${f(h)}-${f(result.grossCentroidFromTop)}` : `Y_g=${f(result.grossCentroidFromTop)}`,
      result: `Y_g=${f(result.grossYt)}\\;\\text{mm}`,
      note: "This step appears only when the selected before-cracking method neglects steel.",
    });
  }

  if (useSteelForBeforeCracking) {
    const tensionLayerCount = result.layers.filter((layer) => layer.role === "tension").length;
    const compressionLayerCount = result.layers.filter((layer) => layer.role === "compression").length;
    let tensionIndex = 0;
    let compressionIndex = 0;
    const layerTerms = result.layers.map((layer) => {
      const roleIndex = layer.role === "tension" ? ++tensionIndex : ++compressionIndex;
      const roleCount = layer.role === "tension" ? tensionLayerCount : compressionLayerCount;
      const symbol = layer.role === "tension"
        ? roleCount === 1 ? "A_s" : `A_{s,${roleIndex}}`
        : roleCount === 1 ? "A'_s" : `A'_{s,${roleIndex}}`;
      const depthSymbol = layer.role === "tension"
        ? roleCount === 1 ? "d" : `d_${roleIndex}`
        : roleCount === 1 ? "d'" : `d'_${roleIndex}`;
      const distanceSymbol = input.direction === "positive" ? `h-${depthSymbol}` : depthSymbol;
      const distance = input.direction === "positive" ? h - layer.depth : layer.depth;
      return { layer, roleIndex, symbol, distanceSymbol, distance };
    });

    layerTerms.forEach(({ layer, roleIndex, symbol, distanceSymbol, distance }) => {
      const factorSymbol = layer.role === "tension" ? "(n-1)" : "k_c";
      const factorDefinition = layer.role === "compression"
        ? input.compressionSteelTransform === "2n-minus-1" ? "k_c=2n-1" : "k_c=n-1"
        : "n-1";
      steps.push({
        label: `${layer.role === "tension" ? "Tension" : "Compression"} steel layer ${roleIndex}`,
        formula: `${symbol}=N\\left(\\dfrac{\\pi d_b^2}{4}\\right),\\qquad \\Delta A=${factorSymbol}${symbol}`,
        substitution: `${symbol}=${layer.count}\\left[\\dfrac{\\pi(${f(layer.diameter)})^2}{4}\\right],\\qquad ${factorDefinition}=${f(layer.transformFactor, 3)},\\qquad \\Delta A=(${f(layer.transformFactor, 3)})(${f(layer.area, 2)})`,
        result: `${symbol}=${f(layer.area, 2)}\\;\\text{mm}^2,\\qquad \\Delta A=${f(layer.transformedArea, 2)}\\;\\text{mm}^2,\\qquad y^*=${distanceSymbol}=${f(distance)}\\;\\text{mm}`,
      });
    });

    const areaTerms = layerTerms.map(({ layer }) => f(layer.transformedArea, 2));
    const firstMomentTerms = layerTerms.map(({ layer, distance }) => `(${f(layer.transformedArea, 2)})(${f(distance)})`);
    const inertiaTerms = layerTerms.map(({ layer, distance }) =>
      `(${f(layer.transformedArea, 2)})(${f(distance)}-${f(result.uncrackedYt)})^2`
    );
    const singleLayerPerRole = tensionLayerCount === 1 && compressionLayerCount <= 1;
    const rectangularCentroidFormula = input.direction === "positive"
      ? compressionLayerCount
        ? "Y_g=\\dfrac{bh(h/2)+(n-1)A_s(h-d)+k_cA'_s(h-d')}{bh+(n-1)A_s+k_cA'_s}"
        : "Y_g=\\dfrac{bh(h/2)+(n-1)A_s(h-d)}{bh+(n-1)A_s}"
      : compressionLayerCount
        ? "Y_g=\\dfrac{bh(h/2)+(n-1)A_sd+k_cA'_sd'}{bh+(n-1)A_s+k_cA'_s}"
        : "Y_g=\\dfrac{bh(h/2)+(n-1)A_sd}{bh+(n-1)A_s}";
    const genericCentroidFormula = input.direction === "positive"
      ? "A_g=A_c+\\sum_i\\Delta A_i,\\qquad Y_g=\\dfrac{A_c(h-\\bar y_c)+\\sum_i\\Delta A_i y_i^*}{A_g}"
      : "A_g=A_c+\\sum_i\\Delta A_i,\\qquad Y_g=\\dfrac{A_c\\bar y_c+\\sum_i\\Delta A_i y_i^*}{A_g}";
    steps.push(
      {
        label: "Before-cracking Yg by Varignon's theorem",
        formula: input.sectionShape === "rectangular" && singleLayerPerRole ? rectangularCentroidFormula : genericCentroidFormula,
        substitution: `A_g=${f(result.grossArea, 0)}+${sumExpression(areaTerms)},\\quad Y_g=\\dfrac{(${f(result.grossArea, 0)})(${f(result.grossYt)})+${sumExpression(firstMomentTerms)}}{${f(result.uncrackedArea, 2)}}`,
        result: `A_g=${f(result.uncrackedArea, 2)}\\;\\text{mm}^2,\\qquad Y_g=${f(result.uncrackedYt)}\\;\\text{mm},\\qquad \\bar y_{g,\\mathrm{top}}=${f(result.uncrackedCentroidFromTop)}\\;\\text{mm}`,
        note: input.direction === "positive"
          ? "All first moments are taken from the bottom tension face, so a layer entered at depth d from the top has y*=h-d. For doubly reinforced sections, the compression layer is included with the selected kc=(n-1) or kc=(2n-1)."
          : "All first moments are taken from the top tension face, so a layer entered at depth d from the top has y*=d. For doubly reinforced sections, the compression layer is included with the selected kc=(n-1) or kc=(2n-1).",
      },
      {
        label: "Before-cracking Ig including steel",
        formula: input.direction === "positive"
          ? "I_g=I_c+A_c\\left[(h-\\bar y_c)-Y_g\\right]^2+\\sum_i\\Delta A_i(y_i^*-Y_g)^2"
          : "I_g=I_c+A_c(\\bar y_c-Y_g)^2+\\sum_i\\Delta A_i(y_i^*-Y_g)^2",
        substitution: `I_g=${f(result.grossInertia, 0)}+(${f(result.grossArea, 0)})(${f(result.grossYt)}-${f(result.uncrackedYt)})^2+${sumExpression(inertiaTerms)}`,
        result: `I_g=${f(result.uncrackedInertia, 0)}\\;\\text{mm}^4,\\qquad Y_g=${f(result.uncrackedYt)}\\;\\text{mm}`,
        note: "Transformed steel is treated as a centroidal point area: its intrinsic I is zero, so only \\Delta A_i d_i^2 is added. Tensile concrete remains before cracking.",
      },
    );
  }

  steps.push({
    label: "Cracking moment",
    formula: "M_{cr}=\\dfrac{f_rI_g}{Y_g}",
    substitution: `M_{cr}=\\dfrac{(${f(result.fr, 3)})(${f(result.selectedInertia, 0)})}{${f(result.selectedYt)}}`,
    result: `\\boxed{M_{cr}=${f(result.McrNmm, 0)}\\;\\text{N}\\cdot\\text{mm}=${f(result.Mcr, 3)}\\;\\text{kN}\\cdot\\text{m}}`,
    note: input.momentBasis === "gross"
      ? "This option follows ACI 318-14 Section 24.2.3.5b / NSCP 2015 Section 424.2.3.5b using the concrete-only gross section."
      : "This option uses the selected steel-inclusive uncracked gross-section properties. It is still the single cracking moment, calculated before tensile concrete is removed.",
  });

  if (result.input.curvatureBasis === "after-cracking" && result.layers.length) {
    const c = result.crackedNeutralAxisFromCompressionFace;
    const fromCompressionFace = (depthFromTop: number) => input.direction === "positive" ? depthFromTop : h - depthFromTop;
    if (!useSteelForBeforeCracking) {
      result.layers.forEach((layer, index) => {
        const symbol = layer.role === "tension" ? `A_{s,${index + 1}}` : `A'_{s,${index + 1}}`;
        const factor = layer.role === "tension" ? "n" : "k_c";
        steps.push({
          label: `After-cracking ${layer.role} steel layer ${index + 1}`,
          formula: `${symbol}=N\\left(\\dfrac{\\pi d_b^2}{4}\\right),\\qquad A_{tr}=${factor}${symbol}`,
          substitution: `${symbol}=${layer.count}\\left[\\dfrac{\\pi(${f(layer.diameter)})^2}{4}\\right],\\qquad A_{tr}=(${f(layer.crackedTransformFactor, 3)})(${f(layer.area, 2)})`,
          result: `${symbol}=${f(layer.area, 2)}\\;\\text{mm}^2,\\qquad A_{tr}=${f(layer.crackedTransformedArea, 2)}\\;\\text{mm}^2`,
        });
      });
    }
    const concreteEquilibriumTerms = result.crackedConcreteParts.map((part) =>
      `(${f(part.area, 2)})(${f(c)}-${f(part.centroidFromCompressionFace)})`
    );
    const compressionEquilibriumTerms = result.layers
      .filter((layer) => layer.role === "compression")
      .map((layer) => `(${f(layer.crackedTransformedArea, 2)})(${f(c)}-${f(fromCompressionFace(layer.depth))})`);
    const tensionEquilibriumTerms = result.layers
      .filter((layer) => layer.role === "tension")
      .map((layer) => `(${f(layer.crackedTransformedArea, 2)})(${f(fromCompressionFace(layer.depth))}-${f(c)})`);
    const concreteInertiaTerms = result.crackedConcreteParts.map((part) =>
      `${f(part.centroidalInertia, 2)}+(${f(part.area, 2)})(${f(part.centroidFromCompressionFace)}-${f(c)})^2`
    );
    const steelInertiaTerms = result.layers.map((layer) =>
      `(${f(layer.crackedTransformedArea, 2)})(${f(fromCompressionFace(layer.depth))}-${f(c)})^2`
    );
    const oneTensionLayer = result.layers.filter((layer) => layer.role === "tension").length === 1;
    const oneCompressionLayer = result.layers.filter((layer) => layer.role === "compression").length === 1;
    const crackedAxisFormula = input.sectionShape === "rectangular" && oneTensionLayer
      ? input.direction === "positive"
        ? oneCompressionLayer
          ? "bc\\left(\\dfrac c2\\right)+k_cA'_s(c-d')=nA_s(d-c)"
          : "bc\\left(\\dfrac c2\\right)=nA_s(d-c)"
        : oneCompressionLayer
          ? "bc\\left(\\dfrac c2\\right)+k_cA'_s\\left[c-(h-d')\\right]=nA_s\\left[(h-d)-c\\right]"
          : "bc\\left(\\dfrac c2\\right)=nA_s\\left[(h-d)-c\\right]"
      : "\\sum_j A_{c,j}(c-z_{c,j})+\\sum_k k_cA'_{s,k}(c-z'_{s,k})=\\sum_i nA_{s,i}(z_{s,i}-c)";
    steps.push({
      label: "After-cracking neutral axis",
      formula: crackedAxisFormula,
      substitution: `${sumExpression([...concreteEquilibriumTerms, ...compressionEquilibriumTerms])}=${sumExpression(tensionEquilibriumTerms)}`,
      result: `c_{NA}=${f(c)}\\;\\text{mm from the compression face},\\qquad \\bar y_{NA,\\mathrm{top}}=${f(result.crackedCentroidFromTop)}\\;\\text{mm}`,
      note: "Tensile concrete is omitted. Tension steel is transformed as nAs; compression steel uses the selected kc factor after subtracting displaced concrete.",
    }, {
      label: "After-cracking neutral-axis inertia",
      formula: "I_{NA}=\\sum_j\\left[I_{c,j}+A_{c,j}(z_{c,j}-c_{NA})^2\\right]+\\sum_i k_iA_{s,i}(z_{s,i}-c_{NA})^2",
      substitution: `I_{NA}=${sumExpression(concreteInertiaTerms)}+${sumExpression(steelInertiaTerms)}`,
      result: `I_{NA}=${f(result.crackedInertia, 0)}\\;\\text{mm}^4`,
    });
  }

  steps.push({
    label: result.input.curvatureBasis === "after-cracking" ? "Curvature just after cracking" : "Curvature just before cracking",
    formula: result.input.curvatureBasis === "after-cracking"
      ? "\\phi_{cr}^{+}=\\dfrac{M_{cr}}{E_cI_{NA}}"
      : "\\phi_{cr}^{-}=\\dfrac{M_{cr}}{E_cI_g}",
    substitution: `\\phi_{cr}^{${curvatureSign}}=\\dfrac{${f(result.McrNmm, 0)}}{(${f(result.Ec, 0)})(${f(result.input.curvatureBasis === "after-cracking" ? result.crackedInertia : result.selectedInertia, 0)})}`,
    result: `\\boxed{\\phi_{cr}^{${curvatureSign}}=${result.curvaturePerMm.toExponential(4)}\\;\\text{mm}^{-1}=${result.curvaturePerM.toExponential(4)}\\;\\text{m}^{-1}}`,
    note: result.input.curvatureBasis === "after-cracking"
      ? "The same Mcr calculated from the selected before-cracking section is used. No second or after-cracking Mcr is calculated."
      : "This uses the selected before-cracking Ig at the cracking moment.",
  });
  return steps;
}
