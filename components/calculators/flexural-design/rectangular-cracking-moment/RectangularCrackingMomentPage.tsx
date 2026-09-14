"use client";

import { useState } from "react";
import { InlineKatex } from "@/components/shared/Katex";
import { RectangularCrackingMomentDiagram } from "@/components/calculators/flexural-design/rectangular-cracking-moment/RectangularCrackingMomentDiagram";
import {
  calculateRectangularCrackingMoment,
  getRectangularCrackingMomentSteps,
  type BendingDirection,
  type RectangularCrackingMomentResult,
  type RectangularCrackingMomentStep,
  type RectangularCrackingSectionMode,
  type ReinforcementMode,
} from "@/lib/rectangular-cracking-moment";

export default function RectangularCrackingMomentPage() {
  const [mode, setMode] =
    useState<RectangularCrackingSectionMode>("rectangle");
  const [direction, setDirection] =
    useState<BendingDirection>("positive");
  const [reinforcementMode, setReinforcementMode] =
    useState<ReinforcementMode>("none");

  const [fc, setFc] = useState("28");
  const [Es, setEs] = useState("200000");
  const [lambda, setLambda] = useState("1.0");
  const [b, setB] = useState("300");
  const [h, setH] = useState("500");

  const [bottomBarCount, setBottomBarCount] = useState("3");
  const [bottomBarDiameter, setBottomBarDiameter] = useState("25");
  const [topBarCount, setTopBarCount] = useState("2");
  const [topBarDiameter, setTopBarDiameter] = useState("16");

  const [d, setD] = useState("450");
  const [dPrime, setDPrime] = useState("50");
  const [Ig, setIg] = useState("3125000000");
  const [yt, setYt] = useState("250");

  const [result, setResult] =
    useState<RectangularCrackingMomentResult | null>(null);
  const [steps, setSteps] =
    useState<RectangularCrackingMomentStep[]>([]);
  const [error, setError] = useState("");
  const [showSolution, setShowSolution] = useState(false);

  const hasBottomSteel =
    reinforcementMode === "bottom" ||
    reinforcementMode === "both";

  const hasTopSteel =
    reinforcementMode === "top" ||
    reinforcementMode === "both";

  function clearOutput() {
    setResult(null);
    setSteps([]);
    setError("");
    setShowSolution(false);
  }

  function handleCalculate() {
    const input = {
      mode,
      direction,
      reinforcementMode:
        mode === "rectangle" ? reinforcementMode : "none",

      fc: Number(fc),
      Es: Number(Es),
      lambda: Number(lambda),
      b: Number(b),
      h: Number(h),
      bottomBarCount: Number(bottomBarCount),
      bottomBarDiameter: Number(bottomBarDiameter),
      topBarCount: Number(topBarCount),
      topBarDiameter: Number(topBarDiameter),

      d: Number(d),
      dPrime: Number(dPrime),
      Ig: Number(Ig),
      yt: Number(yt),
    } as const;

    try {
      const computed = calculateRectangularCrackingMoment(input);

      setResult(computed);
      setSteps(getRectangularCrackingMomentSteps(input, computed));
      setError("");
      setShowSolution(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to calculate the rectangular cracking moment."
      );

      setResult(null);
      setSteps([]);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-3 py-8 text-[var(--text)] sm:px-5 sm:py-10">
      <div className="mx-auto min-w-0 max-w-6xl">
        <h1 className="text-2xl font-bold">
          Rectangular Cracking Moment
        </h1>

        <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
          Calculate the rectangular-section cracking moment using gross or transformed
          section properties.
        </p>

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label="Section-property mode"
              value={mode}
              onChange={(value) => {
                setMode(value as RectangularCrackingSectionMode);
                clearOutput();
              }}
              options={[
                {
                  value: "rectangle",
                  label: "Rectangular section",
                },
                {
                  value: "custom",
                  label: "Custom Ig and yt",
                },
              ]}
            />

            {mode === "rectangle" && (
              <SelectField
                label="Bending direction"
                value={direction}
                onChange={(value) => {
                  setDirection(value as BendingDirection);
                  clearOutput();
                }}
                options={[
                  {
                    value: "positive",
                    label: "Positive - bottom in tension",
                  },
                  {
                    value: "negative",
                    label: "Negative - top in tension",
                  },
                ]}
              />
            )}

            <Field
              label="f'c (MPa)"
              value={fc}
              onChange={setFc}
            />

            <Field
              label="Es - steel modulus (MPa)"
              value={Es}
              onChange={setEs}
            />

            <SelectField
              label="λ - concrete factor"
              value={lambda}
              onChange={setLambda}
              options={[
                {
                  value: "1.0",
                  label: "1.00 - normalweight",
                },
                {
                  value: "0.85",
                  label: "0.85 - sand-lightweight",
                },
                {
                  value: "0.75",
                  label: "0.75 - all-lightweight",
                },
              ]}
            />

            {mode === "rectangle" ? (
              <>
                <Field
                  label="b - section width (mm)"
                  value={b}
                  onChange={setB}
                />

                <Field
                  label="h - overall depth (mm)"
                  value={h}
                  onChange={setH}
                />

                <div className="sm:col-span-2">
                  <SelectField
                    label="Reinforcement included"
                    value={reinforcementMode}
                    onChange={(value) => {
                      setReinforcementMode(
                        value as ReinforcementMode
                      );
                      clearOutput();
                    }}
                    options={[
                      {
                        value: "none",
                        label: "No reinforcement",
                      },
                      {
                        value: "bottom",
                        label: "Bottom steel only",
                      },
                      {
                        value: "top",
                        label: "Top steel only",
                      },
                      {
                        value: "both",
                        label: "Top and bottom steel",
                      },
                    ]}
                  />
                </div>

                {hasBottomSteel && (
                  <>
                    <Field
                      label="Number of bottom bars"
                      value={bottomBarCount}
                      onChange={setBottomBarCount}
                      step="1"
                    />

                    <Field
                      label="Bottom-bar diameter, db (mm)"
                      value={bottomBarDiameter}
                      onChange={setBottomBarDiameter}
                    />

                    <Field
                      label="d - top face to bottom steel (mm)"
                      value={d}
                      onChange={setD}
                    />
                  </>
                )}

                {hasTopSteel && (
                  <>
                    <Field
                      label="Number of top bars"
                      value={topBarCount}
                      onChange={setTopBarCount}
                      step="1"
                    />

                    <Field
                      label="Top-bar diameter, db' (mm)"
                      value={topBarDiameter}
                      onChange={setTopBarDiameter}
                    />

                    <Field
                      label="d' - top face to top steel (mm)"
                      value={dPrime}
                      onChange={setDPrime}
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <Field
                  label="Ig - section inertia (mm⁴)"
                  value={Ig}
                  onChange={setIg}
                />

                <Field
                  label="yt - N.A. to tension face (mm)"
                  value={yt}
                  onChange={setYt}
                />
              </>
            )}
          </div>
        </div>

        <p className="mt-2 text-[9px] leading-relaxed text-[var(--text-muted)]">
          The program calculates the steel area from the number and
          diameter of bars. Tension steel is transformed as nAs,
          while compression steel is transformed as (n − 1)As.
        </p>

        <button
          type="button"
          onClick={handleCalculate}
          className="mt-4 w-full rounded-md bg-[#f5941f] px-4 py-2.5 text-[12px] font-semibold text-[#1a1300] hover:brightness-105 active:scale-[0.99]"
        >
          Calculate Rectangular Cracking Moment
        </button>

        {error && (
          <div className="mt-3 rounded-md bg-[#e05353]/15 px-3 py-2 text-[11px] font-semibold text-[#e05353]">
            {error}
          </div>
        )}

        {result && (
          <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5" aria-label="Rectangular cracking moment visualization and results">
            <h2 className="text-base font-semibold">Cracking moment analysis</h2>
            <p className="mt-1 text-[10px] leading-relaxed text-[var(--text-muted)]">
              Transformed cross-section, neutral axis, linear cracking stress, and calculated section response.
            </p>

            <div className="mt-4 grid min-w-0 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0">
                <RectangularCrackingMomentDiagram
                  b={mode === "rectangle" ? Number(b) : undefined}
                  h={mode === "rectangle" ? Number(h) : undefined}
                  fr={result.fr}
                  mode={mode}
                  direction={direction}
                  reinforcementMode={result.reinforcementMode}
                  neutralAxisFromTop={result.neutralAxisFromTop}
                  tensionSteelY={result.tensionSteelY}
                  compressionSteelY={result.compressionSteelY}
                />
              </div>
              <CrackingMomentOverview result={result} mode={mode} direction={direction} />
            </div>

            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 sm:p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8facd9]">Complete calculated properties</p>
              <ResultRow
                label="Bending direction"
                value={
                  mode === "custom"
                    ? "Defined by input yt"
                    : direction === "positive"
                      ? "Positive - bottom tension"
                      : "Negative - top tension"
                }
              />

              <ResultRow
                label="Modulus of rupture, fr"
                value={`${result.fr.toFixed(3)} MPa`}
              />

              <ResultRow
                label="Concrete modulus, Ec (NSCP 2015)"
                value={`${result.Ec.toFixed(0)} MPa`}
              />
              <ResultRow
                label="Steel modulus, Es"
                value={`${result.Es.toFixed(0)} MPa`}
              />
              {mode === "rectangle" && reinforcementMode !== "none" && (
                <ResultRow
                  label="Modular ratio, n = Es/Ec"
                  value={result.modularRatio.toFixed(3)}
                />
              )}

              {mode === "rectangle" && (
                <>
                  {hasBottomSteel && (
                    <ResultRow
                      label="Bottom steel area, As"
                      value={`${result.As.toFixed(2)} mm²`}
                    />
                  )}

                  {hasTopSteel && (
                    <ResultRow
                      label="Top steel area, As'"
                      value={`${result.AsPrime.toFixed(2)} mm²`}
                    />
                  )}

                  <ResultRow
                    label="Neutral axis from top, y̅"
                    value={`${result.neutralAxisFromTop.toFixed(
                      2
                    )} mm`}
                  />

                  <ResultRow
                    label={
                      result.reinforcementMode === "none"
                        ? "Gross inertia, Ig"
                        : "Transformed inertia, Itr"
                    }
                    value={`${result.inertia.toFixed(0)} mm⁴`}
                  />
                </>
              )}

              {mode === "custom" && (
                <ResultRow
                  label="Section inertia, I"
                  value={`${result.inertia.toFixed(0)} mm⁴`}
                />
              )}

              <ResultRow
                label="Distance to tension face, yt"
                value={`${result.yt.toFixed(2)} mm`}
              />

              <ResultRow
                label="Section modulus, S"
                value={`${result.sectionModulus.toFixed(0)} mm³`}
              />

              <ResultRow
                label="Cracking moment, Mcr"
                value={`${result.Mcr.toFixed(2)} kN·m`}
                bold
              />
            </div>
          </section>
        )}

        {result && steps.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() =>
                setShowSolution((shown) => !shown)
              }
              className="text-[11px] font-semibold text-[#f5941f] underline"
            >
              {showSolution
                ? "Hide full solution"
                : "Show full solution"}
            </button>

            {showSolution && (
              <div className="mt-3 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
                {steps.map((step, index) => (
                  <div
                    key={`${step.label}-${index}`}
                    className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg)] p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#f5941f] text-[10px] font-bold text-[#1a1300]">
                        {index + 1}
                      </span>

                      <p className="text-[11px] font-semibold">
                        {step.label}
                      </p>
                    </div>

                    <div className="mt-2 space-y-1.5 sm:pl-7">
                      <FormulaLine math={step.formula} />

                      {step.substitution && (
                        <FormulaLine
                          math={step.substitution}
                          muted
                        />
                      )}

                      <FormulaLine
                        math={step.result}
                        result
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-[9px] leading-relaxed text-[var(--text-muted)]">
          Educational design aid only. Verify all inputs and
          applicable NSCP 2015 or ACI 318 requirements.
        </p>
      </div>
    </div>
  );
}

function CrackingMomentOverview({
  result,
  mode,
  direction,
}: {
  result: RectangularCrackingMomentResult;
  mode: RectangularCrackingSectionMode;
  direction: BendingDirection;
}) {
  return (
    <aside className="space-y-3" aria-label="Cracking moment summary">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8facd9]">
          Cracking moment
        </p>
        <div className="mt-3 rounded-lg border border-[#f5941f]/50 bg-[#f5941f]/10 p-3">
          <p className="text-[11px] font-semibold text-[var(--text)]">Calculated cracking response</p>
          <div className="mt-1 overflow-x-auto text-[#f5b35f]">
            <InlineKatex math={`M_{cr}=${result.Mcr.toFixed(2)}\\;\\text{kN}\\cdot\\text{m}`} />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[var(--text-muted)]">{result.message}</p>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8facd9]">
          Section properties
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Metric label={result.reinforcementMode === "none" ? "Gross inertia" : "Transformed inertia"} value={`${result.inertia.toExponential(3)} mm⁴`} />
          <Metric label="Section modulus" value={`${result.sectionModulus.toExponential(3)} mm³`} />
          <Metric label="Neutral axis" value={`${result.neutralAxisFromTop.toFixed(2)} mm`} />
          <Metric label="Tension-face distance" value={`${result.yt.toFixed(2)} mm`} />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8facd9]">
          Bending and material response
        </p>
        <div className="mt-3 space-y-2 text-[10px]">
          <SummaryLine label="Direction" value={mode === "custom" ? "Defined by yt" : direction === "positive" ? "Bottom tension" : "Top tension"} />
          <SummaryLine label="Section basis" value={result.reinforcementMode === "none" ? "Gross section" : "Transformed section"} />
          <SummaryLine label="Modulus of rupture" value={`${result.fr.toFixed(3)} MPa`} />
        </div>
      </section>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-[var(--bg-surface)] p-2.5">
      <p className="text-[9px] leading-tight text-[#8facd9]">{label}</p>
      <p className="mt-1 break-words text-[10px] font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-b-0 last:pb-0">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="text-right font-semibold text-[var(--text)]">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step = "any",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
        {label}
      </label>

      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormulaLine({
  math,
  muted,
  result,
}: {
  math: string;
  muted?: boolean;
  result?: boolean;
}) {
  return (
    <div
      className={`max-w-full overflow-x-auto ${
        result
          ? "rounded bg-[#39c98a]/15 px-2 py-1 text-[#39c98a]"
          : muted
            ? "text-[var(--text-muted)]"
            : "rounded bg-[var(--bg-surface)] px-2 py-1.5"
      }`}
    >
      <InlineKatex math={math} />
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
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-1.5 text-[11px] last:border-b-0">
      <span className="text-[var(--text-muted)]">
        {label}
      </span>

      <span
        className={`text-right ${
          bold ? "font-bold" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
