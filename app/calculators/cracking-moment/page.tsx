"use client";

import { useState } from "react";
import { InlineKatex } from "@/components/Katex";
import { CrackingMomentDiagram } from "@/components/CrackingMomentDiagram";
import {
  calculateCrackingMoment,
  getCrackingMomentSteps,
  type CrackingMomentResult,
  type CrackingMomentStep,
  type CrackingSectionMode,
} from "@/lib/cracking-moment";

export default function CrackingMomentPage() {
  const [mode, setMode] = useState<CrackingSectionMode>("rectangle");
  const [fc, setFc] = useState("28");
  const [lambda, setLambda] = useState("1.0");
  const [b, setB] = useState("300");
  const [h, setH] = useState("500");
  const [Ig, setIg] = useState("3125000000");
  const [yt, setYt] = useState("250");
  const [result, setResult] = useState<CrackingMomentResult | null>(null);
  const [steps, setSteps] = useState<CrackingMomentStep[]>([]);
  const [error, setError] = useState("");
  const [showSolution, setShowSolution] = useState(false);

  function handleCalculate() {
    const input = {
      mode,
      fc: Number(fc),
      lambda: Number(lambda),
      b: Number(b),
      h: Number(h),
      Ig: Number(Ig),
      yt: Number(yt),
    };

    try {
      const computed = calculateCrackingMoment(input);
      setResult(computed);
      setSteps(getCrackingMomentSteps(input, computed));
      setError("");
      setShowSolution(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to calculate the cracking moment."
      );
      setResult(null);
      setSteps([]);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-3 py-8 text-[var(--text)] sm:px-5 sm:py-10">
      <div className="mx-auto max-w-[600px]">
        <h1 className="text-[22px] font-extrabold">Cracking Moment</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
          Calculate the first flexural cracking moment from the concrete modulus
          of rupture — NSCP 2015 and ACI 318-14.
        </p>

        <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
              Section-property mode
            </label>
            <select
              value={mode}
              onChange={(event) => {
                setMode(event.target.value as CrackingSectionMode);
                setResult(null);
                setSteps([]);
                setError("");
              }}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
            >
              <option value="rectangle">Rectangular section — calculate Ig and yt</option>
              <option value="custom">Custom section — enter Ig and yt</option>
            </select>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="f'c (MPa)" value={fc} onChange={setFc} />

            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
                λ — lightweight-concrete factor
              </label>
              <select
                value={lambda}
                onChange={(event) => setLambda(event.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
              >
                <option value="1.0">1.00 — normalweight</option>
                <option value="0.85">0.85 — sand-lightweight</option>
                <option value="0.75">0.75 — all-lightweight</option>
              </select>
            </div>

            {mode === "rectangle" ? (
              <>
                <Field label="b — section width (mm)" value={b} onChange={setB} />
                <Field label="h — overall depth (mm)" value={h} onChange={setH} />
              </>
            ) : (
              <>
                <Field label="Ig — gross inertia (mm⁴)" value={Ig} onChange={setIg} />
                <Field
                  label="yt — centroid to tension face (mm)"
                  value={yt}
                  onChange={setYt}
                />
              </>
            )}
          </div>
        </div>

        <p className="mt-2 text-[9px] leading-relaxed text-[var(--text-muted)]">
          For a T-, L-, or other nonrectangular section, select Custom section
          and enter the gross-section Ig and the distance yt to the extreme
          tension fiber for the bending direction being checked.
        </p>

        <button
          type="button"
          onClick={handleCalculate}
          className="mt-4 w-full rounded-md bg-[#f5941f] px-4 py-2.5 text-[12px] font-semibold text-[#1a1300] hover:brightness-105 active:scale-[0.99]"
        >
          Calculate Cracking Moment
        </button>

        {error && (
          <div className="mt-3 rounded-md bg-[#e05353]/15 px-3 py-2 text-[11px] font-semibold text-[#e05353]">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
            <div className="mb-3 rounded-md bg-[#39c98a]/15 px-3 py-2 text-[11px] font-semibold text-[#39c98a]">
              {result.message}
            </div>

            <CrackingMomentDiagram
              b={mode === "rectangle" ? Number(b) : undefined}
              h={mode === "rectangle" ? Number(h) : undefined}
              fr={result.fr}
              mode={mode}
            />

            <div className="mt-4">
              <ResultRow
                label="Section mode"
                value={mode === "rectangle" ? "Rectangular" : "Custom properties"}
              />
              <ResultRow
                label="Modulus of rupture, fr"
                value={`${result.fr.toFixed(3)} MPa`}
              />
              <ResultRow
                label="Gross moment of inertia, Ig"
                value={`${result.Ig.toFixed(0)} mm⁴`}
              />
              <ResultRow
                label="Distance to tension face, yt"
                value={`${result.yt.toFixed(2)} mm`}
              />
              <ResultRow
                label="Gross section modulus, Sg"
                value={`${result.sectionModulus.toFixed(0)} mm³`}
              />
              <ResultRow
                label="Cracking moment, Mcr"
                value={`${result.Mcr.toFixed(2)} kN·m`}
                bold
              />
            </div>
          </div>
        )}

        {result && steps.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowSolution((shown) => !shown)}
              className="text-[11px] font-semibold text-[#f5941f] underline"
            >
              {showSolution ? "Hide full solution" : "Show full solution"}
            </button>

            {showSolution && (
              <div className="mt-3 space-y-4 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
                {steps.map((step, index) => (
                  <div
                    key={`${step.label}-${index}`}
                    className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg)] p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#f5941f] text-[10px] font-bold text-[#1a1300]">
                        {index + 1}
                      </span>
                      <p className="text-[11px] font-semibold text-[var(--text)]">
                        {step.label}
                      </p>
                    </div>

                    <div className="mt-2 min-w-0 space-y-1.5 sm:pl-7">
                      <div className="max-w-full overflow-x-auto rounded bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--text)]">
                        <InlineKatex math={step.formula} />
                      </div>
                      {step.substitution && (
                        <div className="max-w-full overflow-x-auto text-[var(--text-muted)]">
                          <InlineKatex math={step.substitution} />
                        </div>
                      )}
                      <div className="mt-1.5 max-w-full overflow-x-auto rounded bg-[#39c98a]/15 px-2 py-1 text-[#39c98a]">
                        <InlineKatex math={step.result} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-[9px] leading-relaxed text-[var(--text-muted)]">
          Educational design aid only. For nonrectangular members, calculate Ig
          and yt using the complete uncracked gross concrete section and verify
          the bending direction using the official NSCP 2015 and ACI 318-14
          publications.
        </p>
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
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
        {label}
      </label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-[var(--border)] py-1.5 text-[11px] last:border-b-0">
      <span className="min-w-0 text-[var(--text-muted)]">{label}</span>
      <span className={`min-w-0 text-right ${bold ? "font-bold" : ""}`}>
        {value}
      </span>
    </div>
  );
}
