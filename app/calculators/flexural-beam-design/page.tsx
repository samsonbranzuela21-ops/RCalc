"use client";

import { useState } from "react";
import { InlineKatex } from "@/components/Katex";
import { BeamCrossSection } from "@/components/BeamCrossSection";
import {
  designSinglyReinforcedBeam,
  getSolutionSteps,
  type FlexuralBeamResult,
  type SolutionStep,
} from "@/lib/flexural-beam";

const barSizes = [12, 16, 20, 25, 28, 32];

export default function FlexuralBeamDesignPage() {
  const [Mu, setMu] = useState("180");
  const [b, setB] = useState("300");
  const [d, setD] = useState("450");
  const [fc, setFc] = useState("28");
  const [fy, setFy] = useState("420");
  const [barDiameter, setBarDiameter] = useState(20);
  const [result, setResult] = useState<FlexuralBeamResult | null>(null);
  const [steps, setSteps] = useState<SolutionStep[]>([]);
  const [showSolution, setShowSolution] = useState(false);

  function handleCalculate() {
    const parsed = {
      Mu: parseFloat(Mu),
      b: parseFloat(b),
      d: parseFloat(d),
      fc: parseFloat(fc),
      fy: parseFloat(fy),
      barDiameter,
    };

    if (Object.values(parsed).some((v) => isNaN(v) || v <= 0)) {
      setResult(null);
      setSteps([]);
      return;
    }

    const computed = designSinglyReinforcedBeam(parsed);
    setResult(computed);
    setSteps(getSolutionSteps(parsed, computed));
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto max-w-[560px]">
        <h1 className="text-[22px] font-extrabold">Flexural Beam Design</h1>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
          Singly reinforced rectangular beam — NSCP 2015 strength design method.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <Field label="Mu — factored moment (kN·m)" value={Mu} onChange={setMu} />
          <Field label="b — width (mm)" value={b} onChange={setB} />
          <Field label="d — effective depth (mm)" value={d} onChange={setD} />
          <Field label="f'c (MPa)" value={fc} onChange={setFc} />
          <Field label="fy (MPa)" value={fy} onChange={setFy} />

          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
              Bar diameter (mm)
            </label>
            <select
              value={barDiameter}
              onChange={(e) => setBarDiameter(Number(e.target.value))}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
            >
              {barSizes.map((size) => (
                <option key={size} value={size}>
                  {size} mm
                </option>
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
          <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            <div
              className={`mb-3 rounded-md px-3 py-2 text-[11px] font-semibold ${
                result.ok
                  ? "bg-[#39c98a]/15 text-[#39c98a]"
                  : "bg-[#f5941f]/15 text-[#f5941f]"
              }`}
            >
              {result.message}
            </div>

            <BeamCrossSection
              b={parseFloat(b)}
              d={parseFloat(d)}
              barDiameter={barDiameter}
              barsRequired={result.barsRequired}
              clearSpacing={result.clearSpacing}
              spacingOk={result.spacingOk}
            />

            <div className="mt-4">
              <ResultRow label="Rn (required)" value={`${result.Rn.toFixed(3)} MPa`} />
            <ResultRow label="β1" value={result.beta1.toFixed(3)} />
            <ResultRow label="ρ required" value={result.rhoRequired.toFixed(5)} />
            <ResultRow label="ρmin" value={result.rhoMin.toFixed(5)} />
            <ResultRow label="ρmax" value={result.rhoMax.toFixed(5)} />
            <ResultRow label="As required" value={`${result.asRequired.toFixed(0)} mm²`} />
            <ResultRow label="As,min" value={`${result.asMin.toFixed(0)} mm²`} />
            <ResultRow label="As,max" value={`${result.asMax.toFixed(0)} mm²`} />
            <ResultRow label="As final (governing)" value={`${result.asFinal.toFixed(0)} mm²`} bold />
            <ResultRow
              label="Bars required"
              value={`${result.barsRequired} × ${barDiameter}mm`}
              bold
            />
            {result.spacingOk !== null && (
              <ResultRow
                label="Bar spacing (NSCP 2015 §25.2.1)"
                value={
                  result.clearSpacing !== null
                    ? `${result.clearSpacing.toFixed(1)} mm ${result.spacingOk ? "≥" : "<"} ${result.minClearSpacingRequired.toFixed(0)} mm req'd — ${result.spacingOk ? "OK" : "NOT OK"}`
                    : "N/A"
                }
                bold
              />
            )}
            </div>
          </div>
        )}

        {result && result.spacingOk === false && (
          <div className="mt-3 rounded-md bg-[#e05353]/15 px-3 py-2 text-[11px] font-semibold text-[#e05353]">
            {result.spacingMessage}
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
              <div className="mt-3 space-y-4 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                {steps.map((step, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#f5941f] text-[10px] font-bold text-[#1a1300]">
                        {i + 1}
                      </span>
                      <p className="text-[11px] font-semibold text-[var(--text)]">
                        {step.label}
                      </p>
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

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
      />
    </div>
  );
}

function ResultRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-1.5 text-[11px] last:border-b-0">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={bold ? "font-bold" : ""}>{value}</span>
    </div>
  );
}