interface BeamCrossSectionProps {
  b: number;
  d: number;
  barDiameter: number;
  barsRequired: number;
  clearSpacing?: number | null; // from the actual spacing check — pass this in when available
  spacingOk?: boolean | null;
}

export function BeamCrossSection({
  b,
  d,
  barDiameter,
  barsRequired,
  clearSpacing = null,
  spacingOk = null,
}: BeamCrossSectionProps) {
  const assumedCoverToBar = 50; // mm — schematic drawing only, not a detailing value
  const assumedSideCover = 30; // mm — schematic drawing only, for bar layout positions
  const h = d + assumedCoverToBar;

  const drawArea = 220;
  const scale = drawArea / Math.max(b, h);
  const drawW = b * scale;
  const drawH = h * scale;

  const padding = 40;
  const originX = padding + 34;
  const originY = padding;
  const barY = originY + d * scale;

  const barRadius = Math.max((barDiameter / 2) * scale, 3);
  const sideCoverDraw = Math.min(assumedSideCover * scale, drawW / 4);
  const usableWidthDraw = drawW - 2 * sideCoverDraw;
  const barCount = Math.max(barsRequired, 1);

  const barPositions = Array.from({ length: barCount }, (_, i) =>
    barCount === 1
      ? originX + drawW / 2
      : originX + sideCoverDraw + (usableWidthDraw * i) / (barCount - 1)
  );

  const midIndex = Math.max(Math.floor(barCount / 2) - (barCount % 2 === 0 ? 1 : 0), 0);
  const spacingX1 = barCount > 1 ? barPositions[midIndex] : 0;
  const spacingX2 = barCount > 1 ? barPositions[midIndex + 1] : 0;

  const tickHalf = 5;
  const spacingY = barY + barRadius + 18;
  const showSpacing = barCount > 1;
  const svgW = drawW + padding * 2 + 40;
  const svgH = drawH + padding * 2 + (showSpacing ? 58 : 30);

  const spacingLabel =
    clearSpacing !== null
      ? `s(clear) = ${clearSpacing.toFixed(0)} mm`
      : "s (schematic)";
  const spacingColor =
    spacingOk === false ? "#e05353" : spacingOk === true ? "#39c98a" : "var(--text)";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[280px]">
        <rect
          x={originX}
          y={originY}
          width={drawW}
          height={drawH}
          fill="none"
          stroke="var(--text)"
          strokeWidth={1.5}
        />

        <line
          x1={originX}
          y1={barY}
          x2={originX + drawW}
          y2={barY}
          stroke="var(--text-muted)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {barPositions.map((x, i) => (
          <circle key={i} cx={x} cy={barY} r={barRadius} fill="#f5941f" />
        ))}

        {/* width dimension (top) */}
        <line
          x1={originX}
          y1={originY - 12}
          x2={originX + drawW}
          y2={originY - 12}
          stroke="var(--text-muted)"
          strokeWidth={1}
        />
        <text
          x={originX + drawW / 2}
          y={originY - 17}
          textAnchor="middle"
          fontSize="9"
          fill="var(--text-muted)"
        >
          b = {b} mm
        </text>

        {/* depth dimension (left) */}
        <line
          x1={originX - 12}
          y1={originY}
          x2={originX - 12}
          y2={barY}
          stroke="var(--text-muted)"
          strokeWidth={1}
        />
        <text
          x={originX - 17}
          y={(originY + barY) / 2}
          textAnchor="end"
          fontSize="9"
          fill="var(--text-muted)"
          dominantBaseline="middle"
        >
          d = {d} mm
        </text>

        {/* bar spacing caliper */}
        {showSpacing && (
          <>
            <line x1={spacingX1} y1={barY} x2={spacingX1} y2={spacingY} stroke="var(--text-muted)" strokeWidth={1} />
            <line x1={spacingX2} y1={barY} x2={spacingX2} y2={spacingY} stroke="var(--text-muted)" strokeWidth={1} />
            <line x1={spacingX1} y1={spacingY} x2={spacingX2} y2={spacingY} stroke="var(--text-muted)" strokeWidth={1} />
            <line
              x1={spacingX1}
              y1={spacingY - tickHalf}
              x2={spacingX1}
              y2={spacingY + tickHalf}
              stroke="var(--text-muted)"
              strokeWidth={1}
            />
            <line
              x1={spacingX2}
              y1={spacingY - tickHalf}
              x2={spacingX2}
              y2={spacingY + tickHalf}
              stroke="var(--text-muted)"
              strokeWidth={1}
            />
            <text
              x={(spacingX1 + spacingX2) / 2}
              y={spacingY + 16}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill={spacingColor}
            >
              {spacingLabel}
            </text>
          </>
        )}

        <text
          x={originX + drawW / 2}
          y={originY + drawH + (showSpacing ? 42 : 20)}
          textAnchor="middle"
          fontSize="9"
          fill="var(--text)"
        >
          {barCount} × {barDiameter}mm bars
        </text>
      </svg>
      <p className="mt-1 text-[9px] text-[var(--text-muted)]">
        Schematic cross-section — not to scale. Cover shown is assumed for illustration
        {clearSpacing !== null ? "; spacing value is the actual code check." : "."}
      </p>
    </div>
  );
}