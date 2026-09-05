"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ColumnTiesDiagram } from "@/components/ColumnTiesDiagram";
import { ColumnDetailCheck, ColumnTiesSolution } from "@/components/ColumnTiesSolution";
import { calculateColumnTies, rectilinearBars, type ColumnDetailMode, type ColumnTiesInput, type ColumnTiesResult, type Confirmation, type SpiralColumnInput } from "@/lib/column-ties-check";

const initial = { b: "350", h: "350", diameter: "450", coreDiameter: "370", cover: "40", barsAcross: "3", barsDeep: "3", barCount: "8", longitudinalDiameter: "25", tieDiameter: "10", spiralDiameter: "10", tieSpacing: "200", pitch: "50", aggregateSize: "20", includedAngle: "90", fc: "28", spiralFy: "420", topExtraTurns: "1.5", bottomExtraTurns: "1.5" };
type Field = keyof typeof initial;
const initialConfirmations: Record<"closedTie" | "lapCompliant" | "standardHooks" | "staggeredLaps" | "continuousDeformed" | "spliceCompliant", Confirmation> = { closedTie: null, lapCompliant: null, standardHooks: null, staggeredLaps: null, continuousDeformed: null, spliceCompliant: null };
type Detail = keyof typeof initialConfirmations;
const control = "w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--orange)]";
const display = (value: number, digits = 2) => value.toFixed(digits);

export function ColumnTiesCalculator() {
  const [mode, setMode] = useState<ColumnDetailMode>("rectilinear");
  const [values, setValues] = useState(initial);
  const [confirmations, setConfirmations] = useState(initialConfirmations);
  const [supportedBars, setSupportedBars] = useState(["B1", "B3", "B5", "B7"]);
  const [spliceType, setSpliceType] = useState<SpiralColumnInput["spliceType"]>("none");
  const [solved, setSolved] = useState<{ input: ColumnTiesInput; result: ColumnTiesResult } | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [error, setError] = useState("");
  function clearResult() { setSolved(null); setShowSolution(false); setError(""); }
  const numeric = (key: Field, source = values) => source[key].trim() === "" ? NaN : Number(source[key]);
  function resetSupports(source = values, all = false) {
    try {
      const bars = rectilinearBars({ b: numeric("b", source), h: numeric("h", source), cover: numeric("cover", source), longitudinalDiameter: numeric("longitudinalDiameter", source), transverseDiameter: numeric("tieDiameter", source), barsAcross: numeric("barsAcross", source), barsDeep: numeric("barsDeep", source), supportedBars: [] });
      setSupportedBars(bars.filter((bar) => all || bar.corner).map((bar) => bar.id));
    } catch { setSupportedBars([]); }
    clearResult();
  }
  function update(key: Field, value: string) {
    const next = { ...values, [key]: value }; setValues(next);
    if (key === "barsAcross" || key === "barsDeep") resetSupports(next);
    clearResult();
  }
  function buildInput(): ColumnTiesInput {
    const common = { longitudinalDiameter: numeric("longitudinalDiameter"), transverseDiameter: numeric(mode === "spiral" ? "spiralDiameter" : "tieDiameter"), spacing: numeric(mode === "spiral" ? "pitch" : "tieSpacing"), aggregateSize: numeric("aggregateSize") };
    if (mode === "rectilinear") return { ...common, mode, b: numeric("b"), h: numeric("h"), cover: numeric("cover"), barsAcross: numeric("barsAcross"), barsDeep: numeric("barsDeep"), supportedBars, includedAngle: numeric("includedAngle"), closedTie: confirmations.closedTie };
    if (mode === "circular") return { ...common, mode, diameter: numeric("diameter"), cover: numeric("cover"), barCount: numeric("barCount"), lapCompliant: confirmations.lapCompliant, standardHooks: confirmations.standardHooks, staggeredLaps: confirmations.staggeredLaps };
    return { ...common, mode, diameter: numeric("diameter"), coreDiameter: numeric("coreDiameter"), barCount: numeric("barCount"), fc: numeric("fc"), spiralFy: numeric("spiralFy"), continuousDeformed: confirmations.continuousDeformed, topExtraTurns: numeric("topExtraTurns"), bottomExtraTurns: numeric("bottomExtraTurns"), spliceType, spliceCompliant: confirmations.spliceCompliant };
  }
  let preview: { input: ColumnTiesInput; result: ColumnTiesResult } | null = null;
  try { const input = buildInput(); preview = { input, result: calculateColumnTies(input) }; } catch { /* Editable invalid givens are reported on submit. */ }
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { const input = buildInput(); setSolved({ input, result: calculateColumnTies(input) }); setError(""); setShowSolution(false); }
    catch (issue) { setSolved(null); setError(issue instanceof Error ? issue.message : "Check the entered column data."); }
  }
  function field(key: Field, label: string, unit: string, hint?: string) {
    return <label className="block min-w-0"><span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">{label}</span><span className="flex overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg)] focus-within:border-[var(--orange)]"><input aria-label={label} name={key} type="number" required step={key.startsWith("bars") || key === "barCount" ? "1" : "any"} inputMode="decimal" value={values[key]} onChange={(event) => update(key, event.target.value)} className="w-full min-w-0 bg-transparent px-3 py-2 text-sm outline-none" /><span className="flex shrink-0 items-center border-l border-[var(--border)] px-2 text-xs text-[var(--text-muted)]">{unit}</span></span>{hint && <span className="mt-1 block text-[10px] leading-relaxed text-[var(--text-muted)]">{hint}</span>}</label>;
  }
  function confirmation(key: Detail, label: string) {
    return <label className="block min-w-0"><span className="mb-1 block text-xs font-medium">{label}</span><select aria-label={label} value={confirmations[key] === null ? "unknown" : confirmations[key] ? "yes" : "no"} onChange={(event) => { setConfirmations((current) => ({ ...current, [key]: event.target.value === "unknown" ? null : event.target.value === "yes" })); clearResult(); }} className={control}><option value="unknown">Not confirmed from the drawing</option><option value="yes">Yes — confirmed</option><option value="no">No — detail does not comply</option></select></label>;
  }
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)]">
      <div className="mx-auto max-w-6xl space-y-5">
        <header><p className="text-xs font-semibold uppercase tracking-wide text-[var(--green)]">Module 8 · NSCP 2015</p><h1 className="mt-1 text-2xl font-bold">Column Ties and Spiral Detailing Check</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">Check transverse bar size, spacing, and arrangement using the supplied module. Choose the column type to see only the relevant givens.</p></header>
        <form onSubmit={calculate} noValidate className="space-y-4">
          <Panel title="1. Column type and dimensions">
            <label className="mb-4 block max-w-lg"><span className="mb-1 block text-xs font-medium">Column type</span><select aria-label="Column type" value={mode} onChange={(event) => { setMode(event.target.value as ColumnDetailMode); clearResult(); }} className={control}><option value="rectilinear">Tied column — rectilinear ties</option><option value="circular">Tied column — circular ties</option><option value="spiral">Spiral column — cast in place</option></select></label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mode === "rectilinear" ? <>{field("b", "Column width, b", "mm")}{field("h", "Column depth, h", "mm")}</> : field("diameter", "Gross column diameter, D", "mm")}
              {mode === "spiral" ? field("coreDiameter", "Core diameter, dc (outside of spiral)", "mm", "Measure to the outside of the spiral, not its centerline.") : field("cover", "Cover to outside of tie", "mm", "Used to locate the bars; no additional exposure-cover limit is assumed.")}
              {field("longitudinalDiameter", "Longitudinal bar diameter, db", "mm")}
              {mode === "rectilinear" ? <>{field("barsAcross", "Bars on each width face", "bars", "Include both corner bars on each face.")}{field("barsDeep", "Bars on each depth face", "bars", "Include both corner bars. Corners are counted only once in the total.")}</> : field("barCount", "Number of longitudinal bars", "bars", "Equally spaced around the perimeter.")}
            </div>
            {preview && <p className="mt-3 text-xs text-[var(--text-muted)]">Calculated gross area: {display(preview.result.grossArea)} mm² · Total longitudinal bars: {preview.result.barCount}{mode === "spiral" && ` · Cover to outside of spiral: ${display(preview.result.cover)} mm`}</p>}
          </Panel>
          <Panel title={mode === "spiral" ? "2. Spiral bar, pitch, and materials" : "2. Tie size and spacing"}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mode === "spiral" ? <>{field("spiralDiameter", "Spiral bar diameter, dsp", "mm")}{field("pitch", "Spiral pitch, s (center to center)", "mm")}</> : <>{field("tieDiameter", "Provided tie diameter, dt", "mm")}{field("tieSpacing", "Provided tie spacing, s (center to center)", "mm")}</>}
              {field("aggregateSize", "Maximum nominal aggregate size, dagg", "mm")}
              {mode === "spiral" && <>{field("fc", "Concrete strength, f′c", "MPa")}{field("spiralFy", "Spiral steel yield strength, fy,s", "MPa", "Use the spiral reinforcement grade, not the longitudinal steel grade.")}</>}
            </div>
            {preview && <p className="mt-3 text-xs text-[var(--text-muted)]">Calculated clear gap = center spacing − transverse bar diameter = {display(preview.result.clearSpacing)} mm.</p>}
          </Panel>
          <Panel title={mode === "rectilinear" ? "3. Mark the laterally supported bars" : "3. Confirm the detailing shown on your drawing"}>
            {preview && <ColumnTiesDiagram input={preview.input} result={preview.result} onToggle={mode === "rectilinear" ? (id) => { setSupportedBars((current) => current.includes(id) ? current.filter((bar) => bar !== id) : [...current, id]); clearResult(); } : undefined} />}
            {mode === "rectilinear" && <>
              <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => resetSupports()} className="rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold">Mark corners only</button><button type="button" onClick={() => resetSupports(values, true)} className="rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold">Mark every bar supported</button></div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">{supportedBars.length} bars marked directly supported. Mark a bar only if a tie or cross-tie corner actually restrains it.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">{field("includedAngle", "Largest included angle at supporting tie corners", "degrees", "This is the included tie-corner angle, not the hook bend angle.")}{confirmation("closedTie", "Closed outer tie encloses all longitudinal bars")}</div>
            </>}
            {mode === "circular" && <div className="mt-4 grid gap-4 sm:grid-cols-2">{confirmation("lapCompliant", "Circular tie lap complies with the drawing/code")}{confirmation("standardHooks", "Both standard hooks engage a longitudinal bar")}{confirmation("staggeredLaps", "Overlaps of adjacent ties are staggered")}</div>}
            {mode === "spiral" && <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {confirmation("continuousDeformed", "Continuous deformed spiral with even spacing")}
              {field("topExtraTurns", "Extra anchorage turns at top", "turns")}{field("bottomExtraTurns", "Extra anchorage turns at bottom", "turns")}
              <label className="block"><span className="mb-1 block text-xs font-medium">Spiral splice type</span><select aria-label="Spiral splice type" value={spliceType} onChange={(event) => { setSpliceType(event.target.value as SpiralColumnInput["spliceType"]); clearResult(); }} className={control}><option value="none">No splice</option><option value="mechanical">Mechanical splice</option><option value="welded">Welded splice</option></select></label>
              {spliceType !== "none" && confirmation("spliceCompliant", "Selected splice complies with applicable code requirements")}
            </div>}
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">A drawing confirmation is a statement supplied by you, not a calculated verification. Unconfirmed details are marked INCOMPLETE and cannot produce an ADEQUATE result. Numerical lap, hook-extension, and splice-strength rules were not included in the supplied module.</p>
          </Panel>
          {error && <p role="alert" className="rounded-lg border border-amber-600 bg-[var(--bg-surface)] p-4 text-sm text-amber-600">{error}</p>}
          <button type="submit" className="w-full rounded-md bg-[var(--orange)] px-4 py-2.5 text-sm font-semibold text-white sm:w-auto">Check detailing</button>
        </form>
        {solved && <>
          <Panel title="Detailing result">
            <p role="status" className={`text-base font-bold ${solved.result.adequate ? "text-[var(--green)]" : solved.result.incomplete ? "text-amber-600" : "text-[var(--red)]"}`}>{solved.result.adequate ? "ADEQUATE" : "NOT ADEQUATE"} — {solved.result.modeLabel}</p>
            {solved.result.incomplete && <p className="mt-2 text-xs text-amber-600">Complete the unconfirmed drawing details before the arrangement can pass.</p>}
            <div className="mt-3 grid gap-x-8 sm:grid-cols-2">
              <Row label="Gross area, Ag" value={`${display(solved.result.grossArea)} mm²`} />
              <Row label="Required / provided transverse diameter" value={`${solved.result.minimumDiameter} / ${solved.input.transverseDiameter} mm`} />
              <Row label={solved.input.mode === "spiral" ? "Pitch range from clear spacing" : "Maximum permitted tie spacing"} value={solved.input.mode === "spiral" ? `${display(solved.result.minimumSpacing)}–${display(solved.result.maximumSpacing)} mm` : `${display(solved.result.maximumSpacing)} mm`} />
              <Row label="Provided center spacing" value={`${solved.input.spacing} mm`} />
              <Row label="Controlling upper-spacing limit" value={solved.result.controllingLimit} />
              <Row label="Clear spacing" value={`${display(solved.result.clearSpacing)} mm`} />
              {solved.input.mode === "spiral" && <>
                <Row label="Core outside diameter, dc" value={`${solved.result.coreDiameter} mm`} />
                <Row label="Core area, Ac" value={`${display(solved.result.coreArea!)} mm²`} />
                <Row label="Required spiral ratio" value={display(solved.result.requiredSpiralRatio!, 6)} />
                <Row label="Provided spiral ratio" value={display(solved.result.providedSpiralRatio!, 6)} />
                <Row label="Required / provided spiral bar area" value={`${display(solved.result.requiredSpiralArea!)} / ${display(solved.result.spiralBarArea!)} mm²`} />
                <Row label="Maximum pitch from ratio alone" value={`${display(solved.result.ratioPitchMaximum!)} mm`} />
              </>}
            </div>
          </Panel>
          <div className="grid gap-3 sm:grid-cols-2">{solved.result.checks.map((check) => <ColumnDetailCheck key={check.id} check={check} />)}</div>
          {solved.input.mode === "rectilinear" && <Panel title="Bar-by-bar lateral support">
            <div className="grid gap-3 sm:grid-cols-2">{solved.result.supportChecks.map((bar) => <div key={bar.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-xs"><p className="font-semibold">{bar.id}{bar.corner ? " — corner" : ""}: {bar.supported ? "directly supported" : "not directly supported"}</p>{!bar.supported && <p className="mt-1">Previous supported bar: {bar.previousSupport ?? "none"} ({bar.clearPrevious === null ? "no support" : `${display(bar.clearPrevious)} mm clear`}); next: {bar.nextSupport ?? "none"} ({bar.clearNext === null ? "no support" : `${display(bar.clearNext)} mm clear`}).</p>}<p className={`mt-1 font-bold ${bar.distanceOk && bar.alternateOk && (!bar.corner || bar.supported) ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{bar.distanceOk && bar.alternateOk && (!bar.corner || bar.supported) ? "PASS" : "FAIL"}</p></div>)}</div>
          </Panel>}
          <button type="button" aria-expanded={showSolution} aria-controls="column-ties-solution" onClick={() => setShowSolution((show) => !show)} className="w-full rounded-md border border-[var(--orange)] px-4 py-2.5 text-sm font-semibold text-[var(--orange)] sm:w-auto">{showSolution ? "Hide Full Solution" : "Show Full Solution"}</button>
          {showSolution && <ColumnTiesSolution result={solved.result} />}
        </>}
        <details className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-xs text-[var(--text-muted)]"><summary className="cursor-pointer font-semibold">Module and code references</summary><p className="mt-3">Source: the supplied transcription of Module 8, “Shear Analysis and Design of Columns Using NSCP 2015.” Ties: §§425.7.2.1–425.7.2.4. Spirals: §§425.7.3.1–425.7.3.5. Metric equations and limits follow that transcription.</p><p className="mt-2">ACI 318-14 §§25.7.2 and 25.7.3 provide the corresponding reinforced-concrete transverse-detailing context. AISC is excluded: it is for structural steel, not concrete-column ties or spirals. No seismic/special-column rules, bundled-bar requirements, longitudinal steel-ratio limits, or axial/shear capacity checks have been added to the supplied procedure.</p><p className="mt-2">Rectilinear bars are equally spaced along each face; circular bars are equally spaced around a ring. Marked lateral supports must correspond to actual tie corners on the drawing. The module does not define minimum tie diameter for longitudinal bars between 32 and 36 mm, so those inputs are rejected rather than interpolated.</p><p className="mt-2"><a href="https://www.concrete.org/portals/0/files/pdf/318-14-tableofcontents.pdf" className="underline">ACI 318-14 transverse-reinforcement sections</a></p></details>
      </div>
    </main>
  );
}
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5"><h2 className="mb-4 text-sm font-bold">{title}</h2>{children}</section>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-[var(--border)] py-2 text-xs"><span className="text-[var(--text-muted)]">{label}</span><span className="text-right font-semibold">{value}</span></div>;
}
