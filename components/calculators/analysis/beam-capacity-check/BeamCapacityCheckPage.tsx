"use client";

import { useState, type ReactNode } from "react";
import { InlineKatex } from "@/components/shared/Katex";
import { StrainStressDiagram } from "@/components/calculators/analysis/beam-capacity-check/StrainStressDiagram";
import {
  checkBeamCapacity,
  getBeamCapacitySolutionSteps,
  type BeamCapacityResult,
  type BeamCapacitySolutionStep,
} from "@/lib/beam-capacity";

const stirrupSizes = [10, 12, 16];
type LayerCount = 1 | 2;

export interface BeamCapacityPrefill {
  b: number;
  h: number;
  clearCover: number;
  stirrupDiameter: number;
  fc: number;
  fy: number;
  Mu: number;
  tensionBarDiameter: number;
  tensionRows: number[];
  isDoubly: boolean;
  compressionBarDiameter: number;
  compressionRows: number[];
}

interface LayerSpacingCheck {
  barsPerLayer: number[];
  clearSpacing: number | null;
  verticalClearSpacing: number | null;
  minRequired: number;
  ok: boolean | null;
}

function calculateLayerSpacing(
  width: number,
  cover: number,
  stirrupDiameter: number,
  barDiameter: number,
  barsPerLayer: number[],
): LayerSpacingCheck {
  const largestRow = Math.max(...barsPerLayer);
  const minRequired = Math.max(barDiameter, 25);
  const insideWidth = width - 2 * (cover + stirrupDiameter);
  const clearSpacing =
    largestRow > 1
      ? (insideWidth - largestRow * barDiameter) / (largestRow - 1)
      : null;
  const verticalClearSpacing = barsPerLayer.length === 2 ? 25 : null;
  const horizontalOk =
    clearSpacing === null ? insideWidth >= barDiameter : clearSpacing >= minRequired;
  const ok = horizontalOk && (verticalClearSpacing === null || verticalClearSpacing >= 25);

  return {
    barsPerLayer,
    clearSpacing,
    verticalClearSpacing,
    minRequired,
    ok,
  };
}

function tensionSteelLayerDepths(
  overallDepth: number,
  cover: number,
  stirrupDiameter: number,
  barDiameter: number,
  barsPerLayer: number[]
): number[] {
  const bottomRowDepth =
    overallDepth - cover - stirrupDiameter - barDiameter / 2;
  if (barsPerLayer.length === 1) return [bottomRowDepth];

  const rowDistance = barDiameter + 25;
  const upperRowDepth = bottomRowDepth - rowDistance;
  return [bottomRowDepth, upperRowDepth];
}

function areaWeightedDepth(depths: number[], barsPerLayer: number[]): number {
  const totalBars = barsPerLayer.reduce((sum, count) => sum + count, 0);
  return depths.reduce((sum, depth, index) => sum + depth * barsPerLayer[index], 0) / totalBars;
}

function compressionSteelCentroidDepth(
  cover: number,
  stirrupDiameter: number,
  barDiameter: number,
  barsPerLayer: number[]
): number {
  const topRowDepth = cover + stirrupDiameter + barDiameter / 2;
  if (barsPerLayer.length === 1) return topRowDepth;

  const rowDistance = barDiameter + 25;
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

    return `${values.join("; ")} - ${check.ok ? "OK" : "NOT OK"}`;
}

export default function BeamCapacityCheckPage({ prefill }: { prefill?: BeamCapacityPrefill }) {
  const initialTensionRows = prefill?.tensionRows ?? [5];
  const initialCompressionRows = prefill?.compressionRows.length ? prefill.compressionRows : [2];
  const [b, setB] = useState(String(prefill?.b ?? 300));
  const [fc, setFc] = useState(String(prefill?.fc ?? 28));
  const [fy, setFy] = useState(String(prefill?.fy ?? 420));
  const [Mu, setMu] = useState(prefill ? String(prefill.Mu) : "");

  const [depthMode, setDepthMode] = useState<"direct" | "fromH">(prefill ? "fromH" : "direct");
  const [d, setD] = useState("450");
  const [d1, setD1] = useState("450");
  const [d2, setD2] = useState("405");
  const [dPrime, setDPrime] = useState("60");
  const [h, setH] = useState(String(prefill?.h ?? 500));
  const [clearCover, setClearCover] = useState(String(prefill?.clearCover ?? 40));
  const [stirrupDiameter, setStirrupDiameter] = useState(prefill?.stirrupDiameter ?? 10);

  const [barDiameter, setBarDiameter] = useState(prefill?.tensionBarDiameter ?? 20);
  const [numBars, setNumBars] = useState(String(initialTensionRows.reduce((sum, count) => sum + count, 0)));
  const [tensionLayer1Bars, setTensionLayer1Bars] = useState(String(initialTensionRows[0] ?? 3));
  const [tensionLayer2Bars, setTensionLayer2Bars] = useState(String(initialTensionRows[1] ?? 2));
  const [tensionLayers, setTensionLayers] = useState<LayerCount>(initialTensionRows.length as LayerCount);

  const [isDoubly, setIsDoubly] = useState(prefill?.isDoubly ?? false);
  const [barDiameterPrime, setBarDiameterPrime] = useState(prefill?.compressionBarDiameter ?? 16);
  const [numBarsPrime, setNumBarsPrime] = useState(String(initialCompressionRows.reduce((sum, count) => sum + count, 0)));
  const [compressionLayer1Bars, setCompressionLayer1Bars] = useState(String(initialCompressionRows[0] ?? 1));
  const [compressionLayer2Bars, setCompressionLayer2Bars] = useState(String(initialCompressionRows[1] ?? 1));
  const [compressionLayers, setCompressionLayers] = useState<LayerCount>(initialCompressionRows.length as LayerCount);

  const [result, setResult] = useState<BeamCapacityResult | null>(null);
  const [steps, setSteps] = useState<BeamCapacitySolutionStep[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [computedDepths, setComputedDepths] = useState<{ d: number; dPrime: number; tensionLayerDepths: number[] } | null>(null);
  const [spacingCheck, setSpacingCheck] = useState<LayerSpacingCheck | null>(null);
  const [compressionSpacingCheck, setCompressionSpacingCheck] = useState<LayerSpacingCheck | null>(null);
  const [calculatedBarLayers, setCalculatedBarLayers] = useState<{ tension: number[]; compression: number[] } | null>(null);
  const [inputError, setInputError] = useState("");

  function handleCalculate() {
    const bVal = parseFloat(b);
    const fcVal = parseFloat(fc);
    const fyVal = parseFloat(fy);
    const MuVal = Mu.trim() === "" ? null : parseFloat(Mu);
    const tensionBarsPerLayer = tensionLayers === 2
      ? [parseInt(tensionLayer1Bars, 10), parseInt(tensionLayer2Bars, 10)]
      : [parseInt(numBars, 10)];
    const nBars = tensionBarsPerLayer.reduce((sum, count) => sum + count, 0);
    const compressionBarsPerLayer = isDoubly
      ? compressionLayers === 2
        ? [parseInt(compressionLayer1Bars, 10), parseInt(compressionLayer2Bars, 10)]
        : [parseInt(numBarsPrime, 10)]
      : [];
    const nBarsPrime = compressionBarsPerLayer.reduce((sum, count) => sum + count, 0);
    const barDiameters = isDoubly
      ? [barDiameter, barDiameterPrime]
      : [barDiameter];

    if (
      [bVal, fcVal, fyVal, ...barDiameters].some((v) => !Number.isFinite(v) || v <= 0) ||
      [...tensionBarsPerLayer, ...compressionBarsPerLayer].some((v) => !Number.isInteger(v) || v <= 0) ||
      (MuVal !== null && (isNaN(MuVal) || MuVal <= 0))
    ) {
      setInputError("Enter positive values. Mu may be left blank.");
      setResult(null);
      setSteps([]);
      setComputedDepths(null);
      return;
    }

    const As = nBars * (Math.PI / 4) * barDiameter * barDiameter;

    let As_prime = 0;
    if (isDoubly) {
      As_prime = nBarsPrime * (Math.PI / 4) * barDiameterPrime * barDiameterPrime;
    }

    let dVal: number;
    let dPrimeVal: number;
    let tensionLayerDepthValues: number[];
    if (depthMode === "direct") {
      tensionLayerDepthValues = tensionLayers === 2
        ? [parseFloat(d1), parseFloat(d2)]
        : [parseFloat(d)];
      dVal = areaWeightedDepth(tensionLayerDepthValues, tensionBarsPerLayer);
      dPrimeVal = isDoubly ? parseFloat(dPrime) : 0;
      if (tensionLayerDepthValues.some((depth) => !Number.isFinite(depth) || depth <= 0) || (tensionLayers === 2 && tensionLayerDepthValues[0] <= tensionLayerDepthValues[1]) || (isDoubly && (isNaN(dPrimeVal) || dPrimeVal <= 0 || dPrimeVal >= Math.min(...tensionLayerDepthValues)))) {
        setInputError("Enter valid layer depths. For two tension layers, d1 must be deeper than d2.");
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
      tensionLayerDepthValues = tensionSteelLayerDepths(
        hVal,
        ccVal,
        stirrupDiameter,
        barDiameter,
        tensionBarsPerLayer
      );
      dVal = areaWeightedDepth(tensionLayerDepthValues, tensionBarsPerLayer);
      dPrimeVal = isDoubly
        ? compressionSteelCentroidDepth(
            ccVal,
            stirrupDiameter,
            barDiameterPrime,
            compressionBarsPerLayer
          )
        : 0;
      if (dVal <= 0 || (isDoubly && dPrimeVal >= Math.min(...tensionLayerDepthValues))) {
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
      tensionLayers: tensionBarsPerLayer.map((count, index) => ({
        area: count * (Math.PI / 4) * barDiameter * barDiameter,
        depth: tensionLayerDepthValues[index],
        barCount: count,
      })),
      detailing: {
        depthsFromOverall: depthMode === "fromH",
        overallDepth: depthMode === "fromH" ? parseFloat(h) : 0,
        clearCover: depthMode === "fromH" ? parseFloat(clearCover) : 40,
        stirrupDiameter: depthMode === "fromH" ? stirrupDiameter : 10,
        tensionBarDiameter: barDiameter,
        compressionBarDiameter: barDiameterPrime,
        tensionBarsPerLayer,
        compressionBarsPerLayer: isDoubly ? compressionBarsPerLayer : [],
      },
      Mu: MuVal,
    };

    const computed = checkBeamCapacity(parsed);
    setResult(computed);
    setSteps(getBeamCapacitySolutionSteps(parsed, computed));
    setComputedDepths({ d: dVal, dPrime: dPrimeVal, tensionLayerDepths: tensionLayerDepthValues });

    const cover = depthMode === "fromH" ? parseFloat(clearCover) : 40;
    const stirrup = depthMode === "fromH" ? stirrupDiameter : 10;
    setSpacingCheck(
      calculateLayerSpacing(
        bVal,
        cover,
        stirrup,
        barDiameter,
        tensionBarsPerLayer
      )
    );

    if (isDoubly) {
      setCompressionSpacingCheck(
        calculateLayerSpacing(
          bVal,
          cover,
          stirrup,
          barDiameterPrime,
          compressionBarsPerLayer
        )
      );
    } else {
      setCompressionSpacingCheck(null);
    }
    setCalculatedBarLayers({ tension: tensionBarsPerLayer, compression: compressionBarsPerLayer });
  }

  const shownTensionLayers = calculatedBarLayers?.tension ?? [parseInt(numBars, 10)];
  const shownCompressionLayers = calculatedBarLayers?.compression ?? (isDoubly ? [parseInt(numBarsPrime, 10)] : []);
  const shownTensionBars = shownTensionLayers.reduce((sum, count) => sum + count, 0);
  const shownCompressionBars = shownCompressionLayers.reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto min-w-0 max-w-6xl">
        <h1 className="text-2xl font-bold">Beam Capacity Check</h1>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
            Analysis of an existing RC beam section - singly or doubly reinforced, NSCP 2015 / ACI 318.
        </p>
        {prefill && <div className="mt-4 rounded-lg border border-[#4d7cff]/35 bg-[#4d7cff]/10 px-3 py-2 text-[11px] text-[var(--text)]"><span className="font-bold text-[#4d7cff]">Design transferred.</span> The section dimensions, materials, factored moment, and adopted reinforcement below came from Flexural Beam Design. Review them, then click Calculate.</div>}

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-[var(--text)]">
            <input
              type="checkbox"
              checked={isDoubly}
              onChange={(e) => setIsDoubly(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Doubly reinforced (has compression steel, A′ₛ)
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="b - width (mm)" value={b} onChange={setB} />
            <Field label="f′c (MPa)" value={fc} onChange={setFc} />
            <Field label="fᵧ (MPa)" value={fy} onChange={setFy} />
            <Field label="Mᵤ — applied factored moment (kN·m), optional" value={Mu} onChange={setMu} />
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
                {tensionLayers === 1 ? (
                  <Field label="d - tension steel depth (mm)" value={d} onChange={setD} />
                ) : (
                  <>
                    <Field label="d₁ — bottom-layer depth (mm)" value={d1} onChange={setD1} />
                    <Field label="d₂ — upper-layer depth (mm)" value={d2} onChange={setD2} />
                  </>
                )}
                {isDoubly && (
                  <Field label="d′ — compression-steel depth (mm)" value={dPrime} onChange={setDPrime} />
                )}
                {tensionLayers === 2 && <p className="col-span-full text-[10px] text-[var(--text-muted)]">d₁ and d₂ are measured from the extreme compression face to their respective tension layers. The combined d is calculated from the area-weighted centroid.</p>}
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="h - overall depth (mm)" value={h} onChange={setH} />
                <Field label="CC - clear cover (mm)" value={clearCover} onChange={setClearCover} />
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
                    Stirrup diameter (mm)
                  </label>
                  <select
                    value={stirrupDiameter}
                    onChange={(e) => setStirrupDiameter(Number(e.target.value))}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
                  >
                    {(stirrupSizes.includes(stirrupDiameter) ? stirrupSizes : [stirrupDiameter, ...stirrupSizes]).map((size) => (
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
              {tensionLayers === 1 ? (
                <Field label="Number of bars" value={numBars} onChange={setNumBars} />
              ) : (
                <>
                  <Field label="Layer 1 bars (bottom)" value={tensionLayer1Bars} onChange={setTensionLayer1Bars} />
                  <Field label="Layer 2 bars (upper)" value={tensionLayer2Bars} onChange={setTensionLayer2Bars} />
                </>
              )}
              <div>
                <NumberField label="Bar diameter (mm)" value={barDiameter} onChange={setBarDiameter} />
              </div>
              <LayerSelect
                label="Tension steel layers"
                value={tensionLayers}
                onChange={setTensionLayers}
              />
              {tensionLayers === 2 && <p className="col-span-full text-[10px] text-[var(--text-muted)]">Enter the bar count for each row. Layer 1 is the bottom row at d₁; Layer 2 is the upper row at d₂. The clear vertical spacing is 25 mm.</p>}
            </div>
          </div>

          {isDoubly && (
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <label className="mb-2 block text-[10px] font-medium text-[var(--text-muted)]">
                Compression steel (top bars)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {compressionLayers === 1 ? (
                  <Field label="Number of bars" value={numBarsPrime} onChange={setNumBarsPrime} />
                ) : (
                  <>
                    <Field label="Layer 1 bars (top)" value={compressionLayer1Bars} onChange={setCompressionLayer1Bars} />
                    <Field label="Layer 2 bars (lower)" value={compressionLayer2Bars} onChange={setCompressionLayer2Bars} />
                  </>
                )}
                <div>
                  <NumberField label="Bar diameter (mm)" value={barDiameterPrime} onChange={setBarDiameterPrime} />
                </div>
                <LayerSelect
                  label="Compression steel layers"
                  value={compressionLayers}
                  onChange={setCompressionLayers}
                />
                {compressionLayers === 2 && <p className="col-span-full text-[10px] text-[var(--text-muted)]">Enter the compression-bar count for each row. The clear vertical spacing is 25 mm.</p>}
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

            <div className="grid min-w-0 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="min-w-0">
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
                As={shownTensionBars * (Math.PI / 4) * barDiameter * barDiameter}
                AsPrime={isDoubly ? shownCompressionBars * (Math.PI / 4) * barDiameterPrime * barDiameterPrime : 0}
                numBars={shownTensionBars}
                numBarsPrime={isDoubly ? shownCompressionBars : 0}
                tensionBarsPerLayer={shownTensionLayers}
                tensionLayerDepths={computedDepths?.tensionLayerDepths}
                overallDepth={depthMode === "fromH" ? parseFloat(h) : undefined}
                compressionBarsPerLayer={
                  isDoubly
                    ? shownCompressionLayers
                    : []
                }
                />
              </div>
              <CapacityOverview result={result} />
            </div>

            <div className="mt-4">

            {computedDepths && (
              <>
                {computedDepths.tensionLayerDepths.length > 1 && computedDepths.tensionLayerDepths.map((depth, index) => (
                  <ResultRow
                    key={index}
                    label={<><InlineKatex math={`d_{${index + 1}}`} /> — tension layer {index + 1} depth</>}
                    value={<InlineKatex math={`d_{${index + 1}}=${depth.toFixed(1)}\\text{ mm}`} />}
                  />
                ))}
                <ResultRow
                  label={<><InlineKatex math="d" /> — combined tension-steel depth</>}
                  value={<InlineKatex math={`d=${computedDepths.d.toFixed(1)}\\text{ mm}`} />}
                  bold
                />
                {computedDepths.tensionLayerDepths.length > 1 && (
                  <ResultRow
                    label={<>Area-weighted combined <InlineKatex math="d" /></>}
                    value={<InlineKatex math={`d=\\dfrac{${shownTensionLayers.map((count, index) => `${count}(${computedDepths.tensionLayerDepths[index].toFixed(1)})`).join("+")}}{${shownTensionBars}}=${computedDepths.d.toFixed(1)}\\text{ mm}`} />}
                  />
                )}
                {isDoubly && (
                  <ResultRow
                    label={<><InlineKatex math="d'" /> — compression-steel depth</>}
                    value={<InlineKatex math={`d'=${computedDepths.dPrime.toFixed(1)}\\text{ mm}`} />}
                  />
                )}
              </>
            )}

            <ResultRow label="Section type" value={result.isDoublyReinforced ? "Doubly reinforced" : "Singly reinforced"} />
            <ResultRow
              label={<><InlineKatex math="A_s" /> — tension steel</>}
              value={<InlineKatex math={`A_s=${(shownTensionBars * (Math.PI / 4) * barDiameter * barDiameter).toFixed(0)}\\text{ mm}^2\\quad(${shownTensionBars}\\times${barDiameter}\\text{ mm})`} />}
            />
            <ResultRow
              label="Tension-bar arrangement"
              value={`${shownTensionLayers.join(" + ")} bars by layer`}
            />
            {isDoubly && (
              <ResultRow
                label={<><InlineKatex math="A'_s" /> — compression steel</>}
                value={<InlineKatex math={`A'_s=${(shownCompressionBars * (Math.PI / 4) * barDiameterPrime * barDiameterPrime).toFixed(0)}\\text{ mm}^2\\quad(${shownCompressionBars}\\times${barDiameterPrime}\\text{ mm})`} />}
              />
            )}
            {isDoubly && (
              <ResultRow
                label="Compression-bar arrangement"
                value={`${shownCompressionLayers.join(" + ")} bars by layer`}
              />
            )}
            <ResultRow label={<><InlineKatex math="a" /> — stress-block depth</>} value={<InlineKatex math={`a=${result.a.toFixed(1)}\\text{ mm}`} />} />
            <ResultRow label={<><InlineKatex math="c" /> — neutral-axis depth</>} value={<InlineKatex math={`c=${result.c.toFixed(1)}\\text{ mm}`} />} />
            {result.isDoublyReinforced && (
              <ResultRow
                label="Top steel"
                value={<TopSteelResult result={result} />}
              />
            )}
            <ResultRow label={<>Tension strain, <InlineKatex math="\varepsilon_t" /></>} value={<InlineKatex math={`\\varepsilon_t=${result.epsilonT.toFixed(5)}`} />} />
            <ResultRow
              label="Bottom tension steel"
              value={<>{result.tensionSteelYields ? "Yields" : "Does not yield (elastic)"} — <InlineKatex math="f_s" /> = {result.tensionStress.toFixed(1)} MPa</>}
            />
            <ResultRow
              label={<>Reinforcement ratio, <InlineKatex math="\rho_{min}\,/\,\rho\,/\,\rho_{max}" /></>}
              value={<><InlineKatex math={`${result.rhoMin.toFixed(5)}\\,/\\,${result.rho.toFixed(5)}\\,/\\,${result.rhoMax.toFixed(5)}`} /> — {result.rhoAdequate ? "PASS" : "FAIL"}</>}
            />
            <ResultRow label="Ductility class" value={result.ductilityClass.replace("-", " ")} />
            <ResultRow label={<>Strength reduction factor, <InlineKatex math="\phi" /></>} value={<InlineKatex math={`\\phi=${result.phi.toFixed(3)}`} />} />
            <ResultRow label={<><InlineKatex math="M_n" /> — nominal capacity</>} value={<InlineKatex math={`M_n=${result.Mn.toFixed(2)}\\text{ kN}\\cdot\\text{m}`} />} />
            <ResultRow label={<><InlineKatex math="\phi M_n" /> — design capacity</>} value={<InlineKatex math={`\\phi M_n=${result.phiMn.toFixed(2)}\\text{ kN}\\cdot\\text{m}`} />} bold />
            {result.Mu !== null && result.utilizationRatio !== null && (
              <>
                <ResultRow label={<><InlineKatex math="M_u" /> — applied moment</>} value={<InlineKatex math={`M_u=${result.Mu.toFixed(2)}\\text{ kN}\\cdot\\text{m}`} />} />
                <ResultRow
                  label={<>Utilization, <InlineKatex math="M_u/(\phi M_n)" /></>}
                  value={<InlineKatex math={`\\dfrac{M_u}{\\phi M_n}=${(result.utilizationRatio * 100).toFixed(0)}\\%`} />}
                  bold
                />
              </>
            )}
            {result.Mu === null && (
              <ResultRow label="Adequacy check" value="Not performed - Mu was not provided" />
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
              <section className="mt-3 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5" aria-label="Full manual beam-capacity solution">
                <div>
                  <h2 className="text-base font-extrabold">Full Manual Capacity Solution</h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                    All calculations used for the result are shown in sequence: section data, layer depths and combined depth, reinforcement limits, neutral-axis equilibrium, steel strains and stresses, <InlineKatex math="M_n" />, <InlineKatex math="\phi M_n" />, and the final adequacy check.
                  </p>
                </div>
                {steps.map((step, i) => (
                  <div key={i} className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#f5941f] text-[10px] font-bold text-[#1a1300]">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[var(--text)]">{step.label}</p>
                        {step.reference && <p className="mt-1 text-[9px] leading-relaxed text-[var(--text-muted)]">{step.reference}</p>}
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 pl-7">
                      <div>
                        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                          Equation
                        </p>
                        <div className="overflow-x-auto rounded bg-[var(--bg-surface)] px-2 py-2 text-[var(--text)]">
                          <InlineKatex math={step.formula} />
                        </div>
                      </div>
                      {step.substitution && (
                        <div>
                          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                            Substitution
                          </p>
                          <div className="overflow-x-auto rounded border border-[var(--border)] px-2 py-2 text-[var(--text-muted)]">
                            <InlineKatex math={step.substitution} />
                          </div>
                        </div>
                      )}
                      <div className={`rounded px-2 py-2 ${step.status === "fail" ? "bg-[#e05353]/15 text-[#e05353]" : "bg-[#39c98a]/15 text-[#21875c] dark:text-[#39c98a]"}`}>
                        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide">
                          Answer
                        </p>
                        <div className="overflow-x-auto">
                          {step.resultKind === "text" ? (
                            <p className="text-[11px] leading-relaxed">{step.result}</p>
                          ) : (
                            <InlineKatex math={step.result} />
                          )}
                        </div>
                      </div>
                      {step.explanation && <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">{step.explanation}</p>}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CapacityOverview({ result }: { result: BeamCapacityResult }) {
  const demand = result.Mu ?? 0;
  const scale = Math.max(result.Mn, result.phiMn, demand, 1);
  const barWidth = (value: number) => `${Math.max(0, Math.min(100, value / scale * 100))}%`;
  const status = result.ok === null ? "CAPACITY" : result.ok ? "ADEQUATE" : "INADEQUATE";
  const statusClass = result.ok === false
    ? "bg-[#e05353]/15 text-[#e05353]"
    : "bg-[#39c98a]/15 text-[#21875c] dark:text-[#39c98a]";

  return <aside className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3" aria-label="Moment capacity summary">
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-xs font-bold">Moment capacity</h3>
      <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass}`}>{status}</span>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-1">
      <CapacityMetric math="M_n" label="Nominal capacity" value={result.Mn} />
      <CapacityMetric math="\phi M_n" label="Design capacity" value={result.phiMn} accent />
      {result.Mu !== null && <CapacityMetric math="M_u" label="Factored demand" value={result.Mu} />}
      <div className="rounded-md bg-[var(--bg-surface)] p-2">
        <p className="text-[9px] text-[var(--text-muted)]">Strength factor</p>
        <p className="mt-0.5 text-xs font-bold"><InlineKatex math="\phi" /> = {result.phi.toFixed(3)}</p>
      </div>
    </div>
    <div className="mt-3 space-y-2">
      <CapacityBar label="Nominal capacity" math="M_n" value={result.Mn} width={barWidth(result.Mn)} color="#4d7cff" />
      <CapacityBar label="Design capacity" math="\phi M_n" value={result.phiMn} width={barWidth(result.phiMn)} color="#39c98a" />
      {result.Mu !== null && <CapacityBar label="Factored demand" math="M_u" value={result.Mu} width={barWidth(result.Mu)} color="#e05a5a" />}
    </div>
    {result.Mu !== null && <div className={`mt-3 rounded-md px-2 py-2 text-center text-xs font-bold ${statusClass}`}><InlineKatex math={String.raw`\phi M_n=${result.phiMn.toFixed(2)}\ ${result.phiMn >= result.Mu ? String.raw`\ge` : "<"}\ M_u=${result.Mu.toFixed(2)}\ \text{kN}\cdot\text{m}`} /></div>}
    <p className="mt-3 text-[9px] leading-relaxed text-[var(--text-muted)]">The bar lengths are drawn to the same moment scale, so the demand and available strength can be compared directly.</p>
  </aside>;
}

function TopSteelResult({ result }: { result: BeamCapacityResult }) {
  const state = result.compressionSteelYields
    ? "Yields in compression"
    : result.compressionSteelTensionYields
      ? "Yields in tension"
      : result.compressionSteelInTension
        ? "In tension, elastic"
        : "In compression, elastic";
  const stress = result.compressionSteelYields
    ? "f_y"
    : result.compressionSteelTensionYields
      ? "-f_y"
      : `${result.fsPrime?.toFixed(1)}\\text{ MPa}`;

  return <>{state} — <InlineKatex math={`\\varepsilon'_s=${result.epsilonSPrime?.toFixed(5)},\\quad f'_s=${stress}`} /></>;
}

function CapacityMetric({ math, label, value, accent = false }: { math: string; label: string; value: number; accent?: boolean }) {
  return <div className={`rounded-md p-2 ${accent ? "bg-[#39c98a]/10" : "bg-[var(--bg-surface)]"}`}><p className="text-[9px] text-[var(--text-muted)]">{label} · <InlineKatex math={math} /></p><p className="mt-0.5 text-xs font-bold">{value.toFixed(2)} kN·m</p></div>;
}

function CapacityBar({ label, math, value, width, color }: { label: string; math: string; value: number; width: string; color: string }) {
  return <div><div className="mb-1 flex items-center justify-between gap-2 text-[9px] text-[var(--text-muted)]"><span>{label} (<InlineKatex math={math} />)</span><span>{value.toFixed(1)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[var(--bg-surface)]"><div className="h-full rounded-full" style={{ width, backgroundColor: color }} /></div></div>;
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

function ResultRow({ label, value, bold }: { label: ReactNode; value: ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-1.5 text-[11px] last:border-b-0">
      <span className="min-w-0 leading-relaxed text-[var(--text-muted)]">{label}</span>
      <span className={`shrink-0 text-right leading-relaxed ${bold ? "font-bold" : ""}`}>{value}</span>
    </div>
  );
}

function NumberField({
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
      <input
        type="number"
        min="0"
        step="any"
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
      />
    </div>
  );
}
