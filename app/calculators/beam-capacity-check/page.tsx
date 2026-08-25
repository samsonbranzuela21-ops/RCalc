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

export default function BeamCapacityCheckPage() {
  const [b, setB] = useState("300");
  const [fc, setFc] = useState("28");
  const [fy, setFy] = useState("420");
  const [Mu, setMu] = useState("180");

  const [depthMode, setDepthMode] = useState<"direct" | "fromH">("direct");
  const [d, setD] = useState("450");
  const [dPrime, setDPrime] = useState("60");
  const [h, setH] = useState("500");
  const [clearCover, setClearCover] = useState("40");
  const [stirrupDiameter, setStirrupDiameter] = useState(10);

  const [barDiameter, setBarDiameter] = useState(20);
  const [numBars, setNumBars] = useState("5");

  const [isDoubly, setIsDoubly] = useState(false);
  const [barDiameterPrime, setBarDiameterPrime] = useState(16);
  const [numBarsPrime, setNumBarsPrime] = useState("2");

  const [result, setResult] = useState<BeamCapacityResult | null>(null);
  const [steps, setSteps] = useState<BeamCapacitySolutionStep[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [computedDepths, setComputedDepths] = useState<{ d: number; dPrime: number } | null>(null);
  const [spacingCheck, setSpacingCheck] = useState<{ clearSpacing: number | null; minRequired: number; ok: boolean | null } | null>(null);

  function handleCalculate() {
    const bVal = parseFloat(b);
    const fcVal = parseFloat(fc);
    const fyVal = parseFloat(fy);
    const MuVal = parseFloat(Mu);
    const nBars = parseInt(numBars, 10);

    if ([bVal, fcVal, fyVal, MuVal, nBars].some((v) => isNaN(v) || v <= 0)) {
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
        setResult(null);
        setSteps([]);
        setComputedDepths(null);
        return;
      }
    } else {
      const hVal = parseFloat(h);
      const ccVal = parseFloat(clearCover);
      if ([hVal, ccVal].some((v) => isNaN(v) || v <= 0)) {
        setResult(null);
        setSteps([]);
        setComputedDepths(null);
        return;
      }
      dVal = hVal - ccVal - stirrupDiameter - barDiameter / 2;
      dPrimeVal = isDoubly ? ccVal + stirrupDiameter + barDiameterPrime / 2 : 0;
      if (dVal <= 0) {
        setResult(null);
        setSteps([]);
        setComputedDepths(null);
        return;
      }
    }

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
    const minRequired = Math.max(barDiameter, 25);

    if (nBars <= 1) {
      setSpacingCheck({ clearSpacing: null, minRequired, ok: null });
    } else {
      const edgeToFirstBarCenter = cover + stirrup + barDiameter / 2;
      const usableWidth = bVal - 2 * edgeToFirstBarCenter;
      const centerSpacing = usableWidth / (nBars - 1);
      const clearSpacing = centerSpacing - barDiameter;
      setSpacingCheck({ clearSpacing, minRequired, ok: clearSpacing >= minRequired });
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto max-w-[560px]">
        <h1 className="text-[22px] font-extrabold">Beam Capacity Check</h1>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
          Analysis of an existing RC beam section — singly or doubly reinforced, NSCP 2015 / ACI 318.
        </p>

        <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-[var(--text)]">
            <input
              type="checkbox"
              checked={isDoubly}
              onChange={(e) => setIsDoubly(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Doubly reinforced (has compression steel, As')
          </label>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="b — width (mm)" value={b} onChange={setB} />
            <Field label="f'c (MPa)" value={fc} onChange={setFc} />
            <Field label="fy (MPa)" value={fy} onChange={setFy} />
            <Field label="Mu — applied factored moment (kN·m)" value={Mu} onChange={setMu} />
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
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleCalculate}
          className="mt-4 w-full rounded-md bg-[#f5941f] px-4 py-2.5 text-[12px] font-semibold text-[#1a1300]"
        >
          Calculate
        </button>

        {result && (
          <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            <div
              className={`mb-3 rounded-md px-3 py-2 text-[11px] font-semibold ${
                result.ok && result.ductilityClass !== "compression-controlled"
                  ? "bg-[#39c98a]/15 text-[#39c98a]"
                  : "bg-[#e05353]/15 text-[#e05353]"
              }`}
            >
              {result.message}
            </div>

            <div className="w-full overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg)] p-2 sm:p-4">
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
            {isDoubly && (
              <ResultRow
                label="As' (compression steel)"
                value={`${(parseInt(numBarsPrime, 10) * (Math.PI / 4) * barDiameterPrime * barDiameterPrime).toFixed(0)} mm² (${numBarsPrime} × ${barDiameterPrime}mm)`}
              />
            )}
            <ResultRow label="a (stress block depth)" value={`${result.a.toFixed(1)} mm`} />
            <ResultRow label="c (neutral axis)" value={`${result.c.toFixed(1)} mm`} />
            {result.isDoublyReinforced && (
              <ResultRow
                label="Compression steel"
                value={result.compressionSteelYields ? `Yields (fs' = fy)` : `Does not yield (fs' = ${result.fsPrime?.toFixed(1)} MPa)`}
              />
            )}
            <ResultRow label="εt (tension strain)" value={result.epsilonT.toFixed(5)} />
            <ResultRow label="Ductility class" value={result.ductilityClass.replace("-", " ")} />
            <ResultRow label="φ" value={result.phi.toFixed(3)} />
            <ResultRow label="Mn (nominal capacity)" value={`${result.Mn.toFixed(2)} kN·m`} />
            <ResultRow label="φMn (design capacity)" value={`${result.phiMn.toFixed(2)} kN·m`} bold />
            <ResultRow label="Mu (applied)" value={`${result.Mu.toFixed(2)} kN·m`} />
            <ResultRow
              label="Utilization (Mu / φMn)"
              value={`${(result.utilizationRatio * 100).toFixed(0)}%`}
              bold
            />
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
              <div className="mt-3 space-y-4 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
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

function ResultRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-1.5 text-[11px] last:border-b-0">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={bold ? "font-bold" : ""}>{value}</span>
    </div>
  );
}
