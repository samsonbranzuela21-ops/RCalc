import type { OneWaySlabResult, SlabSupportCondition } from "@/lib/one-way-slab";

export function OneWaySlabDiagram({ result, supportCondition, span, h }: { result: OneWaySlabResult; supportCondition: SlabSupportCondition; span: number; h: number }) {
  const supports = supportCondition === "cantilever" ? "Fixed support" : supportCondition === "simply-supported" ? "Simple supports" : "Continuous supports";
  const slabLeft = 110;
  const slabRight = 610;
  const slabTop = 92;
  const slabBottom = 114;

  function PinSupport({ x }: { x: number }) {
    return <polygon points={`${x},${slabBottom} ${x - 16},${slabBottom + 26} ${x + 16},${slabBottom + 26}`} fill="var(--text-muted)" />;
  }

  function FixedSupport({ x, side }: { x: number; side: "left" | "right" }) {
    return (
      <g>
        <rect x={side === "left" ? x - 9 : x} y={slabTop - 16} width="9" height="64" fill="var(--text-muted)" />
        {Array.from({ length: 7 }, (_, index) => {
          const y = slabTop - 12 + index * 9;
          return <line key={y} x1={side === "left" ? x - 9 : x + 9} y1={y} x2={side === "left" ? x : x} y2={y + 7} stroke="var(--text-muted)" strokeWidth="1" />;
        })}
      </g>
    );
  }

  function renderSupports() {
    switch (supportCondition) {
      case "cantilever":
        return <FixedSupport x={slabLeft} side="left" />;
      case "one-end-continuous":
        return <><FixedSupport x={slabLeft} side="left" /><PinSupport x={slabRight} /></>;
      case "both-ends-continuous":
        return <><FixedSupport x={slabLeft} side="left" /><FixedSupport x={slabRight} side="right" /></>;
      case "simply-supported":
      default:
        return <><PinSupport x={slabLeft} /><PinSupport x={slabRight} /></>;
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
      <svg viewBox="0 0 720 270" role="img" aria-label="One-way slab span, loading, and reinforcement diagram" className="mx-auto block h-auto min-w-[560px] max-w-[760px]">
        <defs>
          <marker id="slab-load-arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#df5a13" />
          </marker>
          <marker id="slab-dim-arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse">
            <path d="M0,3.5 L7,0 L7,7 Z" fill="var(--text-muted)" />
          </marker>
        </defs>
        <text x="360" y="24" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">1 m design strip — {supports}</text>
        <line x1="110" y1="85" x2="610" y2="85" stroke="#df5a13" strokeWidth="2" markerEnd="url(#slab-load-arrow)" />
        {Array.from({ length: 9 }, (_, index) => {
          const x = 130 + index * 58;
          return <line key={x} x1={x} y1="45" x2={x} y2="78" stroke="#df5a13" strokeWidth="1.5" markerEnd="url(#slab-load-arrow)" />;
        })}
        <text x="360" y="43" textAnchor="middle" fontSize="10" fill="#df5a13">wᵤ = {result.factoredLoad.toFixed(2)} kN/m²</text>
        <rect x={slabLeft} y={slabTop} width={slabRight - slabLeft} height={slabBottom - slabTop} rx="3" fill="var(--bg)" stroke="var(--text)" strokeWidth="1.5" />
        <line x1={slabLeft + 10} y1="102" x2={slabRight - 10} y2="102" stroke="#f5941f" strokeWidth="3" />
        {renderSupports()}
        <line x1="110" y1="165" x2="610" y2="165" stroke="var(--text-muted)" markerStart="url(#slab-dim-arrow)" markerEnd="url(#slab-dim-arrow)" />
        <text x="360" y="158" textAnchor="middle" fontSize="10" fill="var(--text-muted)">L = {span.toFixed(2)} m</text>
        <line x1="635" y1="92" x2="635" y2="114" stroke="var(--text-muted)" markerStart="url(#slab-dim-arrow)" markerEnd="url(#slab-dim-arrow)" />
        <text x="650" y="106" fontSize="10" fill="var(--text-muted)">h = {h.toFixed(0)} mm</text>
        <circle cx="360" cy="103" r="4" fill="#f5941f" />
        <text x="360" y="210" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">Main bars: {result.spacingProvided.toFixed(0)} mm c/c along span</text>
        <text x="360" y="230" textAnchor="middle" fontSize="10" fill="var(--text-muted)">Design checks: φMn ≥ Mu and φVc ≥ Vu</text>
      </svg>
    </div>
  );
}
