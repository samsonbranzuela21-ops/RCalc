"use client";
import { DeflectionBeamDiagram } from "@/components/DeflectionBeamDiagram";
import { useState } from "react";
import { InlineKatex } from "@/components/Katex";
import {
  checkDeflection,
  getDeflectionSolutionSteps,
  type DeflectionResult,
  type DeflectionSolutionStep,
  type SupportCondition,
  type LimitCase,
  type DurationFactor,
} from "@/lib/deflection";

const supportConditions: { value: SupportCondition; label: string }[] = [
  { value: "simply-supported", label: "Simply supported" },
  { value: "one-end-continuous", label: "One end continuous" },
  { value: "both-ends-continuous", label: "Both ends continuous" },
  { value: "cantilever", label: "Cantilever" },
];

const limitCases: { value: LimitCase; label: string }[] = [
  { value: "supporting-likely-damaged", label: "Likely to be damaged by large deflections (ℓ/480)" },
  { value: "supporting-not-likely-damaged", label: "Not likely to be damaged by large deflections (ℓ/240)" },
];

const durationOptions: { value: DurationFactor; label: string }[] = [
  { value: 1.0, label: "3 months (ξ = 1.0)" },
  { value: 1.2, label: "6 months (ξ = 1.2)" },
  { value: 1.4, label: "12 months (ξ = 1.4)" },
  { value: 2.0, label: "5+ years (ξ = 2.0)" },
];

export default function DeflectionCheckPage() {
  const [L, setL] = useState("6");
  const [b, setB] = useState("300");
  const [h, setH] = useState("500");
  const [d, setD] = useState("450");
  const [fc, setFc] = useState("28");
  const [As, setAs] = useState("1500");
  const [wD, setWD] = useState("15");
  const [wL, setWL] = useState("10");
  const [sustainedLLFactor, setSustainedLLFactor] = useState("0.3");
  const [rhoPrime, setRhoPrime] = useState("0");
  const [xi, setXi] = useState<DurationFactor>(2.0);
  const [supportCondition, setSupportCondition] = useState<SupportCondition>("simply-supported");
  const [limitCase, setLimitCase] = useState<LimitCase>("supporting-not-likely-damaged");

  const [result, setResult] = useState<DeflectionResult | null>(null);
  const [steps, setSteps] = useState<DeflectionSolutionStep[]>([]);
  const [showSolution, setShowSolution] = useState(false);

  function handleCalculate() {
    const parsed = {
      L: parseFloat(L),
      b: parseFloat(b),
      h: parseFloat(h),
      d: parseFloat(d),
      fc: parseFloat(fc),
      As: parseFloat(As),
      wD: parseFloat(wD),
      wL: parseFloat(wL),
      sustainedLLFactor: parseFloat(sustainedLLFactor),
      rhoPrime: parseFloat(rhoPrime),
      xi,
      supportCondition,
      limitCase,
    };

    const numericFields = [parsed.L, parsed.b, parsed.h, parsed.d, parsed.fc, parsed.As, parsed.wD, parsed.wL];
    if (numericFields.some((v) => isNaN(v) || v <= 0)) {
      setResult(null);
      setSteps([]);
      return;
    }

    const computed = checkDeflection(parsed);
    setResult(computed);
    setSteps(getDeflectionSolutionSteps(parsed, computed));
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto min-w-0 max-w-6xl">
        <h1 className="text-2xl font-bold">Deflection Check</h1>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
          Serviceability deflection using Branson&apos;s effective moment of inertia — NSCP 2015 / ACI 318 Table 24.2.2.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <Field label="L — span (m)" value={L} onChange={setL} />
          <Field label="b — width (mm)" value={b} onChange={setB} />
          <Field label="h — overall depth (mm)" value={h} onChange={setH} />
          <Field label="d — effective depth (mm)" value={d} onChange={setD} />
          <Field label="f'c (MPa)" value={fc} onChange={setFc} />
          <Field label="As — tension steel (mm²)" value={As} onChange={setAs} />
          <Field label="wD — service dead load (kN/m)" value={wD} onChange={setWD} />
          <Field label="wL — service live load (kN/m)" value={wL} onChange={setWL} />
          <Field label="Sustained LL factor (0–1)" value={sustainedLLFactor} onChange={setSustainedLLFactor} />
          <Field label="ρ' — compression steel ratio" value={rhoPrime} onChange={setRhoPrime} />

          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
              Support condition
            </label>
            <select
              value={supportCondition}
              onChange={(e) => setSupportCondition(e.target.value as SupportCondition)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
            >
              {supportConditions.map((sc) => (
                <option key={sc.value} value={sc.value}>{sc.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
              Load duration
            </label>
            <select
              value={xi}
              onChange={(e) => setXi(Number(e.target.value) as DurationFactor)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
            >
              {durationOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
              Long-term deflection limit case (ACI 318 Table 24.2.2)
            </label>
            <select
              value={limitCase}
              onChange={(e) => setLimitCase(e.target.value as LimitCase)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
            >
              {limitCases.map((lc) => (
                <option key={lc.value} value={lc.value}>{lc.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="mt-4 w-full rounded-md bg-[#f5941f] px-4 py-2.5 text-[12px] font-semibold text-[#1a1300]"
        >
          Calculate
        </button>

        {result && (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
            <div
              className={`mb-3 rounded-md px-3 py-2 text-[11px] font-semibold ${
                result.ok ? "bg-[#39c98a]/15 text-[#39c98a]" : "bg-[#f5941f]/15 text-[#f5941f]"
              }`}
            >
              {result.message}
            </div>

            <ResultRow label="Mcr" value={`${(result.Mcr / 1e6).toFixed(3)} kN·m`} />
            <ResultRow label="Icr" value={`${(result.Icr / 1e6).toFixed(1)} ×10⁶ mm⁴`} />
            <ResultRow label="δ (immediate, live load)" value={`${result.deltaL.toFixed(2)} mm`} />
            <ResultRow label="δ (total, long-term)" value={`${result.deltaTotalLongTerm.toFixed(2)} mm`} />
            <ResultRow
              label="Allowable (long-term)"
              value={`${result.allowableLongTerm?.toFixed(2)} mm`}
              bold
            />
          </div>
        )}

        {result && (
          <div className="mt-4 min-w-0">
            <DeflectionBeamDiagram
              L={parseFloat(L)}
              b={parseFloat(b)}
              h={parseFloat(h)}
              d={parseFloat(d)}
              As={parseFloat(As)}
              kd={result.kd}
              Icr={result.Icr}
              deltaL={result.deltaL}
              deltaTotal={result.deltaTotalLongTerm}
              supportCondition={supportCondition}
            />
          </div>
        )}

        {result && steps.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowSolution((s) => !s)}
              className="text-[11px] font-semibold text-[#f5941f] underline"
            >
              {showSolution ? "Hide full solution" : "Show full solution"}
            </button>

            {showSolution && (
              <div className="mt-3 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
                {steps.map((step, i) => (
                  <div key={i} className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#f5941f] text-[10px] font-bold text-[#1a1300]">
                        {i + 1}
                      </span>
                      <p className="text-[11px] font-semibold text-[var(--text)]">{step.label}</p>
                    </div>

                    <div className="mt-2 space-y-1.5 pl-7">
                      <div className="overflow-x-auto rounded bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--text)]">
                        <InlineKatex math={step.formula} />
                      </div>
                      {step.substitution && (
                        <div className="overflow-x-auto text-[var(--text-muted)]">
                          <InlineKatex math={step.substitution} />
                        </div>
                      )}
                      <div className="mt-1.5 inline-block rounded bg-[#39c98a]/15 px-2 py-1 text-[#39c98a]">
                        <InlineKatex math={step.result} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
      />
    </div>
  );
}

function ResultRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-1.5 text-[11px] last:border-b-0">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={bold ? "font-bold" : ""}>{value}</span>
    </div>
  );
}