import { DiagramFrame, DiagramSurface, DiagramLegend } from "@/components/DiagramFrame";
import { useId } from "react";
import type { ColumnTiesInput, ColumnTiesResult } from "@/lib/column-ties-check";

export function ColumnTiesDiagram({ input, result, onToggle }: { input: ColumnTiesInput; result: ColumnTiesResult; onToggle?: (id: string) => void }) {
  const id = useId().replace(/:/g, "");
  const width = input.mode === "rectilinear" ? input.b : input.diameter;
  const depth = input.mode === "rectilinear" ? input.h : input.diameter;
  const scale = Math.min(210 / width, 195 / depth);
  const x = 135 - width * scale / 2;
  const y = 145 - depth * scale / 2;
  const cover = result.cover * scale;
  const failIds = new Set(result.supportChecks.filter((bar) => !bar.distanceOk || !bar.alternateOk || (bar.corner && !bar.supported)).map((bar) => bar.id));
  const interactive = input.mode === "rectilinear" && !!onToggle;
  return <DiagramFrame legend={<><DiagramLegend color="var(--purple)" label="Transverse reinforcement" /><DiagramLegend color="var(--green)" label="Supported bar" dot /><DiagramLegend color="var(--red)" label="Support failure" dot /></>}>
    <div className="grid gap-3 sm:grid-cols-2">
      <svg viewBox="0 0 280 280" className="mx-auto h-auto w-full max-w-[350px]" role={interactive ? "group" : "img"} aria-label={interactive ? "Select the longitudinal bars supported by tie corners" : `${result.modeLabel} cross section`}>
        <DiagramSurface width={280} height={280} />
        <text x="140" y="20" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text)">Cross section · {result.barCount} bars</text>
        {input.mode === "rectilinear" ? <>
          <rect x={x} y={y} width={width * scale} height={depth * scale} fill="var(--bg-surface)" stroke="var(--text)" strokeWidth="1.5" />
          <rect x={x + cover + input.transverseDiameter * scale / 2} y={y + cover + input.transverseDiameter * scale / 2} width={(width - 2 * result.cover - input.transverseDiameter) * scale} height={(depth - 2 * result.cover - input.transverseDiameter) * scale} rx="5" fill="none" stroke="var(--purple)" strokeWidth={Math.max(2, input.transverseDiameter * scale)} strokeDasharray={input.closedTie === false ? "6 5" : undefined} />
        </> : <>
          <circle cx="135" cy="145" r={width * scale / 2} fill="var(--bg-surface)" stroke="var(--text)" strokeWidth="1.5" />
          <circle cx="135" cy="145" r={(width / 2 - result.cover - input.transverseDiameter / 2) * scale} fill="none" stroke="var(--purple)" strokeWidth={Math.max(2, input.transverseDiameter * scale)} />
        </>}
        {result.bars.map((bar) => {
          const color = failIds.has(bar.id) ? "var(--red)" : bar.supported ? "var(--green)" : "var(--blue)";
          return <g key={bar.id} role={interactive ? "button" : undefined} tabIndex={interactive ? 0 : undefined} aria-label={`${bar.id}${bar.corner ? " corner" : ""}: ${bar.supported ? "supported" : "not directly supported"}`} aria-pressed={interactive ? bar.supported : undefined} onClick={interactive ? () => onToggle!(bar.id) : undefined} onKeyDown={interactive ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle!(bar.id); } } : undefined} className={interactive ? "cursor-pointer focus:outline-2 focus:outline-[var(--orange)]" : undefined}>
            <title>{bar.id}: {bar.supported ? "direct lateral support marked" : "check distance to supported bars"}</title>
            <circle cx={x + bar.x * scale} cy={y + bar.y * scale} r={Math.max(8, input.longitudinalDiameter * scale / 2 + 3)} fill="transparent" />
            <circle cx={x + bar.x * scale} cy={y + bar.y * scale} r={Math.max(4, input.longitudinalDiameter * scale / 2)} fill={color} stroke="var(--bg-surface)" strokeWidth="1" />
            <text x={x + bar.x * scale} y={y + bar.y * scale - 11} textAnchor="middle" fontSize="8" fill="var(--text)">{bar.id}</text>
          </g>;
        })}
        <text x="140" y="262" textAnchor="middle" fontSize="10" fill="var(--text-muted)">{input.mode === "rectilinear" ? `${input.b} × ${input.h} mm` : `D = ${input.diameter} mm`}{input.mode === "spiral" ? ` · dc = ${input.coreDiameter} mm` : ` · cover = ${result.cover} mm`}</text>
      </svg>
      <svg viewBox="0 0 280 280" className="mx-auto h-auto w-full max-w-[350px]" role="img" aria-label={`Elevation showing ${input.spacing} mm center spacing and ${result.clearSpacing.toFixed(2)} mm clear gap`}>
        <defs><marker id={`${id}-arrow`} markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto-start-reverse"><path d="M0,0 L6,3 L0,6 Z" fill="var(--text-muted)" /></marker></defs>
        <DiagramSurface width={280} height={280} />
        <text x="140" y="20" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text)">Elevation (schematic)</text>
        <rect x="45" y="40" width="130" height="192" fill="var(--bg-surface)" stroke="var(--border)" />
        {[65, 155].map((barX) => <line key={barX} x1={barX} x2={barX} y1="43" y2="229" stroke="var(--green)" strokeWidth="4" />)}
        {input.mode === "spiral" ? <path d="M58,61 C58,43 162,43 162,61 S58,85 58,99 S162,123 162,137 S58,161 58,175 S162,199 162,213" fill="none" stroke="var(--purple)" strokeWidth="4" /> : [60, 108, 156, 204].map((tieY) => <rect key={tieY} x="57" y={tieY} width="108" height="8" rx="4" fill="none" stroke="var(--purple)" strokeWidth="3" />)}
        <line x1="193" x2="193" y1="64" y2="112" stroke="var(--text-muted)" markerStart={`url(#${id}-arrow)`} markerEnd={`url(#${id}-arrow)`} />
        <text x="204" y="85" fontSize="9" fill="var(--text)">s = {input.spacing}</text><text x="204" y="100" fontSize="9" fill="var(--text-muted)">mm c/c</text>
        <text x="140" y="250" textAnchor="middle" fontSize="10" fill="var(--text-muted)">Clear gap = {input.spacing} − {input.transverseDiameter} = {result.clearSpacing.toFixed(2)} mm</text>
        <text x="140" y="267" textAnchor="middle" fontSize="9" fill="var(--text-muted)">Purple: {input.mode === "spiral" ? "spiral" : "ties"} · Green: longitudinal bars</text>
      </svg>
    </div>
    <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{interactive ? "Click a bar (or press Enter) to mark or remove direct lateral support. Green = marked supported; blue = unmarked but within the limits; red = a support-rule failure. Marked non-corner bars require qualifying cross-ties or supplemental tie corners on your drawing; their connections are not inferred." : "Longitudinal bars are equally spaced on a ring inside the transverse reinforcement. The sketch does not verify laps, hooks, or splices; confirm these from the drawing."}</p>
  </DiagramFrame>;
}
