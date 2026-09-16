"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { InlineKatex } from "@/components/shared/Katex";
import { TBeamCrossSection } from "@/components/calculators/flexural-design/t-beam-design/TBeamCrossSection";
import {
  designTBeam,
  getTBeamSolutionSteps,
  type TBeamDesignResult,
  type TBeamSolutionStep,
} from "@/lib/t-beam";

const barSizes = [12, 16, 20, 25, 28, 32, 36];

export default function TBeamDesignPage() {
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
  const [steps, setSteps] = useState<TBeamSolutionStep[]>([]);
  const [error, setError] = useState("");
  const [showSolution, setShowSolution] = useState(false);

  function handleCalculate() {
    const parsed = {
      Mu: Number(Mu),
      bw: Number(bw),
      hf: Number(hf),
      d: Number(d),
      flangeWidthMode,
      bf: flangeWidthMode === "given" ? Number(bf) : undefined,
      span: flangeWidthMode === "calculated" ? Number(span) : undefined,
      clearSpacingLeft: flangeWidthMode === "calculated" ? Number(clearSpacingLeft) : undefined,
      clearSpacingRight: flangeWidthMode === "calculated" ? Number(clearSpacingRight) : undefined,
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
      setSteps([]);
      return;
    }

    try {
      const computed = designTBeam(parsed);
      setResult(computed);
      setSteps(getTBeamSolutionSteps(parsed, computed));
      setError("");
      setShowSolution(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to calculate the T-beam design."
      );
      setResult(null);
      setSteps([]);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-5 sm:py-10">
      <div className="mx-auto min-w-0 max-w-6xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">T-Beam Design</h1>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
              Singly or doubly reinforced interior T-beam under positive bending — NSCP 2015
              and ACI 318-14 strength design method.
            </p>
          </div>
          <Link href="/calculators/t-beam-analysis" className="text-xs font-semibold text-[#f5941f] underline underline-offset-4">
            Need section analysis? Open T-Beam Analysis
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
              id="t-design-flange-width-mode"
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
              <Field label="sw,L — clear distance to left adjacent web (mm)" value={clearSpacingLeft} onChange={setClearSpacingLeft} />
              <Field label="sw,R — clear distance to right adjacent web (mm)" value={clearSpacingRight} onChange={setClearSpacingRight} />
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
          This calculator treats the member as a monolithic interior T-beam.
          {flangeWidthMode === "given"
            ? "The entered bf is used directly for design. Confirm it is the permitted effective flange width for this beam. "
            : "Enter the clear face-to-face distance to the adjacent web on each side, not center-to-center spacing. Each overhang is the least of 8hf, sw/2, and ln/8; bf = bw + left overhang + right overhang. "}
          d is the depth to the outer tension-bar row; cover is measured to the
          outside of the stirrup and locates compression steel. Bar arrangements
          are checked within a maximum of three rows in the web.
        </p>

        <button
          type="button"
          onClick={handleCalculate}
          className="mt-4 w-full rounded-md bg-[#f5941f] px-4 py-2.5 text-[12px] font-semibold text-[#1a1300] hover:brightness-105 active:scale-[0.99]"
        >
          Calculate T-Beam Design
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

            <TBeamCrossSection
              beff={result.beff}
              bw={Number(bw)}
              hf={Number(hf)}
              d={Number(d)}
              a={result.a}
              barDiameter={barDiameter}
              barsRequired={result.barsRequired}
              barsPerLayer={result.barsPerLayer}
              sectionCase={result.sectionCase}
              compressionBarsRequired={result.compressionBarsRequired}
              compressionBarsPerLayer={result.compressionBarsPerLayer}
              compressionBarDiameter={result.compressionBarDiameter}
              dPrime={result.dPrime}
            />

            <div className="mt-4">
              <ResultRow
                label="Design status"
                value={result.designStatus}
                bold
              />
              <ResultRow label="Reinforcement type" value={result.sectionType === "doubly" ? "Doubly reinforced" : "Singly reinforced"} bold />
             <ResultRow
               label="Effective flange width, bf"
               value={`${result.beff.toFixed(0)} mm`}
             />
              <ResultRow label="Flange width input" value={result.flangeWidthMode === "given" ? "Given bf" : "Calculated from both web spacings"} />
              {result.flangeWidthMode === "calculated" && (
                <>
                  <ResultRow label="Left effective overhang" value={result.leftOverhang!.toFixed(2) + " mm"} />
                  <ResultRow label="Right effective overhang" value={result.rightOverhang!.toFixed(2) + " mm"} />
                  <ResultRow label="Limit on each side — ln/8" value={result.spanLimit!.toFixed(2) + " mm"} />
                  <ResultRow label="Limit on each side — 8hf" value={result.thicknessLimit!.toFixed(2) + " mm"} />
                  <ResultRow label="Left spacing limit — sw,L/2" value={result.leftSpacingLimit!.toFixed(2) + " mm"} />
                  <ResultRow label="Right spacing limit — sw,R/2" value={result.rightSpacingLimit!.toFixed(2) + " mm"} />
                </>
              )}
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
              <ResultRow
                label="As,min"
                value={`${result.asMin.toFixed(0)} mm²`}
              />
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
              {result.sectionType === "doubly" && (
                <>
                  <ResultRow label="Compression bars provided" value={result.compressionBarsRequired + " × " + result.compressionBarDiameter + " mm"} bold />
                  <ResultRow label="Compression steel area, As′" value={result.asCompression.toFixed(0) + " mm²"} />
                  <ResultRow label="Compression steel depth, d′" value={result.dPrime.toFixed(1) + " mm"} />
                  <ResultRow label="Compression steel at trial" value={result.compressionDesignStress >= Number(fy) - 1e-9 ? "Yields" : "Does not yield"} />
                  <ResultRow label="Final compression rows" value={result.compressionLayers.map((layer) =>
                    layer.barCount + " bars @ " + layer.depth.toFixed(1) + " mm (" +
                    (Math.abs(layer.stress) >= Number(fy) - 1e-9 ? "yield" : "elastic") + ")"
                  ).join("; ")} />
                </>
              )}
              <ResultRow
                label="Tension strain, εt"
                value={result.epsilonT.toFixed(5)}
              />
              <ResultRow label="ϕ" value={result.phi.toFixed(3)} />
              <ResultRow
                label="Mn"
                value={`${result.Mn.toFixed(2)} kN·m`}
              />
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
              {result.spacingOk !== null && (
                <ResultRow
                  label="Clear bar spacing"
                  value={`${result.clearSpacing?.toFixed(1)} mm ${
                    result.spacingOk ? "— OK" : "— NOT OK"
                  }`}
                  bold
                />
              )}
            </div>
          </div>
        )}

        {result && result.spacingOk === false && (
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

                    <div className="mt-2 min-w-0 space-y-1.5 pl-0 sm:pl-7">
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
