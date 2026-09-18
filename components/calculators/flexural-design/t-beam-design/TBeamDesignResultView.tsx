import Link from "next/link";
import type { ReactNode } from "react";
import { DiagramFrame, DiagramLegend } from "@/components/shared/DiagramFrame";
import { TBeamCrossSection } from "@/components/calculators/flexural-design/t-beam-design/TBeamCrossSection";
import type { TBeamDesignInput, TBeamDesignResult } from "@/lib/t-beam";
import { tBeamAnalysisHref } from "@/lib/t-beam-design-transfer";

const REBAR_BLUE = "#60bfff";

export function TBeamDesignResultView({
  result,
  input,
}: {
  result: TBeamDesignResult;
  input: TBeamDesignInput;
}) {
  const tensionSchedule = result.tensionLayers.map((layer) => layer.barCount).join(" + ");
  const compressionSchedule = result.compressionLayers.map((layer) => layer.barCount).join(" + ");
  const cover = input.clearCover ?? 40;
  const stirrup = input.stirrupDiameter ?? 10;
  const insideWidth = input.bw - 2 * (cover + stirrup);
  const rounded = (value: number, digits = 2) => value.toFixed(digits);

  return (
    <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5" aria-label="T-beam flexural design result">
      <div className={"rounded-lg border px-4 py-3 " + (result.ok
        ? "border-[#39c98a]/40 bg-[#39c98a]/10"
        : "border-[#e05353]/40 bg-[#e05353]/10")}>
        <p className={"text-xs font-bold " + (result.ok
          ? "text-[#21875c] dark:text-[#39c98a]"
          : "text-[#e05353]")}>{result.ok ? "DESIGN COMPLETE" : "DESIGN NOT FEASIBLE"}</p>
        <p className="mt-1 text-sm font-semibold">
          {result.ok
            ? (result.sectionType === "doubly" ? "Doubly" : "Singly") +
              " reinforced T-beam: use " + result.barsRequired + "–" +
              result.tensionLayers[0].diameter + " mm tension bars" +
              (result.compressionBarsRequired > 0
                ? " and " + result.compressionBarsRequired + "–" +
                  result.compressionBarDiameter + " mm compression bars." : ".")
            : result.message}
        </p>
      </div>

      <div className="mt-4">
        <DiagramFrame
          title="Flexural reinforcement design"
          legend={<>
            <DiagramLegend color={REBAR_BLUE} label="Bottom tension steel" dot />
            {result.compressionBarsRequired > 0 && <DiagramLegend color={REBAR_BLUE} label="Top compression steel" dot />}
            <DiagramLegend color="var(--text-muted)" label="Stirrup envelope" dashed />
            <DiagramLegend color="#f5941f" label="Concrete compression block" />
          </>}
        >
          <div className="grid min-w-[620px] gap-3 lg:grid-cols-[minmax(390px,1.1fr)_minmax(280px,.9fr)]">
            <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
              <h3 className="text-xs font-bold">T-beam cross-section</h3>
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Adopted bar counts and layers within the web, flange, and compression block.
              </p>
              <TBeamCrossSection
                beff={result.beff}
                bw={input.bw}
                hf={input.hf}
                d={input.d}
                a={result.a}
                ok={result.ok}
                barDiameter={result.tensionLayers[0].diameter}
                sectionCase={result.sectionCase}
                cover={cover}
                stirrup={stirrup}
                tensionLayers={result.tensionLayers}
                compressionLayers={result.compressionLayers}
              />
            </section>
            <div className="grid content-start gap-3">
              <SmallCard title="Design steel breakdown">
                {result.sectionType === "singly" ? (
                  <div className="mt-2 rounded-md border border-[#f5941f]/35 bg-[#f5941f]/10 p-3">
                    <p className="text-[11px] font-bold">Singly reinforced design</p>
                    <p className="mt-1 text-[10px]">Required tension steel: <strong>{rounded(result.asRequired, 1)} mm²</strong></p>
                  </div>
                ) : (
                  <>
                    <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
                      <DesignPart title="Beam 1" subtitle="T-beam concrete compression" lines={[
                        "Trial singly capacity: " + rounded(result.singlyTrialPhiMn) + " kN·m",
                        "Trial tension steel: " + rounded(result.asTensionControlledMax, 1) + " mm²",
                      ]} />
                      <span className="flex items-center text-lg font-bold text-[var(--text-muted)]">+</span>
                      <DesignPart title="Beam 2" subtitle="Additional steel couple" lines={[
                        "Additional tension: " + rounded(result.asAdditionalTension, 1) + " mm²",
                        "Trial compression: " + rounded(result.asCompressionCalculated, 1) + " mm²",
                      ]} />
                    </div>
                    <p className="mt-2 rounded-md bg-[#f5941f]/10 px-3 py-2 text-[10px]">
                      Adopted bars are rechecked by strain compatibility; the final force and moment results are below.
                    </p>
                  </>
                )}
              </SmallCard>
              <SmallCard title="Adopted bar schedule">
                <ScheduleRow label="Bottom tension" count={result.barsRequired}
                  diameter={result.tensionLayers[0].diameter} layers={tensionSchedule}
                  area={result.asProvided} />
                {result.compressionBarsRequired > 0 && <ScheduleRow label="Top compression"
                  count={result.compressionBarsRequired} diameter={result.compressionBarDiameter}
                  layers={compressionSchedule} area={result.asCompression} />}
              </SmallCard>
              <SmallCard title="Spacing and fit" badge={result.spacingOk ? "PASS" : "REVISE"}>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Metric label="Width inside stirrups" value={rounded(insideWidth, 1) + " mm"} />
                  <Metric label="Minimum clear gap" value={rounded(result.minClearSpacingRequired, 1) + " mm"} />
                </div>
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                  Tension layers: {tensionSchedule}; {result.clearSpacing === null
                    ? "one bar per row"
                    : "horizontal clear gap = " + rounded(result.clearSpacing, 1) + " mm"}.
                  {result.compressionBarsRequired > 0 && " Compression layers: " + compressionSchedule + "."}
                </p>
                {!result.spacingOk && <p className="mt-2 text-[10px] text-[#e05353]">{result.spacingMessage}</p>}
              </SmallCard>
            </div>
          </div>
        </DiagramFrame>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ResultGroup title="Required design steel">
          <ResultRow label="Design type" value={result.sectionType === "doubly" ? "Doubly reinforced" : "Singly reinforced"} bold />
          <ResultRow label="Trial target tension strain" value={rounded(result.targetTensionStrain, 5)} />
          <ResultRow label="Minimum steel, As,min" value={rounded(result.asMin, 1) + " mm²"} />
          <ResultRow label="Preliminary tension steel, As,calc" value={rounded(result.asCalculated, 1) + " mm²"} />
          <ResultRow label={result.sectionType === "doubly" ? "Adopted tension area for final check" : "Required tension steel, As"}
            value={rounded(result.asRequired, 1) + " mm²"} bold />
          {result.sectionType === "doubly" && <>
            <ResultRow label="Additional tension steel, As,2" value={rounded(result.asAdditionalTension, 1) + " mm²"} />
            <ResultRow label="Trial compression steel, As′,calc" value={rounded(result.asCompressionCalculated, 1) + " mm²"} />
            <ResultRow label="Compression steel at trial" value={result.compressionDesignStress >= input.fy - 1e-9 ? "Yields" : "Does not yield"} />
          </>}
          <ResultRow label="Singly trial strength, φMn" value={rounded(result.singlyTrialPhiMn) + " kN·m"} />
        </ResultGroup>
        <ResultGroup title="Adopted reinforcement and strength">
          <ResultRow label="Bottom tension bars" value={result.barsRequired + "–" + result.tensionLayers[0].diameter + " mm (" + tensionSchedule + " by layer)"} bold />
          <ResultRow label="Provided tension area" value={rounded(result.asProvided, 1) + " mm²"} />
          {result.compressionBarsRequired > 0 && <>
            <ResultRow label="Top compression bars" value={result.compressionBarsRequired + "–" + result.compressionBarDiameter + " mm (" + compressionSchedule + " by layer)"} bold />
            <ResultRow label="Provided compression area" value={rounded(result.asCompression, 1) + " mm²"} />
            <ResultRow label="Compression steel depth, d′" value={rounded(result.dPrime, 1) + " mm"} />
            <ResultRow label="Final compression stress by layer" value={result.compressionLayers.map((layer) => rounded(layer.stress, 1) + " MPa").join(" / ")} />
          </>}
          <ResultRow label="Effective depth, d" value={rounded(input.d, 1) + " mm"} />
          <ResultRow label="Final tension strain, εt" value={rounded(result.epsilonT, 5)} />
          <ResultRow label="Strength factor, φ" value={rounded(result.phi, 3)} />
          <ResultRow label="Nominal capacity, Mn" value={rounded(result.Mn) + " kN·m"} />
          <ResultRow label="Design capacity, φMn" value={rounded(result.phiMn) + " kN·m"} bold />
          <ResultRow label="Required moment, Mu" value={rounded(input.Mu) + " kN·m"} />
        </ResultGroup>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <ResultGroup title="Effective flange geometry">
          <ResultRow label="Width source" value={result.flangeWidthMode === "given" ? "Given bf" : "Calculated from left and right clear spacing"} />
          <ResultRow label="Effective flange width, bf" value={rounded(result.beff, 1) + " mm"} bold />
          <ResultRow label="Web width, bw" value={rounded(input.bw, 1) + " mm"} />
          <ResultRow label="Flange thickness, hf" value={rounded(input.hf, 1) + " mm"} />
          {result.flangeWidthMode === "calculated" && <>
            <ResultRow label="Left effective overhang" value={rounded(result.leftOverhang!, 1) + " mm"} />
            <ResultRow label="Right effective overhang" value={rounded(result.rightOverhang!, 1) + " mm"} />
            <ResultRow label="Each-side span limit, ln/8" value={rounded(result.spanLimit!, 1) + " mm"} />
            <ResultRow label="Each-side thickness limit, 8hf" value={rounded(result.thicknessLimit!, 1) + " mm"} />
            <ResultRow label="Left spacing limit, sw,L/2" value={rounded(result.leftSpacingLimit!, 1) + " mm"} />
            <ResultRow label="Right spacing limit, sw,R/2" value={rounded(result.rightSpacingLimit!, 1) + " mm"} />
          </>}
        </ResultGroup>
        <ResultGroup title="Final section checks">
          <ResultRow label="Compression-block depth, a" value={rounded(result.a, 1) + " mm"} />
          <ResultRow label="Neutral-axis depth, c" value={rounded(result.c, 1) + " mm"} />
          <ResultRow label="Stress-block factor, β1" value={rounded(result.beta1, 3)} />
          <ResultRow label="Compression-block case" value={result.sectionCase === "flange" ? "Within flange" : "Flange and web"} bold />
          <ResultRow label="Moment strength" value={result.phiMn >= input.Mu ? "PASS" : "FAIL"} bold />
          <ResultRow label="Tension spacing" value={result.spacingOk ? "PASS" : "REVISE"} />
          {result.compressionBarsRequired > 0 && <ResultRow label="Compression rows" value={result.compressionLayers.map((layer) =>
            layer.barCount + " bars at " + rounded(layer.depth, 1) + " mm (" +
            (Math.abs(layer.stress) >= input.fy - 1e-9 ? "yield" : "elastic") + ")"
          ).join("; ")} />}
        </ResultGroup>
      </div>

      <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
        <p className="text-xs font-semibold">Continue with section analysis</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
          Use the adopted flange geometry and bar layers in T-Beam Analysis to review the final
          neutral axis, steel stresses, and moment capacity independently.
        </p>
        {result.ok ? <Link href={tBeamAnalysisHref(input, result)}
          className="mt-3 inline-flex rounded-md border border-[#f5941f]/50 px-3 py-2 text-xs font-semibold text-[#f5941f] hover:bg-[#f5941f]/10">
          Analyze this design in T-Beam Analysis
        </Link> : <p className="mt-2 text-[10px] text-[var(--text-muted)]">
          Complete a feasible design before transferring its adopted bars to analysis.
        </p>}
      </div>
    </section>
  );
}

function SmallCard({ title, badge, children }: { title: string; badge?: string; children: ReactNode }) {
  return <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">{title}</h3>
      {badge && <span className={"rounded-full px-2 py-1 text-[9px] font-bold " +
        (badge === "PASS" ? "bg-[#39c98a]/15 text-[#21875c] dark:text-[#39c98a]" : "bg-[#e05353]/15 text-[#e05353]")}>{badge}</span>}
    </div>
    {children}
  </section>;
}

function DesignPart({ title, subtitle, lines }: { title: string; subtitle: string; lines: string[] }) {
  return <div className="rounded-md border border-[var(--border)] p-2">
    <p className="text-[11px] font-bold">{title}</p>
    <p className="text-[9px] text-[var(--text-muted)]">{subtitle}</p>
    {lines.map((line) => <p key={line} className="mt-1 text-[10px]">{line}</p>)}
  </div>;
}

function ScheduleRow({ label, count, diameter, layers, area }: {
  label: string; count: number; diameter: number; layers: string; area: number;
}) {
  return <div className="mt-2 flex gap-2 rounded-md border border-[var(--border)] p-2">
    <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#60bfff]" />
    <div>
      <p className="text-[11px] font-bold">{label}: {count}–{diameter} mm</p>
      <p className="text-[10px] text-[var(--text-muted)]">Layers: {layers} · Provided area: {area.toFixed(1)} mm²</p>
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-[var(--bg-surface)] p-2">
    <p className="text-[9px] text-[var(--text-muted)]">{label}</p>
    <p className="mt-0.5 text-[11px] font-bold">{value}</p>
  </div>;
}

function ResultGroup({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
    <h3 className="mb-2 text-xs font-bold">{title}</h3>
    {children}
  </section>;
}

function ResultRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return <div className="grid grid-cols-1 gap-1 border-b border-[var(--border)] py-2 text-[11px] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 last:border-b-0">
    <span className="text-[var(--text-muted)]">{label}</span>
    <span className={"break-words sm:text-right " + (bold ? "font-bold" : "")}>{value}</span>
  </div>;
}
