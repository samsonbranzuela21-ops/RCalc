"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { InlineKatex } from "@/components/Katex";
import { OneWaySlabDiagram } from "@/components/OneWaySlabDiagram";
import { OneWaySlabSolution } from "@/components/OneWaySlabSolution";
import { DEFAULT_SLAB_PROBLEM, designSlabProblem, MOMENT_TABLE, type SlabProblemInput, type SlabProblemResult } from "@/lib/one-way-slab";

const initialValues = {
  exteriorSpacing: "4.2", interiorSpacing: "4.5", beamWidth: "300",
  superimposedDeadLoad: "2.8", liveLoad: "2.4", fc: "28", barDiameter: "10",
  thickness: "180", cover: "20", concreteUnitWeight: "24", aggregateSize: "20", fy: "420",
};
type FieldKey = keyof typeof initialValues;
const controlClass = "w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--green)]";
const numberText = (value: number, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : "—";

export function OneWaySlabCalculator() {
  const [values, setValues] = useState(initialValues);
  const [grade, setGrade] = useState("60");
  const [spanCount, setSpanCount] = useState<2 | 3 | 4>(4);
  const [endSupport, setEndSupport] = useState<SlabProblemInput["endSupport"]>("spandrel");
  const [negativeRule, setNegativeRule] = useState<SlabProblemInput["negativeRule"]>("standard");
  const [automaticThickness, setAutomaticThickness] = useState(true);
  const [result, setResult] = useState<SlabProblemResult | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [solutionSpan, setSolutionSpan] = useState(0);
  const [error, setError] = useState("");
  const n = (key: FieldKey) => values[key].trim() === "" ? NaN : Number(values[key]);
  const fy = grade === "60" ? 420 : grade === "40" ? 280 : n("fy");
  const exteriorClear = n("exteriorSpacing") - n("beamWidth") / 1000;
  const interiorClear = n("interiorSpacing") - n("beamWidth") / 1000;
  const clearResult = () => { setResult(null); setShowSolution(false); setError(""); };
  function update(key: FieldKey, value: string) { setValues((current) => ({ ...current, [key]: value })); clearResult(); }
  function resetExample() {
    setValues(initialValues); setGrade("60"); setSpanCount(4); setEndSupport("spandrel");
    setNegativeRule("standard"); setAutomaticThickness(true); setSolutionSpan(0); clearResult();
  }
  function field(key: FieldKey, label: string, unit: string, hint?: string) {
    return <label className="block min-w-0"><span className="mb-1.5 block text-sm font-medium">{label}</span><span className="flex overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg)] focus-within:ring-2 focus-within:ring-[var(--green)]"><input aria-label={label} name={key} required type="number" step="any" inputMode="decimal" value={values[key]} onChange={(event) => update(key, event.target.value)} className="w-full min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none" /><span className="flex shrink-0 items-center border-l border-[var(--border)] px-3 text-xs text-[var(--text-muted)]">{unit}</span></span>{hint && <span className="mt-1 block text-xs leading-relaxed text-[var(--text-muted)]">{hint}</span>}</label>;
  }
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const problem: SlabProblemInput = {
        ...DEFAULT_SLAB_PROBLEM,
        exteriorSpacing: n("exteriorSpacing"), interiorSpacing: n("interiorSpacing"), beamWidth: n("beamWidth"),
        superimposedDeadLoad: n("superimposedDeadLoad"), liveLoad: n("liveLoad"), fc: n("fc"), barDiameter: n("barDiameter"),
        fy, spanCount, endSupport, negativeRule, thickness: automaticThickness ? null : n("thickness"),
        cover: n("cover"), concreteUnitWeight: n("concreteUnitWeight"), aggregateSize: n("aggregateSize"),
      };
      setResult(designSlabProblem(problem)); setError(""); setShowSolution(false); setSolutionSpan(0);
    } catch (issue) { setResult(null); setError(issue instanceof Error ? issue.message : "Check the entered givens."); }
  }
  const solvedSpan = result?.spans[solutionSpan];
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)]">
      <div className="mx-auto max-w-6xl space-y-5">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--green)]">NSCP 2015 · Continuous one-way slabs</p>
          <h1 className="mt-1 text-2xl font-bold">One-Way Slab Design</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">Enter the givens from your problem. The calculator finds the clear spans, slab thickness, and bar spacing for the end span and interior span.</p>
        </header>
        <form onSubmit={calculate} noValidate className="space-y-4">
          <Panel title="1. Dimensions from the figure">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs"><p className="text-[var(--text-muted)]">The values below match your 4.2 m / 4.5 m example.</p><button type="button" onClick={resetExample} className="font-semibold text-[var(--green)] underline underline-offset-4">Load example givens</button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("exteriorSpacing", spanCount === 2 ? "First span beam spacing" : "Exterior span beam spacing", "m", "Center to center of the beams. This is the first span at the edge.")}
              {field("interiorSpacing", spanCount === 2 ? "Second span beam spacing" : "Interior span beam spacing", "m", "For equal spans, enter the same spacing in both boxes.")}
              {field("beamWidth", "Typical beam width", "mm", "The beam width shown or stated in the problem.")}
              <Select label="How many spans are there?" value={String(spanCount)} onChange={(value) => { setSpanCount(Number(value) as 2 | 3 | 4); clearResult(); }}>
                <option value="2">Two spans only</option><option value="3">Three spans: end – interior – end</option><option value="4">Four or more: interior spans continue</option>
              </Select>
            </div>
            <div className="mt-4 rounded-lg bg-[var(--bg)] p-3 text-sm" aria-live="polite">
              <p className="font-semibold">Calculated clear spans</p>
              <p className="mt-1" data-testid="clear-spans">{spanCount === 2 ? "First" : "Exterior"}: {numberText(exteriorClear, 3)} m · {spanCount === 2 ? "Second" : "Interior"}: {numberText(interiorClear, 3)} m</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Clear span = beam spacing − beam width. You do not need to calculate this yourself.</p>
            </div>
          </Panel>
          <Panel title="2. Loads and reinforcing bars">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {field("superimposedDeadLoad", "Superimposed dead load", "kPa", "One total value, excluding the slab’s own weight.")}
              {field("liveLoad", "Live load", "kPa")}
              {field("fc", "Concrete strength, f′c", "MPa")}
              {field("barDiameter", "Bar diameter", "mm", "Used for main bars and shrinkage/temperature bars.")}
              <Select label="Steel grade" value={grade} onChange={(value) => { setGrade(value); clearResult(); }}><option value="60">Grade 60 — fy = 420 MPa</option><option value="40">Grade 40 — fy = 280 MPa</option><option value="custom">Enter a different fy</option></Select>
              {grade === "custom" && field("fy", "Steel yield strength, fy", "MPa")}
            </div>
          </Panel>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            <p className="text-sm font-semibold">We’ll calculate the thickness and add slab self-weight.</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Defaults: indoor slab, {values.cover} mm cover, normalweight concrete at {values.concreteUnitWeight} kN/m³, and a 1 m design strip. {endSupport === "unrestrained" ? "The exterior end is unrestrained." : `The edge is cast together with ${endSupport === "spandrel" ? "a supporting beam" : "a supporting column"}.`} Uniform loads and continuous, constant-thickness spans are assumed.</p>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--green)]">Optional settings — only change if your problem says otherwise</summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Select label="Slab thickness" value={automaticThickness ? "auto" : "given"} onChange={(value) => { setAutomaticThickness(value === "auto"); clearResult(); }}><option value="auto">Calculate for me</option><option value="given">My problem gives a thickness</option></Select>
                {!automaticThickness && field("thickness", "Given slab thickness", "mm")}
                {field("cover", "Clear cover", "mm")}
                {field("concreteUnitWeight", "Concrete unit weight", "kN/m³")}
                {field("aggregateSize", "Maximum aggregate size", "mm")}
                <Select label="Support at the exterior edge" value={endSupport} onChange={(value) => { setEndSupport(value as SlabProblemInput["endSupport"]); clearResult(); }}><option value="spandrel">Slab cast together with the edge beam</option><option value="column">Slab cast together with the edge column</option><option value="unrestrained">End is unrestrained</option></Select>
                <Select label="Negative moment table case" value={negativeRule} onChange={(value) => { setNegativeRule(value as SlabProblemInput["negativeRule"]); clearResult(); }}><option value="standard">Use the usual support rows (1/9, 1/10, 1/11)</option><option value="short-spans">Use 1/12 at supports — all clear spans ≤ 3 m</option></Select>
              </div>
              <p className="mt-3 text-xs text-[var(--text-muted)]">The standard rows match the highlighted 1/14 and 1/10 method in your slide. The special 1/12 slab row is available when specifically used by your problem. Steel modulus is 200,000 MPa. For 3+ spans, the two end spans are taken as equal and interior spacings repeat.</p>
            </details>
          </div>
          {error && <p role="alert" className="rounded-lg border border-[var(--red)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--red)]">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-[var(--green)] px-6 py-3 font-bold text-white sm:w-auto">Design slab</button>
        </form>
        {result && <>
          <Panel title="Your slab design">
            <p role="status" className={`text-sm font-bold ${result.overallOk ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{result.overallOk ? "ADEQUATE — the calculated slab passes the checks" : "NOT ADEQUATE — revise the failed checks below"}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Summary label={result.problem.thickness === null ? "Selected slab thickness" : "Given slab thickness"} value={`${result.thickness} mm`} />
              <Summary label="Effective depth" value={`${numberText(result.spans[0].result.d)} mm`} />
              <Summary label="Factored load" value={`${numberText(result.spans[0].result.factoredLoad, 3)} kPa`} />
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)]">{result.problem.thickness === null ? `Thickness starts at ${result.initialThickness} mm, rounded up to 10 mm to meet the ${numberText(result.minimumThickness)} mm screen and fit the bars and cover. ${result.trials.length > 1 ? `${result.trials.length} trial thicknesses were checked, including updated self-weight.` : result.overallOk ? "The first trial passes." : "The trial failed; see the required revisions below."}` : "The given thickness is checked without changing it."}</p>
          </Panel>
          <OneWaySlabDiagram problem={result} />
          <Panel title="Bar spacing to provide">
            <p className="mb-3 text-xs text-[var(--text-muted)]">All moments are for a 1 m strip. Top bars resist negative support moments; bottom bars resist positive span moments.</p>
            <div className="space-y-3">{result.zones.map(({ label, design }) => <div key={label} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 sm:flex sm:items-center sm:justify-between sm:gap-5">
              <div><h3 className="text-sm font-semibold">{label}</h3><p className="mt-1 text-xs text-[var(--text-muted)]">Mu = {numberText(design.Mu, 3)} kN·m · C = 1/{design.tableCase.denominator} · {design.adequate ? "ADEQUATE" : "NOT ADEQUATE"}</p></div>
              <p className={`mt-2 shrink-0 text-sm font-bold sm:mt-0 ${design.adequate && result.overallOk ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{!result.overallOk && "Trial: "}Ø{result.problem.barDiameter} mm @ {design.spacingProvided} mm</p>
            </div>)}</div>
            <div className="mt-3 rounded-lg bg-[var(--bg)] p-3"><h3 className="text-sm font-semibold">Shrinkage and temperature bars</h3><p className="mt-1 text-sm">Ø{result.problem.barDiameter} mm @ {Math.min(...result.spans.map((span) => span.result.distribution.spacing))} mm, perpendicular to the main bars.</p></div>
          </Panel>
          {!result.overallOk && <Panel title="Checks to revise"><ul className="list-disc space-y-2 pl-5 text-sm text-[var(--red)]">{[...new Set(result.spans.flatMap((span) => span.result.warnings))].map((warning) => <li key={warning}>{warning}</li>)}</ul></Panel>}
          <button type="button" onClick={() => setShowSolution((show) => !show)} aria-expanded={showSolution} aria-controls="slab-problem-solution" className="w-full rounded-lg border border-[var(--green)] px-5 py-3 text-sm font-bold text-[var(--green)] sm:w-auto">{showSolution ? "Hide Full Solution" : "Show Full Solution"}</button>
          {showSolution && solvedSpan && <div id="slab-problem-solution" className="min-w-0 space-y-4">
            <Panel title="From the given beam spacings to clear spans">
              <Formula value={String.raw`L_{n,end}=L_{end}-b_{beam}/1000=${result.problem.exteriorSpacing}-${result.problem.beamWidth}/1000=${numberText(result.exteriorClear, 3)}\,\text{m}`} />
              <Formula value={String.raw`L_{n,${result.problem.spanCount === 2 ? "second" : "interior"}}=${result.problem.interiorSpacing}-${result.problem.beamWidth}/1000=${numberText(result.interiorClear, 3)}\,\text{m}`} />
              <Formula value={String.raw`h_{screen}=\max\left(\frac{${result.problem.exteriorSpacing * 1000}}{24},\frac{${result.problem.interiorSpacing * 1000}}{${result.problem.spanCount === 2 ? 24 : 28}}\right)\left(0.4+\frac{${result.problem.fy}}{700}\right)=${numberText(result.minimumThickness, 3)}\,\text{mm}`} />
              <Formula value={String.raw`h_{selected}=${result.thickness}\,\text{mm}`} />
              <p className="mt-2 text-xs text-[var(--text-muted)]">{result.problem.thickness === null ? "Use one common slab thickness for both spans. Automatic trials (10 mm increments): " + result.trials.map((trial) => `${trial.thickness} mm ${trial.adequate ? "passes" : "fails"}`).join("; ") : "The thickness was supplied by the user."}</p>
            </Panel>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose the span solution">{result.spans.map((span, index) => <button key={span.label} type="button" aria-pressed={solutionSpan === index} onClick={() => setSolutionSpan(index)} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${solutionSpan === index ? "border-[var(--green)] bg-[var(--green)] text-white" : "border-[var(--border)] bg-[var(--bg-surface)]"}`}>{span.label} solution</button>)}</div>
            <OneWaySlabSolution input={solvedSpan.input} result={solvedSpan.result} />
          </div>}
        </>}
        <details className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-xs text-[var(--text-muted)]">
          <summary className="cursor-pointer font-semibold">Design basis and assumptions</summary>
          <p className="mt-3">{MOMENT_TABLE}. This form is for problems that specify a continuous one-way slab. No floor area or panel aspect ratio is invented when the problem gives only a section. It assumes equal beam widths, indoor exposure, normalweight concrete and uniform gravity loads.</p>
          <p className="mt-2">Adjacent clear spans must differ by no more than 20%, and live load must not exceed three times the total dead load. Thickness selection is a deflection screen assuming no deflection-sensitive attachments; strain, strength, spacing, and support-face shear are checked afterward. Development lengths, anchorage and openings require separate detailing.</p>
          <p className="mt-2">Supplemental checks: ACI 318-14 Tables 5.3.1, 6.5.2/6.5.4, 7.3.1.1, 7.6.1.1, 20.6.1.3.1, 21.2.2 and 24.3.2; §§7.3.3.1, 7.7.2.3–4, 22.2 and 22.5.5.1. <a className="underline" href="https://structurepoint.org/publication/html/DE-One-Way-Slab-ACI-14-spBeam-v1000/DE-One-Way-Slab-ACI-14-v1000/05/05.htm?rhtocid=_6">ACI slab-design reference</a>.</p>
        </details>
      </div>
    </main>
  );
}
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5"><h2 className="mb-4 text-base font-bold">{title}</h2>{children}</section>;
}
function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-sm font-medium">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={controlClass}>{children}</select></label>;
}
function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-[var(--bg)] p-3"><p className="text-xs text-[var(--text-muted)]">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>;
}
function Formula({ value }: { value: string }) {
  return <div className="mt-2 max-w-full overflow-x-auto rounded-lg bg-[var(--bg)] p-2 text-sm"><InlineKatex math={value} /></div>;
}
