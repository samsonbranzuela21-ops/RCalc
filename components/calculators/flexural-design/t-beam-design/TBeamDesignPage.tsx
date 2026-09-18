"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { InlineKatex } from "@/components/shared/Katex";
import { TBeamDesignResultView } from "@/components/calculators/flexural-design/t-beam-design/TBeamDesignResultView";
import {
  designTBeam,
  getTBeamSolutionSteps,
  type TBeamDesignInput,
  type TBeamDesignResult,
  type TBeamSolutionStep,
} from "@/lib/t-beam";

const barSizes = [12, 16, 20, 25, 28, 32, 36];

export default function TBeamDesignPage({ shape = "T" }: { shape?: "T" | "L" }) {
  const [Mu, setMu] = useState("650");
  const [bw, setBw] = useState("300");
  const [hf, setHf] = useState("120");
  const [d, setD] = useState("550");
  const [flangeWidthMode, setFlangeWidthMode] = useState<"calculated" | "given">("calculated");
  const [bf, setBf] = useState("1800");
  const [span, setSpan] = useState("6000");
  const [clearSpacingLeft, setClearSpacingLeft] = useState("2700");
  const [clearSpacingRight, setClearSpacingRight] = useState("2700");
  const [fc, setFc] = useState("28");
  const [fy, setFy] = useState("420");
  const [Es, setEs] = useState("200000");
  const [targetTensionStrain, setTargetTensionStrain] = useState("");
  const [clearCover, setClearCover] = useState("40");
  const [stirrupDiameter, setStirrupDiameter] = useState("10");
  const [aggregateSize, setAggregateSize] = useState("19");
  const [barDiameter, setBarDiameter] = useState(25);
  const [compressionBarDiameter, setCompressionBarDiameter] = useState(20);
  const [result, setResult] = useState<TBeamDesignResult | null>(null);
  const [designInput, setDesignInput] = useState<TBeamDesignInput | null>(null);
  const [steps, setSteps] = useState<TBeamSolutionStep[]>([]);
  const [error, setError] = useState("");
  const [showSolution, setShowSolution] = useState(false);

  function handleCalculate() {
    const parsed = {
      shape,
      Mu: Number(Mu),
      bw: Number(bw),
      hf: Number(hf),
      d: Number(d),
      flangeWidthMode,
      bf: flangeWidthMode === "given" ? Number(bf) : undefined,
      span: flangeWidthMode === "calculated" ? Number(span) : undefined,
      clearSpacingLeft: flangeWidthMode === "calculated" ? Number(clearSpacingLeft) : undefined,
      clearSpacingRight: shape === "T" && flangeWidthMode === "calculated" ? Number(clearSpacingRight) : undefined,
      fc: Number(fc),
      fy: Number(fy),
      Es: Number(Es),
      targetTensionStrain: targetTensionStrain.trim() === "" ? null : Number(targetTensionStrain),
      clearCover: Number(clearCover),
      stirrupDiameter: Number(stirrupDiameter),
      aggregateSize: Number(aggregateSize),
      barDiameter,
      compressionBarDiameter,
    };

    if (
      [parsed.Mu, parsed.bw, parsed.hf, parsed.d, parsed.fc, parsed.fy,
        parsed.Es, parsed.clearCover, parsed.stirrupDiameter, parsed.aggregateSize,
        parsed.barDiameter, parsed.compressionBarDiameter].some(
        (value) => !Number.isFinite(value) || value <= 0
      )
    ) {
      setError("Enter a valid positive number in every input field.");
      setResult(null);
      setDesignInput(null);
      setSteps([]);
      return;
    }

    try {
      const computed = designTBeam(parsed);
      setResult(computed);
      setDesignInput(parsed);
      setSteps(getTBeamSolutionSteps(parsed, computed));
      setError("");
      setShowSolution(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : `Unable to calculate the ${shape}-beam design.`
      );
      setResult(null);
      setDesignInput(null);
      setSteps([]);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-5 sm:py-10">
      <div className="mx-auto min-w-0 max-w-6xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{shape}-Beam Design</h1>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
              Singly or doubly reinforced {shape === "T" ? "interior T-beam" : "edge L-beam"} under positive bending — NSCP 2015
              and ACI 318-14 strength design method.
            </p>
          </div>
          <Link href={shape === "T" ? "/calculators/t-beam-analysis" : "/calculators/l-beam-analysis"} className="text-xs font-semibold text-[#f5941f] underline underline-offset-4">
            Need section analysis? Open {shape}-Beam Analysis
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:grid-cols-2 sm:p-5">
          <Field
            label="Factored moment, Mu (kN·m)"
            value={Mu}
            onChange={setMu}
          />
          <Field label="Web width, bw (mm)" value={bw} onChange={setBw} />
          <Field
            label="Flange thickness, hf (mm)"
            value={hf}
            onChange={setHf}
          />
          <Field
            label="Effective depth, d (mm)"
            value={d}
            onChange={setD}
          />
          <div>
            <label htmlFor="t-design-flange-width-mode" className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
              Effective flange width, bf
            </label>
            <select
              id={`${shape.toLowerCase()}-design-flange-width-mode`}
              value={flangeWidthMode}
              onChange={(event) => {
                setFlangeWidthMode(event.target.value as "calculated" | "given");
                setResult(null);
                setSteps([]);
                setError("");
              }}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-xs text-[var(--text)]"
            >
              <option value="calculated">Calculate bf from clear span and web spacing</option>
              <option value="given">Given bf</option>
            </select>
          </div>
          {flangeWidthMode === "given" ? (
            <Field label="bf — given effective flange width (mm)" value={bf} onChange={setBf} />
          ) : (
            <>
              <Field label="ln — beam clear span (mm)" value={span} onChange={setSpan} />
              <Field label={shape === "T" ? "sw,L — clear distance to left adjacent web (mm)" : "sw — clear distance to adjacent web (mm)"} value={clearSpacingLeft} onChange={setClearSpacingLeft} />
              {shape === "T" && <Field label="sw,R — clear distance to right adjacent web (mm)" value={clearSpacingRight} onChange={setClearSpacingRight} />}
            </>
          )}
          <Field label="Concrete strength, f′c (MPa)" value={fc} onChange={setFc} />
          <Field label="Steel yield strength, fy (MPa)" value={fy} onChange={setFy} />
          <Field label="Steel modulus, Es (MPa)" value={Es} onChange={setEs} />
          <Field label="Target tension strain, εt (optional; blank uses 0.005)" value={targetTensionStrain} onChange={setTargetTensionStrain} />
          <Field label="Clear cover to stirrup, Cc (mm)" value={clearCover} onChange={setClearCover} />
          <Field label="Stirrup diameter (mm)" value={stirrupDiameter} onChange={setStirrupDiameter} />
          <Field label="Maximum nominal aggregate size (mm)" value={aggregateSize} onChange={setAggregateSize} />

          <div>
            <label htmlFor="t-design-tension-bar-diameter" className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
              Tension-bar diameter (mm)
            </label>
            <select
              id="t-design-tension-bar-diameter"
              value={barDiameter}
              onChange={(event) =>
                setBarDiameter(Number(event.target.value))
              }
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-xs text-[var(--text)]"
            >
              {barSizes.map((size) => (
                <option key={size} value={size}>
                  {size} mm
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 sm:col-span-2">
            <p className="text-xs font-semibold">Compression-bar size for a doubly reinforced design</p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Used only when the singly reinforced portion cannot carry the required design moment.
            </p>
            <div className="mt-3 max-w-md">
              <label htmlFor="t-design-compression-bar-diameter" className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
                Compression-bar diameter (mm)
              </label>
              <select
                id="t-design-compression-bar-diameter"
                value={compressionBarDiameter}
                onChange={(event) => setCompressionBarDiameter(Number(event.target.value))}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-2 text-xs text-[var(--text)]"
              >
                {barSizes.map((size) => <option key={size} value={size}>{size} mm</option>)}
              </select>
            </div>
          </div>
        </div>

        <p className="mt-2 text-[9px] leading-relaxed text-[var(--text-muted)]">
          This calculator treats the member as a monolithic {shape === "T" ? "interior T-beam" : "edge L-beam with slab flange on one side"}.
          {flangeWidthMode === "given"
            ? "The entered bf is used directly for design. Confirm it is the permitted effective flange width for this beam. "
            : shape === "T"
              ? "Enter the clear face-to-face distance to the adjacent web on each side, not center-to-center spacing. Each overhang is the least of 8hf, sw/2, and ln/8; bf = bw + left overhang + right overhang. "
              : "Enter the one clear face-to-face distance to the adjacent web, not center-to-center spacing. The overhang is the least of 6hf, sw/2, and ln/12; bf = bw + overhang. "}
          d is the depth to the outer tension-bar row; cover is measured to the
          outside of the stirrup and locates compression steel. Bar arrangements
          are checked within a maximum of three rows in the web.
        </p>

        <button
          type="button"
          onClick={handleCalculate}
          className="mt-4 w-full rounded-md bg-[#f5941f] px-4 py-2.5 text-[12px] font-semibold text-[#1a1300] hover:brightness-105 active:scale-[0.99]"
        >
          Calculate {shape}-Beam Design
        </button>

        {error && (
          <div className="mt-3 rounded-md bg-[#e05353]/15 px-3 py-2 text-[11px] font-semibold text-[#e05353]">
            {error}
          </div>
        )}

        {result && designInput && <TBeamDesignResultView shape={shape} result={result} input={designInput} />}

        {result && steps.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowSolution((shown) => !shown)}
              className="text-[11px] font-semibold text-[#f5941f] underline"
            >
              {showSolution ? "Hide full design solution" : "Show full design solution"}
            </button>

            {showSolution && (
              <div className="mt-3 space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
                <div>
                  <h2 className="text-base font-extrabold">Full Manual {shape}-Beam Design Solution</h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                    Each step shows the equation, numerical substitution, and result.
                    Values are rounded only for display; final capacity uses the full-precision bar layout.
                  </p>
                </div>
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

                    <div className="mt-2 min-w-0 space-y-1.5 pl-0 sm:pl-7">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Equation</p>
                      <div className="max-w-full overflow-x-auto rounded bg-[var(--bg-surface)] px-2 py-1.5 text-[var(--text)]">
                        <InlineKatex math={step.formula} />
                      </div>
                      {step.substitution && (
                        <>
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Substitution</p>
                          <div className="max-w-full overflow-x-auto text-[var(--text-muted)]">
                            <InlineKatex math={step.substitution} />
                          </div>
                        </>
                      )}
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Answer</p>
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
          Educational design aid only. Verify the final member dimensions,
          detailing, cover, bar arrangement, shear, deflection, development
          length, and applicable project requirements using the official NSCP
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
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[10px] font-medium text-[var(--text-muted)]">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-xs text-[var(--text)]"
      />
    </div>
  );
}
