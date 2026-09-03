"use client";

import { useState } from "react";
import { InlineKatex } from "@/components/Katex";
import { CrackingMomentDiagram } from "@/components/CrackingMomentDiagram";
import {
  calculateCrackingMoment,
  getCrackingMomentSteps,
  type BendingDirection,
  type CrackingMomentResult,
  type CrackingMomentStep,
  type CrackingSectionMode,
  type ReinforcementMode,
} from "@/lib/cracking-moment";

export default function CrackingMomentPage() {
  const [mode, setMode] =
    useState<CrackingSectionMode>("rectangle");
  const [direction, setDirection] =
    useState<BendingDirection>("positive");
  const [reinforcementMode, setReinforcementMode] =
    useState<ReinforcementMode>("none");

  const [fc, setFc] = useState("28");
  const [lambda, setLambda] = useState("1.0");
  const [b, setB] = useState("300");
  const [h, setH] = useState("500");
  const [modularRatio, setModularRatio] = useState("8");

  const [bottomBarCount, setBottomBarCount] = useState("3");
  const [bottomBarDiameter, setBottomBarDiameter] = useState("25");
  const [topBarCount, setTopBarCount] = useState("2");
  const [topBarDiameter, setTopBarDiameter] = useState("16");

  const [d, setD] = useState("450");
  const [dPrime, setDPrime] = useState("50");
  const [Ig, setIg] = useState("3125000000");
  const [yt, setYt] = useState("250");

  const [result, setResult] =
    useState<CrackingMomentResult | null>(null);
  const [steps, setSteps] =
    useState<CrackingMomentStep[]>([]);
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
      lambda: Number(lambda),
      b: Number(b),
      h: Number(h),
      modularRatio: Number(modularRatio),

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
        <h1 className="text-[22px] font-extrabold">
          Cracking Moment
        </h1>

        <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
          Calculate the cracking moment using gross or transformed
          section properties.
        </p>

        <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label="Section-property mode"
              value={mode}
              onChange={(value) => {
                setMode(value as CrackingSectionMode);
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

                {reinforcementMode !== "none" && (
                  <Field
                    label="n = Es/Ec - modular ratio"
                    value={modularRatio}
                    onChange={setModularRatio}
                  />
                )}

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
              b={
                mode === "rectangle"
                  ? Number(b)
                  : undefined
              }
              h={
                mode === "rectangle"
                  ? Number(h)
                  : undefined
              }
              fr={result.fr}
              mode={mode}
              direction={direction}
              reinforcementMode={result.reinforcementMode}
              neutralAxisFromTop={
                result.neutralAxisFromTop
              }
              tensionSteelY={result.tensionSteelY}
              compressionSteelY={result.compressionSteelY}
            />

            <div className="mt-4">
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
          </div>
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