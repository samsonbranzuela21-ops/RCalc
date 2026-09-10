import { DiagramFrame, DiagramLegend, DiagramSurface, diagramSvgClass } from "@/components/shared/DiagramFrame";

interface StirrupElevationProps {
  b: number;
  d: number;
  spacingFinal: number | null;
  stirrupCase: "none" | "minimum" | "calculated" | "section-inadequate";
  legs: number;
  stirrupDiameter: number;
}

export function StirrupElevation({ b, d, spacingFinal, stirrupCase, legs, stirrupDiameter }: StirrupElevationProps) {
  const showStirrups = spacingFinal !== null && (stirrupCase === "minimum" || stirrupCase === "calculated");
  // Overall depth, cover and longitudinal bars are illustrative: only b and d are inputs.
  const scale = 145 / Math.max(b, d);
  const w = b * scale;
  const effectiveHeight = d * scale;
  const x = 165 - w / 2;
  const y = 65;
  const bottom = y + effectiveHeight;
  const legXs = Array.from({ length: legs }, (_, i) => x + 8 + i * Math.max(0, w - 16) / (legs - 1));
  const stirrupXs = [410, 475, 540, 605];
  const status = stirrupCase === "section-inadequate" ? "Section inadequate - increase b or d" : "No stirrups required by calculation";

  return (
    <DiagramFrame title="Beam shear reinforcement" legend={<>
      <DiagramLegend color="var(--text)" label="Concrete section" />
      <DiagramLegend color="#f5941f" label="Shear reinforcement" />
      <DiagramLegend color="#4d7cff" label="Effective depth / steel level" dashed />
    </>}>
      <svg viewBox="0 0 720 280" role="img" aria-label="Beam cross-section and stirrup elevation" className={diagramSvgClass}>
        <DiagramSurface width={720} height={280} />
        <line x1="360" x2="360" y1="20" y2="260" stroke="var(--border)" strokeDasharray="3 5" />
        <text x="180" y="30" textAnchor="middle" fontSize="12" fill="var(--text-muted)">Cross-section (schematic)</text>
        <rect x={x} y={y} width={w} height={effectiveHeight + 16} fill="none" stroke="var(--text)" strokeWidth="1.5" />
        {showStirrups && <>
          <rect x={x + 8} y={y + 8} width={Math.max(0, w - 16)} height={effectiveHeight} rx="5" fill="none" stroke="#f5941f" strokeWidth="2" />
          {legXs.slice(1, -1).map((lx, i) => <line key={i} x1={lx} x2={lx} y1={y + 8} y2={bottom + 8} stroke="#f5941f" strokeWidth="2" />)}
        </>}
        <line x1={x - 5} x2={x + w + 5} y1={bottom} y2={bottom} stroke="#4d7cff" strokeDasharray="3 3" />
        <line x1={x + w + 18} x2={x + w + 18} y1={y} y2={bottom} stroke="#4d7cff" />
        {[y, bottom].map((cy) => <line key={cy} x1={x + w + 14} x2={x + w + 22} y1={cy} y2={cy} stroke="#4d7cff" />)}
        <text x={x + w + 30} y={(y + bottom) / 2} transform={`rotate(-90 ${x + w + 30} ${(y + bottom) / 2})`} textAnchor="middle" fontSize="10" fill="#4d7cff">d = {d} mm</text>
        <text x="165" y="52" textAnchor="middle" fontSize="10" fill="var(--text)">b = {b} mm</text>
        <text x="180" y="253" textAnchor="middle" fontSize="10" fill="var(--text-muted)">{showStirrups ? `${legs}-leg diameter ${stirrupDiameter} mm stirrups` : "No stirrup layout selected"}</text>
        <text x="540" y="30" textAnchor="middle" fontSize="12" fill="var(--text-muted)">Beam elevation (schematic)</text>
        <rect x="390" y="70" width="280" height="120" fill="none" stroke="var(--text)" strokeWidth="1.5" />
        <line x1="390" x2="670" y1="173" y2="173" stroke="#4d7cff" strokeDasharray="3 3" />
        {showStirrups ? <>
          {stirrupXs.map((sx) => <rect key={sx} x={sx} y="80" width="4" height="100" rx="2" fill="none" stroke="#f5941f" strokeWidth="2" />)}
          <line x1="412" x2="477" y1="207" y2="207" stroke="var(--text-muted)" />
          {[412, 477].map((sx) => <line key={sx} x1={sx} x2={sx} y1="199" y2="213" stroke="var(--text-muted)" />)}
          <text x="445" y="230" textAnchor="middle" fontSize="10" fill="var(--text)">s = {spacingFinal.toFixed(2)} mm</text>
          <text x="540" y="253" textAnchor="middle" fontSize="10" fill="var(--text-muted)">Repeated stirrups along the design region</text>
        </> : <text x="540" y="135" textAnchor="middle" fontSize="10" fill={stirrupCase === "section-inadequate" ? "#e05353" : "var(--text-muted)"}>{status}</text>}
      </svg>
      <p className="mt-2 text-center text-[10px] text-[var(--text-muted)]">Not to scale. Overall depth and cover are illustrative; d is measured to the longitudinal tension steel level.</p>
    </DiagramFrame>
  );
}
