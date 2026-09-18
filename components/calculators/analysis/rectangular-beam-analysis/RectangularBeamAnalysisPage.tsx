"use client";

import { useState, type ReactNode } from "react";
import { InlineKatex } from "@/components/shared/Katex";
import { StrainStressDiagram } from "@/components/calculators/analysis/rectangular-beam-analysis/StrainStressDiagram";
import type { RectangularBeamDesignPrefill } from "@/lib/rectangular-beam-design-transfer";
import {
  analyzeRectangularBeam,
  getRectangularBeamAnalysisSolutionSteps,
  type RectangularBeamAnalysisResult,
  type RectangularBeamAnalysisSolutionStep,
} from "@/lib/rectangular-beam-analysis";

const stirrupSizes = [10, 12, 16];
interface EditableLayer { id: number; count: string; diameter: string; depth: string }
type LayerRole = "tension" | "compression";

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
  layers: Array<{ count: number; diameter: number; depth: number }>,
): LayerSpacingCheck {
  const barsPerLayer = layers.map((layer) => layer.count);
  const minRequired = Math.max(25, ...layers.map((layer) => layer.diameter));
  const insideWidth = width - 2 * (cover + stirrupDiameter);
  const clearSpacings = layers.map(({ count, diameter }) => count > 1
    ? (insideWidth - count * diameter) / (count - 1) : null);
  const clearSpacing = Math.min(...clearSpacings.filter((value): value is number => value !== null));
  const verticalSpacings = layers.slice(1).map((layer, index) =>
    Math.abs(layer.depth - layers[index].depth) - (layer.diameter + layers[index].diameter) / 2);
  const verticalClearSpacing = verticalSpacings.length ? Math.min(...verticalSpacings) : null;
  const horizontalOk = layers.every(({ count, diameter }, index) =>
    count > 1 ? (clearSpacings[index] ?? -Infinity) >= Math.max(25, diameter) : insideWidth >= diameter);
  const ok = horizontalOk && (verticalClearSpacing === null || verticalClearSpacing >= 25);

  return {
    barsPerLayer,
    clearSpacing: Number.isFinite(clearSpacing) ? clearSpacing : null,
    verticalClearSpacing,
    minRequired,
    ok,
  };
}

function layerDepthsFromGeometry(layers: EditableLayer[], role: LayerRole, overallDepth: number, cover: number, stirrup: number): number[] {
  let edge = role === "tension" ? overallDepth - cover - stirrup : cover + stirrup;
  return layers.map((layer) => {
    const diameter = Number(layer.diameter);
    const depth = edge + (role === "tension" ? -diameter / 2 : diameter / 2);
    edge = depth + (role === "tension" ? -diameter / 2 - 25 : diameter / 2 + 25);
    return depth;
  });
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

export default function RectangularBeamAnalysisPage({ prefill }: { prefill?: RectangularBeamDesignPrefill }) {
  const initialTensionRows = prefill?.tensionRows ?? [5];
  const initialCompressionRows = prefill?.compressionRows.length ? prefill.compressionRows : [2];
  const [b, setB] = useState(String(prefill?.b ?? 300));
  const [fc, setFc] = useState(String(prefill?.fc ?? 28));
  const [fy, setFy] = useState(String(prefill?.fy ?? 420));
  const [Es, setEs] = useState(String(prefill?.Es ?? 200000));
  const [Mu, setMu] = useState(prefill ? String(prefill.Mu) : "");

  const [depthMode, setDepthMode] = useState<"direct" | "fromH">(prefill ? "fromH" : "direct");
  const [h, setH] = useState(String(prefill?.h ?? 500));
  const [clearCover, setClearCover] = useState(String(prefill?.clearCover ?? 40));
  const [stirrupDiameter, setStirrupDiameter] = useState(prefill?.stirrupDiameter ?? 10);

  const [isDoubly, setIsDoubly] = useState(prefill?.isDoubly ?? false);
  const [nextLayerId, setNextLayerId] = useState(initialTensionRows.length + initialCompressionRows.length + 1);
  const [tensionLayers, setTensionLayers] = useState<EditableLayer[]>(initialTensionRows.map((count, index) => ({
    id: index + 1, count: String(count), diameter: String(prefill?.tensionBarDiameter ?? 20), depth: String(450 - index * 45),
  })));
  const [compressionLayers, setCompressionLayers] = useState<EditableLayer[]>(initialCompressionRows.map((count, index) => ({
    id: initialTensionRows.length + index + 1, count: String(count), diameter: String(prefill?.compressionBarDiameter ?? 16), depth: String(60 + index * 41),
  })));

  const [result, setResult] = useState<RectangularBeamAnalysisResult | null>(null);
  const [steps, setSteps] = useState<RectangularBeamAnalysisSolutionStep[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [computedDepths, setComputedDepths] = useState<{ d: number; dPrime: number; tensionLayerDepths: number[] } | null>(null);
  const [spacingCheck, setSpacingCheck] = useState<LayerSpacingCheck | null>(null);
  const [compressionSpacingCheck, setCompressionSpacingCheck] = useState<LayerSpacingCheck | null>(null);
  const [calculatedBarLayers, setCalculatedBarLayers] = useState<{ tension: Array<{ count: number; diameter: number }>; compression: Array<{ count: number; diameter: number }> } | null>(null);
  const [inputError, setInputError] = useState("");

  function updateLayer(role: LayerRole, id: number, key: "count" | "diameter" | "depth", value: string) {
    const setter = role === "tension" ? setTensionLayers : setCompressionLayers;
    setter((layers) => layers.map((layer) => layer.id === id ? { ...layer, [key]: value } : layer));
    setResult(null);
  }

  function addLayer(role: LayerRole) {
    const layers = role === "tension" ? tensionLayers : compressionLayers;
    const previous = layers.at(-1);
    const newLayer = { id: nextLayerId, count: "2", diameter: previous?.diameter ?? "20",
      depth: String(Number(previous?.depth ?? (role === "tension" ? 450 : 60)) + (role === "tension" ? -45 : 45)) };
    if (role === "tension") setTensionLayers((current) => [...current, newLayer]);
    else setCompressionLayers((current) => [...current, newLayer]);
    setNextLayerId((id) => id + 1);
    setResult(null);
  }

  function removeLayer(role: LayerRole, id: number) {
    const setter = role === "tension" ? setTensionLayers : setCompressionLayers;
    setter((layers) => layers.filter((layer) => layer.id !== id));
    setResult(null);
  }

  function handleCalculate() {
    const bVal = parseFloat(b);
    const fcVal = parseFloat(fc);
    const fyVal = parseFloat(fy);
    const EsVal = parseFloat(Es);
    const MuVal = Mu.trim() === "" ? null : parseFloat(Mu);
    const activeCompressionLayers = isDoubly ? compressionLayers : [];
    const allLayers = [...tensionLayers, ...activeCompressionLayers];
    const barCounts = allLayers.map((layer) => Number(layer.count));
    const barDiameters = allLayers.map((layer) => Number(layer.diameter));

    if (
      tensionLayers.length === 0 || (isDoubly && compressionLayers.length === 0) ||
      [bVal, fcVal, fyVal, EsVal, ...barDiameters].some((v) => !Number.isFinite(v) || v <= 0) ||
      barCounts.some((v) => !Number.isInteger(v) || v <= 0) ||
      (MuVal !== null && (isNaN(MuVal) || MuVal <= 0))
    ) {
      setInputError("Add at least one required layer, and enter positive materials, bar counts, and diameters. Mu may be blank.");
      setResult(null);
      setSteps([]);
      setComputedDepths(null);
      return;
    }

    const hVal = Number(h);
    const ccVal = Number(clearCover);
    if (depthMode === "fromH" && (![hVal, ccVal, stirrupDiameter].every((v) => Number.isFinite(v) && v > 0) || hVal <= 2 * (ccVal + stirrupDiameter))) {
      setInputError("Enter a valid overall depth, cover, and stirrup diameter.");
      setResult(null);
      return;
    }
    const tensionLayerDepthValues = depthMode === "fromH"
      ? layerDepthsFromGeometry(tensionLayers, "tension", hVal, ccVal, stirrupDiameter)
      : tensionLayers.map((layer) => Number(layer.depth));
    const compressionLayerDepthValues = depthMode === "fromH"
      ? layerDepthsFromGeometry(activeCompressionLayers, "compression", hVal, ccVal, stirrupDiameter)
      : activeCompressionLayers.map((layer) => Number(layer.depth));
    const orderedTension = tensionLayerDepthValues.every((depth, index) => index === 0 || depth < tensionLayerDepthValues[index - 1]);
    const orderedCompression = compressionLayerDepthValues.every((depth, index) => index === 0 || depth > compressionLayerDepthValues[index - 1]);
    if ([...tensionLayerDepthValues, ...compressionLayerDepthValues].some((depth) => !Number.isFinite(depth) || depth <= 0 || (depthMode === "fromH" && depth >= hVal)) ||
      !orderedTension || !orderedCompression || (isDoubly && Math.max(...compressionLayerDepthValues) >= Math.min(...tensionLayerDepthValues))) {
      setInputError("Layer depths must fit the section: tension layers run bottom to top, compression layers top to bottom, with no overlap.");
      setResult(null);
      return;
    }

    const areaOf = (layer: EditableLayer) => Number(layer.count) * Math.PI * Number(layer.diameter) ** 2 / 4;
    const As = tensionLayers.reduce((sum, layer) => sum + areaOf(layer), 0);
    const As_prime = activeCompressionLayers.reduce((sum, layer) => sum + areaOf(layer), 0);
    const dVal = tensionLayers.reduce((sum, layer, index) => sum + areaOf(layer) * tensionLayerDepthValues[index], 0) / As;
    const dPrimeVal = isDoubly ? activeCompressionLayers.reduce((sum, layer, index) => sum + areaOf(layer) * compressionLayerDepthValues[index], 0) / As_prime : 0;
    const supportsLegacyDetailing = tensionLayers.length <= 2 && activeCompressionLayers.length <= 2 &&
      tensionLayers.every((layer) => layer.diameter === tensionLayers[0].diameter) &&
      activeCompressionLayers.every((layer) => layer.diameter === activeCompressionLayers[0].diameter);

    setInputError("");

    const parsed = {
      b: bVal,
      d: dVal,
      dPrime: dPrimeVal,
      fc: fcVal,
      fy: fyVal,
      Es: EsVal,
      As,
      AsPrime: As_prime,
      tensionLayers: tensionLayers.map((layer, index) => ({
        area: areaOf(layer),
        depth: tensionLayerDepthValues[index],
        barCount: Number(layer.count),
      })),
      compressionLayers: activeCompressionLayers.map((layer, index) => ({
        area: areaOf(layer), depth: compressionLayerDepthValues[index], barCount: Number(layer.count),
      })),
      detailing: supportsLegacyDetailing ? {
        depthsFromOverall: depthMode === "fromH",
        overallDepth: depthMode === "fromH" ? parseFloat(h) : 0,
        clearCover: depthMode === "fromH" ? parseFloat(clearCover) : 40,
        stirrupDiameter: depthMode === "fromH" ? stirrupDiameter : 10,
        tensionBarDiameter: Number(tensionLayers[0].diameter),
        compressionBarDiameter: Number(activeCompressionLayers[0]?.diameter ?? 16),
        tensionBarsPerLayer: tensionLayers.map((layer) => Number(layer.count)),
        compressionBarsPerLayer: activeCompressionLayers.map((layer) => Number(layer.count)),
      } : undefined,
      Mu: MuVal,
    };

    let computed: RectangularBeamAnalysisResult;
    try { computed = analyzeRectangularBeam(parsed); }
    catch (error) { setInputError(error instanceof Error ? error.message : "Unable to analyze this section."); setResult(null); return; }
    setResult(computed);
    setSteps(getRectangularBeamAnalysisSolutionSteps(parsed, computed));
    setComputedDepths({ d: dVal, dPrime: dPrimeVal, tensionLayerDepths: tensionLayerDepthValues });

    const cover = depthMode === "fromH" ? parseFloat(clearCover) : 40;
    const stirrup = depthMode === "fromH" ? stirrupDiameter : 10;
    setSpacingCheck(calculateLayerSpacing(bVal, cover, stirrup,
      tensionLayers.map((layer, index) => ({ count: Number(layer.count), diameter: Number(layer.diameter), depth: tensionLayerDepthValues[index] }))));

    if (isDoubly) {
      setCompressionSpacingCheck(calculateLayerSpacing(bVal, cover, stirrup,
        activeCompressionLayers.map((layer, index) => ({ count: Number(layer.count), diameter: Number(layer.diameter), depth: compressionLayerDepthValues[index] }))));
    } else {
      setCompressionSpacingCheck(null);
    }
    setCalculatedBarLayers({ tension: tensionLayers.map((layer) => ({ count: Number(layer.count), diameter: Number(layer.diameter) })),
      compression: activeCompressionLayers.map((layer) => ({ count: Number(layer.count), diameter: Number(layer.diameter) })) });
  }

  const shownTensionLayers = calculatedBarLayers?.tension.map((layer) => layer.count) ?? [];
  const shownCompressionLayers = calculatedBarLayers?.compression.map((layer) => layer.count) ?? [];
  const shownTensionBars = shownTensionLayers.reduce((sum, count) => sum + count, 0);
  const shownCompressionBars = shownCompressionLayers.reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto min-w-0 max-w-6xl">
        <h1 className="text-2xl font-bold">Rectangular Beam Analysis</h1>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
            Analysis of an existing RC beam section - singly or doubly reinforced, NSCP 2015 / ACI 318.
        </p>
        {prefill && <div className="mt-4 rounded-lg border border-[#4d7cff]/35 bg-[#4d7cff]/10 px-3 py-2 text-[11px] text-[var(--text)]"><span className="font-bold text-[#4d7cff]">Design transferred.</span> The section dimensions, materials, factored moment, and adopted reinforcement below came from Rectangular Beam Design. Review them, then click Calculate.</div>}

        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <label className="block text-[10px] font-medium text-[var(--text-muted)]" htmlFor="reinforcement-layout">Longitudinal reinforcement</label>
          <select id="reinforcement-layout" value={isDoubly ? "doubly" : "singly"} onChange={(event) => { setIsDoubly(event.target.value === "doubly"); setResult(null); }} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]">
            <option value="singly">Singly reinforced</option>
            <option value="doubly">Doubly reinforced</option>
          </select>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="b - width (mm)" value={b} onChange={setB} />
            <Field label="f′c (MPa)" value={fc} onChange={setFc} />
            <Field label="fᵧ (MPa)" value={fy} onChange={setFy} />
            <Field label="Es - steel modulus (MPa)" value={Es} onChange={setEs} />
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
              <p className="mt-3 text-[10px] text-[var(--text-muted)]">Enter each bar layer depth below, measured from the top face.</p>
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

          <div className="mt-5 grid items-start gap-3 border-t border-[var(--border)] pt-4 lg:grid-cols-2">
            <LayerEditor title="Tension reinforcement layers" role="tension" layers={tensionLayers} depthMode={depthMode} onUpdate={updateLayer} onAdd={addLayer} onRemove={removeLayer} />
            {isDoubly && <LayerEditor title="Compression reinforcement layers" role="compression" layers={compressionLayers} depthMode={depthMode} onUpdate={updateLayer} onAdd={addLayer} onRemove={removeLayer} />}
          </div>
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
                d={result.d}
                c={result.c}
                a={result.a}
                fc={parseFloat(fc)}
                fy={parseFloat(fy)}
                isDoublyReinforced={result.isDoublyReinforced}
                dPrime={computedDepths?.dPrime}
                compressionSteelYields={result.compressionSteelYields}
                fsPrime={result.fsPrime}
                As={result.As}
                AsPrime={result.compressionLayers.reduce((sum, layer) => sum + layer.area, 0)}
                numBars={shownTensionBars}
                numBarsPrime={isDoubly ? shownCompressionBars : 0}
                tensionBarsPerLayer={shownTensionLayers}
                tensionLayerDepths={computedDepths?.tensionLayerDepths}
                compressionLayerDepths={result.compressionLayers.map((layer) => layer.depth)}
                tensionLayerResults={result.tensionLayers}
                compressionLayerResults={result.compressionLayers}
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
                    value={<InlineKatex math={`d=\\dfrac{${result.tensionLayers.map((layer) => `(${layer.area.toFixed(1)})(${layer.depth.toFixed(1)})`).join("+")}}{${result.As.toFixed(1)}}=${computedDepths.d.toFixed(1)}\\text{ mm}`} />}
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
              value={<InlineKatex math={`A_s=${result.As.toFixed(0)}\\text{ mm}^2`} />}
            />
            <ResultRow
              label="Tension-bar arrangement"
              value={`${shownTensionLayers.join(" + ")} bars by layer`}
            />
            {isDoubly && (
              <ResultRow
                label={<><InlineKatex math="A'_s" /> — compression steel</>}
                value={<InlineKatex math={`A'_s=${result.compressionLayers.reduce((sum, layer) => sum + layer.area, 0).toFixed(0)}\\text{ mm}^2`} />}
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
            {result.compressionLayers.length > 1 && result.compressionLayers.map((layer) => (
              <ResultRow key={layer.index} label={`Compression layer ${layer.index} stress`} value={`${layer.stress.toFixed(1)} MPa at ${layer.depth.toFixed(1)} mm`} />
            ))}
            {result.isDoublyReinforced && result.compressionLayers.length === 1 && (
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
              <section className="mt-3 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5" aria-label="Full manual rectangular-beam-analysis solution">
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

function CapacityOverview({ result }: { result: RectangularBeamAnalysisResult }) {
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

function TopSteelResult({ result }: { result: RectangularBeamAnalysisResult }) {
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

function LayerEditor({ title, role, layers, depthMode, onUpdate, onAdd, onRemove }: {
  title: string;
  role: LayerRole;
  layers: EditableLayer[];
  depthMode: "direct" | "fromH";
  onUpdate: (role: LayerRole, id: number, key: "count" | "diameter" | "depth", value: string) => void;
  onAdd: (role: LayerRole) => void;
  onRemove: (role: LayerRole, id: number) => void;
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-[11px] font-bold">{title}</p><p className="text-[9px] text-[var(--text-muted)]">{depthMode === "direct" ? "Each centroid depth is measured from the top face." : "Layer depths are calculated from cover and 25 mm clear spacing."}</p></div>
        <button type="button" onClick={() => onAdd(role)} className="rounded-md border border-[#f5941f]/50 px-2 py-1 text-[10px] font-bold text-[#f5941f]">+ Add layer</button>
      </div>
      <div className="mt-3 space-y-2">
        {layers.map((layer, index) => (
          <div key={layer.id} className="rounded-md border border-[var(--border)] bg-[var(--bg-surface)] p-2">
            <div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-bold">Layer {index + 1}</p><button type="button" onClick={() => onRemove(role, layer.id)} className="text-[9px] font-semibold text-[#e05353]">Remove</button></div>
            <div className={`grid gap-2 ${depthMode === "direct" ? "grid-cols-3" : "grid-cols-2"}`}>
              <Field label="Bars" value={layer.count} onChange={(value) => onUpdate(role, layer.id, "count", value)} />
              <Field label="Diameter (mm)" value={layer.diameter} onChange={(value) => onUpdate(role, layer.id, "diameter", value)} />
              {depthMode === "direct" && <Field label="Depth y (mm)" value={layer.depth} onChange={(value) => onUpdate(role, layer.id, "depth", value)} />}
            </div>
          </div>
        ))}
        {layers.length === 0 && <p className="rounded-md border border-dashed border-[var(--border)] p-3 text-center text-[10px] text-[var(--text-muted)]">Add at least one layer.</p>}
      </div>
    </section>
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
