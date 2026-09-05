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
  const [dPrime, setDPrime] = useState("60");
  const [compressionBarDiameter, setCompressionBarDiameter] = useState(20);
  const [result, setResult] = useState<FlexuralBeamResult | null>(null);
  const [steps, setSteps] = useState<SolutionStep[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [inputError, setInputError] = useState("");

  function handleCalculate() {
    const parsed = {
      Mu: parseFloat(Mu),
      b: parseFloat(b),
      d: parseFloat(d),
      fc: parseFloat(fc),
      fy: parseFloat(fy),
      barDiameter,
      dPrime: parseFloat(dPrime),
      compressionBarDiameter,
    };

    if (Object.values(parsed).some((value) => !Number.isFinite(value) || value <= 0)) {
      setInputError("Enter a positive number in every field.");
      setResult(null);
      setSteps([]);
      return;
    }

    if (parsed.dPrime >= parsed.d) {
      setInputError("d′ must be smaller than d.");
      setResult(null);
      setSteps([]);
      return;
    }

    setInputError("");
    const computed = designSinglyReinforcedBeam(parsed);
    setResult(computed);
    setSteps(getSolutionSteps(parsed, computed));
    setShowSolution(false);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto min-w-0 max-w-6xl">
        <h1 className="text-2xl font-bold">Flexural Beam Design</h1>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
          Singly or doubly reinforced rectangular beam — NSCP 2015 strength design method.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <Field label="Mu — factored moment (kN·m)" value={Mu} onChange={setMu} />
          <Field label="b — width (mm)" value={b} onChange={setB} />
          <Field label="d — effective depth (mm)" value={d} onChange={setD} />
          <Field label="f'c (MPa)" value={fc} onChange={setFc} />
          <Field label="fy (MPa)" value={fy} onChange={setFy} />

          <BarSelect
            label="Tension bar diameter (mm)"
            value={barDiameter}
            onChange={setBarDiameter}
          />

          <div className="col-span-full mt-1 border-t border-[var(--border)] pt-3">
            <p className="text-[10px] font-semibold text-[var(--text)]">
              Doubly reinforced inputs
            </p>
            <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">
              These values are used only when the singly reinforced limit is exceeded.
            </p>
          </div>

          <Field label="d′ — compression steel depth (mm)" value={dPrime} onChange={setDPrime} />
          <BarSelect
            label="Compression bar diameter (mm)"
            value={compressionBarDiameter}
            onChange={setCompressionBarDiameter}
          />
        </div>

        {inputError && (
          <div className="mt-3 rounded-md bg-[#e05353]/15 px-3 py-2 text-[11px] font-semibold text-[#e05353]">
            {inputError}
          </div>
        )}

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

            <BeamCrossSection
              b={parseFloat(b)}
              d={parseFloat(d)}
              barDiameter={barDiameter}
              barsRequired={result.barsRequired}
              clearSpacing={result.clearSpacing}
              spacingOk={result.spacingOk}
              tensionBarsPerLayer={result.tensionBarsPerLayer}
              dPrime={result.dPrime}
              compressionBarDiameter={compressionBarDiameter}
              compressionBarsRequired={result.compressionBarsRequired}
              compressionBarsPerLayer={result.compressionBarsPerLayer}
            />

            <div className="mt-4">
              <ResultRow
                label="Section type"
                value={result.sectionType === "doubly" ? "Doubly reinforced" : "Singly reinforced"}
                bold
              />
              <ResultRow label="Rn (required)" value={`${result.Rn.toFixed(3)} MPa`} />
              <ResultRow label="β1" value={result.beta1.toFixed(3)} />
              <ResultRow
                label="ρ required"
                value={Number.isFinite(result.rhoRequired) ? result.rhoRequired.toFixed(5) : "Beyond singly limit"}
              />
              <ResultRow label="ρmin" value={result.rhoMin.toFixed(5)} />
              <ResultRow label="ρmax" value={result.rhoMax.toFixed(5)} />
              <ResultRow
                label="As required by singly equation"
                value={Number.isFinite(result.asRequired) ? `${result.asRequired.toFixed(0)} mm²` : "Beyond singly limit"}
              />
              <ResultRow label="As,min" value={`${result.asMin.toFixed(0)} mm²`} />
              <ResultRow label="As,max" value={`${result.asMax.toFixed(0)} mm²`} />

              {result.sectionType === "singly" ? (
                <>
                  <ResultRow label="As final (governing)" value={`${result.asFinal.toFixed(0)} mm²`} bold />
                  <ResultRow label="Bars required" value={`${result.barsRequired} × ${barDiameter}mm`} bold />
                  <ResultRow
                    label="Bar arrangement"
                    value={`${result.tensionBarsPerLayer.join(" + ")} bar(s) — ${result.tensionBarLayers} layer(s)`}
                    bold
                  />
                </>
              ) : (
                <>
                  <ResultRow label="d′" value={`${result.dPrime?.toFixed(1)} mm`} />
                  <ResultRow label="a" value={`${result.a?.toFixed(2)} mm`} />
                  <ResultRow label="c" value={`${result.c?.toFixed(2)} mm`} />
                  <ResultRow label="As1 — singly portion" value={`${result.asSinglyPortion?.toFixed(0)} mm²`} />
                  <ResultRow label="φMn1" value={`${((result.mnSingly ?? 0) * 0.9).toFixed(2)} kN·m`} />
                  <ResultRow label="Mu2 — remaining moment" value={`${result.muRemaining?.toFixed(2)} kN·m`} />
                  <ResultRow label="ε′s" value={result.epsilonSPrime?.toFixed(6) ?? "N/A"} />
                  <ResultRow label="f′s" value={`${result.fsPrime?.toFixed(2) ?? "N/A"} MPa`} />
                  <ResultRow
                    label="Compression steel yielding"
                    value={result.compressionSteelYields === null ? "N/A" : result.compressionSteelYields ? "YES" : "NO"}
                    bold
                  />
                  <ResultRow label="As2 — additional tension steel" value={result.asAdditionalTension === null ? "N/A" : `${result.asAdditionalTension.toFixed(0)} mm²`} />
                  <ResultRow label="As — total tension steel" value={`${result.asFinal.toFixed(0)} mm²`} bold />
                  <ResultRow label="A′s — compression steel" value={result.asCompression === null ? "N/A" : `${result.asCompression.toFixed(0)} mm²`} bold />
                  <ResultRow label="Tension bars required" value={`${result.barsRequired} × ${barDiameter}mm`} bold />
                  <ResultRow
                    label="Tension-bar arrangement"
                    value={`${result.tensionBarsPerLayer.join(" + ")} bar(s) — ${result.tensionBarLayers} layer(s)`}
                    bold
                  />
                  <ResultRow label="Compression bars required" value={result.compressionBarsRequired > 0 ? `${result.compressionBarsRequired} × ${compressionBarDiameter}mm` : "N/A"} bold />
                  {result.compressionBarsRequired > 0 && (
                    <ResultRow
                      label="Compression-bar arrangement"
                      value={`${result.compressionBarsPerLayer.join(" + ")} bar(s) — ${result.compressionBarLayers} layer(s)`}
                      bold
                    />
                  )}
                </>
              )}

              {result.spacingOk !== null && (
                <ResultRow
                  label="Tension-bar spacing (NSCP 2015 §25.2.1)"
                  value={
                    result.clearSpacing !== null
                      ? `${result.clearSpacing.toFixed(1)} mm ${result.spacingOk ? "≥" : "<"} ${result.minClearSpacingRequired.toFixed(0)} mm req'd — ${result.spacingOk ? "OK" : "NOT OK"}`
                      : result.tensionBarLayers === 2
                        ? `${result.tensionVerticalClearSpacing?.toFixed(0)} mm vertical — OK`
                        : "N/A"
                  }
                  bold
                />
              )}

              {result.sectionType === "doubly" && result.compressionSpacingOk !== null && (
                <ResultRow
                  label="Compression-bar spacing"
                  value={
                    result.compressionClearSpacing !== null
                      ? `${result.compressionClearSpacing.toFixed(1)} mm — ${result.compressionSpacingOk ? "OK" : "NOT OK"}`
                      : result.compressionBarLayers === 2
                        ? `${result.compressionVerticalClearSpacing?.toFixed(0)} mm vertical — OK`
                        : "N/A"
                  }
                  bold
                />
              )}
            </div>
          </div>
        )}

        {result && (result.spacingOk === false || result.compressionSpacingOk === false) && (
          <div className="mt-3 space-y-1 rounded-md bg-[#e05353]/15 px-3 py-2 text-[11px] font-semibold text-[#e05353]">
            {result.spacingOk === false && <p>Tension bars: {result.spacingMessage}</p>}
            {result.compressionSpacingOk === false && <p>Compression bars: {result.compressionSpacingMessage}</p>}
          </div>
        )}

        {result && steps.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowSolution((shown) => !shown)}
              className="text-[11px] font-semibold text-[#f5941f] underline"
            >
              {showSolution ? "Hide full solution" : "Show full solution"}
            </button>

            {showSolution && (
              <div className="mt-3 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
                {steps.map((step, index) => (
                  <div key={index} className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#f5941f] text-[10px] font-bold text-[#1a1300]">
                        {index + 1}
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
      <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
      />
    </div>
  );
}

function BarSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
      >
        {barSizes.map((size) => (
          <option key={size} value={size}>{size} mm</option>
        ))}
      </select>
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
