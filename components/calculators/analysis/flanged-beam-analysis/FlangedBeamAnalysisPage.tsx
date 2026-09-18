"use client";

import { useState } from "react";
import { InlineKatex } from "@/components/shared/Katex";
import { LBeamCrossSection } from "@/components/calculators/flexural-design/l-beam-design/LBeamCrossSection";
import { TBeamAnalysisDiagram } from "./TBeamAnalysisDiagram";
import type { TBeamAnalysisPrefill } from "@/lib/t-beam-design-transfer";
import {
  analyzeFlangedBeam,
  deriveTBeamLayersFromOverallHeight,
  getFlangedBeamAnalysisSteps,
  type FlangedBeamAnalysisResult,
  type FlangedBeamAnalysisStep,
  type FlangedBeamShape,
  type FlangedBeamLayerInput,
} from "@/lib/flanged-beam-analysis";

const barSizes = [12, 16, 20, 25, 28, 32, 36];
const stirrupSizes = [10, 12, 16];
interface EditableLayer { id: number; count: string; diameter: string; depth: string }
type LayerRole = "tension" | "compression";
type DepthMode = "direct" | "fromH";

export default function FlangedBeamAnalysisPage({ shape, prefill }: { shape: FlangedBeamShape; prefill?: TBeamAnalysisPrefill }) {
  const [bw, setBw] = useState(String(prefill?.bw ?? 300));
  const [hf, setHf] = useState(String(prefill?.hf ?? 120));
  const [d, setD] = useState(String(prefill?.d ?? 550));
  const [depthMode, setDepthMode] = useState<DepthMode>("direct");
  const [h, setH] = useState("600");
  const [clearCover, setClearCover] = useState(String(prefill?.clearCover ?? 40));
  const [stirrupDiameter, setStirrupDiameter] = useState(prefill?.stirrupDiameter ?? 10);
  const [flangeWidthMode, setFlangeWidthMode] = useState<"calculated" | "given">(prefill?.flangeWidthMode ?? "calculated");
  const [bf, setBf] = useState(String(prefill?.bf ?? 1500));
  const [span, setSpan] = useState(String(prefill?.span ?? 6000));
  const [clearSpacingLeft, setClearSpacingLeft] = useState(String(prefill?.clearSpacingLeft ?? 2700));
  const [clearSpacingRight, setClearSpacingRight] = useState(String(prefill?.clearSpacingRight ?? 2700));
  const [fc, setFc] = useState(String(prefill?.fc ?? 28));
  const [fy, setFy] = useState(String(prefill?.fy ?? 420));
  const [Es, setEs] = useState(String(prefill?.Es ?? 200000));
  const [barCount, setBarCount] = useState(String(prefill?.tensionLayers.reduce((sum, layer) => sum + layer.barCount, 0) ?? 4));
  const [barDiameter, setBarDiameter] = useState(prefill?.tensionLayers[0]?.barDiameter ?? 25);
  const [Mu, setMu] = useState(prefill ? String(prefill.Mu) : "");
  const [isDoubly, setIsDoubly] = useState((prefill?.compressionLayers.length ?? 0) > 0);
  const [nextLayerId, setNextLayerId] = useState(10);
  const [tensionLayers, setTensionLayers] = useState<EditableLayer[]>(prefill
    ? prefill.tensionLayers.map((layer, index) => ({
        id: index + 1, count: String(layer.barCount), diameter: String(layer.barDiameter), depth: String(layer.depth),
      }))
    : [{ id: 1, count: "4", diameter: "25", depth: "550" }]);
  const [compressionLayers, setCompressionLayers] = useState<EditableLayer[]>(prefill?.compressionLayers.length
    ? prefill.compressionLayers.map((layer, index) => ({
        id: index + 4, count: String(layer.barCount), diameter: String(layer.barDiameter), depth: String(layer.depth),
      }))
    : [{ id: 2, count: "2", diameter: "16", depth: "60" }]);
  const [result, setResult] = useState<FlangedBeamAnalysisResult | null>(null);
  const [steps, setSteps] = useState<FlangedBeamAnalysisStep[]>([]);
  const [error, setError] = useState("");
  const [showSolution, setShowSolution] = useState(false);

  const title = `${shape}-Beam Analysis`;

  function editLayer(role: LayerRole, id: number, key: keyof Omit<EditableLayer, "id">, value: string) {
    const setter = role === "tension" ? setTensionLayers : setCompressionLayers;
    setter((layers) => layers.map((layer) => layer.id === id ? { ...layer, [key]: value } : layer));
    setResult(null);
  }

  function addLayer(role: LayerRole) {
    const layers = role === "tension" ? tensionLayers : compressionLayers;
    const previous = layers.at(-1);
    const layer = { id: nextLayerId, count: "2", diameter: previous?.diameter ?? "16",
      depth: String(Number(previous?.depth ?? (role === "tension" ? d : "60")) + (role === "tension" ? -45 : 45)) };
    if (role === "tension") setTensionLayers((current) => [...current, layer]);
    else setCompressionLayers((current) => [...current, layer]);
    setNextLayerId((id) => id + 1);
    setResult(null);
  }

  function removeLayer(role: LayerRole, id: number) {
    const setter = role === "tension" ? setTensionLayers : setCompressionLayers;
    setter((layers) => layers.filter((layer) => layer.id !== id));
    setResult(null);
  }

  function handleCalculate() {
    const parseLayers = (layers: EditableLayer[]): FlangedBeamLayerInput[] => layers.map((layer) => ({
      barCount: Number(layer.count), barDiameter: Number(layer.diameter), depth: Number(layer.depth),
    }));
    let parsedTensionLayers: FlangedBeamLayerInput[] | undefined;
    let parsedCompressionLayers: FlangedBeamLayerInput[] | undefined;
    if (shape === "T") {
      try {
        if (depthMode === "fromH") {
          const derived = deriveTBeamLayersFromOverallHeight({
            h: Number(h), bw: Number(bw), hf: Number(hf),
            clearCover: Number(clearCover), stirrupDiameter,
            tensionLayers: tensionLayers.map((layer) => ({
              barCount: Number(layer.count), barDiameter: Number(layer.diameter),
            })),
            compressionLayers: isDoubly ? compressionLayers.map((layer) => ({
              barCount: Number(layer.count), barDiameter: Number(layer.diameter),
            })) : [],
          });
          parsedTensionLayers = derived.tensionLayers;
          parsedCompressionLayers = derived.compressionLayers;
        } else {
          parsedTensionLayers = parseLayers(tensionLayers);
          parsedCompressionLayers = isDoubly ? parseLayers(compressionLayers) : [];
        }
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to derive the layer depths.");
        setResult(null);
        setSteps([]);
        return;
      }
    }
    const tensionArea = (layer: FlangedBeamLayerInput) => layer.barCount * Math.PI * layer.barDiameter ** 2 / 4;
    const totalTensionArea = parsedTensionLayers?.reduce((sum, layer) => sum + tensionArea(layer), 0) ?? 0;
    const effectiveDepth = parsedTensionLayers && totalTensionArea > 0
      ? parsedTensionLayers.reduce((sum, layer) => sum + tensionArea(layer) * layer.depth, 0) / totalTensionArea
      : Number(d);
    const parsed = {
      shape,
      bw: Number(bw),
      hf: Number(hf),
      d: effectiveDepth,
      flangeWidthMode: shape === "T" ? flangeWidthMode : "calculated",
      bf: shape === "T" && flangeWidthMode === "given" ? Number(bf) : undefined,
      span: shape === "L" || flangeWidthMode === "calculated" ? Number(span) : undefined,
      clearSpacingLeft: shape === "L" || flangeWidthMode === "calculated" ? Number(clearSpacingLeft) : undefined,
      clearSpacingRight: shape === "T" && flangeWidthMode === "calculated" ? Number(clearSpacingRight) : undefined,
      fc: Number(fc),
      fy: Number(fy),
      Es: shape === "T" ? Number(Es) : undefined,
      barCount: Number(barCount),
      barDiameter,
      tensionLayers: parsedTensionLayers,
      compressionLayers: parsedCompressionLayers,
      depthGeometry: shape === "T" && depthMode === "fromH"
        ? { h: Number(h), clearCover: Number(clearCover), stirrupDiameter } : undefined,
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
          Flexural capacity analysis of an existing {shape}-beam under positive bending{shape === "T" ? ", singly or doubly reinforced" : ""}.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:grid-cols-2 sm:p-5">
          <Field label="bw — web width (mm)" value={bw} onChange={setBw} />
          <Field label="hf — flange thickness (mm)" value={hf} onChange={setHf} />
          {shape === "L" && <Field label="d — effective depth (mm)" value={d} onChange={setD} />}
          {shape === "T" && (
            <div>
              <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]" htmlFor="t-flange-width-mode">Effective flange width, bf</label>
              <select
                id="t-flange-width-mode"
                value={flangeWidthMode}
                onChange={(event) => {
                  setFlangeWidthMode(event.target.value as "calculated" | "given");
                  setResult(null);
                  setSteps([]);
                  setError("");
                }}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
              >
                <option value="calculated">Calculate bf from clear span and web spacing</option>
                <option value="given">Given bf</option>
              </select>
            </div>
          )}
          {shape === "T" && flangeWidthMode === "given"
            ? <Field label="bf — given effective flange width (mm)" value={bf} onChange={setBf} />
            : <>
                <Field label="ℓn — beam clear span (mm)" value={span} onChange={setSpan} />
                <Field label={shape === "T" ? "sw,L — clear distance to left adjacent web (mm)" : "sw — clear distance to adjacent web (mm)"} value={clearSpacingLeft} onChange={setClearSpacingLeft} />
                {shape === "T" && <Field label="sw,R — clear distance to right adjacent web (mm)" value={clearSpacingRight} onChange={setClearSpacingRight} />}
              </>}
          <Field label="f′c (MPa)" value={fc} onChange={setFc} />
          <Field label="fy (MPa)" value={fy} onChange={setFy} />
          {shape === "T" && <Field label="Es — steel modulus (MPa)" value={Es} onChange={setEs} />}
          {shape === "L" && <><Field label="Number of tension bars" value={barCount} onChange={setBarCount} step="1" />
          <div>
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">Tension-bar diameter (mm)</label>
            <select
              value={barDiameter}
              onChange={(event) => setBarDiameter(Number(event.target.value))}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]"
            >
              {barSizes.map((size) => <option key={size} value={size}>{size} mm</option>)}
            </select>
          </div></>}
          <Field label="Mu — applied factored moment (kN·m), optional" value={Mu} onChange={setMu} />
          {shape === "T" && <div className="border-t border-[var(--border)] pt-4 sm:col-span-2">
            <label className="mb-2 block text-[10px] font-medium text-[var(--text-muted)]">Effective depth</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setDepthMode("direct"); setResult(null); setSteps([]); setError(""); }}
                className={depthMode === "direct" ? "flex-1 rounded-md border border-[#f5941f] bg-[#f5941f]/15 px-2 py-1.5 text-[11px] font-semibold text-[#f5941f]" : "flex-1 rounded-md border border-[var(--border)] px-2 py-1.5 text-[11px] font-semibold text-[var(--text-muted)]"}>
                Enter d directly
              </button>
              <button type="button" onClick={() => { setDepthMode("fromH"); setResult(null); setSteps([]); setError(""); }}
                className={depthMode === "fromH" ? "flex-1 rounded-md border border-[#f5941f] bg-[#f5941f]/15 px-2 py-1.5 text-[11px] font-semibold text-[#f5941f]" : "flex-1 rounded-md border border-[var(--border)] px-2 py-1.5 text-[11px] font-semibold text-[var(--text-muted)]"}>
                Compute d from h
              </button>
            </div>
            {depthMode === "direct" ? (
              <p className="mt-3 text-[10px] text-[var(--text-muted)]">Enter d for one layer, or each dᵢ for multiple layers, measured from the top face.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="h — overall height (mm)" value={h} onChange={setH} />
                <Field label="CC — clear cover (mm)" value={clearCover} onChange={setClearCover} />
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">Stirrup diameter (mm)</label>
                  <select value={stirrupDiameter} onChange={(event) => setStirrupDiameter(Number(event.target.value))} className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]">
                    {stirrupSizes.map((size) => <option key={size} value={size}>{size} mm</option>)}
                  </select>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] sm:col-span-3">Rows use 25 mm clear vertical spacing; depths are derived from h, cover, stirrup and bar diameters.</p>
              </div>
            )}
          </div>}
          {shape === "T" && <div className="sm:col-span-2">
            <label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]" htmlFor="t-reinforcement-layout">Longitudinal reinforcement</label>
            <select id="t-reinforcement-layout" value={isDoubly ? "doubly" : "singly"} onChange={(event) => { setIsDoubly(event.target.value === "doubly"); setResult(null); }} className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]">
              <option value="singly">Singly reinforced</option><option value="doubly">Doubly reinforced</option>
            </select>
            <div className="mt-4 grid items-start gap-3 border-t border-[var(--border)] pt-4 lg:grid-cols-2">
              <LayerEditor title="Tension reinforcement layers" role="tension" depthMode={depthMode} layers={tensionLayers} onUpdate={editLayer} onAdd={addLayer} onRemove={removeLayer} />
              {isDoubly && <LayerEditor title="Compression reinforcement layers (web only)" role="compression" depthMode={depthMode} layers={compressionLayers} onUpdate={editLayer} onAdd={addLayer} onRemove={removeLayer} />}
            </div>
          </div>}
        </div>

        <p className="mt-2 text-[9px] leading-relaxed text-[var(--text-muted)]">
          {shape === "T"
            ? flangeWidthMode === "given"
              ? "The entered bf is used directly for analysis. Confirm that it is the permitted effective flange width for this beam."
              : "T-beam: enter the clear face-to-face distance to the adjacent web on each side, not center-to-center spacing. Each overhang is the least of 8hf, sw/2, and ℓn/8; bf = bw + left overhang + right overhang."
            : "L-beam: enter the one clear face-to-face distance to the adjacent web, not center-to-center spacing. The overhang is the least of 6hf, sw/2, and ℓn/12; bf = bw + overhang."}
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
              <div className="grid min-w-0 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
                <TBeamAnalysisDiagram result={result} bw={Number(bw)} hf={Number(hf)} fc={Number(fc)} overallHeight={depthMode === "fromH" ? Number(h) : undefined} />
                <CapacityOverview result={result} />
              </div>
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
              {shape === "T" && <>
                <ResultRow label="Section type" value={result.compressionLayers.length ? "Doubly reinforced" : "Singly reinforced"} />
                {result.leftOverhang !== null && <ResultRow label="Effective overhangs, left / right" value={result.leftOverhang.toFixed(2) + " / " + result.rightOverhang!.toFixed(2) + " mm"} />}
                <ResultRow label="Steel modulus, Es" value={result.Es.toFixed(0) + " MPa"} />
                <ResultRow label="Area-weighted tension depth, d" value={result.d.toFixed(1) + " mm"} />
                <ResultRow label="Flange-only trial, a" value={result.flangeTrialA!.toFixed(2) + " mm — " + (result.webTrialA === null ? "within flange" : "assumption failed")} />
                {result.webTrialA !== null && <ResultRow label="Flange + web trial, a" value={result.webTrialA.toFixed(2) + " mm"} />}
                <ResultRow label="Final solution method" value={result.yieldTrialAccepted ? "Yield-based closed form, verified" : "Strain-compatible force equilibrium"} />
                <ResultRow label="Tension layers" value={result.tensionLayers.map((layer) => layer.barCount + " at " + layer.depth.toFixed(1) + " mm").join("; ")} />
                {result.compressionLayers.length > 0 && <ResultRow label="Compression layers" value={result.compressionLayers.map((layer) => layer.barCount + " at " + layer.depth.toFixed(1) + " mm").join("; ")} />}
                {result.compressionLayers.map((layer, index) => <ResultRow key={index} label={"Compression layer " + (index + 1)} value={(layer.stress < 0 ? "Tension" : "Compression") + ", " + (layer.yields ? "yielded" : "elastic") + " (" + layer.stress.toFixed(1) + " MPa)"} />)}
                {result.tensionLayers.map((layer, index) => <ResultRow key={index} label={"Tension layer " + (index + 1)} value={(layer.stress < 0 ? "Tension" : "Compression") + ", " + (layer.yields ? "yielded" : "elastic") + " (" + Math.abs(layer.stress).toFixed(1) + " MPa)"} />)}
              </>}
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
                {shape === "T" && <div><h2 className="text-base font-bold">Full Manual Capacity Solution</h2><p className="mt-1 text-[10px] text-[var(--text-muted)]">Width, steel areas, stress-block case, compatible strains and stresses, force equilibrium, moment and strength reduction follow the NSCP 2015 / ACI 318-14 flexural assumptions.</p></div>}
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

function LayerEditor({ title, role, depthMode, layers, onUpdate, onAdd, onRemove }: {
  title: string;
  role: LayerRole;
  depthMode: DepthMode;
  layers: EditableLayer[];
  onUpdate: (role: LayerRole, id: number, key: keyof Omit<EditableLayer, "id">, value: string) => void;
  onAdd: (role: LayerRole) => void;
  onRemove: (role: LayerRole, id: number) => void;
}) {
  return <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
    <div className="flex items-center justify-between gap-3">
      <div><p className="text-[11px] font-bold">{title}</p><p className="text-[9px] text-[var(--text-muted)]">{depthMode === "direct" ? "Each centroid depth is measured from the top face." : "Layer depths are calculated from cover and 25 mm clear spacing."}</p></div>
      <button type="button" onClick={() => onAdd(role)} className="rounded-md border border-[#f5941f]/50 px-2 py-1 text-[10px] font-bold text-[#f5941f]">+ Add layer</button>
    </div>
    <div className="mt-3 space-y-2">
      {layers.map((layer, index) => <div key={layer.id} className="rounded-md border border-[var(--border)] bg-[var(--bg-surface)] p-2">
        <div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-bold">Layer {index + 1}</p><button type="button" onClick={() => onRemove(role, layer.id)} className="text-[9px] font-semibold text-[#e05353]">Remove</button></div>
        <div className={depthMode === "direct" ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-2"}>
          <Field label="Bars" value={layer.count} onChange={(value) => onUpdate(role, layer.id, "count", value)} step="1" />
          <Field label="Diameter (mm)" value={layer.diameter} onChange={(value) => onUpdate(role, layer.id, "diameter", value)} />
          {depthMode === "direct" && <Field label="Depth y (mm)" value={layer.depth} onChange={(value) => onUpdate(role, layer.id, "depth", value)} />}
        </div>
      </div>)}
      {layers.length === 0 && <p className="rounded-md border border-dashed border-[var(--border)] p-3 text-center text-[10px] text-[var(--text-muted)]">Add at least one layer.</p>}
    </div>
  </section>;
}

function CapacityOverview({ result }: { result: FlangedBeamAnalysisResult }) {
  const demand = result.utilizationRatio === null ? null : result.utilizationRatio * result.phiMn;
  const scale = Math.max(result.Mn, result.phiMn, demand ?? 0, 1);
  const metric = (label: string, value: number, accent = false) => <div className={accent ? "rounded-md bg-[#39c98a]/10 p-2" : "rounded-md bg-[var(--bg-surface)] p-2"}><p className="text-[9px] text-[var(--text-muted)]">{label}</p><p className="mt-0.5 text-xs font-bold">{value.toFixed(2)} kN·m</p></div>;
  const bar = (label: string, value: number, color: string) => <div><div className="mb-1 flex justify-between text-[9px] text-[var(--text-muted)]"><span>{label}</span><span>{value.toFixed(1)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[var(--bg-surface)]"><div className="h-full rounded-full" style={{ width: (100 * value / scale) + "%", backgroundColor: color }} /></div></div>;
  return <aside className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3" aria-label="Moment capacity summary">
    <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-bold">Moment capacity</h3><span className={result.status === "FAIL" || !result.strainLimitOk ? "rounded-full bg-[#e05353]/15 px-2 py-1 text-[9px] font-bold text-[#e05353]" : "rounded-full bg-[#39c98a]/15 px-2 py-1 text-[9px] font-bold text-[#39c98a]"}>{result.status}</span></div>
    <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-1">
      {metric("Nominal capacity · Mn", result.Mn)}
      {metric("Design capacity · φMn", result.phiMn, true)}
      {demand !== null && metric("Factored demand · Mu", demand)}
      <div className="rounded-md bg-[var(--bg-surface)] p-2"><p className="text-[9px] text-[var(--text-muted)]">Strength factor</p><p className="mt-0.5 text-xs font-bold">φ = {result.phi.toFixed(3)}</p></div>
    </div>
    <div className="mt-3 space-y-2">{bar("Nominal capacity", result.Mn, "#4d7cff")}{bar("Design capacity", result.phiMn, "#39c98a")}{demand !== null && bar("Factored demand", demand, "#e05a5a")}</div>
    <p className="mt-3 text-[9px] leading-relaxed text-[var(--text-muted)]">Capacity and demand bars use the same moment scale.</p>
  </aside>;
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
