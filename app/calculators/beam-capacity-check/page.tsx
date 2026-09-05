"use client";

import { useState } from "react";
import { InlineKatex } from "@/components/Katex";
import { StrainStressDiagram } from "@/components/StrainStressDiagram";
import {
  checkBeamCapacity,
  getBeamCapacitySolutionSteps,
  type BeamCapacityResult,
  type BeamCapacitySolutionStep,
} from "@/lib/beam-capacity";

const barSizes = [12, 16, 20, 25, 28, 32];
const stirrupSizes = [10, 12, 16];
type LayerCount = 1 | 2;

interface LayerSpacingCheck {
  barsPerLayer: number[];
  clearSpacing: number | null;
  verticalClearSpacing: number | null;
  minRequired: number;
  ok: boolean | null;
}

function splitBars(totalBars: number, layers: LayerCount): number[] {
  if (layers === 1) return [totalBars];
  return [Math.ceil(totalBars / 2), Math.floor(totalBars / 2)];
}

function calculateLayerSpacing(
  width: number,
  cover: number,
  stirrupDiameter: number,
  barDiameter: number,
  totalBars: number,
  layers: LayerCount
): LayerSpacingCheck {
  const barsPerLayer = splitBars(totalBars, layers);
  const largestRow = Math.max(...barsPerLayer);
  const minRequired = Math.max(barDiameter, 25);
  const insideWidth = width - 2 * (cover + stirrupDiameter);
  const clearSpacing =
    largestRow > 1
      ? (insideWidth - largestRow * barDiameter) / (largestRow - 1)
      : null;
  const verticalClearSpacing = layers === 2 ? minRequired : null;
  const horizontalOk =
    clearSpacing === null ? insideWidth >= barDiameter : clearSpacing >= minRequired;
  const ok = horizontalOk && (verticalClearSpacing === null || verticalClearSpacing >= minRequired);

  return {
    barsPerLayer,
    clearSpacing,
    verticalClearSpacing,
    minRequired,
    ok,
  };
}

function tensionSteelCentroidDepth(
  overallDepth: number,
  cover: number,
  stirrupDiameter: number,
  barDiameter: number,
  barsPerLayer: number[]
): number {
  const bottomRowDepth =
    overallDepth - cover - stirrupDiameter - barDiameter / 2;
  if (barsPerLayer.length === 1) return bottomRowDepth;

  const rowDistance = barDiameter + Math.max(barDiameter, 25);
  const upperRowDepth = bottomRowDepth - rowDistance;
  const totalBars = barsPerLayer[0] + barsPerLayer[1];
  return (
    (barsPerLayer[0] * bottomRowDepth +
      barsPerLayer[1] * upperRowDepth) /
    totalBars
  );
}

function compressionSteelCentroidDepth(
  cover: number,
  stirrupDiameter: number,
  barDiameter: number,
  barsPerLayer: number[]
): number {
  const topRowDepth = cover + stirrupDiameter + barDiameter / 2;
  if (barsPerLayer.length === 1) return topRowDepth;

  const rowDistance = barDiameter + Math.max(barDiameter, 25);
  const lowerRowDepth = topRowDepth + rowDistance;
  const totalBars = barsPerLayer[0] + barsPerLayer[1];
  return (
    (barsPerLayer[0] * topRowDepth +
      barsPerLayer[1] * lowerRowDepth) /
    totalBars
  );
}

function formatLayerSpacing(check: LayerSpacingCheck): string {
  const values: string[] = [];

  if (check.clearSpacing !== null) {
    values.push(`${check.clearSpacing.toFixed(1)} mm horizontal`);
  }
  if (check.verticalClearSpacing !== null) {
    values.push(`${check.verticalClearSpacing.toFixed(0)} mm vertical`);
  }

  if (values.length === 0) {
    return check.ok === false ? "NOT OK" : "N/A";
  }

  return `${values.join("; ")} — ${check.ok ? "OK" : "NOT OK"}`;
}

export default function BeamCapacityCheckPage() {
  const [b, setB] = useState("300");
  const [fc, setFc] = useState("28");
  const [fy, setFy] = useState("420");
  const [Mu, setMu] = useState("");

  const [depthMode, setDepthMode] = useState<"direct" | "fromH">("direct");
  const [d, setD] = useState("450");
  const [dPrime, setDPrime] = useState("60");
  const [h, setH] = useState("500");
  const [clearCover, setClearCover] = useState("40");
  const [stirrupDiameter, setStirrupDiameter] = useState(10);

  const [barDiameter, setBarDiameter] = useState(20);
  const [numBars, setNumBars] = useState("5");
  const [tensionLayers, setTensionLayers] = useState<LayerCount>(1);

  const [isDoubly, setIsDoubly] = useState(false);
  const [barDiameterPrime, setBarDiameterPrime] = useState(16);
  const [numBarsPrime, setNumBarsPrime] = useState("2");
  const [compressionLayers, setCompressionLayers] = useState<LayerCount>(1);

  const [result, setResult] = useState<BeamCapacityResult | null>(null);
  const [steps, setSteps] = useState<BeamCapacitySolutionStep[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [computedDepths, setComputedDepths] = useState<{ d: number; dPrime: number } | null>(null);
  const [spacingCheck, setSpacingCheck] = useState<LayerSpacingCheck | null>(null);
  const [compressionSpacingCheck, setCompressionSpacingCheck] = useState<LayerSpacingCheck | null>(null);
  const [inputError, setInputError] = useState("");

  function handleCalculate() {
    const bVal = parseFloat(b);
    const fcVal = parseFloat(fc);
    const fyVal = parseFloat(fy);
    const MuVal = Mu.trim() === "" ? null : parseFloat(Mu);
    const nBars = parseInt(numBars, 10);

    if (
      [bVal, fcVal, fyVal, nBars].some((v) => isNaN(v) || v <= 0) ||
      (MuVal !== null && (isNaN(MuVal) || MuVal <= 0))
    ) {
      setInputError("Enter positive values. Mu may be left blank.");
      setResult(null);
      setSteps([]);
      setComputedDepths(null);
      return;
    }

    if (tensionLayers === 2 && nBars < 2) {
      setInputError("Two tension-steel layers require at least 2 bars.");
      setResult(null);
      setSteps([]);
      setComputedDepths(null);
      return;
    }

    const As = nBars * (Math.PI / 4) * barDiameter * barDiameter;

    let As_prime = 0;
    if (isDoubly) {
      const nBarsPrime = parseInt(numBarsPrime, 10);
      if (isNaN(nBarsPrime) || nBarsPrime <= 0) {
        setInputError("Enter a valid number of compression bars.");
        setResult(null);
        setSteps([]);
        setComputedDepths(null);
        return;
      }
      if (compressionLayers === 2 && nBarsPrime < 2) {
        setInputError("Two compression-steel layers require at least 2 bars.");
        setResult(null);
        setSteps([]);
        setComputedDepths(null);
        return;
      }
      As_prime = nBarsPrime * (Math.PI / 4) * barDiameterPrime * barDiameterPrime;
    }

    let dVal: number;
    let dPrimeVal: number;

    if (depthMode === "direct") {
      dVal = parseFloat(d);
      dPrimeVal = isDoubly ? parseFloat(dPrime) : 0;
      if (isNaN(dVal) || dVal <= 0 || (isDoubly && (isNaN(dPrimeVal) || dPrimeVal <= 0))) {
        setInputError("Enter valid effective depths.");
        setResult(null);
        setSteps([]);
        setComputedDepths(null);
        return;
      }
    } else {
      const hVal = parseFloat(h);
      const ccVal = parseFloat(clearCover);
      if ([hVal, ccVal].some((v) => isNaN(v) || v <= 0)) {
        setInputError("Enter valid values for h and clear cover.");
        setResult(null);
        setSteps([]);
        setComputedDepths(null);
        return;
      }
      const tensionBarsPerLayer = splitBars(nBars, tensionLayers);
      dVal = tensionSteelCentroidDepth(
        hVal,
        ccVal,
        stirrupDiameter,
        barDiameter,
        tensionBarsPerLayer
      );
      dPrimeVal = isDoubly
        ? compressionSteelCentroidDepth(
            ccVal,
            stirrupDiameter,
            barDiameterPrime,
            splitBars(parseInt(numBarsPrime, 10), compressionLayers)
          )
        : 0;
      if (dVal <= 0 || (isDoubly && dPrimeVal >= dVal)) {
        setInputError("The selected layers do not fit within the entered overall depth.");
        setResult(null);
        setSteps([]);
        setComputedDepths(null);
        return;
      }
    }

    setInputError("");

    const parsed = {
      b: bVal,
      d: dVal,
      dPrime: dPrimeVal,
      fc: fcVal,
      fy: fyVal,
      As,
      AsPrime: As_prime,
      Mu: MuVal,
    };

    const computed = checkBeamCapacity(parsed);
    setResult(computed);
    setSteps(getBeamCapacitySolutionSteps(parsed, computed));
    setComputedDepths(depthMode === "fromH" ? { d: dVal, dPrime: dPrimeVal } : null);

    const cover = depthMode === "fromH" ? parseFloat(clearCover) : 40;
    const stirrup = depthMode === "fromH" ? stirrupDiameter : 10;
    setSpacingCheck(
      calculateLayerSpacing(
        bVal,
        cover,
        stirrup,
        barDiameter,
        nBars,
        tensionLayers
      )
    );

    if (isDoubly) {
      setCompressionSpacingCheck(
        calculateLayerSpacing(
          bVal,
          cover,
          stirrup,
          barDiameterPrime,
          parseInt(numBarsPrime, 10),
          compressionLayers
        )
      );
    } else {
      setCompressionSpacingCheck(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto min-w-0 max-w-6xl">
        <h1 className="text-2xl font-bold">Beam Capacity Check</h1>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
          Analysis of an existing RC beam section — singly or doubly reinforced, NSCP 2015 / ACI 318.
        </p>

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-[var(--text)]">
            <input
              type="checkbox"
              checked={isDoubly}
              onChange={(e) => setIsDoubly(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Doubly reinforced (has compression steel, As&apos;)
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="b — width (mm)" value={b} onChange={setB} />
            <Field label="f'c (MPa)" value={fc} onChange={setFc} />
            <Field label="fy (MPa)" value={fy} onChange={setFy} />
            <Field label="Mu — applied factored moment (kN·m), optional" value={Mu} onChange={setMu} />
          </div>

          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <label className="mb-2 block text-[10px] font-medium text-[var(--text-muted)]">
              Effective depth
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDepthMode("direct")}
                className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] font-semibold ${
                  depthMode === "direct"
                    ? "border-[#f5941f] bg-[#f5941f]/15 text-[#f5941f]"
                    : "border-[var(--border)] text-[var(--text-muted)]"
                }`}
              >
                Enter d directly
              </button>
              <button
                type="button"
                onClick={() => setDepthMode("fromH")}
                className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] font-semibold ${
                  depthMode === "fromH"
                    ? "border-[#f5941f] bg-[#f5941f]/15 text-[#f5941f]"
                    : "border-[var(--border)] text-[var(--text-muted)]"
                }`}
              >
                Compute d from h
              </button>
            </div>

            {depthMode === "direct" ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="d — effective depth (mm)" value={d} onChange={setD} />
                {isDoubly && (
                  <Field label="d' — depth to compression steel (mm)" value={dPrime} onChange={setDPrime} />
                )}
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="h — overall depth (mm)" value={h} onChange={setH} />
                <Field label="CC — clear cover (mm)" value={clearCover} onChange={setClearCover} />
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
                      <option key={size} value={size}>{size} mm</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <label className="mb-2 block text-[10px] font-medium text-[var(--text-muted)]">
              Tension steel (bottom bars)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Number of bars" value={numBars} onChange={setNumBars} />
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
                    <option key={size} value={size}>{size} mm</option>
                  ))}
                </select>
              </div>
              <LayerSelect
                label="Tension steel layers"
                value={tensionLayers}
                onChange={setTensionLayers}
              />
            </div>
          </div>

          {isDoubly && (
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <label className="mb-2 block text-[10px] font-medium text-[var(--text-muted)]">
                Compression steel (top bars)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Number of bars" value={numBarsPrime} onChange={setNumBarsPrime} />
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
                    Bar diameter (mm)
                  </label>
                  <select
                    value={barDiameterPrime}
                    onChange={(e) => setBarDiameterPrime(Number(e.target.value))}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
                  >
                    {barSizes.map((size) => (
                      <option key={size} value={size}>{size} mm</option>
                    ))}
                  </select>
                </div>
                <LayerSelect
                  label="Compression steel layers"
                  value={compressionLayers}
                  onChange={setCompressionLayers}
                />
              </div>
            </div>
          )}
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
                result.ok !== false && result.ductilityClass !== "compression-controlled"
                  ? "bg-[#39c98a]/15 text-[#39c98a]"
                  : "bg-[#e05353]/15 text-[#e05353]"
              }`}
            >
              {result.message}
            </div>

            <div className="min-w-0 w-full">
              <StrainStressDiagram
                b={parseFloat(b)}
                d={computedDepths ? computedDepths.d : parseFloat(d)}
                c={result.c}
                a={result.a}
                fc={parseFloat(fc)}
                fy={parseFloat(fy)}
                isDoublyReinforced={isDoubly}
                dPrime={computedDepths ? computedDepths.dPrime : parseFloat(dPrime)}
                compressionSteelYields={result.compressionSteelYields}
                fsPrime={result.fsPrime}
                As={parseInt(numBars, 10) * (Math.PI / 4) * barDiameter * barDiameter}
                AsPrime={isDoubly ? parseInt(numBarsPrime, 10) * (Math.PI / 4) * barDiameterPrime * barDiameterPrime : 0}
                numBars={parseInt(numBars, 10)}
                numBarsPrime={isDoubly ? parseInt(numBarsPrime, 10) : 0}
                tensionBarsPerLayer={splitBars(parseInt(numBars, 10), tensionLayers)}
                compressionBarsPerLayer={
                  isDoubly
                    ? splitBars(parseInt(numBarsPrime, 10), compressionLayers)
                    : []
                }
              />
            </div>

            <div className="mt-4">

            {computedDepths && (
              <>
                <ResultRow label="d (computed from h)" value={`${computedDepths.d.toFixed(1)} mm`} />
                {isDoubly && (
                  <ResultRow label="d' (computed from CC)" value={`${computedDepths.dPrime.toFixed(1)} mm`} />
                )}
              </>
            )}

            <ResultRow label="Section type" value={result.isDoublyReinforced ? "Doubly reinforced" : "Singly reinforced"} />
            <ResultRow label="As (tension steel)" value={`${(parseInt(numBars, 10) * (Math.PI / 4) * barDiameter * barDiameter).toFixed(0)} mm² (${numBars} × ${barDiameter}mm)`} />
            <ResultRow
              label="Tension-bar arrangement"
              value={`${splitBars(parseInt(numBars, 10), tensionLayers).join(" + ")} bar(s) — ${tensionLayers} layer(s)`}
            />
            {isDoubly && (
              <ResultRow
                label="As' (compression steel)"
                value={`${(parseInt(numBarsPrime, 10) * (Math.PI / 4) * barDiameterPrime * barDiameterPrime).toFixed(0)} mm² (${numBarsPrime} × ${barDiameterPrime}mm)`}
              />
            )}
            {isDoubly && (
              <ResultRow
                label="Compression-bar arrangement"
                value={`${splitBars(parseInt(numBarsPrime, 10), compressionLayers).join(" + ")} bar(s) — ${compressionLayers} layer(s)`}
              />
            )}
            <ResultRow label="a (stress block depth)" value={`${result.a.toFixed(1)} mm`} />
            <ResultRow label="c (neutral axis)" value={`${result.c.toFixed(1)} mm`} />
            {result.isDoublyReinforced && (
              <ResultRow
                label="Compression steel"
                value={result.compressionSteelYields ? `Yields (εs' = ${result.epsilonSPrime?.toFixed(5)}, fs' = fy)` : `Does not yield (εs' = ${result.epsilonSPrime?.toFixed(5)}, fs' = ${result.fsPrime?.toFixed(1)} MPa)`}
              />
            )}
            <ResultRow label="εt (tension strain)" value={result.epsilonT.toFixed(5)} />
            <ResultRow label="Bottom tension steel" value={`${result.tensionSteelYields ? "Yields" : "Does not yield (elastic)"} — fs = ${result.tensionStress.toFixed(1)} MPa`} />
            <ResultRow label="ρmin / ρ / ρmax" value={`${result.rhoMin.toFixed(5)} / ${result.rho.toFixed(5)} / ${result.rhoMax.toFixed(5)} — ${result.rhoAdequate ? "PASS" : "FAIL"}`} />
            <ResultRow label="Ductility class" value={result.ductilityClass.replace("-", " ")} />
            <ResultRow label="φ" value={result.phi.toFixed(3)} />
            <ResultRow label="Mn (nominal capacity)" value={`${result.Mn.toFixed(2)} kN·m`} />
            <ResultRow label="φMn (design capacity)" value={`${result.phiMn.toFixed(2)} kN·m`} bold />
            {result.Mu !== null && result.utilizationRatio !== null && (
              <>
                <ResultRow label="Mu (applied)" value={`${result.Mu.toFixed(2)} kN·m`} />
                <ResultRow
                  label="Utilization (Mu / φMn)"
                  value={`${(result.utilizationRatio * 100).toFixed(0)}%`}
                  bold
                />
              </>
            )}
            {result.Mu === null && (
              <ResultRow label="Adequacy check" value="Not performed — Mu was not provided" />
            )}
            {spacingCheck && (
              <ResultRow
                label="Tension-bar spacing"
                value={formatLayerSpacing(spacingCheck)}
                bold
              />
            )}
            {compressionSpacingCheck && (
              <ResultRow
                label="Compression-bar spacing"
                value={formatLayerSpacing(compressionSpacingCheck)}
                bold
              />
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

function LayerSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: LayerCount;
  onChange: (value: LayerCount) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value) as LayerCount)}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
      >
        <option value={1}>1 layer</option>
        <option value={2}>2 layers</option>
      </select>
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
