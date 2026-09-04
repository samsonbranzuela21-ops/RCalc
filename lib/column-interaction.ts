export interface ReinforcementLayer {
  id: string;
  count: number;
  diameter: number;
  y: number;
}

export interface ColumnInteractionInput {
  b: number;
  h: number;
  fc: number;
  fy: number;
  Es: number;
  layers: ReinforcementLayer[];
  Pu: number;
  Mu: number;
}

export interface InteractionPoint {
  key?: "A" | "D" | "D.5" | "E" | "F" | "G";
  label?: string;
  c: number | null;
  a: number;
  epsilonT: number;
  phi: number;
  Pn: number;
  Mn: number;
  phiPn: number;
  phiMn: number;
  concreteForce: number;
  concreteMoment: number;
  steelForce: number;
  steelMoment: number;
  layerStates: LayerState[];
}

export interface LayerResult extends ReinforcementLayer {
  area: number;
}

export interface LayerState extends LayerResult {
  strain: number;
  stress: number;
  force: number;
  moment: number;
  insideCompressionBlock: boolean;
}

export interface ColumnInteractionResult {
  beta1: number;
  epsilonY: number;
  Ag: number;
  Ast: number;
  rho: number;
  Po: number;
  maxDesignAxial: number;
  tensionCapacity: number;
  d: number;
  layers: LayerResult[];
  keyPoints: InteractionPoint[];
  nominalCurve: InteractionPoint[];
  designCurve: InteractionPoint[];
  demandMomentCapacity: number | null;
  demandRatio: number | null;
  eccentricity: number | null;
  status: "SAFE" | "NOT SAFE" | "OUTSIDE RANGE";
  warnings: string[];
}

const EPSILON_CU = 0.003;

function positive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Enter a valid positive value for ${label}.`);
  }
  return value;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getBeta1(fc: number) {
  if (fc <= 28) return 0.85;
  return Math.max(0.65, 0.85 - (0.05 * (fc - 28)) / 7);
}

function getPhi(epsilonT: number, epsilonY: number) {
  if (epsilonT <= epsilonY) return 0.65;
  if (epsilonT >= 0.005) return 0.9;
  return 0.65 + (0.25 * (epsilonT - epsilonY)) / (0.005 - epsilonY);
}

function analyzeAtC(
  input: ColumnInteractionInput,
  layers: LayerResult[],
  beta1: number,
  epsilonY: number,
  c: number,
  maxDesignAxial: number
): InteractionPoint {
  const a = Math.min(beta1 * c, input.h);
  const concreteForce = 0.85 * input.fc * input.b * a;
  let axialForce = concreteForce;
  let momentAboutCentroid = concreteForce * (input.h / 2 - a / 2);
  let epsilonT = 0;
  const layerStates: LayerState[] = [];

  for (const layer of layers) {
    const strain = (EPSILON_CU * (c - layer.y)) / c;
    const stress = clamp(input.Es * strain, -input.fy, input.fy);
    // Concrete block already includes the concrete displaced by embedded bars.
    const force =
      layer.y <= a
        ? (stress - 0.85 * input.fc) * layer.area
        : stress * layer.area;
    axialForce += force;
    momentAboutCentroid += force * (input.h / 2 - layer.y);
    if (strain < 0) epsilonT = Math.max(epsilonT, -strain);
    layerStates.push({
      ...layer,
      strain,
      stress,
      force: force / 1000,
      moment: (force * (input.h / 2 - layer.y)) / 1_000_000,
      insideCompressionBlock: layer.y <= a,
    });
  }

  const phi = getPhi(epsilonT, epsilonY);
  const Pn = axialForce / 1000;
  const Mn = Math.abs(momentAboutCentroid) / 1_000_000;
  return {
    c,
    a,
    epsilonT,
    phi,
    Pn,
    Mn,
    phiPn: Pn > 0 ? Math.min(phi * Pn, maxDesignAxial) : phi * Pn,
    phiMn: phi * Mn,
    concreteForce: concreteForce / 1000,
    concreteMoment:
      (concreteForce * (input.h / 2 - a / 2)) / 1_000_000,
    steelForce: layerStates.reduce((sum, layer) => sum + layer.force, 0),
    steelMoment: layerStates.reduce((sum, layer) => sum + layer.moment, 0),
    layerStates,
  };
}

function findPureBendingC(
  input: ColumnInteractionInput,
  layers: LayerResult[],
  beta1: number,
  epsilonY: number,
  maxDesignAxial: number
) {
  let low = input.h * 1e-6;
  let high = input.h * 10;
  for (let i = 0; i < 100; i += 1) {
    const mid = (low + high) / 2;
    const point = analyzeAtC(
      input,
      layers,
      beta1,
      epsilonY,
      mid,
      maxDesignAxial
    );
    if (point.Pn > 0) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}

function capacityAtPu(curve: InteractionPoint[], Pu: number) {
  const intersections: number[] = [];
  for (let i = 0; i < curve.length - 1; i += 1) {
    const first = curve[i];
    const second = curve[i + 1];
    const low = Math.min(first.phiPn, second.phiPn);
    const high = Math.max(first.phiPn, second.phiPn);
    if (Pu < low - 1e-8 || Pu > high + 1e-8) continue;
    const delta = second.phiPn - first.phiPn;
    const ratio = Math.abs(delta) < 1e-10 ? 0 : (Pu - first.phiPn) / delta;
    intersections.push(first.phiMn + ratio * (second.phiMn - first.phiMn));
  }
  return intersections.length ? Math.max(...intersections) : null;
}

export function calculateColumnInteraction(
  input: ColumnInteractionInput
): ColumnInteractionResult {
  positive(input.b, "b");
  positive(input.h, "h");
  positive(input.fc, "f'c");
  positive(input.fy, "fy");
  positive(input.Es, "Es");
  if (!Number.isFinite(input.Pu) || !Number.isFinite(input.Mu)) {
    throw new Error("Enter valid numerical values for Pu and Mu.");
  }
  if (!input.layers.length) throw new Error("Add at least one reinforcement layer.");

  const layers = input.layers.map((layer, index) => {
    if (!Number.isInteger(layer.count) || layer.count <= 0) {
      throw new Error(`Layer ${index + 1}: number of bars must be a positive whole number.`);
    }
    positive(layer.diameter, `Layer ${index + 1} bar diameter`);
    if (!Number.isFinite(layer.y) || layer.y <= 0 || layer.y >= input.h) {
      throw new Error(`Layer ${index + 1}: y must be greater than 0 and less than h.`);
    }
    return {
      ...layer,
      area: (layer.count * Math.PI * layer.diameter ** 2) / 4,
    };
  });

  const Ag = input.b * input.h;
  const Ast = layers.reduce((total, layer) => total + layer.area, 0);
  if (Ast >= Ag) throw new Error("Total steel area must be less than the gross area.");
  const rho = Ast / Ag;
  const beta1 = getBeta1(input.fc);
  const epsilonY = input.fy / input.Es;
  const Po = (0.85 * input.fc * (Ag - Ast) + input.fy * Ast) / 1000;
  const maxDesignAxial = 0.8 * 0.65 * Po;
  const tensionCapacity = (-input.fy * Ast) / 1000;
  const d = Math.max(...layers.map((layer) => layer.y));

  const atC = (c: number) =>
    analyzeAtC(input, layers, beta1, epsilonY, c, maxDesignAxial);
  const balancedC = (EPSILON_CU * d) / (EPSILON_CU + epsilonY);
  const transitionC = (EPSILON_CU * d) / (EPSILON_CU + 0.004);
  const tensionControlledC = (EPSILON_CU * d) / (EPSILON_CU + 0.005);
  const pureBendingC = findPureBendingC(
    input,
    layers,
    beta1,
    epsilonY,
    maxDesignAxial
  );

  const axialPoint: InteractionPoint = {
    key: "A",
    label: "Pure axial compression",
    c: null,
    a: input.h,
    epsilonT: 0,
    phi: 0.65,
    Pn: Po,
    Mn: 0,
    phiPn: maxDesignAxial,
    phiMn: 0,
    concreteForce: (0.85 * input.fc * (Ag - Ast)) / 1000,
    concreteMoment: 0,
    steelForce: (input.fy * Ast) / 1000,
    steelMoment: 0,
    layerStates: layers.map((layer) => ({
      ...layer,
      strain: epsilonY,
      stress: input.fy,
      force: (input.fy * layer.area) / 1000,
      moment: 0,
      insideCompressionBlock: true,
    })),
  };
  const makeKey = (
    key: InteractionPoint["key"],
    label: string,
    c: number
  ): InteractionPoint => ({ ...atC(c), key, label });
  const pureBending = makeKey("F", "Pure bending, Pn = 0", pureBendingC);
  const tensionPoint: InteractionPoint = {
    key: "G",
    label: "Pure axial tension",
    c: 0,
    a: 0,
    epsilonT: Number.POSITIVE_INFINITY,
    phi: 0.9,
    Pn: tensionCapacity,
    Mn: 0,
    phiPn: 0.9 * tensionCapacity,
    phiMn: 0,
    concreteForce: 0,
    concreteMoment: 0,
    steelForce: tensionCapacity,
    steelMoment: 0,
    layerStates: layers.map((layer) => ({
      ...layer,
      strain: -epsilonY,
      stress: -input.fy,
      force: (-input.fy * layer.area) / 1000,
      moment: 0,
      insideCompressionBlock: false,
    })),
  };
  const keyPoints = [
    axialPoint,
    makeKey("D", "Balanced condition", balancedC),
    makeKey("D.5", "Transition point, εt = 0.004", transitionC),
    makeKey("E", "Tension-controlled, εt = 0.005", tensionControlledC),
    pureBending,
    tensionPoint,
  ];

  const sampled: InteractionPoint[] = [];
  const cMaximum = input.h * 100;
  const cMinimum = input.h * 1e-5;
  for (let i = 0; i <= 160; i += 1) {
    const ratio = i / 160;
    const c = cMaximum * Math.pow(cMinimum / cMaximum, ratio);
    sampled.push(atC(c));
  }
  const nominalCurve = [axialPoint, ...sampled, tensionPoint];
  const designCurve = nominalCurve.map((point) => ({ ...point }));
  const demandMomentCapacity = capacityAtPu(designCurve, input.Pu);
  const demandRatio =
    demandMomentCapacity !== null && demandMomentCapacity > 0
      ? Math.abs(input.Mu) / demandMomentCapacity
      : null;
  const status =
    demandMomentCapacity === null
      ? "OUTSIDE RANGE"
      : Math.abs(input.Mu) <= demandMomentCapacity + 1e-8
        ? "SAFE"
        : "NOT SAFE";
  const eccentricity = Math.abs(input.Pu) > 1e-9 ? (input.Mu / input.Pu) * 1000 : null;
  const warnings: string[] = [];
  if (rho < 0.01 || rho > 0.08) {
    warnings.push(
      `Longitudinal reinforcement ratio is ${(rho * 100).toFixed(2)}%; check the module/code limits of 1% to 8%.`
    );
  }
  if (input.Pu < 0) warnings.push("Negative Pu is treated as axial tension.");

  return {
    beta1,
    epsilonY,
    Ag,
    Ast,
    rho,
    Po,
    maxDesignAxial,
    tensionCapacity,
    d,
    layers,
    keyPoints,
    nominalCurve,
    designCurve,
    demandMomentCapacity,
    demandRatio,
    eccentricity,
    status,
    warnings,
  };
}
