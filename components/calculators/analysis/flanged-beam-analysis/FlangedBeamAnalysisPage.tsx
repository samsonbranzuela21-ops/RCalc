"use client";

import { useState } from "react";
import { InlineKatex } from "@/components/shared/Katex";
import { LBeamCrossSection } from "@/components/calculators/flexural-design/l-beam-design/LBeamCrossSection";
import { TBeamCrossSection } from "@/components/calculators/flexural-design/t-beam-design/TBeamCrossSection";
import {
  analyzeFlangedBeam,
  getFlangedBeamAnalysisSteps,
  type FlangedBeamAnalysisResult,
  type FlangedBeamAnalysisStep,
  type FlangedBeamShape,
} from "@/lib/flanged-beam-analysis";

const barSizes = [12, 16, 20, 25, 28, 32, 36];

export default function FlangedBeamAnalysisPage({ shape }: { shape: FlangedBeamShape }) {
  const [bw, setBw] = useState("300");
  const [hf, setHf] = useState("120");
  const [d, setD] = useState("550");
  const [span, setSpan] = useState("6000");
  const [beamSpacing, setBeamSpacing] = useState("3000");
  const [fc, setFc] = useState("28");
  const [fy, setFy] = useState("420");
  const [barCount, setBarCount] = useState("4");
  const [barDiameter, setBarDiameter] = useState(25);
  const [Mu, setMu] = useState("");
  const [result, setResult] = useState<FlangedBeamAnalysisResult | null>(null);
  const [steps, setSteps] = useState<FlangedBeamAnalysisStep[]>([]);
  const [error, setError] = useState("");
  const [showSolution, setShowSolution] = useState(false);

  const title = `${shape}-Beam Analysis`;

  function handleCalculate() {
    const parsed = {
      shape,
      bw: Number(bw),
      hf: Number(hf),
      d: Number(d),
      span: Number(span),
      beamSpacing: Number(beamSpacing),
      fc: Number(fc),
      fy: Number(fy),
      barCount: Number(barCount),
      barDiameter,
      Mu: Mu.trim() === "" ? null : Number(Mu),
    };

    try {
      const computed = analyzeFlangedBeam(parsed);
      setResult(computed);
      setSteps(getFlangedBeamAnalysisSteps(parsed, computed));
      setError("");
      setShowSolution(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : `Unable to calculate the ${shape}-beam analysis.`);
      setResult(null);
      setSteps([]);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-3 py-8 text-[var(--text)] sm:px-5 sm:py-10">
      <div className="mx-auto min-w-0 max-w-6xl">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
          Flexural capacity analysis of an existing singly reinforced {shape}-beam under positive bending.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:grid-cols-2 sm:p-5">
          <Field label="bw — web width (mm)" value={bw} onChange={setBw} />
          <Field label="hf — flange thickness (mm)" value={hf} onChange={setHf} />
          <Field label="d — effective depth (mm)" value={d} onChange={setD} />
          <Field label="L — effective span (mm)" value={span} onChange={setSpan} />
          <Field label="s — beam spacing, c/c (mm)" value={beamSpacing} onChange={setBeamSpacing} />
          <Field label="f′c (MPa)" value={fc} onChange={setFc} />
          <Field label="fy (MPa)" value={fy} onChange={setFy} />
          <Field label="Number of tension bars" value={barCount} onChange={setBarCount} step="1" />
          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">Tension-bar diameter (mm)</label>
            <select
              value={barDiameter}
              onChange={(event) => setBarDiameter(Number(event.target.value))}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
            >
              {barSizes.map((size) => <option key={size} value={size}>{size} mm</option>)}
            </select>
          </div>
          <Field label="Mu — applied factored moment (kN·m), optional" value={Mu} onChange={setMu} />
        </div>

        <p className="mt-2 text-[9px] leading-relaxed text-[var(--text-muted)]">
          {shape === "T"
            ? "The effective flange width is the least of L/4, bw + 16hf, and the beam spacing."
            : "The effective one-sided flange overhang is the least of L/12, 6hf, and half the clear distance to the next web."}
        </p>

        <button
          type="button"
          onClick={handleCalculate}
          className="mt-4 w-full rounded-md bg-[#f5941f] px-4 py-2.5 text-[12px] font-semibold text-[#1a1300] hover:brightness-105 active:scale-[0.99]"
        >
          Calculate {title}
        </button>

        {error && <div className="mt-3 rounded-md bg-[#e05353]/15 px-3 py-2 text-[11px] font-semibold text-[#e05353]">{error}</div>}

        {result && (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
            <div className={`mb-3 rounded-md px-3 py-2 text-[11px] font-semibold ${result.status === "PASS" ? "bg-[#39c98a]/15 text-[#39c98a]" : result.status === "FAIL" ? "bg-[#e05353]/15 text-[#e05353]" : "bg-[#4d7cff]/15 text-[#4d7cff]"}`}>
              {result.message}
            </div>

            {shape === "T" ? (
              <TBeamCrossSection
                beff={result.beff}
                bw={Number(bw)}
                hf={Number(hf)}
                d={Number(d)}
                a={result.a}
                barDiameter={barDiameter}
                barsRequired={Number(barCount)}
                barsPerLayer={Math.min(Number(barCount), 4)}
                sectionCase={result.sectionCase}
              />
            ) : (
              <LBeamCrossSection
                beff={result.beff}
                effectiveOverhang={result.effectiveOverhang ?? 0}
                bw={Number(bw)}
                hf={Number(hf)}
                d={Number(d)}
                a={result.a}
                barDiameter={barDiameter}
                barsRequired={Number(barCount)}
                barsPerLayer={Math.min(Number(barCount), 4)}
                sectionCase={result.sectionCase}
              />
            )}

            <div className="mt-4">
              <ResultRow label="Analysis status" value={result.status} bold />
              <ResultRow label="Effective flange width, bf" value={`${result.beff.toFixed(2)} mm`} />
              {result.effectiveOverhang !== null && <ResultRow label="Effective overhang, bo" value={`${result.effectiveOverhang.toFixed(2)} mm`} />}
              <ResultRow label="Provided steel, As" value={`${result.As.toFixed(2)} mm²`} />
              <ResultRow label="β1" value={result.beta1.toFixed(3)} />
              <ResultRow label="Compression-block case" value={result.sectionCase === "flange" ? "a ≤ hf — within flange" : "a > hf — flange and web"} bold />
              <ResultRow label="Neutral-axis depth, c" value={`${result.c.toFixed(2)} mm`} />
              <ResultRow label="Stress-block depth, a" value={`${result.a.toFixed(2)} mm`} />
              <ResultRow label="Tension strain, εt" value={result.epsilonT.toFixed(6)} />
              <ResultRow label="Tension-steel stress, fs" value={`${result.tensionStress.toFixed(2)} MPa`} />
              <ResultRow label="Steel behavior" value={result.tensionSteelYields ? "Yielded" : "Elastic"} />
              <ResultRow label="ϕ" value={result.phi.toFixed(3)} />
              <ResultRow label="Mn" value={`${result.Mn.toFixed(2)} kN·m`} />
              <ResultRow label="ϕMn" value={`${result.phiMn.toFixed(2)} kN·m`} bold />
              {result.utilizationRatio !== null && <ResultRow label="Mu / ϕMn" value={result.utilizationRatio.toFixed(3)} bold />}
            </div>
          </div>
        )}

        {result && steps.length > 0 && (
          <div className="mt-3">
            <button type="button" onClick={() => setShowSolution((shown) => !shown)} className="text-[11px] font-semibold text-[#f5941f] underline">
              {showSolution ? "Hide full solution" : "Show full solution"}
            </button>
            {showSolution && (
              <div className="mt-3 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
                {steps.map((step, index) => (
                  <div key={`${step.label}-${index}`} className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f5941f] text-[10px] font-bold text-[#1a1300]">{index + 1}</span>
                      <p className="text-[11px] font-semibold">{step.label}</p>
                    </div>
                    <div className="mt-2 min-w-0 space-y-1.5 sm:pl-7">
                      <Equation math={step.formula} />
                      {step.substitution && <Equation math={step.substitution} muted />}
                      <Equation math={step.result} result />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-[9px] leading-relaxed text-[var(--text-muted)]">
          Positive-bending educational analysis aid. Verify geometry, reinforcement placement, shear, serviceability, development, and project requirements using the applicable code publications.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, step }: { label: string; value: string; onChange: (value: string) => void; step?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">{label}</label>
      <input type="number" min="0" step={step} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]" />
    </div>
  );
}

function ResultRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 border-b border-[var(--border)] py-1.5 text-[11px] last:border-b-0">
      <span className="min-w-0 text-[var(--text-muted)]">{label}</span>
      <span className={`min-w-0 text-right ${bold ? "font-bold" : ""}`}>{value}</span>
    </div>
  );
}

function Equation({ math, muted, result }: { math: string; muted?: boolean; result?: boolean }) {
  return (
    <div className={`max-w-full overflow-x-auto rounded px-2 py-1.5 ${result ? "bg-[#39c98a]/15 text-[#39c98a]" : muted ? "text-[var(--text-muted)]" : "bg-[var(--bg-surface)] text-[var(--text)]"}`}>
      <InlineKatex math={math} />
    </div>
  );
}
