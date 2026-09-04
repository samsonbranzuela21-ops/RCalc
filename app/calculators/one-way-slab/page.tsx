"use client";

import { useState, type FormEvent } from "react";
import { InlineKatex } from "@/components/Katex";
import { OneWaySlabDiagram } from "@/components/OneWaySlabDiagram";
import { designOneWaySlab, type OneWaySlabInput, type OneWaySlabResult, type SlabSupportCondition } from "@/lib/one-way-slab";

const supportOptions: Array<{ value: SlabSupportCondition; label: string }> = [
  { value: "simply-supported", label: "Simply supported" },
  { value: "one-end-continuous", label: "One end continuous" },
  { value: "both-ends-continuous", label: "Both ends continuous" },
  { value: "cantilever", label: "Cantilever" },
];

export default function OneWaySlabPage() {
  const [values, setValues] = useState({ span: "4.5", h: "150", deadLoad: "1.0", liveLoad: "2.0", fc: "28", fy: "420", cover: "20", barDiameter: "12", distributionBarDiameter: "10" });
  const [supportCondition, setSupportCondition] = useState<SlabSupportCondition>("simply-supported");
  const [result, setResult] = useState<OneWaySlabResult | null>(null);
  const [solvedInput, setSolvedInput] = useState<OneWaySlabInput | null>(null);
  const [error, setError] = useState("");

  function update(name: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: OneWaySlabInput = {
      span: Number(values.span), h: Number(values.h), deadLoad: Number(values.deadLoad), liveLoad: Number(values.liveLoad),
      fc: Number(values.fc), fy: Number(values.fy), cover: Number(values.cover), barDiameter: Number(values.barDiameter), distributionBarDiameter: Number(values.distributionBarDiameter), supportCondition,
    };
    try {
      const calculated = designOneWaySlab(input);
      setResult(calculated); setSolvedInput(input); setError("");
    } catch (calculationError) {
      setResult(null); setSolvedInput(null);
      setError(calculationError instanceof Error ? calculationError.message : "Check the entered values.");
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)]">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold">One-Way Slab Design</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--text-muted)]">
          Design a 1 m slab strip for gravity loads using NSCP 2015 strength design provisions consistent with ACI 318-18. Positive moments for continuous spans use the approximate coefficient method.
        </p>

        <form onSubmit={calculate} className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <Field label="Span, L" unit="m" value={values.span} onChange={(v) => update("span", v)} />
            <Field label="Slab thickness, h" unit="mm" value={values.h} onChange={(v) => update("h", v)} />
            <Field label="Superimposed dead load" unit="kPa" value={values.deadLoad} onChange={(v) => update("deadLoad", v)} />
            <Field label="Live load" unit="kPa" value={values.liveLoad} onChange={(v) => update("liveLoad", v)} />
            <Field label="Concrete strength, f'c" unit="MPa" value={values.fc} onChange={(v) => update("fc", v)} />
            <Field label="Rebar yield strength, fy" unit="MPa" value={values.fy} onChange={(v) => update("fy", v)} />
            <Field label="Clear cover" unit="mm" value={values.cover} onChange={(v) => update("cover", v)} />
            <Field label="Main bar diameter" unit="mm" value={values.barDiameter} onChange={(v) => update("barDiameter", v)} />
            <Field label="Distribution bar diameter" unit="mm" value={values.distributionBarDiameter} onChange={(v) => update("distributionBarDiameter", v)} />
          </div>
          <label className="mt-5 block max-w-md">
            <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">Support condition</span>
            <select value={supportCondition} onChange={(event) => setSupportCondition(event.target.value as SlabSupportCondition)} className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm">
              {supportOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {error && <p role="alert" className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}
          <button type="submit" className="mt-5 w-full rounded-md bg-[var(--orange)] px-4 py-2.5 font-semibold text-white sm:w-auto">Calculate slab</button>
        </form>

        {result && solvedInput && (
          <>
            <div className="mt-6"><OneWaySlabDiagram result={result} supportCondition={solvedInput.supportCondition} span={solvedInput.span} h={solvedInput.h} /></div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <ResultCard title="Design checks" ok={result.overallOk}>
                <ResultRow label="Factored load, wu" value={`${result.factoredLoad.toFixed(2)} kN/m²`} />
                <ResultRow label="Design moment, Mu" value={`${result.Mu.toFixed(2)} kN·m/m`} />
                <ResultRow label="Provided main steel" value={`${solvedInput.barDiameter} mm @ ${result.spacingProvided.toFixed(0)} mm c/c`} />
                <ResultRow label="Shrinkage / temperature steel" value={`${solvedInput.distributionBarDiameter} mm @ ${result.shrinkageSpacing.toFixed(0)} mm c/c`} ok={result.shrinkageOk} />
                <ResultRow label="φMn ≥ Mu" value={`${result.phiMn.toFixed(2)} ≥ ${result.Mu.toFixed(2)} kN·m/m`} ok={result.flexureOk} />
                <ResultRow label="φVc ≥ Vu" value={`${result.phiVc.toFixed(2)} ≥ ${result.Vu.toFixed(2)} kN/m`} ok={result.shearOk} />
                <ResultRow label={`Thickness screen (L/${result.thicknessRatio > 0 ? result.thicknessRatio.toFixed(0) : "—"})`} value={`${solvedInput.h.toFixed(0)} ≥ ${result.thicknessMinimum.toFixed(0)} mm`} ok={result.thicknessOk} />
              </ResultCard>
              <ResultCard title="Reinforcement design" ok={result.flexureOk}>
                <ResultRow label="Effective depth, d" value={`${result.d.toFixed(1)} mm`} />
                <ResultRow label="As required" value={`${result.AsRequired.toFixed(0)} mm²/m`} />
                <ResultRow label="As provided" value={`${result.AsProvided.toFixed(0)} mm²/m`} />
                <ResultRow label="Maximum spacing" value={`${result.spacingMax.toFixed(0)} mm`} />
                <ResultRow label="Tension strain, εt" value={result.epsilonT.toFixed(5)} />
                <ResultRow label="Strength factor, φ" value={result.phi.toFixed(3)} />
              </ResultCard>
            </div>
            {result.warnings.length > 0 && <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-600"><p className="font-bold">Engineering notes</p><ul className="mt-2 list-disc space-y-1 pl-4">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
            <Solution input={solvedInput} result={result} />
          </>
        )}
      </div>
    </main>
  );
}

function Solution({ input, result }: { input: OneWaySlabInput; result: OneWaySlabResult }) {
  return (
    <section className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
      <h2 className="text-[15px] font-extrabold">Engineering solution sequence</h2>
      <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">The calculation uses a 1,000 mm-wide strip. Loads are converted to a factored line load, then the strip is checked for flexure, minimum reinforcement, spacing, thickness screening, and one-way shear.</p>
      <div className="mt-4 space-y-3">
        <Step number={1} title="Factored gravity load" formula="w_u=1.2(D_s+w_{self})+1.6L" substitution={`w_u=1.2(${input.deadLoad.toFixed(2)}+${result.selfWeight.toFixed(2)})+1.6(${input.liveLoad.toFixed(2)})=${result.factoredLoad.toFixed(2)}\\,\\text{kN/m}^2`} />
        <Step number={2} title="Design action" formula={`M_u=C_mw_uL^2\\quad(${result.momentType})`} substitution={`M_u=(${result.momentCoefficient.toFixed(4)})(${result.factoredLoad.toFixed(2)})(${input.span.toFixed(2)})^2=${result.Mu.toFixed(2)}\\,\\text{kN}\\cdot\\text{m/m}`} />
        <Step number={3} title="Flexural and transverse reinforcement" formula="A_s=\\max(A_{s,req},A_{s,min}),\\quad A_{s,temp}\\geq\\rho_{s,min}bh" substitution={`\\rho_{s,min}=${result.rhoMin.toFixed(5)};\\quad \\text{main }${input.barDiameter}\\,\\text{mm}\\text{ bars at }${result.spacingProvided.toFixed(0)}\\,\\text{ mm c/c}\\Rightarrow A_{s,prov}=${result.AsProvided.toFixed(0)}\\,\\text{mm}^2/\\text{m};\\quad \\text{transverse }A_s=${result.shrinkageAsProvided.toFixed(0)}\\,\\text{mm}^2/\\text{m}`} />
        <Step number={4} title="Strength and serviceability checks" formula="\\phi M_n\\geq M_u\\quad\\text{and}\\quad\\phi V_c\\geq V_u" substitution={`\\phi M_n=${result.phiMn.toFixed(2)}\\,\\text{kN}\\cdot\\text{m/m};\\quad \\phi V_c=${result.phiVc.toFixed(2)}\\,\\text{kN/m};\\quad h\\geq L/${result.thicknessRatio}`} />
      </div>
    </section>
  );
}

function Step({ number, title, formula, substitution }: { number: number; title: string; formula: string; substitution: string }) {
  return <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"><div className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">{number}</span><h3 className="text-xs font-semibold">{title}</h3></div><div className="mt-2 space-y-1.5 sm:pl-7"><div className="overflow-x-auto rounded bg-[var(--bg-surface)] px-2 py-1.5 text-xs"><InlineKatex math={formula} /></div><div className="overflow-x-auto text-xs text-[var(--text-muted)]"><InlineKatex math={substitution} /></div></div></div>;
}

function ResultCard({ title, ok, children }: { title: string; ok: boolean; children: React.ReactNode }) {
  return <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"><div className={`mb-3 rounded-md px-3 py-2 text-xs font-semibold ${ok ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>{title}: {ok ? "PASS" : "REVIEW REQUIRED"}</div>{children}</section>;
}

function ResultRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-2 text-xs last:border-0"><span className="text-[var(--text-muted)]">{label}</span><span className={`text-right font-semibold ${ok === undefined ? "text-[var(--text)]" : ok ? "text-green-600" : "text-red-500"}`}>{value}{ok !== undefined && ` — ${ok ? "OK" : "NOT OK"}`}</span></div>;
}

function Field({ label, unit, value, onChange }: { label: string; unit: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">{label}</span><span className="flex overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg)]"><input required type="number" inputMode="decimal" step="any" value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" /><span className="flex min-w-14 items-center justify-center border-l border-[var(--border)] px-2 text-xs text-[var(--text-muted)]">{unit}</span></span></label>;
}
