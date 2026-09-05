import { DiagramFrame, DiagramLegend, diagramSvgClass } from "@/components/DiagramFrame";
import { useId } from "react";
import type { SlabProblemResult } from "@/lib/one-way-slab";

export function OneWaySlabDiagram({ problem: result }: { problem: SlabProblemResult }) {
  const id = useId().replace(/:/g, "");
  const { problem } = result;
  const scale = 550 / (problem.exteriorSpacing + problem.interiorSpacing);
  const a = 60;
  const b = a + problem.exteriorSpacing * scale;
  const c = 610;
  const beam = Math.max(10, problem.beamWidth / 1000 * scale);
  const end = result.spans[0].result;
  const interior = result.spans[1].result;
  const continues = problem.spanCount > 2;
  return (
    <DiagramFrame legend={<><DiagramLegend color="var(--green)" label="Bottom bars" /><DiagramLegend color="var(--purple)" label="Top bars" /><DiagramLegend color="var(--orange)" label="Factored load" /></>}>
      <h2 className="mb-2 text-sm font-bold">Slab section — like the problem figure</h2>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 680 320" role="img" aria-label={`Continuous slab with ${problem.exteriorSpacing} m and ${problem.interiorSpacing} m beam spacings, ${problem.beamWidth} mm beams, and ${result.thickness} mm slab thickness`} className={diagramSvgClass}>
          <defs>
            <marker id={`${id}-arrow`} markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto-start-reverse"><path d="M0,0 L6,3 L0,6 Z" fill="context-stroke" /></marker>
          </defs>
          <rect x="12" y="12" width="656" height="292" rx="6" fill="var(--bg)" stroke="var(--border)" />
          <text x="340" y="34" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text)">1 m slab strip · h = {result.thickness} mm · d = {end.d.toFixed(1)} mm</text>
          <text x="340" y="53" textAnchor="middle" fontSize="10" fill="var(--orange)">wu = {end.stripLoad.toFixed(3)} kN/m (includes slab self-weight)</text>
          <line x1={a} x2={c} y1="64" y2="64" stroke="var(--orange)" />
          {Array.from({ length: 12 }, (_, index) => <line key={index} x1={a + index * 50} x2={a + index * 50} y1="64" y2="89" stroke="var(--orange)" markerEnd={`url(#${id}-arrow)`} />)}
          <path d={`M ${a - beam / 2} 96 H ${continues ? 650 : c + beam / 2} V 120 H ${c + beam / 2} V 156 H ${c - beam / 2} V 120 H ${b + beam / 2} V 156 H ${b - beam / 2} V 120 H ${a + beam / 2} V 156 H ${a - beam / 2} Z`} fill="var(--bg-surface)" stroke="var(--text)" strokeWidth="1.5" />
          {continues && <path d="M650,95 l-5,6 l10,6 l-5,6 v8" fill="none" stroke="var(--text-muted)" />}
          <line x1={a + (b - a) * 0.25} x2={a + (b - a) * 0.75} y1="114" y2="114" stroke="var(--green)" strokeWidth="3" />
          <line x1={b + (c - b) * 0.25} x2={b + (c - b) * 0.75} y1="114" y2="114" stroke="var(--green)" strokeWidth="3" />
          {problem.endSupport !== "unrestrained" && <line x1={a - beam / 4} x2={a + 70} y1="102" y2="102" stroke="var(--purple)" strokeWidth="3" />}
          <line x1={b - 70} x2={b + 70} y1="102" y2="102" stroke="var(--purple)" strokeWidth="3" />
          {(continues || problem.endSupport !== "unrestrained") && <line x1={c - 70} x2={continues ? c + 35 : c + beam / 4} y1="102" y2="102" stroke="var(--purple)" strokeWidth="3" />}
          {[{ x: a, label: "A" }, { x: b, label: "B" }, { x: c, label: "C" }].map(({ x, label }) => <g key={label}><line x1={x} x2={x} y1="158" y2="217" stroke="var(--text-muted)" strokeDasharray="3 3" /><text x={x} y="174" textAnchor="middle" fontSize="10" fill="var(--text)">{label}</text></g>)}
          {[{ from: a, to: b, spacing: problem.exteriorSpacing, clear: result.exteriorClear, label: "End span" }, { from: b, to: c, spacing: problem.interiorSpacing, clear: result.interiorClear, label: continues ? "Interior span" : "Second end span" }].map((span) => <g key={span.label}>
            <line x1={span.from} x2={span.to} y1="207" y2="207" stroke="var(--text-muted)" markerStart={`url(#${id}-arrow)`} markerEnd={`url(#${id}-arrow)`} />
            <text x={(span.from + span.to) / 2} y="195" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text)">{span.spacing} m center to center</text>
            <text x={(span.from + span.to) / 2} y="238" textAnchor="middle" fontSize="11" fill="var(--text-muted)">{span.label} · clear = {span.clear.toFixed(3)} m</text>
          </g>)}
          <text x="340" y="263" textAnchor="middle" fontSize="10" fill="var(--text-muted)">Typical beam width = {problem.beamWidth} mm · beam widths equal</text>
          <text x="340" y="283" textAnchor="middle" fontSize="10" fill="var(--green)">Bottom bars: end Ø{problem.barDiameter} @ {end.designs[0].spacingProvided} mm · {continues ? "interior" : "second"} Ø{problem.barDiameter} @ {interior.designs[0].spacingProvided} mm</text>
        </svg>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">Green = bottom bars. Purple = top bars over supports. {continues ? "The slab continues beyond the section shown." : "The slab ends at A and C."} Bar lengths and beam depths are schematic; spacing recommendations are listed below.</p>
    </DiagramFrame>
  );
}
