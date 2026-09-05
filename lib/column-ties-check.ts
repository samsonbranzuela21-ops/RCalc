/** Module 8: Shear Analysis and Design of Columns Using NSCP 2015.
 * Rules are from the user's supplied transcription; see references/column-ties-check.md.
 */
export type ColumnDetailMode = "rectilinear" | "circular" | "spiral";
export type Confirmation = boolean | null;
export type CheckStatus = "PASS" | "FAIL" | "INCOMPLETE";
interface CommonInput {
  longitudinalDiameter: number;
  transverseDiameter: number;
  spacing: number;
  aggregateSize: number;
}
export interface RectilinearTiesInput extends CommonInput {
  mode: "rectilinear";
  b: number;
  h: number;
  cover: number;
  barsAcross: number;
  barsDeep: number;
  supportedBars: string[];
  includedAngle: number;
  closedTie: Confirmation;
}
export interface CircularTiesInput extends CommonInput {
  mode: "circular";
  diameter: number;
  cover: number;
  barCount: number;
  lapCompliant: Confirmation;
  standardHooks: Confirmation;
  staggeredLaps: Confirmation;
}
export interface SpiralColumnInput extends CommonInput {
  mode: "spiral";
  diameter: number;
  coreDiameter: number;
  barCount: number;
  fc: number;
  spiralFy: number;
  continuousDeformed: Confirmation;
  topExtraTurns: number;
  bottomExtraTurns: number;
  spliceType: "none" | "mechanical" | "welded";
  spliceCompliant: Confirmation;
}
export type ColumnTiesInput = RectilinearTiesInput | CircularTiesInput | SpiralColumnInput;
export interface LongitudinalBar {
  id: string;
  x: number;
  y: number;
  corner: boolean;
  supported: boolean;
}
export interface LateralSupportCheck {
  id: string;
  supported: boolean;
  corner: boolean;
  previousSupport: string | null;
  nextSupport: string | null;
  clearPrevious: number | null;
  clearNext: number | null;
  alternateOk: boolean;
  distanceOk: boolean;
}
export interface DetailingCheck {
  id: string;
  label: string;
  status: CheckStatus;
  reference: string;
  summary: string;
  correction: string;
  equations: string[];
}
export interface DetailingStep {
  title: string;
  reference?: string;
  equations: string[];
  notes: string[];
  checkIds: string[];
}
export interface ColumnTiesResult {
  mode: ColumnDetailMode;
  modeLabel: string;
  grossArea: number;
  coreArea: number | null;
  coreDiameter: number | null;
  cover: number;
  barCount: number;
  bars: LongitudinalBar[];
  supportChecks: LateralSupportCheck[];
  minimumDiameter: number;
  spacingLimits: { label: string; value: number }[];
  maximumSpacing: number;
  minimumSpacing: number;
  clearSpacing: number;
  minimumClear: number;
  maximumClear: number | null;
  controllingLimit: string;
  spiralBarArea: number | null;
  requiredSpiralRatio: number | null;
  providedSpiralRatio: number | null;
  requiredSpiralArea: number | null;
  ratioPitchMaximum: number | null;
  checks: DetailingCheck[];
  steps: DetailingStep[];
  adequate: boolean;
  incomplete: boolean;
}
const m = String.raw;
const f = (value: number, digits = 3) => value.toFixed(digits);
const ref = (section: string) => `NSCP 2015 §${section}`;
function positive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Enter a valid positive value for ${label}.`);
}
function nonnegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`Enter zero or a positive value for ${label}.`);
}
function count(value: number, label: string, minimum: number) {
  if (!Number.isInteger(value) || value < minimum || value > 40) throw new Error(`${label} must be a whole number from ${minimum} to 40 (diagram input range).`);
}
function checkConfirmation(value: Confirmation) {
  if (value !== null && typeof value !== "boolean") throw new Error("Select Yes, No, or Not confirmed for each drawing detail.");
}

export function rectilinearBars(input: Pick<RectilinearTiesInput, "b" | "h" | "cover" | "longitudinalDiameter" | "transverseDiameter" | "barsAcross" | "barsDeep" | "supportedBars">): LongitudinalBar[] {
  positive(input.b, "column width"); positive(input.h, "column depth");
  positive(input.longitudinalDiameter, "longitudinal bar diameter"); positive(input.transverseDiameter, "tie diameter");
  nonnegative(input.cover, "cover to the outside of the tie");
  count(input.barsAcross, "Bars across each width face", 2); count(input.barsDeep, "Bars on each depth face", 2);
  const offset = input.cover + input.transverseDiameter + input.longitudinalDiameter / 2;
  const dx = (input.b - 2 * offset) / (input.barsAcross - 1);
  const dy = (input.h - 2 * offset) / (input.barsDeep - 1);
  if (dx < input.longitudinalDiameter || dy < input.longitudinalDiameter) throw new Error("The bars overlap or do not fit inside the tie. Increase the column size or reduce the bar count/diameters/cover.");
  const bars: LongitudinalBar[] = [];
  function add(x: number, y: number, corner: boolean) {
    const id = `B${bars.length + 1}`;
    bars.push({ id, x, y, corner, supported: input.supportedBars.includes(id) });
  }
  for (let j = 0; j < input.barsAcross; j++) add(offset + j * dx, offset, j === 0 || j === input.barsAcross - 1);
  for (let j = 1; j < input.barsDeep; j++) add(input.b - offset, offset + j * dy, j === input.barsDeep - 1);
  for (let j = input.barsAcross - 2; j >= 0; j--) add(offset + j * dx, input.h - offset, j === 0);
  for (let j = input.barsDeep - 2; j > 0; j--) add(offset, offset + j * dy, false);
  if (input.supportedBars.some((id) => !bars.some((bar) => bar.id === id))) throw new Error("A marked support does not match the current bar arrangement. Select the supported bars again.");
  return bars;
}

export const DEFAULT_RECTILINEAR_INPUT: RectilinearTiesInput = {
  mode: "rectilinear", b: 350, h: 350, cover: 40, barsAcross: 3, barsDeep: 3,
  longitudinalDiameter: 25, transverseDiameter: 10, spacing: 200, aggregateSize: 20,
  supportedBars: ["B1", "B3", "B5", "B7"], includedAngle: 90, closedTie: null,
};
export const DEFAULT_CIRCULAR_INPUT: CircularTiesInput = {
  mode: "circular", diameter: 450, cover: 40, barCount: 8,
  longitudinalDiameter: 25, transverseDiameter: 10, spacing: 200, aggregateSize: 20,
  lapCompliant: null, standardHooks: null, staggeredLaps: null,
};
export const DEFAULT_SPIRAL_INPUT: SpiralColumnInput = {
  mode: "spiral", diameter: 450, coreDiameter: 370, barCount: 8,
  longitudinalDiameter: 25, transverseDiameter: 10, spacing: 50, aggregateSize: 20,
  fc: 28, spiralFy: 420, continuousDeformed: null, topExtraTurns: 1.5, bottomExtraTurns: 1.5,
  spliceType: "none", spliceCompliant: null,
};

export function calculateColumnTies(input: ColumnTiesInput): ColumnTiesResult {
  if (!["rectilinear", "circular", "spiral"].includes(input.mode)) throw new Error("Select a valid column type.");
  positive(input.longitudinalDiameter, "longitudinal bar diameter");
  positive(input.transverseDiameter, "tie or spiral bar diameter");
  positive(input.spacing, "center-to-center tie spacing or spiral pitch");
  positive(input.aggregateSize, "maximum nominal aggregate size");
  if (input.spacing <= input.transverseDiameter) throw new Error("Center-to-center spacing must exceed the transverse bar diameter to leave a positive clear gap.");
  const isSpiral = input.mode === "spiral";
  if (!isSpiral && input.longitudinalDiameter > 32 && input.longitudinalDiameter < 36) throw new Error("The supplied module gives tie sizes for longitudinal bars ≤32 mm and ≥36 mm. Sizes between 32 and 36 mm are not defined; select a module-listed size.");
  let bars: LongitudinalBar[];
  let grossArea: number;
  let cover: number;
  const geometryEquations: string[] = [];
  let geometryFits = true;
  if (input.mode === "rectilinear") {
    bars = rectilinearBars(input);
    positive(input.includedAngle, "maximum included tie-corner angle");
    if (input.includedAngle > 180) throw new Error("An included corner angle must not exceed 180 degrees.");
    checkConfirmation(input.closedTie);
    grossArea = input.b * input.h; cover = input.cover;
    geometryEquations.push(m`A_g=bh=(${input.b})(${input.h})=${f(grossArea)}\,\text{mm}^2`);
    geometryEquations.push(m`N=2n_b+2n_h-4=2(${input.barsAcross})+2(${input.barsDeep})-4=${bars.length}\,\text{bars}`);
    geometryEquations.push(m`o=c_{cover}+d_t+d_b/2=${input.cover}+${input.transverseDiameter}+${input.longitudinalDiameter}/2=${f(input.cover + input.transverseDiameter + input.longitudinalDiameter / 2)}\,\text{mm}`);
  } else {
    positive(input.diameter, "gross column diameter"); count(input.barCount, "Number of longitudinal bars", 1);
    if (input.mode === "spiral") {
      positive(input.coreDiameter, "outside core diameter"); positive(input.fc, "concrete strength"); positive(input.spiralFy, "spiral reinforcement yield strength");
      if (input.coreDiameter >= input.diameter) throw new Error("The core diameter measured to the outside of the spiral must be less than the gross column diameter.");
      nonnegative(input.topExtraTurns, "top anchorage extra turns"); nonnegative(input.bottomExtraTurns, "bottom anchorage extra turns");
      if (!["none", "mechanical", "welded"].includes(input.spliceType)) throw new Error("Choose no splice, a mechanical splice, or a welded splice.");
      checkConfirmation(input.continuousDeformed); checkConfirmation(input.spliceCompliant);
      cover = (input.diameter - input.coreDiameter) / 2;
    } else {
      nonnegative(input.cover, "cover to the outside of the circular tie"); cover = input.cover;
      [input.lapCompliant, input.standardHooks, input.staggeredLaps].forEach(checkConfirmation);
    }
    const radius = input.diameter / 2 - cover - input.transverseDiameter - input.longitudinalDiameter / 2;
    if (radius <= 0) throw new Error("Longitudinal bars do not fit inside the transverse reinforcement. Review diameter, cover, and bar sizes.");
    grossArea = Math.PI * input.diameter ** 2 / 4;
    bars = Array.from({ length: input.barCount }, (_, index) => ({ id: `B${index + 1}`, x: input.diameter / 2 + radius * Math.cos(index * 2 * Math.PI / input.barCount), y: input.diameter / 2 + radius * Math.sin(index * 2 * Math.PI / input.barCount), corner: false, supported: true }));
    const chord = input.barCount === 1 ? 2 * radius : 2 * radius * Math.sin(Math.PI / input.barCount);
    geometryFits = chord >= input.longitudinalDiameter;
    geometryEquations.push(m`A_g=\frac{\pi D^2}{4}=\frac{\pi(${input.diameter})^2}{4}=${f(grossArea)}\,\text{mm}^2`);
    geometryEquations.push(m`r_{bars}=D/2-c_{cover}-d_t-d_b/2=${input.diameter}/2-${f(cover)}-${input.transverseDiameter}-${input.longitudinalDiameter}/2=${f(radius)}\,\text{mm}`);
    if (input.barCount > 1) geometryEquations.push(m`\ell_{centers}=2r_{bars}\sin(\pi/N)=2(${f(radius)})\sin(\pi/${input.barCount})=${f(chord)}\,\text{mm}\ ${geometryFits ? "\\ge" : "<"}\ ${input.longitudinalDiameter}\,\text{mm}`);
  }
  if (!Number.isFinite(grossArea)) throw new Error("Column dimensions exceed the supported numerical range.");
  const checks: DetailingCheck[] = [];
  function add(id: string, label: string, ok: Confirmation, section: string, summary: string, correction: string, equations: string[] = []) {
    checks.push({ id, label, status: ok === null ? "INCOMPLETE" : ok ? "PASS" : "FAIL", reference: ref(section), summary, correction, equations });
  }
  const minimumDiameter = isSpiral ? 10 : input.longitudinalDiameter <= 32 ? 10 : 12;
  add("diameter", isSpiral ? "Spiral bar diameter" : "Minimum tie diameter", input.transverseDiameter >= minimumDiameter, isSpiral ? "425.7.3.1" : "425.7.2.1", `Provided ${input.transverseDiameter} mm; required ≥${minimumDiameter} mm.`, `Use transverse reinforcement at least ${minimumDiameter} mm in diameter.`, [m`d_{t,provided}=${input.transverseDiameter}\,\text{mm}\ ${input.transverseDiameter >= minimumDiameter ? "\\ge" : "<"}\ d_{t,min}=${minimumDiameter}\,\text{mm}`]);
  const minimumClear = isSpiral ? Math.max(25, 4 * input.aggregateSize / 3) : 4 * input.aggregateSize / 3;
  const maximumClear = isSpiral ? 75 : null;
  const minimumSpacing = minimumClear + input.transverseDiameter;
  const clearSpacing = input.spacing - input.transverseDiameter;
  const spacingLimits = isSpiral ? [{ label: "75 mm clear + spiral bar diameter", value: 75 + input.transverseDiameter }]
    : [{ label: "16 × longitudinal bar diameter", value: 16 * input.longitudinalDiameter }, { label: "48 × tie diameter", value: 48 * input.transverseDiameter }, { label: "Least column dimension", value: input.mode === "rectilinear" ? Math.min(input.b, input.h) : input.diameter }];
  const maximumSpacing = Math.min(...spacingLimits.map((limit) => limit.value));
  const controllingLimit = spacingLimits.filter((limit) => Math.abs(limit.value - maximumSpacing) < 1e-9).map((limit) => limit.label).join("; ");
  const spacingEquations = isSpiral ? [
    m`s_{min}=d_{sp}+\max(25,4d_{agg}/3)=${input.transverseDiameter}+\max(25,4(${input.aggregateSize})/3)=${f(minimumSpacing)}\,\text{mm}`,
    m`s_{max}=d_{sp}+75=${input.transverseDiameter}+75=${f(maximumSpacing)}\,\text{mm}`,
  ] : [
    m`s_1=16d_b=16(${input.longitudinalDiameter})=${f(spacingLimits[0].value)}\,\text{mm}`,
    m`s_2=48d_t=48(${input.transverseDiameter})=${f(spacingLimits[1].value)}\,\text{mm}`,
    input.mode === "rectilinear" ? m`s_3=\min(b,h)=\min(${input.b},${input.h})=${f(spacingLimits[2].value)}\,\text{mm}` : m`s_3=D=${input.diameter}\,\text{mm}`,
    m`s_{max}=\min(s_1,s_2,s_3)=\min(${spacingLimits.map((limit) => f(limit.value)).join(",")})=${f(maximumSpacing)}\,\text{mm}`,
  ];
  const spacingOk = input.spacing <= maximumSpacing + 1e-9 && (!isSpiral || input.spacing + 1e-9 >= minimumSpacing);
  add("spacing", isSpiral ? "Spiral pitch limits" : "Maximum tie spacing", spacingOk, isSpiral ? "425.7.3.2" : "425.7.2.2", `Provided ${input.spacing} mm; ${isSpiral ? `range ${f(minimumSpacing)}–${f(maximumSpacing)}` : `maximum ${f(maximumSpacing)}`} mm.`, isSpiral ? "Choose a pitch within both the clear-spacing range and the required reinforcement-ratio limit." : `Reduce center spacing to ${f(maximumSpacing)} mm or less.`, [...spacingEquations, m`s_{provided}=${input.spacing}\,\text{mm}\ ${input.spacing <= maximumSpacing ? "\\le" : ">"}\ ${f(maximumSpacing)}\,\text{mm}`, m`\text{Upper-limit margin}=${f(maximumSpacing)}-${input.spacing}=${f(maximumSpacing - input.spacing)}\,\text{mm}`]);
  const clearOk = clearSpacing + 1e-9 >= minimumClear && (!isSpiral || clearSpacing <= 75 + 1e-9);
  add("clear", "Clear vertical spacing", clearOk, isSpiral ? "425.7.3.2" : "425.7.2.1", `Clear = ${f(clearSpacing)} mm; minimum ${f(minimumClear)} mm${isSpiral ? ", maximum 75 mm" : ""}.`, "Adjust center spacing, bar diameter, or nominal aggregate size to meet the clear-gap limit.", [
    m`s_{clear}=s-d_t=${input.spacing}-${input.transverseDiameter}=${f(clearSpacing)}\,\text{mm}`,
    isSpiral ? m`s_{clear,min}=\max(25,4d_{agg}/3)=\max(25,4(${input.aggregateSize})/3)=${f(minimumClear)}\,\text{mm}` : m`s_{clear,min}=4d_{agg}/3=4(${input.aggregateSize})/3=${f(minimumClear)}\,\text{mm}`,
    m`${f(clearSpacing)}\,\text{mm}\ ${clearSpacing >= minimumClear ? "\\ge" : "<"}\ ${f(minimumClear)}\,\text{mm}`,
    ...(isSpiral ? [m`${f(clearSpacing)}\,\text{mm}\ ${clearSpacing <= 75 ? "\\le" : ">"}\ 75\,\text{mm}`] : []),
  ]);
  const supportChecks: LateralSupportCheck[] = [];
  if (input.mode === "rectilinear") {
    const total = bars.length;
    function nearest(start: number, direction: 1 | -1) {
      let distance = 0;
      let previous = start;
      for (let step = 1; step < total; step++) {
        const index = (start + direction * step + total) % total;
        distance += Math.hypot(bars[index].x - bars[previous].x, bars[index].y - bars[previous].y);
        if (bars[index].supported) return { id: bars[index].id, clear: Math.max(0, distance - input.longitudinalDiameter) };
        previous = index;
      }
      return null;
    }
    bars.forEach((bar, index) => {
      const previous = bar.supported ? null : nearest(index, -1);
      const next = bar.supported ? null : nearest(index, 1);
      supportChecks.push({ id: bar.id, supported: bar.supported, corner: bar.corner, previousSupport: previous?.id ?? null, nextSupport: next?.id ?? null, clearPrevious: previous?.clear ?? null, clearNext: next?.clear ?? null, alternateOk: bar.supported || (bars[(index - 1 + total) % total].supported && bars[(index + 1) % total].supported), distanceOk: bar.supported || (previous !== null && next !== null && previous.clear <= 150 + 1e-9 && next.clear <= 150 + 1e-9) });
    });
    const missingCorners = bars.filter((bar) => bar.corner && !bar.supported).map((bar) => bar.id);
    const missingAlternate = supportChecks.filter((bar) => !bar.alternateOk).map((bar) => bar.id);
    const tooFar = supportChecks.filter((bar) => !bar.distanceOk).map((bar) => bar.id);
    add("closed", "Closed tie and enclosure", input.closedTie, "425.7.2.3", "Drawing confirmation: the outer tie is closed and encloses the longitudinal bars.", "Confirm a closed enclosing tie on the drawing, or revise the arrangement.");
    add("angle", "Included angle at supporting tie corners", input.includedAngle <= 135, "425.7.2.3", `Maximum included angle ${input.includedAngle}°; limit 135°. This is a tie-corner angle, not a hook bend angle.`, "Provide lateral support by tie corners with included angles no greater than 135°.", [m`\theta=${input.includedAngle}^{\circ}\ ${input.includedAngle <= 135 ? "\\le" : ">"}\ 135^{\circ}`]);
    add("corners", "Corner-bar lateral support", missingCorners.length === 0, "425.7.2.3", missingCorners.length ? `Unsupported corner bars: ${missingCorners.join(", ")}.` : "All four corner bars are marked laterally supported.", "Support every corner bar with a qualifying tie corner.");
    add("alternate", "Alternate-bar lateral support", missingAlternate.length === 0, "425.7.2.3", missingAlternate.length ? `Consecutive unsupported bars involve: ${missingAlternate.join(", ")}.` : "No two consecutive perimeter bars are unsupported.", "Add qualifying cross-ties or supplemental ties so every alternate bar is supported.");
    add("distance", "150 mm clear distance on both sides", tooFar.length === 0, "425.7.2.3", tooFar.length ? `Bars failing one or both sides: ${tooFar.join(", ")}.` : "Every unmarked bar lies within 150 mm clear of a supported bar in both directions along the tie.", "Add lateral supports on the failing side(s) or revise the bar arrangement.");
  } else if (input.mode === "circular") {
    add("lap", "Circular tie lap detail", input.lapCompliant, "425.7.2.4", "Drawing confirmation: the lap complies with the applicable circular-tie detailing.", "Verify the required lap on the drawing. The supplied module gives no numerical lap length.");
    add("hooks", "Standard hooks engage a longitudinal bar", input.standardHooks, "425.7.2.4", "Drawing confirmation: both ends have standard hooks engaging a longitudinal bar.", "Provide standard hooks at both ends engaging a longitudinal bar.");
    add("stagger", "Adjacent circular laps staggered", input.staggeredLaps, "425.7.2.4", "Drawing confirmation: adjacent tie overlaps are staggered around the perimeter.", "Stagger adjacent circular-tie overlaps around the longitudinal bars.");
    add("enclosed", "Longitudinal-bar enclosure and fit", geometryFits, "425.7.2.4", geometryFits ? "The uniformly spaced bar ring fits inside the circular tie without bar overlap." : "The selected longitudinal bars overlap around the circular ring.", "Increase column size or reduce the bar count/diameter. The 150 mm rectilinear rule is not applied to circular ties.", geometryEquations.slice(1));
  }
  let coreArea: number | null = null;
  let spiralBarArea: number | null = null;
  let requiredSpiralRatio: number | null = null;
  let providedSpiralRatio: number | null = null;
  let requiredSpiralArea: number | null = null;
  let ratioPitchMaximum: number | null = null;
  const ratioRequiredEquations: string[] = [];
  const ratioProvidedEquations: string[] = [];
  if (input.mode === "spiral") {
    coreArea = Math.PI * input.coreDiameter ** 2 / 4;
    spiralBarArea = Math.PI * input.transverseDiameter ** 2 / 4;
    requiredSpiralRatio = 0.45 * (grossArea / coreArea - 1) * input.fc / input.spiralFy;
    providedSpiralRatio = 4 * spiralBarArea / (input.coreDiameter * input.spacing);
    requiredSpiralArea = requiredSpiralRatio * input.coreDiameter * input.spacing / 4;
    ratioPitchMaximum = 4 * spiralBarArea / (input.coreDiameter * requiredSpiralRatio);
    if (![coreArea, requiredSpiralRatio, providedSpiralRatio, requiredSpiralArea, ratioPitchMaximum].every(Number.isFinite)) throw new Error("The spiral inputs exceed the supported numerical range.");
    geometryEquations.push(m`A_c=\frac{\pi d_c^2}{4}=\frac{\pi(${input.coreDiameter})^2}{4}=${f(coreArea)}\,\text{mm}^2`);
    geometryEquations.push(m`c_{cover}=\frac{D-d_c}{2}=\frac{${input.diameter}-${input.coreDiameter}}{2}=${f(cover)}\,\text{mm}`);
    ratioRequiredEquations.push(m`\rho_{s,req}=0.45\left(\frac{A_g}{A_c}-1\right)\frac{f'_c}{f_{y,s}}`);
    ratioRequiredEquations.push(m`\rho_{s,req}=0.45\left(\frac{${f(grossArea)}}{${f(coreArea)}}-1\right)\frac{${input.fc}}{${input.spiralFy}}=${f(requiredSpiralRatio, 6)}\quad\text{(dimensionless)}`);
    ratioProvidedEquations.push(m`A_{sp}=\frac{\pi d_{sp}^2}{4}=\frac{\pi(${input.transverseDiameter})^2}{4}=${f(spiralBarArea)}\,\text{mm}^2`);
    ratioProvidedEquations.push(m`\rho_{s,prov}=\frac{4A_{sp}}{d_cs}=\frac{4(${f(spiralBarArea)})}{(${input.coreDiameter})(${input.spacing})}=${f(providedSpiralRatio, 6)}\quad\text{(dimensionless)}`);
    ratioProvidedEquations.push(m`A_{sp,req}=\frac{\rho_{s,req}d_cs}{4}=\frac{(${f(requiredSpiralRatio, 6)})(${input.coreDiameter})(${input.spacing})}{4}=${f(requiredSpiralArea)}\,\text{mm}^2`);
    ratioProvidedEquations.push(m`s_{ratio,max}=\frac{4A_{sp}}{d_c\rho_{s,req}}=\frac{4(${f(spiralBarArea)})}{(${input.coreDiameter})(${f(requiredSpiralRatio, 6)})}=${f(ratioPitchMaximum)}\,\text{mm}`);
    add("continuous", "Continuous, evenly spaced deformed spiral", input.continuousDeformed, "425.7.3.1", "Drawing confirmation: spiral consists of continuous deformed bar or wire with even spacing.", "Use continuous deformed reinforcement and uniform spiral pitch.");
    add("enclosed", "Longitudinal-bar enclosure and fit", geometryFits, "425.7.3.1", geometryFits ? "The uniformly spaced longitudinal bar ring fits inside the spiral without overlap." : "Longitudinal bars overlap inside the spiral.", "Increase core diameter or reduce longitudinal bar count/diameter.", geometryEquations.slice(1, 3));
    const ratioOk = providedSpiralRatio + 1e-12 >= requiredSpiralRatio;
    add("ratio", "Volumetric spiral reinforcement ratio", ratioOk, "425.7.3.3", `Provided ${f(providedSpiralRatio, 6)}; required ${f(requiredSpiralRatio, 6)}.`, "Increase spiral bar area or reduce pitch while maintaining the required clear gap.", [...ratioRequiredEquations, ...ratioProvidedEquations, m`\rho_{s,prov}=${f(providedSpiralRatio, 6)}\ ${ratioOk ? "\\ge" : "<"}\ ${f(requiredSpiralRatio, 6)}=\rho_{s,req}`, m`A_{sp,prov}=${f(spiralBarArea)}\,\text{mm}^2\ ${ratioOk ? "\\ge" : "<"}\ ${f(requiredSpiralArea)}\,\text{mm}^2`]);
    add("top-turns", "Top spiral anchorage", input.topExtraTurns >= 1.5, "425.7.3.4", `${input.topExtraTurns} extra turns at top; required ≥1.5.`, "Provide at least 1½ extra turns at the top.", [m`n_{top}=${input.topExtraTurns}\ ${input.topExtraTurns >= 1.5 ? "\\ge" : "<"}\ 1.5\,\text{turns}`]);
    add("bottom-turns", "Bottom spiral anchorage", input.bottomExtraTurns >= 1.5, "425.7.3.4", `${input.bottomExtraTurns} extra turns at bottom; required ≥1.5.`, "Provide at least 1½ extra turns at the bottom.", [m`n_{bottom}=${input.bottomExtraTurns}\ ${input.bottomExtraTurns >= 1.5 ? "\\ge" : "<"}\ 1.5\,\text{turns}`]);
    add("splice", "Spiral splice condition", input.spliceType === "none" ? true : input.spliceCompliant, "425.7.3.5", input.spliceType === "none" ? "No splice is provided." : `Drawing confirmation: ${input.spliceType} splice complies with the applicable code requirements.`, "Verify the selected mechanical or welded splice. The module does not supply a splice-strength calculation.");
  }
  const modeLabel = input.mode === "rectilinear" ? "Rectilinear tied column" : input.mode === "circular" ? "Circular tied column" : "Spiral column";
  const step = (title: string, equations: string[] = [], notes: string[] = [], checkIds: string[] = [], reference?: string): DetailingStep => ({ title, equations, notes, checkIds, reference });
  const supportNotes = input.mode === "rectilinear" ? supportChecks.map((bar) => bar.supported ? `${bar.id}: marked directly supported${bar.corner ? " (corner)" : ""}.` : `${bar.id}: previous support ${bar.previousSupport ?? "none"}, next support ${bar.nextSupport ?? "none"}.`) : ["Uniformly spaced longitudinal bars inside the transverse reinforcement. Rectilinear alternate-bar and 150 mm rules are not applied to circular ties or spirals."];
  const supportEquations = supportChecks.filter((bar) => !bar.supported && bar.clearPrevious !== null && bar.clearNext !== null).flatMap((bar) => [
    m`\ell_{${bar.id},left}=L_{centers}-d_b=${f(bar.clearPrevious! + input.longitudinalDiameter)}-${input.longitudinalDiameter}=${f(bar.clearPrevious!)}\,\text{mm}\ ${bar.clearPrevious! <= 150 ? "\\le" : ">"}\ 150\,\text{mm}`,
    m`\ell_{${bar.id},right}=${f(bar.clearNext! + input.longitudinalDiameter)}-${input.longitudinalDiameter}=${f(bar.clearNext!)}\,\text{mm}\ ${bar.clearNext! <= 150 ? "\\le" : ">"}\ 150\,\text{mm}`,
  ]);
  const adequate = checks.every((check) => check.status === "PASS");
  const steps = [
    step("Identify the column type", [], [modeLabel, "Module 8 — Shear Analysis and Design of Columns Using NSCP 2015.", "Only the supplied ordinary transverse-detailing rules are checked; special/seismic confinement was not included."]),
    step("Given column and reinforcement data", [m`d_b=${input.longitudinalDiameter}\,\text{mm},\quad d_t=${input.transverseDiameter}\,\text{mm},\quad s=${input.spacing}\,\text{mm},\quad d_{agg}=${input.aggregateSize}\,\text{mm}`, ...(input.mode === "rectilinear" ? [m`b=${input.b}\,\text{mm},\quad h=${input.h}\,\text{mm},\quad c_{cover}=${input.cover}\,\text{mm}`] : [m`D=${input.diameter}\,\text{mm},\quad N=${input.barCount}\,\text{bars}`]), ...(input.mode === "spiral" ? [m`d_c=${input.coreDiameter}\,\text{mm},\quad f'_c=${input.fc}\,\text{MPa},\quad f_{y,s}=${input.spiralFy}\,\text{MPa}`] : [])], ["Longitudinal bars are single, unbundled bars. Material strengths are only needed for the spiral-ratio calculation."]),
    step("Gross area, core geometry and bar layout", geometryEquations, [input.mode === "spiral" ? "dc and Ac are measured to the OUTSIDE of the spiral, not its centerline. Cover is derived, not checked against an additional exposure rule." : "Cover is a layout input measured to the outside of the tie; no additional minimum-cover provision is assumed."], [], input.mode === "spiral" ? ref("425.7.3.3") : "Module 8 — column geometry"),
    step("Required minimum transverse bar diameter", checks.find((check) => check.id === "diameter")!.equations, [isSpiral ? "Cast-in-place spiral: minimum diameter 10 mm." : `Longitudinal diameter ${input.longitudinalDiameter} mm selects the ${minimumDiameter} mm minimum tie.`], ["diameter"], ref(isSpiral ? "425.7.3.1" : "425.7.2.1")),
    step(isSpiral ? "Permitted spiral pitch from clear-spacing limits" : "Calculate every maximum tie-spacing limit", spacingEquations, [`Controlling upper limit: ${controllingLimit}.`], [], ref(isSpiral ? "425.7.3.2" : "425.7.2.2")),
    step("Compare provided center-to-center spacing", checks.find((check) => check.id === "spacing")!.equations.slice(spacingEquations.length), [], ["spacing"], ref(isSpiral ? "425.7.3.2" : "425.7.2.2")),
    step("Check the clear vertical gap", checks.find((check) => check.id === "clear")!.equations, [], ["clear"], ref(isSpiral ? "425.7.3.2" : "425.7.2.1")),
    step("Tie or spiral configuration", input.mode === "rectilinear" ? checks.find((check) => check.id === "angle")!.equations : [], ["Drawing confirmations are reported as provided by the user. An unconfirmed detail cannot pass."], input.mode === "rectilinear" ? ["closed", "angle"] : input.mode === "circular" ? ["lap", "hooks", "stagger"] : ["continuous"], ref(input.mode === "rectilinear" ? "425.7.2.3" : input.mode === "circular" ? "425.7.2.4" : "425.7.3.1")),
    step("Longitudinal-bar support and arrangement", supportEquations, supportNotes, input.mode === "rectilinear" ? ["corners", "alternate", "distance"] : ["enclosed"], ref(input.mode === "rectilinear" ? "425.7.2.3" : input.mode === "circular" ? "425.7.2.4" : "425.7.3.1")),
    step("Required spiral reinforcement ratio", ratioRequiredEquations, isSpiral ? ["fy,s is the yield strength of the SPIRAL reinforcement."] : ["Not applicable to individual ties."], [], isSpiral ? ref("425.7.3.3") : undefined),
    step("Provided spiral ratio and required bar area", ratioProvidedEquations, isSpiral ? ["Both the pitch range and reinforcement ratio must pass. The ratio may impose a tighter maximum pitch."] : ["Not applicable to individual ties."], isSpiral ? ["ratio"] : [], isSpiral ? ref("425.7.3.3") : undefined),
    step("Spiral anchorage and splice condition", checks.filter((check) => ["top-turns", "bottom-turns"].includes(check.id)).flatMap((check) => check.equations), isSpiral ? [] : ["Spiral extra-turn anchorage does not apply to individual ties."], isSpiral ? ["top-turns", "bottom-turns", "splice"] : [], isSpiral ? "NSCP 2015 §§425.7.3.4–425.7.3.5" : undefined),
    step("Compare every provided detail with its limit", [], checks.map((check) => `${check.label}: ${check.summary} (${check.reference})`)),
    step("Individual PASS / FAIL results", [], [], checks.map((check) => check.id)),
    step("Final detailing judgment", [], [adequate ? "ADEQUATE — all supplied Module 8 checks pass." : "NOT ADEQUATE — resolve every failed or incomplete condition.", "ACI 318 transverse-detailing context: §§25.7.2 and 25.7.3. The supplied NSCP metric rules govern this calculation. AISC is excluded because it addresses structural steel, not reinforced-concrete ties or spirals."]),
  ];
  return { mode: input.mode, modeLabel, grossArea, coreArea, coreDiameter: input.mode === "spiral" ? input.coreDiameter : null, cover, barCount: bars.length, bars, supportChecks, minimumDiameter, spacingLimits, maximumSpacing, minimumSpacing, clearSpacing, minimumClear, maximumClear, controllingLimit, spiralBarArea, requiredSpiralRatio, providedSpiralRatio, requiredSpiralArea, ratioPitchMaximum, checks, steps, adequate, incomplete: checks.some((check) => check.status === "INCOMPLETE") };
}
