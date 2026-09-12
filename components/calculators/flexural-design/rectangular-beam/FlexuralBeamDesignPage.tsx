"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { InlineKatex } from "@/components/shared/Katex";
import { FlexuralBeamDiagram } from "@/components/calculators/flexural-design/rectangular-beam/FlexuralBeamDiagram";
import { designSinglyReinforcedBeam, getDesignSolutionSteps, getReinforcementLayoutCapacity, type FlexuralBeamInput, type FlexuralBeamResult, type SolutionStep } from "@/lib/flexural-beam";

const barSizes = [12, 16, 20, 25, 28, 32];

export default function FlexuralBeamDesignPage() {
  const [Mu, setMu] = useState("180");
  const [b, setB] = useState("300");
  const [h, setH] = useState("510");
  const [cover, setCover] = useState("40");
  const [stirrupDiameter, setStirrupDiameter] = useState("10");
  const [aggregateSize, setAggregateSize] = useState("19");
  const [fc, setFc] = useState("28");
  const [fy, setFy] = useState("420");
  const [Es, setEs] = useState("200000");
  const [barDiameter, setBarDiameter] = useState(20);
  const [compressionBarDiameter, setCompressionBarDiameter] = useState(20);
  const [result, setResult] = useState<FlexuralBeamResult | null>(null);
  const [steps, setSteps] = useState<SolutionStep[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [inputError, setInputError] = useState("");

  function invalidateResult() { setResult(null); setSteps([]); setShowSolution(false); setInputError(""); }
  function update<T>(setter: (value: T) => void, value: T) { setter(value); invalidateResult(); }

  function handleCalculate() {
    const input: FlexuralBeamInput = {
      Mu: Number(Mu), b: Number(b), h: Number(h), cover: Number(cover),
      stirrupDiameter: Number(stirrupDiameter), aggregateSize: Number(aggregateSize),
      fc: Number(fc), fy: Number(fy), Es: Number(Es), barDiameter, compressionBarDiameter,
    };
    try {
      const computed = designSinglyReinforcedBeam(input);
      setResult(computed);
      setSteps(getDesignSolutionSteps(input, computed));
      setInputError("");
      setShowSolution(false);
    } catch (error) {
      setInputError(error instanceof Error ? error.message : "Check the entered values and try again.");
      setResult(null); setSteps([]);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-5 sm:py-10">
      <div className="mx-auto min-w-0 max-w-6xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Flexural Beam Design</h1>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Design the required longitudinal reinforcement and bar spacing for a rectangular beam.</p>
          </div>
          <Link href="/calculators/beam-capacity-check" className="text-xs font-semibold text-[#f5941f] underline underline-offset-4">Need section analysis? Open Beam Capacity Check</Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:grid-cols-2 sm:p-5">
          <Field label="Factored moment, Mu (kN·m)" value={Mu} onChange={(v) => update(setMu, v)} />
          <Field label="Beam width, b (mm)" value={b} onChange={(v) => update(setB, v)} />
          <Field label="Overall height, h (mm)" value={h} onChange={(v) => update(setH, v)} />
          <Field label="Clear cover to stirrup, Cc (mm)" value={cover} onChange={(v) => update(setCover, v)} />
          <Field label="Stirrup diameter (mm)" value={stirrupDiameter} onChange={(v) => update(setStirrupDiameter, v)} />
          <Field label="Maximum nominal aggregate size (mm)" value={aggregateSize} onChange={(v) => update(setAggregateSize, v)} />
          <Field label="Concrete strength, f′c (MPa)" value={fc} onChange={(v) => update(setFc, v)} />
          <Field label="Steel yield strength, fy (MPa)" value={fy} onChange={(v) => update(setFy, v)} />
          <Field label="Steel modulus, Es (MPa)" value={Es} onChange={(v) => update(setEs, v)} />
          <BarSelect label="Tension-bar diameter (mm)" value={barDiameter} onChange={(v) => update(setBarDiameter, v)} />
          <div className="col-span-full rounded-lg border border-[var(--border)] p-3">
            <p className="text-[11px] font-semibold">Compression-bar size for a doubly reinforced design</p>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">Used only when the singly reinforced portion cannot carry the required design moment.</p>
            <div className="mt-2 max-w-sm"><BarSelect label="Compression-bar diameter (mm)" value={compressionBarDiameter} onChange={(v) => update(setCompressionBarDiameter, v)} /></div>
          </div>
          <p className="col-span-full text-[10px] leading-relaxed text-[var(--text-muted)]">One cover value is used on all faces and is measured to the outside of the stirrup. Design equations and detailing checks follow NSCP 2015 / ACI 318-14. The adopted design limit is <InlineKatex math="\rho_{max}=0.025" />.</p>
        </div>

        {inputError && <div role="alert" className="mt-3 rounded-md bg-[#e05353]/15 px-3 py-2 text-xs font-semibold text-[#e05353]">{inputError}</div>}
        <button type="button" onClick={handleCalculate} className="mt-4 w-full rounded-md bg-[#f5941f] px-4 py-2.5 text-xs font-semibold text-[#1a1300] transition hover:brightness-105">Design Reinforcement</button>

        {result && <DesignResult result={result} />}
        {result && steps.length > 0 && <div className="mt-3">
          <button type="button" onClick={() => setShowSolution((v) => !v)} className="text-xs font-semibold text-[#f5941f] underline underline-offset-4" aria-expanded={showSolution}>{showSolution ? "Hide full design solution" : "Show full design solution"}</button>
          {showSolution && <ManualSolution steps={steps} />}
        </div>}
      </div>
    </div>
  );
}

function DesignResult({ result }: { result: FlexuralBeamResult }) {
  return <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5" aria-label="Flexural design result">
    <div className={`rounded-lg border px-4 py-3 ${result.ok ? "border-[#39c98a]/40 bg-[#39c98a]/10" : "border-[#e05353]/40 bg-[#e05353]/10"}`}>
      <p className={`text-xs font-bold ${result.ok ? "text-[#21875c] dark:text-[#39c98a]" : "text-[#e05353]"}`}>{result.ok ? "DESIGN COMPLETE" : "DESIGN NOT FEASIBLE"}</p>
      <p className="mt-1 text-sm font-semibold">{result.ok ? `${result.sectionType === "doubly" ? "Doubly" : "Singly"} reinforced beam: use ${barSchedule(result.tensionBarsPerLayer, result.input.barDiameter)} at the bottom${result.compressionBarsRequired > 0 ? ` and ${barSchedule(result.compressionBarsPerLayer, result.input.compressionBarDiameter)} at the top` : ""}.` : result.message}</p>
    </div>
    {!result.ok && <FailureExplanation result={result} />}
    <div className="mt-4"><FlexuralBeamDiagram result={result} /></div>

    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      <ResultGroup title="Required design steel">
        <ResultRow label="Design type" value={result.sectionType === "doubly" ? "Doubly reinforced" : "Singly reinforced"} bold />
        <ResultRow label={<>Required nominal moment, <InlineKatex math="M_{n,req}" /></>} value={`${fmt(result.requiredMn)} kN·m`} />
        <ResultRow label={<>Minimum steel, <InlineKatex math="A_{s,min}" /></>} value={`${fmt(result.asMin, 1)} mm²`} />
        {result.sectionType === "doubly" ? <>
          <ResultRow label={<>Singly reinforced portion, <InlineKatex math="A_{s1}" /></>} value={`${fmt(result.asSinglyPortion, 1)} mm²`} />
          <ResultRow label={<>Moment from Beam 1, <InlineKatex math="M_{n1}" /></>} value={`${fmt(result.mnSingly)} kN·m`} />
          <ResultRow label={<>Remaining moment, <InlineKatex math="M_{n2}" /></>} value={`${fmt(result.mnRemaining)} kN·m`} />
          <ResultRow label={<>Additional tension steel, <InlineKatex math="A_{s2}" /></>} value={`${fmt(result.asAdditionalTension, 1)} mm²`} />
          <ResultRow label={<>Compression steel, <InlineKatex math="A'_s" /></>} value={`${fmt(result.asCompression, 1)} mm²`} />
          <ResultRow label={<>Total tension steel, <InlineKatex math="A_s=A_{s1}+A_{s2}" /></>} value={`${fmt(result.asRequired, 1)} mm²`} bold />
        </> : <ResultRow label={<>Required tension steel, <InlineKatex math="A_s" /></>} value={`${fmt(result.asRequired, 1)} mm²`} bold />}
        <ResultRow
          label={<>Reinforcement ratio, <InlineKatex math="\rho_{min}\,/\,\rho_{req}\,/\,\rho_{max}" /></>}
          value={`${fmt(result.rhoMin, 5)} / ${fmt(result.rhoRequired, 5)} / ${fmt(result.rhoMax, 3)}`}
        />
      </ResultGroup>

      <ResultGroup title="Adopted reinforcement">
        <ResultRow label="Bottom tension bars" value={barSchedule(result.tensionBarsPerLayer, result.input.barDiameter)} bold />
        <ResultRow label={<>Provided tension area, <InlineKatex math="A_{s,prov}" /></>} value={`${fmt(result.asProvided, 1)} mm²`} />
        {result.compressionBarsRequired > 0 && <>
          <ResultRow label="Top compression bars" value={barSchedule(result.compressionBarsPerLayer, result.input.compressionBarDiameter)} bold />
          <ResultRow label={<>Provided compression area, <InlineKatex math="A'_{s,prov}" /></>} value={`${fmt(result.compressionBarsRequired * result.compressionBarArea, 1)} mm²`} />
        </>}
        <ResultRow label={<>Effective depth, <InlineKatex math="d" /></>} value={`${fmt(result.d)} mm`} />
        {result.dPrime !== null && <ResultRow label={<>Compression-steel depth, <InlineKatex math="d'" /></>} value={`${fmt(result.dPrime)} mm`} />}
        <ResultRow label="Tension bars by layer" value={result.tensionBarsPerLayer.join(" + ")} />
        <ResultRow label="Tension spacing" value={result.spacingOk ? "PASS" : "FAIL"} bold />
        {result.compressionBarsRequired > 0 && <ResultRow label="Compression spacing" value={result.compressionSpacingOk ? "PASS" : "FAIL"} bold />}
        <ResultRow label="Required and provided steel" value={result.asProvided >= result.asRequired ? "PASS" : "FAIL"} bold />
      </ResultGroup>
    </div>

    <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
      <p className="text-xs font-semibold">Continue with section analysis</p>
      <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">Use the adopted dimensions, cover, and bar layout in Beam Capacity Check to review neutral-axis depth, strain compatibility, steel stresses, and design moment capacity.</p>
      {result.ok && result.tensionBarsPerLayer.length <= 2 && result.compressionBarsPerLayer.length <= 2 ? (
        <Link href={beamCapacityAnalysisHref(result)} className="mt-3 inline-flex rounded-md border border-[#f5941f]/50 px-3 py-2 text-xs font-semibold text-[#f5941f] hover:bg-[#f5941f]/10">Analyze this design in Beam Capacity Check</Link>
      ) : (
        <p className="mt-3 text-[10px] text-[var(--text-muted)]">Complete a feasible design with no more than two rows at either face before transferring it to Beam Capacity Check.</p>
      )}
    </div>
  </section>;
}

function ManualSolution({ steps }: { steps: SolutionStep[] }) {
  return <section id="flexural-solution" className="mt-3 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
    <div>
      <h2 className="text-base font-extrabold">Full Manual Design Solution</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">The steps below show the design in order. Each card separates the equation, numerical substitution, and answer. Values are rounded only for display.</p>
    </div>
    {steps.map((step, index) => <article key={`${index}-${step.label}`} className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3">
      <div className="flex items-start gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f5941f] text-[10px] font-bold text-[#1a1300]">{index + 1}</span>
        <div className="min-w-0">
          <h3 className="text-[11px] font-semibold text-[var(--text)]">{step.label}</h3>
          {step.reference && <p className="mt-1 text-[9px] leading-relaxed text-[var(--text-muted)]">{step.reference}</p>}
        </div>
      </div>
      <div className="mt-3 space-y-2 pl-7">
        <SolutionPart label="Equation"><FormulaLine math={step.formula} /></SolutionPart>
        {step.substitution && <SolutionPart label="Substitution"><FormulaLine math={step.substitution} muted /></SolutionPart>}
        <div className={`rounded px-2 py-2 ${step.status === "fail" ? "bg-[#e05353]/15 text-[#e05353]" : "bg-[#39c98a]/15 text-[#21875c] dark:text-[#39c98a]"}`}>
          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide">Answer</p>
          <p className="text-[11px] leading-relaxed text-[var(--text)]">{step.result}</p>
          {step.resultMath && <div className="mt-2 overflow-x-auto"><InlineKatex math={step.resultMath} /></div>}
        </div>
        {step.explanation && <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">{step.explanation}</p>}
      </div>
    </article>)}
  </section>;
}

function SolutionPart({ label, children }: { label: string; children: ReactNode }) {
  return <div><p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>{children}</div>;
}

function FailureExplanation({ result }: { result: FlexuralBeamResult }) {
  const capacity = getReinforcementLayoutCapacity(result.input, "tension");
  return <div className="mt-3 rounded-lg border border-[#e05353]/35 bg-[#e05353]/5 p-3 text-[11px] leading-relaxed">
    <p className="font-semibold text-[#e05353]">Why the design cannot be detailed</p>
    {result.failureDetails && <p className="mt-1 text-[var(--text-muted)]">{result.failureDetails}</p>}
    {result.failureType === "layout" && <><p className="mt-2">The selected tension-bar size allows at most {capacity.maximumBarsPerLayer} bars per layer and {capacity.maximumTotalBars} bars within the section.</p><div className="mt-2"><FormulaLine math="n d_b+(n-1)s_{clear,min}\le b_{inside};\quad s_{clear,min}=\max\left(25,d_b,\dfrac{4d_{agg}}{3}\right)" muted /></div><p className="mt-2 text-[var(--text-muted)]">Increase the beam width or height, select another bar size, or reduce the design demand.</p></>}
  </div>;
}

function ResultGroup({ title, children }: { title: string; children: ReactNode }) { return <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"><h3 className="mb-2 text-xs font-bold">{title}</h3>{children}</section>; }
function ResultRow({ label, value, bold = false }: { label: ReactNode; value: string; bold?: boolean }) { return <div className="grid grid-cols-1 gap-1 border-b border-[var(--border)] py-2 text-[11px] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 last:border-b-0"><span className="text-[var(--text-muted)]">{label}</span><span className={`break-words sm:text-right ${bold ? "font-bold" : ""}`}>{value}</span></div>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { const id = `flexural-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`; return <div><label htmlFor={id} className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">{label}</label><input id={id} type="number" inputMode="decimal" step="any" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-xs" /></div>; }
function BarSelect({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <div><label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">{label}</label><select value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-xs">{barSizes.map((size) => <option key={size} value={size}>{size} mm</option>)}</select></div>; }
function FormulaLine({ math, muted = false }: { math: string; muted?: boolean }) { return <div className={`max-w-full overflow-x-auto rounded-md px-3 py-2 text-xs ${muted ? "bg-[var(--bg-surface)] text-[var(--text-muted)]" : "bg-[var(--bg-surface)]"}`}><InlineKatex math={math} /></div>; }
function barSchedule(layers: number[], diameter: number): string { const total = layers.reduce((sum, count) => sum + count, 0); return layers.length > 1 ? `${total}–${diameter} mm bars (${layers.join(" + ")} by layer)` : `${total}–${diameter} mm bars`; }
function fmt(value: number | null | undefined, digits = 2): string { return value !== null && value !== undefined && Number.isFinite(value) ? value.toFixed(digits) : "—"; }

function beamCapacityAnalysisHref(result: FlexuralBeamResult): string {
  const params = new URLSearchParams({
    source: "flexural-beam-design",
    b: String(result.input.b),
    h: String(result.input.h),
    cover: String(result.input.cover),
    stirrup: String(result.input.stirrupDiameter),
    fc: String(result.input.fc),
    fy: String(result.input.fy),
    mu: String(result.input.Mu),
    tensionDiameter: String(result.input.barDiameter),
    tensionRows: result.tensionBarsPerLayer.join(","),
    doubly: result.compressionBarsRequired > 0 ? "1" : "0",
    compressionDiameter: String(result.input.compressionBarDiameter),
    compressionRows: result.compressionBarsPerLayer.join(","),
  });
  return `/calculators/beam-capacity-check?${params.toString()}`;
}
