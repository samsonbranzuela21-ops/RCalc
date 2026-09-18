"use client";

import { useState } from "react";
import { InlineKatex } from "@/components/shared/Katex";
import { CrackingMomentDiagram } from "@/components/calculators/flexural-design/cracking-moment/CrackingMomentDiagram";
import {
  calculateCrackingMoment,
  getCrackingMomentSteps,
  type BendingDirection,
  type CompressionSteelTransform,
  type CurvatureBasis,
  type CrackingMomentInput,
  type CrackingMomentResult,
  type CrackingMomentStep,
  type MomentBasis,
  type ReinforcementLayout,
  type SectionShape,
} from "@/lib/cracking-moment";

interface EditableLayer {
  id: number;
  count: string;
  diameter: string;
  depth: string;
}

export default function CrackingMomentPage() {
  const [sectionShape, setSectionShape] = useState<SectionShape>("rectangular");
  const [direction, setDirection] = useState<BendingDirection>("positive");
  const [reinforcementLayout, setReinforcementLayout] = useState<ReinforcementLayout>("singly");
  const [compressionSteelTransform, setCompressionSteelTransform] = useState<CompressionSteelTransform>("n-minus-1");
  const [momentBasis, setMomentBasis] = useState<MomentBasis>("uncracked");
  const [curvatureBasis, setCurvatureBasis] = useState<CurvatureBasis>("before-cracking");
  const [fc, setFc] = useState("28");
  const [lambda, setLambda] = useState("1.0");
  const [Es, setEs] = useState("200000");
  const [EcOverride, setEcOverride] = useState("");
  const [b, setB] = useState("300");
  const [h, setH] = useState("500");
  const [bf, setBf] = useState("900");
  const [bw, setBw] = useState("300");
  const [hf, setHf] = useState("120");
  const [Ig, setIg] = useState("3125000000");
  const [grossCentroid, setGrossCentroid] = useState("250");
  const [nextLayerId, setNextLayerId] = useState(3);
  const [tensionLayers, setTensionLayers] = useState<EditableLayer[]>([
    { id: 1, count: "4", diameter: "20", depth: "450" },
  ]);
  const [compressionLayers, setCompressionLayers] = useState<EditableLayer[]>([
    { id: 2, count: "2", diameter: "16", depth: "50" },
  ]);
  const [result, setResult] = useState<CrackingMomentResult | null>(null);
  const [steps, setSteps] = useState<CrackingMomentStep[]>([]);
  const [error, setError] = useState("");
  const [showSolution, setShowSolution] = useState(true);

  function clearOutput() {
    setResult(null);
    setSteps([]);
    setError("");
  }

  function changeValue(setter: (value: string) => void, value: string) {
    setter(value);
    clearOutput();
  }

  function changeDirection(value: BendingDirection) {
    const depth = Number(h) || 500;
    setDirection(value);
    setTensionLayers((layers) => layers.map((layer, index) => ({ ...layer, depth: String(value === "positive" ? depth - 50 - index * 45 : 50 + index * 45) })));
    setCompressionLayers((layers) => layers.map((layer, index) => ({ ...layer, depth: String(value === "positive" ? 50 + index * 45 : depth - 50 - index * 45) })));
    clearOutput();
  }

  function updateLayer(role: "tension" | "compression", id: number, key: "count" | "diameter" | "depth", value: string) {
    const setter = role === "tension" ? setTensionLayers : setCompressionLayers;
    setter((layers) => layers.map((layer) => layer.id === id ? { ...layer, [key]: value } : layer));
    clearOutput();
  }

  function addLayer(role: "tension" | "compression") {
    const depth = Number(h) || 500;
    const layers = role === "tension" ? tensionLayers : compressionLayers;
    const towardTop = (role === "tension") === (direction === "positive");
    const fallbackDepth = towardTop ? depth - 50 : 50;
    const previousDepth = Number(layers.at(-1)?.depth ?? fallbackDepth);
    const newDepth = Math.max(1, Math.min(depth - 1, previousDepth + (towardTop ? -45 : 45)));
    const layer = { id: nextLayerId, count: "2", diameter: "20", depth: String(newDepth) };
    if (role === "tension") setTensionLayers((current) => [...current, layer]);
    else setCompressionLayers((current) => [...current, layer]);
    setNextLayerId((id) => id + 1);
    clearOutput();
  }

  function removeLayer(role: "tension" | "compression", id: number) {
    const setter = role === "tension" ? setTensionLayers : setCompressionLayers;
    setter((layers) => layers.filter((layer) => layer.id !== id));
    clearOutput();
  }

  function handleCalculate() {
    const input: CrackingMomentInput = {
      sectionShape,
      direction,
      reinforcementLayout: sectionShape === "custom" ? "none" : reinforcementLayout,
      compressionSteelTransform,
      momentBasis: sectionShape === "custom" ? "gross" : momentBasis,
      curvatureBasis: sectionShape === "custom" || reinforcementLayout === "none" ? "before-cracking" : curvatureBasis,
      fc: Number(fc),
      lambda: Number(lambda),
      Es: Number(Es),
      EcOverride: EcOverride.trim() === "" ? undefined : Number(EcOverride),
      b: Number(b),
      h: Number(h),
      bf: Number(bf),
      bw: Number(bw),
      hf: Number(hf),
      Ig: Number(Ig),
      grossCentroid: Number(grossCentroid),
      tensionLayers: tensionLayers.map(({ count, diameter, depth }) => ({ count: Number(count), diameter: Number(diameter), depth: Number(depth) })),
      compressionLayers: compressionLayers.map(({ count, diameter, depth }) => ({ count: Number(count), diameter: Number(diameter), depth: Number(depth) })),
    };

    try {
      const computed = calculateCrackingMoment(input);
      setResult(computed);
      setSteps(getCrackingMomentSteps(input, computed));
      setError("");
      setShowSolution(true);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to calculate the cracking moment.");
      setResult(null);
      setSteps([]);
    }
  }

  const hasReinforcement = sectionShape !== "custom" && reinforcementLayout !== "none";
  const hasCompression = sectionShape !== "custom" && reinforcementLayout === "doubly";

  return (
    <div className="min-h-screen bg-[var(--bg)] px-3 py-8 text-[var(--text)] sm:px-5 sm:py-10">
      <div className="mx-auto min-w-0 max-w-7xl">
        <h1 className="text-2xl font-bold">Cracking Moment and Curvature</h1>
        <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-[var(--text-muted)]">
          Calculate the before-cracking centroid and inertia, the single cracking moment, and the curvature immediately before or after cracking.
        </p>

        <section className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4" aria-label="Calculation options">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8facd9]">Analysis options</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <SelectField
              label="Getting the value of Yg and Ig"
              value={hasReinforcement ? momentBasis : "gross"}
              disabled={!hasReinforcement}
              onChange={(value) => { setMomentBasis(value as MomentBasis); clearOutput(); }}
              options={[
                { value: "uncracked", label: "Include transformed steel" },
                { value: "gross", label: "Concrete only — neglect steel" },
              ]}
            />
            <SelectField
              label="Curvature stage"
              value={hasReinforcement ? curvatureBasis : "before-cracking"}
              disabled={!hasReinforcement}
              onChange={(value) => { setCurvatureBasis(value as CurvatureBasis); clearOutput(); }}
              options={[
                { value: "before-cracking", label: "Just before cracking — Mcr/(EcIg)" },
                { value: "after-cracking", label: "Just after cracking — Mcr/(EcINA)" },
              ]}
            />
            <SelectField
              label="Compression-steel transformed increment"
              value={compressionSteelTransform}
              disabled={!hasCompression}
              onChange={(value) => { setCompressionSteelTransform(value as CompressionSteelTransform); clearOutput(); }}
              options={[
                { value: "n-minus-1", label: "(n − 1)As′ — short-term transformed section" },
                { value: "2n-minus-1", label: "(2n − 1)As′ — NSCP 429.6.5-based option" },
              ]}
            />
          </div>
          <div className="mt-3 grid gap-2 text-[10px] leading-relaxed text-[var(--text-muted)] md:grid-cols-3">
            <div className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg)] p-2">
              <p className="font-semibold text-[var(--text)]">1 · Before cracking</p>
              <p className="mt-1">Choose concrete only, or include transformed steel in <InlineKatex math="Y_g" /> and <InlineKatex math="I_g" />.</p>
            </div>
            <div className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg)] p-2">
              <p className="font-semibold text-[var(--text)]">2 · Cracking moment</p>
              <p className="mt-1">Use one equation: <InlineKatex math="M_{cr}=f_rI_g/Y_g" />.</p>
            </div>
            <div className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg)] p-2">
              <p className="font-semibold text-[var(--text)]">3 · Curvature</p>
              <p className="mt-1">Before: <InlineKatex math="M_{cr}/(E_cI_g)" />. After: <InlineKatex math="M_{cr}/(E_cI_{NA})" />.</p>
            </div>
          </div>
        </section>

        <section className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField
              label="Cross-section"
              value={sectionShape}
              onChange={(value) => { setSectionShape(value as SectionShape); clearOutput(); }}
              options={[
                { value: "rectangular", label: "Rectangular beam" },
                { value: "t", label: "T-beam" },
                { value: "l", label: "L-beam" },
                { value: "custom", label: "Custom Ig and gross centroid" },
              ]}
            />
            <SelectField
              label="Bending direction"
              value={direction}
              onChange={(value) => changeDirection(value as BendingDirection)}
              options={[
                { value: "positive", label: "Positive — bottom in tension" },
                { value: "negative", label: "Negative — top in tension" },
              ]}
            />
            <SelectField
              label="λ — concrete modification factor"
              value={lambda}
              onChange={(value) => changeValue(setLambda, value)}
              options={[
                { value: "1.0", label: "1.00 — normalweight" },
                { value: "0.85", label: "0.85 — sand-lightweight" },
                { value: "0.75", label: "0.75 — all-lightweight" },
              ]}
            />
            <Field label="f′c (MPa)" value={fc} onChange={(value) => changeValue(setFc, value)} />
            <Field label="Es (MPa)" value={Es} onChange={(value) => changeValue(setEs, value)} />
            <Field label="Ec override (MPa, optional)" value={EcOverride} onChange={(value) => changeValue(setEcOverride, value)} />

            {sectionShape === "rectangular" && (
              <>
                <Field label="b — width (mm)" value={b} onChange={(value) => changeValue(setB, value)} />
                <Field label="h — overall depth (mm)" value={h} onChange={(value) => changeValue(setH, value)} />
              </>
            )}
            {(sectionShape === "t" || sectionShape === "l") && (
              <>
                <Field label="bf — flange width (mm)" value={bf} onChange={(value) => changeValue(setBf, value)} />
                <Field label="bw — web width (mm)" value={bw} onChange={(value) => changeValue(setBw, value)} />
                <Field label="hf — flange thickness (mm)" value={hf} onChange={(value) => changeValue(setHf, value)} />
                <Field label="h — overall depth (mm)" value={h} onChange={(value) => changeValue(setH, value)} />
              </>
            )}
            {sectionShape === "custom" && (
              <>
                <Field label="h — overall depth (mm)" value={h} onChange={(value) => changeValue(setH, value)} />
                <Field label="Ig — pure-concrete gross inertia (mm⁴)" value={Ig} onChange={(value) => changeValue(setIg, value)} />
                <Field label="Gross centroid from top, ȳg (mm)" value={grossCentroid} onChange={(value) => changeValue(setGrossCentroid, value)} />
              </>
            )}
          </div>

          {sectionShape !== "custom" && (
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              <SelectField
                label="Longitudinal reinforcement"
                value={reinforcementLayout}
                onChange={(value) => { setReinforcementLayout(value as ReinforcementLayout); clearOutput(); }}
                options={[
                  { value: "none", label: "No reinforcement — gross section only" },
                  { value: "singly", label: "Singly reinforced" },
                  { value: "doubly", label: "Doubly reinforced" },
                ]}
              />
              {hasReinforcement && (
                <div className="mt-3 grid items-start gap-3 lg:grid-cols-2">
                  <LayerEditor title="Tension reinforcement layers" role="tension" layers={tensionLayers} onUpdate={updateLayer} onAdd={addLayer} onRemove={removeLayer} />
                  {hasCompression && <LayerEditor title="Compression reinforcement layers" role="compression" layers={compressionLayers} onUpdate={updateLayer} onAdd={addLayer} onRemove={removeLayer} />}
                </div>
              )}
            </div>
          )}
        </section>

        <button type="button" onClick={handleCalculate} className="mt-4 w-full rounded-md bg-[#f5941f] px-4 py-2.5 text-[12px] font-semibold text-[#1a1300] hover:brightness-105 active:scale-[0.99]">
          Calculate Cracking Moment and Curvature
        </button>

        {error && <div className="mt-3 rounded-md bg-[#e05353]/15 px-3 py-2 text-[11px] font-semibold text-[#e05353]">{error}</div>}

        {result && (
          <section className="mt-6" aria-label="Cracking moment visualization and results">
            <CrackingMomentDiagram result={result} />
            <CalculatedProperties result={result} />
          </section>
        )}

        {result && steps.length > 0 && (
          <section className="mt-4" aria-label="Full calculation solution">
            <button type="button" onClick={() => setShowSolution((shown) => !shown)} className="text-[11px] font-semibold text-[#f5941f] underline">
              {showSolution ? "Hide full solution" : "Show full solution"}
            </button>
            {showSolution && (
              <div className="mt-3 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
                <div>
                  <h2 className="text-sm font-bold">Full solution</h2>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">Bar depth: top face. <InlineKatex math="Y_g" />: tension face. <InlineKatex math="c_{NA}" />: compression face. Units: MPa and mm.</p>
                </div>
                {steps.map((step, index) => (
                  <div key={`${step.label}-${index}`} className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f5941f] text-[10px] font-bold text-[#1a1300]">{index + 1}</span>
                      <p className="text-[11px] font-semibold">{step.label}</p>
                    </div>
                    <div className="mt-2 space-y-1.5 sm:pl-7">
                      <FormulaLine math={step.formula} />
                      {step.substitution && <FormulaLine math={step.substitution} muted />}
                      <FormulaLine math={step.result} result />
                      {step.note && <p className="text-[9px] leading-relaxed text-[var(--text-muted)]">{step.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <p className="mt-6 text-[9px] leading-relaxed text-[var(--text-muted)]">
          Educational design aid. Confirm the effective flange width and all project-specific requirements with the governing NSCP 2015 / ACI 318-14 provisions and a licensed structural engineer.
        </p>
      </div>
    </div>
  );
}

function LayerEditor({ title, role, layers, onUpdate, onAdd, onRemove }: {
  title: string;
  role: "tension" | "compression";
  layers: EditableLayer[];
  onUpdate: (role: "tension" | "compression", id: number, key: "count" | "diameter" | "depth", value: string) => void;
  onAdd: (role: "tension" | "compression") => void;
  onRemove: (role: "tension" | "compression", id: number) => void;
}) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-[11px] font-bold">{title}</p><p className="text-[9px] text-[var(--text-muted)]">Each centroid depth is measured from the top face.</p></div>
        <button type="button" onClick={() => onAdd(role)} className="rounded-md border border-[#f5941f]/50 px-2 py-1 text-[10px] font-bold text-[#f5941f]">+ Add layer</button>
      </div>
      <div className="mt-3 space-y-2">
        {layers.map((layer, index) => (
          <div key={layer.id} className="rounded-md border border-[var(--border)] bg-[var(--bg-surface)] p-2">
            <div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-bold">Layer {index + 1}</p><button type="button" onClick={() => onRemove(role, layer.id)} className="text-[9px] font-semibold text-[#e05353]">Remove</button></div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Bars" value={layer.count} step="1" onChange={(value) => onUpdate(role, layer.id, "count", value)} />
              <Field label="Diameter (mm)" value={layer.diameter} onChange={(value) => onUpdate(role, layer.id, "diameter", value)} />
              <Field label="Depth y (mm)" value={layer.depth} onChange={(value) => onUpdate(role, layer.id, "depth", value)} />
            </div>
          </div>
        ))}
        {layers.length === 0 && <p className="rounded-md border border-dashed border-[var(--border)] p-3 text-center text-[10px] text-[var(--text-muted)]">Add at least one layer.</p>}
      </div>
    </section>
  );
}

function CalculatedProperties({ result }: { result: CrackingMomentResult }) {
  const steelIncluded = result.input.momentBasis === "uncracked" && result.layers.length > 0;
  const afterCracking = result.input.curvatureBasis === "after-cracking";
  return (
    <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8facd9]">Complete calculated properties</p>
      <ResultRow label="Modulus of rupture" math={`f_r=${result.fr.toFixed(3)}\\;\\text{MPa}`} />
      <ResultRow label="Concrete modulus" math={`E_c=${result.Ec.toFixed(0)}\\;\\text{MPa}`} />
      <ResultRow label="Modular ratio" math={`n=E_s/E_c=${result.modularRatio.toFixed(3)}`} />
      {result.input.sectionShape !== "custom" && <ResultRow label="Concrete area" math={`A_c=${result.grossArea.toFixed(0)}\\;\\text{mm}^2`} />}
      {result.input.sectionShape !== "custom" && <>
        {result.layers.length > 0 && <>
          <ResultRow label="Total tension reinforcement" math={`A_s=${result.totalTensionSteelArea.toFixed(2)}\\;\\text{mm}^2`} />
          {result.totalCompressionSteelArea > 0 && <ResultRow label="Total compression reinforcement" math={`A'_s=${result.totalCompressionSteelArea.toFixed(2)}\\;\\text{mm}^2`} />}
        </>}
      </>}
      <ResultRow label={`Selected before-cracking centroid (${steelIncluded ? "steel included" : "concrete only"})`} math={`Y_g=${result.selectedYt.toFixed(2)}\\;\\text{mm}`} />
      <ResultRow label="Selected neutral axis from top" math={`\\bar y_{g,\\mathrm{top}}=${result.selectedCentroidFromTop.toFixed(2)}\\;\\text{mm}`} />
      <ResultRow label={`Selected before-cracking inertia (${steelIncluded ? "steel included" : "concrete only"})`} math={`I_g=${result.selectedInertia.toFixed(0)}\\;\\text{mm}^4`} />
      <ResultRow label="Cracking moment" math={`\\boxed{M_{cr}=${result.Mcr.toFixed(3)}\\;\\text{kN}\\cdot\\text{m}}`} bold />
      {afterCracking && <>
        <ResultRow label="Cracked neutral axis from compression face" math={`c_{NA}=${result.crackedNeutralAxisFromCompressionFace.toFixed(2)}\\;\\text{mm}`} />
        <ResultRow label="After-cracking neutral-axis inertia" math={`I_{NA}=${result.crackedInertia.toFixed(0)}\\;\\text{mm}^4`} />
      </>}
      <ResultRow
        label={afterCracking ? "Curvature just after cracking" : "Curvature just before cracking"}
        math={`\\boxed{\\phi_{cr}^{${afterCracking ? "+" : "-"}}=${result.curvaturePerMm.toExponential(4)}\\;\\text{mm}^{-1}=${result.curvaturePerM.toExponential(4)}\\;\\text{m}^{-1}}`}
        bold
      />
    </div>
  );
}

function Field({ label, value, onChange, step = "any" }: { label: string; value: string; onChange: (value: string) => void; step?: string }) {
  return <div><label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">{label}</label><input type="number" min="0" step={step} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)]" /></div>;
}

function SelectField({ label, value, onChange, options, disabled = false }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; disabled?: boolean }) {
  return <div><label className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">{label}</label><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-[12px] text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-50">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}

function FormulaLine({ math, muted, result }: { math: string; muted?: boolean; result?: boolean }) {
  return <div className={`min-w-0 max-w-full overflow-x-auto text-[10px] sm:text-[11px] ${result ? "rounded bg-[#39c98a]/15 px-2 py-1 text-[#21875c] dark:text-[#39c98a]" : muted ? "text-[var(--text-muted)]" : "rounded bg-[var(--bg-surface)] px-2 py-1.5"}`}><InlineKatex math={math} /></div>;
}

function ResultRow({ label, math, bold = false }: { label: string; math: string; bold?: boolean }) {
  return <div className="flex min-w-0 items-start gap-2 border-b border-[var(--border)] py-1.5 text-[11px] last:border-b-0"><span className="min-w-0 max-w-[42%] break-words text-[var(--text-muted)]">{label}</span><span className={`min-w-0 flex-1 overflow-x-auto text-right ${bold ? "font-bold text-[#f5941f]" : ""}`}><InlineKatex math={math} /></span></div>;
}
