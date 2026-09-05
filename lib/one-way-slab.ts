/** Module 4, pp. 12–16, as transcribed by the user.
 * Supplemental provisions and assumptions: references/one-way-slab-design.md.
 */
export const MOMENT_TABLE = "NSCP Table 406.5.2 — Approximate Moments for Non-prestressed Continuous Beams and One-way Slabs";
export const POSITIVE_CASES = [
  { id: "end-integral", location: "End span", condition: "Discontinuous end integral with support", denominator: 14 },
  { id: "end-unrestrained", location: "End span", condition: "Discontinuous end unrestrained", denominator: 11 },
  { id: "interior", location: "Interior span", condition: "All conditions", denominator: 16 },
] as const;
export const NEGATIVE_CASES = [
  { id: "exterior-spandrel", location: "Interior face of exterior support", condition: "Member built integrally with supporting spandrel beam", denominator: 24 },
  { id: "exterior-column", location: "Interior face of exterior support", condition: "Member built integrally with supporting column", denominator: 16 },
  { id: "first-two", location: "Exterior face of first interior support", condition: "Two spans", denominator: 9 },
  { id: "first-many", location: "Exterior face of first interior support", condition: "More than two spans", denominator: 10 },
  { id: "other", location: "Other faces of interior supports", condition: "All conditions", denominator: 11 },
  { id: "short-slabs", location: "Faces of all supports", condition: "Slabs with spans not exceeding 3 m", denominator: 12 },
  { id: "stiff-beams", location: "Faces of all supports", condition: "Beam where column stiffness/beam stiffness exceeds 8 at each end", denominator: 12 },
] as const;
export type SlabSupportCondition = typeof POSITIVE_CASES[number]["id"];
export type MomentCase = { id: string; location: string; condition: string; denominator: number };
export interface OneWaySlabInput {
  geometryMode?: "floor" | "strip";
  beamWidth?: number;
  floorLength: number; floorWidth: number; panelLength: number; panelWidth: number;
  spanDirection: "length" | "width"; supportedSides: "two" | "four"; isOneWay: boolean;
  supportCondition: SlabSupportCondition; exteriorSupport: "spandrel" | "column";
  shortSpanCase: boolean; spanCount: number; span: number; leftSpan: number; rightSpan: number;
  continuous: boolean; uniformLoads: boolean; prismatic: boolean; normalWeight: boolean;
  h: number; stripWidth: number; cover: number; barDiameter: number;
  distributionBarDiameter: number; aggregateSize: number;
  fc: number; fy: number; Es: number; concreteUnitWeight: number;
  finishLoad: number; ceilingLoad: number; partitionLoad: number; otherDeadLoad: number; liveLoad: number;
}
export interface ReinforcementDesign {
  id: string; face: "top" | "bottom"; position: "midspan" | "left" | "right";
  location: string; tableCase: MomentCase; coefficient: number; designSpan: number;
  adjacentSpans: [number, number] | null;
  Mu: number; MnRequired: number; quadraticA: number; quadraticB: number; discriminant: number;
  AsRequired: number; AsMinimum: number; AsGoverning: number; barArea: number;
  spacingRequired: number; spacingProvided: number; AsProvided: number;
  a: number; c: number; epsilonT: number; phi: number; Mn: number; phiMn: number;
  spacingOk: boolean; steelOk: boolean; strainOk: boolean; strengthOk: boolean; adequate: boolean;
}
export interface OneWaySlabResult {
  floorArea: number; aspectRatio: number; classification: string; panelSpan: number; supportLabel: string;
  selfWeight: number; additionalDeadLoad: number; deadLoadTotal: number; deadOnlyLoad: number;
  gravityLoad: number; factoredLoad: number; loadCombination: string; stripLoad: number;
  d: number; beta1: number; rhoMin: number; epsilonY: number;
  spacingMax: number; geometricSpacingMax: number; crackSpacingMax: number; minimumSpacing: number;
  designs: ReinforcementDesign[];
  distribution: { barArea: number; AsMinimum: number; spacingRequired: number; spacingMax: number; minimumSpacing: number; spacing: number; AsProvided: number; adequate: boolean };
  thicknessRatio: number; thicknessFactor: number; thicknessMinimum: number; thicknessOk: boolean; coverOk: boolean;
  Vu: number; shearFactor: number; shearSpan: number; Vc: number; phiVc: number; shearOk: boolean;
  overallOk: boolean; warnings: string[];
}
export const DEFAULT_SLAB_INPUT: OneWaySlabInput = {
  floorLength: 20, floorWidth: 12, panelLength: 5, panelWidth: 12,
  spanDirection: "length", supportedSides: "four", isOneWay: true,
  supportCondition: "end-integral", exteriorSupport: "spandrel", shortSpanCase: false,
  spanCount: 4, span: 4.7, leftSpan: 4.7, rightSpan: 4.7,
  continuous: true, uniformLoads: true, prismatic: true, normalWeight: true,
  h: 220, stripWidth: 1000, cover: 20, barDiameter: 12, distributionBarDiameter: 10,
  aggregateSize: 20, fc: 28, fy: 420, Es: 200000, concreteUnitWeight: 24,
  finishLoad: 1, ceilingLoad: 0.3, partitionLoad: 1, otherDeadLoad: 0, liveLoad: 3,
};

export interface SlabProblemInput {
  exteriorSpacing: number;
  interiorSpacing: number;
  beamWidth: number;
  superimposedDeadLoad: number;
  liveLoad: number;
  fc: number;
  fy: number;
  barDiameter: number;
  spanCount: 2 | 3 | 4;
  endSupport: "spandrel" | "column" | "unrestrained";
  negativeRule: "standard" | "short-spans";
  thickness: number | null;
  cover: number;
  concreteUnitWeight: number;
  aggregateSize: number;
}
export const DEFAULT_SLAB_PROBLEM: SlabProblemInput = {
  exteriorSpacing: 4.2, interiorSpacing: 4.5, beamWidth: 300,
  superimposedDeadLoad: 2.8, liveLoad: 2.4, fc: 28, fy: 420,
  barDiameter: 10, spanCount: 4, endSupport: "spandrel", negativeRule: "standard",
  thickness: null, cover: 20, concreteUnitWeight: 24, aggregateSize: 20,
};
export interface SlabProblemResult {
  problem: SlabProblemInput;
  exteriorClear: number;
  interiorClear: number;
  minimumThickness: number;
  initialThickness: number;
  thickness: number;
  trials: { thickness: number; adequate: boolean }[];
  spans: { label: string; input: OneWaySlabInput; result: OneWaySlabResult }[];
  zones: { label: string; design: ReinforcementDesign }[];
  overallOk: boolean;
}

/** Accept the givens of the classroom problem; derive all design-only inputs. */
export function designSlabProblem(problem: SlabProblemInput): SlabProblemResult {
  positive(problem.exteriorSpacing, "exterior beam spacing");
  positive(problem.interiorSpacing, "interior beam spacing");
  positive(problem.beamWidth, "beam width");
  positive(problem.fy, "steel yield strength");
  positive(problem.fc, "concrete strength");
  positive(problem.barDiameter, "bar diameter");
  positive(problem.concreteUnitWeight, "concrete unit weight");
  positive(problem.aggregateSize, "maximum aggregate size");
  for (const [value, label] of [[problem.superimposedDeadLoad, "Superimposed dead load"], [problem.liveLoad, "Live load"], [problem.cover, "Clear cover"]] as const) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be zero or a positive number.`);
  }
  if (![2, 3, 4].includes(problem.spanCount)) throw new Error("Choose two, three, or four-or-more spans.");
  if (!["spandrel", "column", "unrestrained"].includes(problem.endSupport)) throw new Error("Select a valid end support.");
  if (!["standard", "short-spans"].includes(problem.negativeRule)) throw new Error("Select a valid negative moment table option.");
  if (problem.thickness !== null) positive(problem.thickness, "given slab thickness");
  const exteriorClear = problem.exteriorSpacing - problem.beamWidth / 1000;
  const interiorClear = problem.interiorSpacing - problem.beamWidth / 1000;
  if (Math.min(exteriorClear, interiorClear) <= 0) throw new Error("Beam width must be smaller than both center-to-center beam spacings.");
  const minimumThickness = Math.max(problem.exteriorSpacing * 1000 / 24, problem.interiorSpacing * 1000 / (problem.spanCount === 2 ? 24 : 28)) * (0.4 + problem.fy / 700);
  const initialThickness = problem.thickness ?? Math.ceil(Math.max(minimumThickness, 2 * problem.cover + 2 * problem.barDiameter) / 10) * 10;
  if (problem.thickness === null && initialThickness > 1000) throw new Error("The starting thickness exceeds the automatic search limit of 1,000 mm. Check the beam spacings or enter a trial thickness.");
  const trials: SlabProblemResult["trials"] = [];
  const endCondition = problem.endSupport === "unrestrained" ? "end-unrestrained" : "end-integral";
  function solve(thickness: number) {
    const common: OneWaySlabInput = {
      ...DEFAULT_SLAB_INPUT, geometryMode: "strip", beamWidth: problem.beamWidth,
      // Floor dimensions are unknown and are not used or reported in strip mode.
      floorLength: 0, floorWidth: 0, panelWidth: 0, spanDirection: "length", supportedSides: "two",
      h: thickness, stripWidth: 1000, spanCount: problem.spanCount, cover: problem.cover,
      fc: problem.fc, fy: problem.fy, Es: 200000, concreteUnitWeight: problem.concreteUnitWeight,
      barDiameter: problem.barDiameter, distributionBarDiameter: problem.barDiameter, aggregateSize: problem.aggregateSize,
      finishLoad: 0, ceilingLoad: 0, partitionLoad: 0, otherDeadLoad: problem.superimposedDeadLoad, liveLoad: problem.liveLoad,
      exteriorSupport: problem.endSupport === "column" ? "column" : "spandrel", shortSpanCase: problem.negativeRule === "short-spans",
    };
    const endInput: OneWaySlabInput = { ...common, supportCondition: endCondition, panelLength: problem.exteriorSpacing, span: exteriorClear, leftSpan: exteriorClear, rightSpan: interiorClear };
    const otherInput: OneWaySlabInput = problem.spanCount === 2
      ? { ...common, supportCondition: endCondition, panelLength: problem.interiorSpacing, span: interiorClear, leftSpan: interiorClear, rightSpan: exteriorClear }
      : { ...common, supportCondition: "interior", panelLength: problem.interiorSpacing, span: interiorClear, leftSpan: exteriorClear, rightSpan: problem.spanCount === 3 ? exteriorClear : interiorClear };
    return [
      { label: problem.spanCount === 2 ? "First end span" : "End span", input: endInput, result: designOneWaySlab(endInput) },
      { label: problem.spanCount === 2 ? "Second end span" : "Interior span", input: otherInput, result: designOneWaySlab(otherInput) },
    ];
  }
  const upperThickness = problem.thickness ?? 1000;
  for (let thickness = initialThickness; thickness <= upperThickness; thickness += 10) {
    let spans: SlabProblemResult["spans"];
    try { spans = solve(thickness); }
    catch (error) {
      // Only a section-capacity failure may be retried at a larger thickness.
      // Invalid geometry, loads and table prerequisites must remain visible.
      if (problem.thickness === null && error instanceof Error && error.message.includes("required moment exceeds the singly reinforced section limit")) {
        trials.push({ thickness, adequate: false }); continue;
      }
      throw error;
    }
    const overallOk = spans.every((span) => span.result.overallOk);
    trials.push({ thickness, adequate: overallOk });
    // Invalid cover cannot be fixed by increasing thickness.
    if (!overallOk && problem.thickness === null && spans.every((span) => span.result.coverOk)) continue;
    const end = spans[0].result.designs;
    const other = spans[1].result.designs;
    const zones: SlabProblemResult["zones"] = [];
    if (end.find((item) => item.position === "left")) zones.push({ label: "Top bars at the exterior support", design: end.find((item) => item.position === "left")! });
    zones.push({ label: "Bottom bars in the end span", design: end[0] });
    zones.push({ label: "Top bars at the first interior support (end-span face)", design: end.find((item) => item.position === "right")! });
    zones.push({ label: problem.spanCount === 2 ? "Bottom bars in the second end span" : "Bottom bars in the interior span", design: other[0] });
    if (problem.spanCount === 2) {
      const exterior = other.find((item) => item.position === "left");
      if (exterior) zones.push({ label: "Top bars at the second exterior support", design: exterior });
    } else {
      const governing = other.filter((item) => item.face === "top").reduce((a, b) => a.Mu >= b.Mu ? a : b);
      zones.push({ label: "Top bars at other interior support faces (governing)", design: governing });
    }
    return { problem, exteriorClear, interiorClear, minimumThickness, initialThickness, thickness, trials, spans, zones, overallOk };
  }
  throw new Error("Automatic thickness selection did not find an adequate slab up to 1,000 mm. Review the spans, loads, and bar diameter, or enter a trial thickness to inspect the failed checks.");
}
function positive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Enter a valid positive value for ${label}.`);
}
export function classifyOneWaySlab(panelLength: number, panelWidth: number, supportedSides: string) {
  const aspectRatio = Math.max(panelLength, panelWidth) / Math.min(panelLength, panelWidth);
  const oneWay = supportedSides === "two" || aspectRatio > 2;
  return { aspectRatio, oneWay, classification: supportedSides === "two"
    ? "One-way slab — beams on only two opposite sides"
    : aspectRatio > 2 ? "One-way slab — longer/shorter span > 2" : "Two-way slab — four supported sides and span ratio ≤ 2" };
}
export function getSlabMomentCases(input: Pick<OneWaySlabInput, "supportCondition" | "exteriorSupport" | "spanCount" | "shortSpanCase">) {
  const positiveCase = POSITIVE_CASES.find((item) => item.id === input.supportCondition);
  if (!positiveCase) throw new Error("Select a valid support condition from the module table.");
  const short = NEGATIVE_CASES[5];
  const negativeCases: { position: "left" | "right"; tableCase: MomentCase }[] = [];
  if (input.supportCondition === "interior") {
    negativeCases.push({ position: "left", tableCase: input.shortSpanCase ? short : NEGATIVE_CASES[4] });
    negativeCases.push({ position: "right", tableCase: input.shortSpanCase ? short : NEGATIVE_CASES[4] });
  } else {
    if (input.supportCondition === "end-integral") negativeCases.push({ position: "left", tableCase: input.shortSpanCase ? short : NEGATIVE_CASES[input.exteriorSupport === "column" ? 1 : 0] });
    negativeCases.push({ position: "right", tableCase: input.shortSpanCase ? short : NEGATIVE_CASES[input.spanCount === 2 ? 2 : 3] });
  }
  return { positiveCase, negativeCases };
}
export function designOneWaySlab(input: OneWaySlabInput): OneWaySlabResult {
  const dimensions = { floorLength: "floor length", floorWidth: "floor width", panelLength: "panel length", panelWidth: "panel width", span: "clear span", h: "slab thickness", stripWidth: "design strip width", barDiameter: "main bar diameter", distributionBarDiameter: "distribution bar diameter", aggregateSize: "aggregate size", fc: "concrete strength", fy: "steel yield strength", Es: "steel modulus", concreteUnitWeight: "concrete unit weight" } as const;
  for (const [key, label] of Object.entries(dimensions)) {
    if (input.geometryMode === "strip" && ["floorLength", "floorWidth", "panelWidth"].includes(key)) continue;
    positive(input[key as keyof typeof dimensions], label);
  }
  for (const key of ["finishLoad", "ceilingLoad", "partitionLoad", "otherDeadLoad", "liveLoad", "cover"] as const) {
    if (!Number.isFinite(input[key]) || input[key] < 0) throw new Error(`${key} must be a finite, nonnegative value.`);
  }
  if (!["length", "width"].includes(input.spanDirection)) throw new Error("Select a valid span direction.");
  if (!["two", "four"].includes(input.supportedSides)) throw new Error("Select two or four supported sides.");
  if (!["spandrel", "column"].includes(input.exteriorSupport)) throw new Error("Select a valid exterior support.");
  const { positiveCase, negativeCases } = getSlabMomentCases(input);
  if (!input.continuous || !input.uniformLoads || !input.prismatic) throw new Error("Table 406.5.2 requires continuous, prismatic members with uniformly distributed loads. Use structural analysis for other systems.");
  if (!Number.isInteger(input.spanCount) || input.spanCount < 2) throw new Error("The continuous-member table requires at least two spans.");
  if (input.supportCondition === "interior" && input.spanCount < 3) throw new Error("An interior span requires at least three spans.");
  if (!input.normalWeight) throw new Error("This design supports normalweight concrete only; lightweight concrete requires additional code modifications.");
  if (input.fc < 17 || input.fy > 550 || input.fy / input.Es >= 0.004) throw new Error("Use f'c ≥ 17 MPa, fy ≤ 550 MPa, and a steel modulus giving fy/Es < 0.004.");
  if (input.barDiameter > 32 || input.distributionBarDiameter > 32) throw new Error("This sheltered-slab cover check supports bar diameters up to 32 mm.");
  const classification = input.geometryMode === "strip"
    ? { aspectRatio: 0, oneWay: true, classification: "One-way slab specified in the problem; design a 1 m strip" }
    : classifyOneWaySlab(input.panelLength, input.panelWidth, input.supportedSides);
  if (!input.isOneWay || !classification.oneWay) throw new Error("The selected panel is not classified as one-way. Use beams on two opposite sides or a longer/shorter span ratio greater than 2.");
  if (input.geometryMode !== "strip" && (input.panelLength > input.floorLength || input.panelWidth > input.floorWidth)) throw new Error("Panel dimensions must fit within the floor-system dimensions.");
  const panelSpan = input.spanDirection === "length" ? input.panelLength : input.panelWidth;
  const transverseSpan = input.spanDirection === "length" ? input.panelWidth : input.panelLength;
  const floorSpan = input.spanDirection === "length" ? input.floorLength : input.floorWidth;
  if (input.geometryMode !== "strip" && input.supportedSides === "four" && panelSpan > transverseSpan) throw new Error("For a four-side-supported one-way panel, main reinforcement must run along the shorter span.");
  if (input.span > panelSpan) throw new Error("The unsupported clear span cannot exceed the panel dimension along the span direction.");
  if (input.geometryMode !== "strip" && input.stripWidth / 1000 > transverseSpan) throw new Error("The design strip width cannot exceed the transverse panel dimension.");
  const spans = input.supportCondition === "interior" ? [input.leftSpan, input.span, input.rightSpan] : [input.span, input.rightSpan];
  spans.forEach((span) => positive(span, "adjacent clear span"));
  for (let index = 1; index < spans.length; index++) {
    if (Math.max(spans[index - 1], spans[index]) > 1.2 * Math.min(spans[index - 1], spans[index]) + 1e-9) throw new Error("Adjacent clear spans may differ by no more than 20% for the coefficient method (ACI 318-14 §6.5.1).");
  }
  if (input.geometryMode !== "strip" && (spans.reduce((sum, span) => sum + span, 0) > floorSpan || input.spanCount * Math.min(...spans) > floorSpan)) throw new Error("The entered continuous spans do not fit along the floor-system span direction.");
  if (input.shortSpanCase && Math.max(...spans) > 3) throw new Error("The 1/12 slab case requires all spans to be no greater than 3 m.");
  const d = input.h - input.cover - input.barDiameter / 2;
  if (d <= 0 || input.h < 2 * input.cover + input.barDiameter + input.distributionBarDiameter) throw new Error("Slab thickness is too small for the cover and crossing reinforcement layers. Increase h.");
  const selfWeight = input.h / 1000 * input.concreteUnitWeight;
  const additionalDeadLoad = input.finishLoad + input.ceilingLoad + input.partitionLoad + input.otherDeadLoad;
  const deadLoadTotal = selfWeight + additionalDeadLoad;
  if (input.liveLoad > 3 * deadLoadTotal) throw new Error("The coefficient method requires live load ≤ 3 times dead load (ACI 318-14 §6.5.1).");
  const deadOnlyLoad = 1.4 * deadLoadTotal;
  const gravityLoad = 1.2 * deadLoadTotal + 1.6 * input.liveLoad;
  const factoredLoad = Math.max(deadOnlyLoad, gravityLoad);
  const stripLoad = factoredLoad * input.stripWidth / 1000;
  const b = input.stripWidth;
  const beta1 = Math.max(0.65, Math.min(0.85, 0.85 - 0.05 * (input.fc - 28) / 7));
  const epsilonY = input.fy / input.Es;
  const rhoMin = input.fy < 420 ? 0.002 : Math.max(0.0018 * 420 / input.fy, 0.0014);
  const AsMinimum = rhoMin * b * input.h;
  const geometricSpacingMax = Math.min(3 * input.h, 450);
  const fs = 2 * input.fy / 3;
  const crackSpacingMax = Math.min(380 * 280 / fs - 2.5 * input.cover, 300 * 280 / fs);
  const spacingMax = Math.min(geometricSpacingMax, crackSpacingMax);
  const minimumSpacing = input.barDiameter + Math.max(25, input.barDiameter, 4 * input.aggregateSize / 3);
  if (spacingMax <= 0) throw new Error("The cover and steel strength leave no positive crack-control spacing. Revise the section.");
  const barArea = Math.PI * input.barDiameter ** 2 / 4;
  function design(tableCase: MomentCase, position: ReinforcementDesign["position"], adjacentSpans: [number, number] | null): ReinforcementDesign {
    const designSpan = adjacentSpans ? (adjacentSpans[0] + adjacentSpans[1]) / 2 : input.span;
    const coefficient = 1 / tableCase.denominator;
    const Mu = coefficient * stripLoad * designSpan ** 2;
    const MnRequired = Mu / 0.9;
    // q As² - p As + Mn = 0; moments in N·mm in the quadratic.
    const quadraticA = input.fy ** 2 / (1.7 * input.fc * b);
    const quadraticB = input.fy * d;
    const discriminant = quadraticB ** 2 - 4 * quadraticA * MnRequired * 1e6;
    if (discriminant <= 0) throw new Error(`${tableCase.location}: required moment exceeds the singly reinforced section limit. Increase slab thickness.`);
    // Rationalized smaller root avoids cancellation for small moments.
    const AsRequired = 2 * MnRequired * 1e6 / (quadraticB + Math.sqrt(discriminant));
    const AsGoverning = Math.max(AsRequired, AsMinimum);
    const spacingRequired = barArea * b / AsGoverning;
    const spacingProvided = Math.max(Math.ceil(minimumSpacing / 5) * 5, Math.floor(Math.min(spacingRequired, spacingMax) / 5) * 5);
    const AsProvided = barArea * b / spacingProvided;
    const a = AsProvided * input.fy / (0.85 * input.fc * b);
    const c = a / beta1;
    const epsilonT = 0.003 * (d - c) / c;
    const phi = epsilonT >= 0.005 ? 0.9 : epsilonT <= epsilonY ? 0.65 : 0.65 + 0.25 * (epsilonT - epsilonY) / (0.005 - epsilonY);
    const Mn = AsProvided * input.fy * (d - a / 2) / 1e6;
    const phiMn = phi * Mn;
    const spacingOk = spacingProvided >= minimumSpacing && spacingProvided <= spacingMax + 1e-9;
    const steelOk = AsProvided + 1e-8 >= AsGoverning;
    const strainOk = epsilonT >= 0.004 && epsilonT >= epsilonY;
    const strengthOk = phiMn + 1e-8 >= Mu && strainOk;
    const face = position === "midspan" ? "bottom" : "top";
    const location = position === "midspan" ? `Bottom reinforcement at ${positiveCase.location.toLowerCase()} midspan` : `Top reinforcement — ${position} support: ${tableCase.location}`;
    return { id: `${position}-${tableCase.id}`, face, position, location, tableCase, coefficient, designSpan, adjacentSpans, Mu, MnRequired, quadraticA, quadraticB, discriminant, AsRequired, AsMinimum, AsGoverning, barArea, spacingRequired, spacingProvided, AsProvided, a, c, epsilonT, phi, Mn, phiMn, spacingOk, steelOk, strainOk, strengthOk, adequate: spacingOk && steelOk && strengthOk };
  }
  const designs = [design(positiveCase, "midspan", null), ...negativeCases.map(({ position, tableCase }) => {
    const adjacent: [number, number] | null = position === "left" && input.supportCondition !== "interior" ? null : position === "left" ? [input.leftSpan, input.span] : [input.span, input.rightSpan];
    return design(tableCase, position, adjacent);
  })];
  const distributionBarArea = Math.PI * input.distributionBarDiameter ** 2 / 4;
  const distributionMax = Math.min(5 * input.h, 450);
  const distributionMin = input.distributionBarDiameter + Math.max(25, input.distributionBarDiameter, 4 * input.aggregateSize / 3);
  const distributionRequired = distributionBarArea * b / AsMinimum;
  const distributionSpacing = Math.max(Math.ceil(distributionMin / 5) * 5, Math.floor(Math.min(distributionRequired, distributionMax) / 5) * 5);
  const distributionAs = distributionBarArea * b / distributionSpacing;
  const distribution = { barArea: distributionBarArea, AsMinimum, spacingRequired: distributionRequired, spacingMax: distributionMax, minimumSpacing: distributionMin, spacing: distributionSpacing, AsProvided: distributionAs, adequate: distributionAs + 1e-8 >= AsMinimum && distributionSpacing <= distributionMax && distributionSpacing >= distributionMin };
  const thicknessRatio = input.supportCondition === "interior" ? 28 : 24;
  const thicknessFactor = 0.4 + input.fy / 700;
  const thicknessMinimum = panelSpan * 1000 / thicknessRatio * thicknessFactor;
  const thicknessOk = input.h >= thicknessMinimum;
  const coverOk = input.cover >= 20;
  // Conservative support-face shear screen, without reduction to the section at d.
  const shearFactor = input.supportCondition === "interior" ? 1 : 1.15;
  const shearSpan = input.span;
  const Vu = shearFactor * stripLoad * shearSpan / 2;
  const Vc = 0.17 * Math.sqrt(input.fc) * b * d / 1000;
  const phiVc = 0.75 * Vc;
  const shearOk = phiVc >= Vu;
  const warnings: string[] = [];
  if (!thicknessOk) warnings.push(`Thickness ${input.h} mm is below the ${thicknessMinimum.toFixed(1)} mm deflection screen. Increase h or complete a separate deflection calculation; the screen assumes no deflection-sensitive attachments.`);
  if (!coverOk) warnings.push("Provide at least 20 mm clear cover for this sheltered, cast-in-place slab with bars up to 32 mm. Other exposures require a separate cover check.");
  if (!shearOk) warnings.push("Support-face shear exceeds φVc. Increase h or complete a separate shear design.");
  if (!distribution.adequate) warnings.push("Shrinkage and temperature reinforcement fails area or spacing limits. Change bar diameter or thickness.");
  for (const item of designs) {
    if (!item.spacingOk) warnings.push(`${item.location}: provided spacing exceeds the permitted limits.`);
    if (!item.steelOk) warnings.push(`${item.location}: provided reinforcement is less than the governing required area. Select larger bars or increase thickness.`);
    if (!item.strainOk) warnings.push(`${item.location}: tensile strain is below 0.004; increase thickness. The assumed yielding flexural model is not accepted.`);
    if (!item.strengthOk && item.strainOk) warnings.push(`${item.location}: φMn < Mu using the verified φ. Increase thickness or revise reinforcement.`);
  }
  const floorArea = input.floorLength * input.floorWidth;
  if (![floorArea, stripLoad, ...designs.flatMap((item) => [item.Mu, item.AsRequired, item.phiMn])].every(Number.isFinite)) throw new Error("The entered values exceed the supported numerical range.");
  return { floorArea, aspectRatio: classification.aspectRatio, classification: classification.classification, panelSpan, supportLabel: `${positiveCase.location} — ${positiveCase.condition}`, selfWeight, additionalDeadLoad, deadLoadTotal, deadOnlyLoad, gravityLoad, factoredLoad, loadCombination: deadOnlyLoad > gravityLoad ? "1.4D" : "1.2D + 1.6L", stripLoad, d, beta1, rhoMin, epsilonY, spacingMax, geometricSpacingMax, crackSpacingMax, minimumSpacing, designs, distribution, thicknessRatio, thicknessFactor, thicknessMinimum, thicknessOk, coverOk, Vu, shearFactor, shearSpan, Vc, phiVc, shearOk, overallOk: designs.every((item) => item.adequate) && distribution.adequate && thicknessOk && coverOk && shearOk, warnings };
}
