"use client";

import { useState } from "react";
import { InlineKatex } from "@/components/Katex";
import { LBeamCrossSection } from "@/components/LBeamCrossSection";
import {
  designLBeam,
  getLBeamSolutionSteps,
  type LBeamDesignResult,
  type LBeamSolutionStep,
} from "@/lib/l-beam";

const barSizes = [12, 16, 20, 25, 28, 32, 36];

export default function LBeamDesignPage() {
  const [Mu, setMu] = useState("400");
  const [bw, setBw] = useState("300");
  const [hf, setHf] = useState("120");
  const [d, setD] = useState("550");
  const [span, setSpan] = useState("6000");
  const [beamSpacing, setBeamSpacing] = useState("3000");
  const [fc, setFc] = useState("28");
  const [fy, setFy] = useState("420");
  const [barDiameter, setBarDiameter] = useState(25);
  const [result, setResult] = useState<LBeamDesignResult | null>(null);
  const [steps, setSteps] = useState<LBeamSolutionStep[]>([]);
  const [error, setError] = useState("");
  const [showSolution, setShowSolution] = useState(false);

  function handleCalculate() {
    const parsed = {
      Mu: Number(Mu),
      bw: Number(bw),
      hf: Number(hf),
      d: Number(d),
      span: Number(span),
      beamSpacing: Number(beamSpacing),
      fc: Number(fc),
      fy: Number(fy),
      barDiameter,
    };

    if (
      Object.values(parsed).some(
        (value) => !Number.isFinite(value) || value <= 0
      )
    ) {
      setError("Enter a valid positive number in every input field.");
      setResult(null);
      setSteps([]);
      return;
    }

    try {
      const computed = designLBeam(parsed);
      setResult(computed);
      setSteps(getLBeamSolutionSteps(parsed, computed));
      setError("");
      setShowSolution(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to calculate the L-beam design."
      );
      setResult(null);
      setSteps([]);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-3 py-8 text-[var(--text)] sm:px-5 sm:py-10">
      <div className="mx-auto min-w-0 max-w-6xl">
        <h1 className="text-2xl font-bold">L-Beam Design</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
          Singly reinforced edge L-beam under positive bending — NSCP 2015 and
          ACI 318-14 strength design method.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5 sm:grid-cols-2">
          <Field label="Mu — factored moment (kN·m)" value={Mu} onChange={setMu} />
          <Field label="bw — web width (mm)" value={bw} onChange={setBw} />
          <Field label="hf — flange thickness (mm)" value={hf} onChange={setHf} />
          <Field label="d — effective depth (mm)" value={d} onChange={setD} />
          <Field label="L — effective span (mm)" value={span} onChange={setSpan} />
          <Field
            label="s — adjacent beam spacing, c/c (mm)"
            value={beamSpacing}
            onChange={setBeamSpacing}
          />
          <Field label="f'c (MPa)" value={fc} onChange={setFc} />
          <Field label="fy (MPa)" value={fy} onChange={setFy} />

          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
              Tension-bar diameter (mm)
            </label>
            <select
              value={barDiameter}
              onChange={(event) => setBarDiameter(Number(event.target.value))}
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

        <p className="mt-2 text-[9px] leading-relaxed text-[var(--text-muted)]">
          This calculator treats the member as a monolithic edge L-beam with
          slab flange on one side. The one-sided effective overhang is limited
          by L/12, 6hf, and half the clear distance to the adjacent web.
        </p>

        <button
          type="button"
          onClick={handleCalculate}
          className="mt-4 w-full rounded-md bg-[#f5941f] px-4 py-2.5 text-[12px] font-semibold text-[#1a1300] hover:brightness-105 active:scale-[0.99]"
        >
          Calculate L-Beam Design
        </button>

        {error && (
          <div className="mt-3 rounded-md bg-[#e05353]/15 px-3 py-2 text-[11px] font-semibold text-[#e05353]">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
            <div
              className={`mb-3 rounded-md px-3 py-2 text-[11px] font-semibold ${
                result.ok
                  ? "bg-[#39c98a]/15 text-[#39c98a]"
                  : "bg-[#f5941f]/15 text-[#f5941f]"
              }`}
            >
              {result.message}
            </div>

            <LBeamCrossSection
              beff={result.beff}
              effectiveOverhang={result.effectiveOverhang}
              bw={Number(bw)}
              hf={Number(hf)}
              d={Number(d)}
              a={result.a}
              barDiameter={barDiameter}
              barsRequired={result.barsRequired}
              barsPerLayer={result.barsPerLayer}
              sectionCase={result.sectionCase}
            />

            <div className="mt-4">
              <ResultRow label="Design status" value={result.designStatus} bold />
              <ResultRow
                label="Effective one-sided overhang, bo"
                value={`${result.effectiveOverhang.toFixed(0)} mm`}
              />
              <ResultRow
                label="Effective flange width, bf"
                value={`${result.beff.toFixed(0)} mm`}
                bold
              />
              <ResultRow
                label="bo limit — L/12"
                value={`${result.overhangLimitSpan.toFixed(0)} mm`}
              />
              <ResultRow
                label="bo limit — 6hf"
                value={`${result.overhangLimitThickness.toFixed(0)} mm`}
              />
              <ResultRow
                label="bo limit — (s − bw)/2"
                value={`${result.overhangLimitSpacing.toFixed(0)} mm`}
              />
              <ResultRow label="β1" value={result.beta1.toFixed(3)} />
              <ResultRow
                label="Compression-block case"
                value={
                  result.sectionCase === "flange"
                    ? "a ≤ hf — within flange"
                    : "a > hf — flange and web"
                }
                bold
              />
              <ResultRow label="a" value={`${result.a.toFixed(2)} mm`} />
              <ResultRow label="c" value={`${result.c.toFixed(2)} mm`} />
              <ResultRow
                label="As calculated"
                value={`${result.asCalculated.toFixed(0)} mm²`}
              />
              <ResultRow label="As,min" value={`${result.asMin.toFixed(0)} mm²`} />
              <ResultRow
                label="As required"
                value={`${result.asRequired.toFixed(0)} mm²`}
                bold
              />
              <ResultRow
                label="Bars provided"
                value={`${result.barsRequired} × ${barDiameter}mm`}
                bold
              />
              <ResultRow
                label="Bar arrangement"
                value={`${result.barsPerLayer} bars maximum per layer × ${result.numberOfLayers} layer${
                  result.numberOfLayers === 1 ? "" : "s"
                }`}
              />
              <ResultRow
                label="As provided"
                value={`${result.asProvided.toFixed(0)} mm²`}
              />
              <ResultRow
                label="Tension strain, εt"
                value={result.epsilonT.toFixed(5)}
              />
              <ResultRow label="ϕ" value={result.phi.toFixed(3)} />
              <ResultRow label="Mn" value={`${result.Mn.toFixed(2)} kN·m`} />
              <ResultRow
                label="ϕMn"
                value={`${result.phiMn.toFixed(2)} kN·m`}
                bold
              />
              <ResultRow
                label="Strength check"
                value={`${result.phiMn.toFixed(2)} ${
                  result.phiMn >= Number(Mu) ? "≥" : "<"
                } ${Number(Mu).toFixed(2)} kN·m`}
                bold
              />
              <ResultRow
                label="Clear bar spacing"
                value={
                  result.clearSpacing === null
                    ? `One bar per layer — ${result.spacingOk ? "OK" : "NOT OK"}`
                    : `${result.clearSpacing.toFixed(1)} mm — ${
                        result.spacingOk ? "OK" : "NOT OK"
                      }`
                }
                bold
              />
            </div>
          </div>
        )}

        {result && !result.spacingOk && (
          <div className="mt-3 rounded-md bg-[#e05353]/15 px-3 py-2 text-[11px] font-semibold text-[#e05353]">
            {result.spacingMessage}
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
          Educational design aid only. Verify final dimensions, detailing,
          cover, reinforcement arrangement, shear, serviceability, development
          length, and project-specific requirements using the official NSCP
          2015 and ACI 318-14 publications.
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
