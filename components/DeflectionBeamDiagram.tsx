import type { SupportCondition } from "@/lib/deflection";

interface DeflectionBeamDiagramProps {
  L: number;
  b: number;
  h: number;
  d: number;
  As: number;
  kd: number;
  Icr: number;
  deltaL: number;
  deltaTotal: number;
  supportCondition: SupportCondition;
  barDiameter?: number;
}

export function DeflectionBeamDiagram({
  L,
  b,
  h,
  d,
  As,
  kd,
  Icr,
  deltaL,
  deltaTotal,
  supportCondition,
  barDiameter = 20,
}: DeflectionBeamDiagramProps) {
  const Ab = (Math.PI * barDiameter * barDiameter) / 4;
  const barCount = Math.max(2, Math.ceil(As / Ab));

  // ---------- Cracked cross-section (top) ----------
  const maxDim = Math.max(b, h);
  const sc = 160 / maxDim;
  const rectW = b * sc;
  const rectH = h * sc;
  const secX = 90;
  const secY = 26;

  const naY = secY + kd * sc; // neutral axis position
  const cover = 18 * sc;
  const barY = secY + d * sc;
  const spacing = (rectW - 2 * cover) / (barCount - 1 || 1);
  const barPositions = Array.from({ length: barCount }, (_, i) =>
    barCount === 1 ? secX + rectW / 2 : secX + cover + i * spacing
  );

  // ---------- Deflected shape (bottom) ----------
  const beamX = 40;
  const beamY = 260;
  const beamW = 260;
  const midX = beamX + beamW / 2;
  const sagRatio = Math.min(deltaTotal / (L * 1000 / 240), 1.5);
  const sag = Math.min(30, 8 + sagRatio * 16);

  function FixedSupport({ x, side }: { x: number; side: "left" | "right" }) {
    const hatchLines = Array.from({ length: 5 }, (_, i) => i);
    return (
      <g>
        <line x1={x} y1={beamY - 14} x2={x} y2={beamY + 14} stroke="var(--text)" strokeWidth="2" />
        {hatchLines.map((i) => (
          <line
            key={i}
            x1={x + (side === "left" ? -6 : 6)}
            y1={beamY - 12 + i * 7}
            x2={x}
            y2={beamY - 6 + i * 7}
            stroke="var(--text-muted)"
            strokeWidth="1"
          />
        ))}
      </g>
    );
  }

  function PinSupport({ x }: { x: number }) {
    return (
      <polygon
        points={`${x},${beamY} ${x - 8},${beamY + 14} ${x + 8},${beamY + 14}`}
        fill="var(--text-muted)"
      />
    );
  }

  function renderBeamProfile() {
    switch (supportCondition) {
      case "cantilever": {
        // fixed at left, free tip at right, curvature increases toward tip
        const tipY = beamY + sag * 1.4;
        const path = `M ${beamX} ${beamY} C ${beamX + beamW * 0.5} ${beamY + sag * 0.15}, ${beamX + beamW * 0.85} ${tipY * 0.9}, ${beamX + beamW} ${tipY}`;
        return (
          <>
            {/* fixed wall */}
            <rect x={beamX - 10} y={beamY - 16} width="10" height="32" fill="var(--text-muted)" />
            <line x1={beamX} y1={beamY} x2={beamX + beamW} y2={beamY} stroke="var(--border)" strokeWidth="1" strokeDasharray="4,3" />
            <path d={path} fill="none" stroke="#f5941f" strokeWidth="2.5" />
            <line x1={beamX + beamW} y1={beamY} x2={beamX + beamW} y2={tipY} stroke="#39c98a" strokeWidth="1" strokeDasharray="2,2" />
            <text x={beamX + beamW - 60} y={(beamY + tipY) / 2 - 4} fontSize="10" fill="#39c98a">
              δ = {deltaTotal.toFixed(1)} mm (at tip)
            </text>
          </>
        );
      }
      case "both-ends-continuous": {
        const midY = beamY + sag;
        const path = `M ${beamX} ${beamY} C ${beamX + beamW * 0.22} ${beamY + sag * 0.3}, ${midX - beamW * 0.15} ${midY}, ${midX} ${midY} C ${midX + beamW * 0.15} ${midY}, ${beamX + beamW * 0.78} ${beamY + sag * 0.3}, ${beamX + beamW} ${beamY}`;
        return (
          <>
            <rect x={beamX - 4} y={beamY - 16} width="10" height="32" fill="var(--text-muted)" />
            <rect x={beamX + beamW - 6} y={beamY - 16} width="10" height="32" fill="var(--text-muted)" />
            <line x1={beamX} y1={beamY} x2={beamX + beamW} y2={beamY} stroke="var(--border)" strokeWidth="1" strokeDasharray="4,3" />
            <path d={path} fill="none" stroke="#f5941f" strokeWidth="2.5" />
            <line x1={midX} y1={beamY} x2={midX} y2={midY} stroke="#39c98a" strokeWidth="1" strokeDasharray="2,2" />
            <text x={midX + 8} y={(beamY + midY) / 2} fontSize="10" fill="#39c98a">
              δ = {deltaTotal.toFixed(1)} mm
            </text>
          </>
        );
      }
      case "one-end-continuous": {
        const peakX = midX + beamW * 0.08;
        const peakY = beamY + sag;
        const path = `M ${beamX} ${beamY} Q ${beamX + beamW * 0.35} ${beamY + sag * 0.4}, ${peakX} ${peakY} Q ${peakX + beamW * 0.25} ${peakY}, ${beamX + beamW} ${beamY}`;
        return (
          <>
            <rect x={beamX - 4} y={beamY - 16} width="10" height="32" fill="var(--text-muted)" />
            <PinSupport x={beamX + beamW} />
            <line x1={beamX} y1={beamY} x2={beamX + beamW} y2={beamY} stroke="var(--border)" strokeWidth="1" strokeDasharray="4,3" />
            <path d={path} fill="none" stroke="#f5941f" strokeWidth="2.5" />
            <line x1={peakX} y1={beamY} x2={peakX} y2={peakY} stroke="#39c98a" strokeWidth="1" strokeDasharray="2,2" />
            <text x={peakX + 8} y={(beamY + peakY) / 2} fontSize="10" fill="#39c98a">
              δ = {deltaTotal.toFixed(1)} mm
            </text>
          </>
        );
      }
      case "simply-supported":
      default: {
        const midY = beamY + sag;
        const path = `M ${beamX} ${beamY} Q ${midX} ${midY + sag * 0.5}, ${midX} ${midY} Q ${midX} ${midY + sag * 0.5}, ${beamX + beamW} ${beamY}`;
        return (
          <>
            <PinSupport x={beamX} />
            <PinSupport x={beamX + beamW} />
            <line x1={beamX} y1={beamY} x2={beamX + beamW} y2={beamY} stroke="var(--border)" strokeWidth="1" strokeDasharray="4,3" />
            <path d={path} fill="none" stroke="#f5941f" strokeWidth="2.5" />
            <line x1={midX} y1={beamY} x2={midX} y2={midY} stroke="#39c98a" strokeWidth="1" strokeDasharray="2,2" />
            <text x={midX + 8} y={(beamY + midY) / 2} fontSize="10" fill="#39c98a">
              δ = {deltaTotal.toFixed(1)} mm
            </text>
          </>
        );
      }
    }
  }

  const conditionLabel: Record<SupportCondition, string> = {
    "simply-supported": "Simply supported",
    "one-end-continuous": "One end continuous",
    "both-ends-continuous": "Both ends continuous",
    cantilever: "Cantilever",
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
      <svg viewBox="0 0 360 320" className="mx-auto w-full max-w-[340px]">
      {/* --- Cracked cross-section --- */}
      <text x={secX + rectW / 2} y={secY - 10} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
        Cracked section — b = {b} mm
      </text>

      <rect x={secX} y={secY} width={rectW} height={rectH} fill="none" stroke="var(--text)" strokeWidth="1.5" />

      {/* compression zone shading, top to neutral axis */}
      <rect x={secX} y={secY} width={rectW} height={naY - secY} fill="#4d7cff" opacity="0.15" />

      {/* neutral axis line */}
      <line x1={secX} y1={naY} x2={secX + rectW} y2={naY} stroke="#4d7cff" strokeWidth="1.5" strokeDasharray="3,2" />
      <text x={secX + rectW + 6} y={naY + 3} fontSize="9" fill="#4d7cff">
        N.A. (kd = {kd.toFixed(0)} mm)
      </text>

      {/* tension steel */}
      <line
        x1={barPositions[0]}
        y1={barY}
        x2={barPositions[barPositions.length - 1]}
        y2={barY}
        stroke="var(--text-muted)"
        strokeWidth="1"
        strokeDasharray="3,3"
      />
      {barPositions.map((x, i) => (
        <circle key={i} cx={x} cy={barY} r="4" fill="#f5941f" />
      ))}
      <text x={secX + rectW + 6} y={barY + 3} fontSize="9" fill="var(--text-muted)">
        A_s at d = {d} mm
      </text>

      <text x={secX + rectW / 2} y={secY + rectH + 18} textAnchor="middle" fontSize="10" fill="var(--text)">
        I_cr = {(Icr / 1e6).toFixed(1)} ×10⁶ mm⁴
      </text>

      {/* --- Deflected shape, per support condition --- */}
      <text x={midX} y={beamY - 40} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
        {conditionLabel[supportCondition]} — L = {L} m (exaggerated)
      </text>

      {renderBeamProfile()}

      <text x={midX} y={beamY + 55} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
        δ(live, immediate) = {deltaL.toFixed(1)} mm
      </text>
      </svg>
    </div>
  );
}
