"use client";

import { useState } from "react";
import { InlineKatex } from "@/components/Katex";
import { StirrupElevation } from "@/components/StirrupElevation";
import {
  designShearReinforcement,
  getShearSolutionSteps,
  type ShearDesignResult,
  type ShearSolutionStep,
} from "@/lib/shear-design";

const stirrupSizes = [10, 12, 16];

export default function ShearDesignPage() {
  const [Vu, setVu] = useState("120");
  const [b, setB] = useState("300");
  const [d, setD] = useState("450");
  const [fc, setFc] = useState("28");
  const [fy, setFy] = useState("275");
  const [stirrupDiameter, setStirrupDiameter] = useState(10);
  const [legs, setLegs] = useState(2);
  const [result, setResult] = useState<ShearDesignResult | null>(null);
  const [steps, setSteps] = useState<ShearSolutionStep[]>([]);
  const [showSolution, setShowSolution] = useState(false);

  function handleCalculate() {
    const parsed = {
      Vu: parseFloat(Vu),
      b: parseFloat(b),
      d: parseFloat(d),
      fc: parseFloat(fc),
      fy: parseFloat(fy),
      stirrupDiameter,
      legs,
    };

    if (Object.values(parsed).some((v) => isNaN(v) || v <= 0)) {
      setResult(null);
      setSteps([]);
      return;
    }

    const computed = designShearReinforcement(parsed);
    setResult(computed);
    setSteps(getShearSolutionSteps(parsed, computed));
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto min-w-0 max-w-6xl">
        <h1 className="text-2xl font-bold">Shear Capacity Design</h1>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
          Stirrup design for beam shear — NSCP 2015 strength design method.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <Field label="Vu — factored shear (kN)" value={Vu} onChange={setVu} />
          <Field label="b — width (mm)" value={b} onChange={setB} />
          <Field label="d — effective depth (mm)" value={d} onChange={setD} />
          <Field label="f'c (MPa)" value={fc} onChange={setFc} />
          <Field label="fy — stirrup steel (MPa)" value={fy} onChange={setFy} />

          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
              Stirrup diameter (mm)
            </label>
            <select
              value={stirrupDiameter}
              onChange={(e) => setStirrupDiameter(Number(e.target.value))}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
            >
              {stirrupSizes.map((size) => (
                <option key={size} value={size}>
                  {size} mm
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
              Number of legs
            </label>
            <select
              value={legs}
              onChange={(e) => setLegs(Number(e.target.value))}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
            >
              {[2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} legs
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
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
            <div
              className={`mb-3 rounded-md px-3 py-2 text-[11px] font-semibold ${
                result.ok
                  ? "bg-[#39c98a]/15 text-[#39c98a]"
                  : "bg-[#f5941f]/15 text-[#f5941f]"
              }`}
            >
              {result.message}
            </div>

            <StirrupElevation
              d={parseFloat(d)}
              spacingFinal={result.spacingFinal}
              stirrupCase={result.stirrupCase}
              legs={legs}
              stirrupDiameter={stirrupDiameter}
            />

            <div className="mt-4">
            <ResultRow label="Vc" value={`${result.Vc.toFixed(2)} kN`} />
            <ResultRow label="φVc" value={`${result.phiVc.toFixed(2)} kN`} />
            <ResultRow label="0.5φVc" value={`${result.halfPhiVc.toFixed(2)} kN`} />
            {result.stirrupCase !== "none" && result.stirrupCase !== "section-inadequate" && (
              <>
                <ResultRow label="Av" value={`${result.Av.toFixed(1)} mm²`} />
                {result.spacingRequired !== null && (
                  <ResultRow label="Spacing required" value={`${result.spacingRequired.toFixed(0)} mm`} />
                )}
                <ResultRow label="Spacing max (code)" value={`${result.spacingMax.toFixed(0)} mm`} />
                <ResultRow
                  label="Governing spacing"
                  value={`${result.spacingFinal?.toFixed(0)} mm`}
                  bold
                />
              </>
            )}
            </div>
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