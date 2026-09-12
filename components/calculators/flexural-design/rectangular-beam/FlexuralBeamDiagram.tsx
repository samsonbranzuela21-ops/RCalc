import { DiagramFrame, DiagramLegend, DiagramSurface } from "@/components/shared/DiagramFrame";
import { InlineKatex } from "@/components/shared/Katex";
import type { FlexuralBeamResult, ReinforcementLayerResult } from "@/lib/flexural-beam";

const REBAR_BLUE = "#60bfff";

export function FlexuralBeamDiagram({ result }: { result: FlexuralBeamResult }) {
  return <DiagramFrame
    title="Flexural reinforcement design"
    legend={<><DiagramLegend color={REBAR_BLUE} label="Bottom tension steel" dot />{result.compressionBarsRequired > 0 && <DiagramLegend color={REBAR_BLUE} label="Top compression steel" dot />}<DiagramLegend color="var(--text-muted)" label="Stirrup envelope" dashed /></>}
  >
    <div className="grid min-w-[620px] gap-3 lg:grid-cols-[minmax(390px,1.1fr)_minmax(280px,.9fr)]">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
        <h3 className="text-xs font-bold">Beam cross-section</h3>
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">Actual bar counts, layers, cover envelope, and reinforcement centroids.</p>
        <SectionSketch result={result} />
      </section>

      <div className="grid content-start gap-3">
        <DesignBreakdown result={result} />
        <BarSchedule result={result} />
        <SpacingSummary result={result} />
      </div>
    </div>
  </DiagramFrame>;
}

function SectionSketch({ result }: { result: FlexuralBeamResult }) {
  const width = Math.max(result.input.b, 1);
  const height = Math.max(result.input.h, 1);
  const left = 145;
  const top = 48;
  const drawW = 210;
  const drawH = 330;
  const sx = drawW / width;
  const sy = drawH / height;
  const stirrupInsetX = (result.input.cover + result.input.stirrupDiameter / 2) * sx;
  const stirrupInsetY = (result.input.cover + result.input.stirrupDiameter / 2) * sy;
  const layers = [...result.tensionLayers, ...result.compressionLayers];

  return <svg viewBox="0 0 500 430" className="mt-2 block h-auto w-full" role="img" aria-label="Designed rectangular beam reinforcement cross-section">
    <defs><marker id="design-arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse"><path d="M0,0 L7,3.5 L0,7 z" fill="var(--text-muted)" /></marker></defs>
    <DiagramSurface width={500} height={430} />
    <rect x={left} y={top} width={drawW} height={drawH} rx="2" fill="var(--bg-surface)" stroke="var(--text)" strokeWidth="2" />
    <rect x={left + stirrupInsetX} y={top + stirrupInsetY} width={Math.max(0, drawW - 2 * stirrupInsetX)} height={Math.max(0, drawH - 2 * stirrupInsetY)} rx="2" fill="none" stroke="var(--text-muted)" strokeDasharray="5 4" />

    {result.ok ? layers.map((layer, layerIndex) =>
      layer.xCentres.map((x, index) => <circle key={`${layerIndex}-${index}`} cx={left + x * sx} cy={top + layer.yFromCompressionFace * sy} r={Math.max(5, layer.barDiameter * Math.min(sx, sy) / 2)} fill={REBAR_BLUE} stroke="var(--bg)" strokeWidth="1.5" />)
    ) : <text x="250" y="215" textAnchor="middle" fill="var(--text-muted)" fontSize="11">No feasible bar layout</text>}

    <Dimension x1={left} y1={28} x2={left + drawW} y2={28} label={`b = ${f(result.input.b, 0)} mm`} />
    <Dimension x1={112} y1={top} x2={112} y2={top + drawH} label={`h = ${f(result.input.h, 0)} mm`} vertical />
    {result.ok && <>
      <Dimension x1={388} y1={top} x2={388} y2={top + result.d * sy} label={`d = ${f(result.d, 1)} mm`} vertical />
      {result.dPrime !== null && result.compressionBarsRequired > 0 && <Dimension x1={430} y1={top} x2={430} y2={top + result.dPrime * sy} label={`d′ = ${f(result.dPrime, 1)} mm`} vertical />}
      <line x1={left - 8} y1={top + result.d * sy} x2={left + drawW + 8} y2={top + result.d * sy} stroke={REBAR_BLUE} strokeDasharray="4 4" />
      <text x={left + 6} y={top + result.d * sy - 7} fill={REBAR_BLUE} fontSize="9">tension-steel centroid</text>
      {result.dPrime !== null && result.compressionBarsRequired > 0 && <><line x1={left - 8} y1={top + result.dPrime * sy} x2={left + drawW + 8} y2={top + result.dPrime * sy} stroke={REBAR_BLUE} strokeDasharray="4 4" /><text x={left + 6} y={top + result.dPrime * sy - 7} fill={REBAR_BLUE} fontSize="9">compression-steel centroid</text></>}
    </>}
    <text x="250" y="410" textAnchor="middle" fill="var(--text-muted)" fontSize="9">Drawing is proportional to the entered section dimensions.</text>
  </svg>;
}

function Dimension({ x1, y1, x2, y2, label, vertical = false }: { x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean }) {
  return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-muted)" strokeWidth="1" markerStart="url(#design-arrow)" markerEnd="url(#design-arrow)" />{vertical ? <text x={x1 - 8} y={(y1 + y2) / 2} textAnchor="middle" fill="var(--text-muted)" fontSize="9" transform={`rotate(-90 ${x1 - 8} ${(y1 + y2) / 2})`}>{label}</text> : <text x={(x1 + x2) / 2} y={y1 - 7} textAnchor="middle" fill="var(--text-muted)" fontSize="9">{label}</text>}</g>;
}

function DesignBreakdown({ result }: { result: FlexuralBeamResult }) {
  return <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Design steel breakdown</p>
    {result.sectionType === "singly" ? <div className="mt-2 rounded-md border border-[#f5941f]/35 bg-[#f5941f]/10 p-3"><p className="text-xs font-bold">Singly reinforced design</p><p className="mt-1 text-[11px]">Required tension steel: <strong><InlineKatex math={`A_s=${f(result.asRequired, 1)}\\text{ mm}^2`} /></strong></p></div> : <>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        <DesignPart title="Beam 1" subtitle="Singly reinforced portion" equations={[`A_{s1}=${f(result.asSinglyPortion, 1)}\\text{ mm}^2`, `M_{n1}=${f(result.mnSingly, 2)}\\text{ kN}\\cdot\\text{m}`]} />
        <div className="flex items-center text-lg font-bold text-[var(--text-muted)]">+</div>
        <DesignPart title="Beam 2" subtitle="Steel couple" equations={[`A_{s2}=${f(result.asAdditionalTension, 1)}\\text{ mm}^2`, `A'_s=${f(result.asCompression, 1)}\\text{ mm}^2`]} />
      </div>
      <div className="mt-2 rounded-md bg-[#f5941f]/10 px-3 py-2 text-[11px]"><strong>Total bottom steel: </strong><InlineKatex math={`A_s=A_{s1}+A_{s2}=${f(result.asRequired, 1)}\\text{ mm}^2`} /></div>
    </>}
  </section>;
}

function DesignPart({ title, subtitle, equations }: { title: string; subtitle: string; equations: string[] }) {
  return <div className="rounded-md border border-[var(--border)] p-2"><p className="text-xs font-bold">{title}</p><p className="text-[9px] text-[var(--text-muted)]">{subtitle}</p>{equations.map((equation) => <div key={equation} className="mt-1 overflow-x-auto text-[10px] font-semibold"><InlineKatex math={equation} /></div>)}</div>;
}

function BarSchedule({ result }: { result: FlexuralBeamResult }) {
  return <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Adopted bar schedule</p>
    <ScheduleRow color={REBAR_BLUE} label="Bottom tension" layers={result.tensionLayers} diameter={result.input.barDiameter} area={result.asProvided} />
    {result.compressionBarsRequired > 0 && <ScheduleRow color={REBAR_BLUE} label="Top compression" layers={result.compressionLayers} diameter={result.input.compressionBarDiameter} area={result.compressionBarsRequired * result.compressionBarArea} />}
  </section>;
}

function ScheduleRow({ color, label, layers, diameter, area }: { color: string; label: string; layers: ReinforcementLayerResult[]; diameter: number; area: number }) {
  const total = layers.reduce((sum, layer) => sum + layer.count, 0);
  return <div className="mt-2 flex gap-2 rounded-md border border-[var(--border)] p-2"><span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} /><div><p className="text-[11px] font-bold">{label}: {total}–{diameter} mm</p><p className="text-[10px] text-[var(--text-muted)]">Layers: {layers.map((layer) => layer.count).join(" + ") || "—"} · Provided area: {f(area, 1)} mm²</p></div></div>;
}

function SpacingSummary({ result }: { result: FlexuralBeamResult }) {
  return <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
    <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Spacing and fit</p><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${result.spacingOk && result.verticalSpacingOk ? "bg-[#39c98a]/15 text-[#21875c] dark:text-[#39c98a]" : "bg-[#e05353]/15 text-[#e05353]"}`}>{result.spacingOk && result.verticalSpacingOk ? "PASS" : "REVISE"}</span></div>
    <div className="mt-2 grid grid-cols-2 gap-2"><Metric label="Width inside stirrups" value={`${f(result.insideWidth, 1)} mm`} /><Metric label="Minimum clear gap" value={`${f(result.minClearSpacingRequired, 2)} mm`} /></div>
    {result.tensionLayers.map((layer) => <p key={layer.index} className="mt-2 text-[10px] text-[var(--text-muted)]">Bottom layer {layer.index}: {layer.count} bar{layer.count === 1 ? "" : "s"}; {layer.clearSpacing === null ? "no horizontal interbar gap" : `clear gap = ${f(layer.clearSpacing, 2)} mm`}{layer.verticalClearSpacingToNext !== null ? `; vertical clear gap = ${f(layer.verticalClearSpacingToNext, 1)} mm` : ""}.</p>)}
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-md bg-[var(--bg-surface)] p-2"><p className="text-[9px] text-[var(--text-muted)]">{label}</p><p className="mt-0.5 text-[11px] font-bold">{value}</p></div>; }
function f(value: number | null | undefined, digits = 2) { return value !== null && value !== undefined && Number.isFinite(value) ? value.toFixed(digits) : "—"; }
