interface BeamCrossSectionProps {
  b: number;
  d: number;
  barDiameter: number;
  barsRequired: number;
  clearSpacing?: number | null;
  spacingOk?: boolean | null;
  tensionBarsPerLayer?: number[];
  dPrime?: number | null;
  compressionBarDiameter?: number;
  compressionBarsRequired?: number;
  compressionBarsPerLayer?: number[];
}

export function BeamCrossSection({
  b,
  d,
  barDiameter,
  barsRequired,
  clearSpacing = null,
  spacingOk = null,
  tensionBarsPerLayer,
  dPrime = null,
  compressionBarDiameter = 0,
  compressionBarsRequired = 0,
  compressionBarsPerLayer,
}: BeamCrossSectionProps) {
  const assumedCoverToBar = 50;
  const assumedSideCover = 30;
  const tensionRows =
    tensionBarsPerLayer && tensionBarsPerLayer.length > 0
      ? tensionBarsPerLayer
      : [Math.max(barsRequired, 1)];
  const compressionRows =
    compressionBarsPerLayer && compressionBarsPerLayer.length > 0
      ? compressionBarsPerLayer
      : compressionBarsRequired > 0
        ? [compressionBarsRequired]
        : [];

  const tensionRowSpacing = barDiameter + Math.max(barDiameter, 25);
  const tensionTotalBars = tensionRows.reduce((sum, count) => sum + count, 0);
  const tensionBottomOffset =
    tensionRows.length === 2
      ? (tensionRows[1] / tensionTotalBars) * tensionRowSpacing
      : 0;
  const tensionUpperOffset =
    tensionRows.length === 2
      ? (tensionRows[0] / tensionTotalBars) * tensionRowSpacing
      : 0;

  // d remains the centroid of the full tension-steel group.
  const tensionRowDepths =
    tensionRows.length === 2
      ? [d + tensionBottomOffset, d - tensionUpperOffset]
      : [d];
  const h = d + assumedCoverToBar + tensionBottomOffset;

  const drawArea = 220;
  const scale = drawArea / Math.max(b, h);
  const drawW = b * scale;
  const drawH = h * scale;

  const padding = 40;
  const originX = padding + 34;
  const originY = padding;
  const tensionBarYs = tensionRowDepths.map(
    (depth) => originY + depth * scale
  );

  const compressionRowSpacing =
    compressionBarDiameter + Math.max(compressionBarDiameter, 25);
  const compressionTotalBars = compressionRows.reduce(
    (sum, count) => sum + count,
    0
  );
  const compressionTopOffset =
    compressionRows.length === 2
      ? (compressionRows[1] / compressionTotalBars) * compressionRowSpacing
      : 0;
  const compressionLowerOffset =
    compressionRows.length === 2
      ? (compressionRows[0] / compressionTotalBars) * compressionRowSpacing
      : 0;
  // d′ remains the centroid of the full compression-steel group.
  const compressionRowDepths =
    dPrime !== null
      ? compressionRows.length === 2
        ? [dPrime - compressionTopOffset, dPrime + compressionLowerOffset]
        : [dPrime]
      : [];
  const compressionBarYs = compressionRowDepths.map(
    (depth) => originY + depth * scale
  );

  const tensionBarRadius = Math.max((barDiameter / 2) * scale, 3);
  const compressionBarRadius = Math.max(
    (compressionBarDiameter / 2) * scale,
    3
  );
  const sideCoverDraw = Math.min(assumedSideCover * scale, drawW / 4);
  const usableWidthDraw = drawW - 2 * sideCoverDraw;
  const makeBarPositions = (count: number) =>
    Array.from({ length: count }, (_, index) =>
      count === 1
        ? originX + drawW / 2
        : originX + sideCoverDraw + (usableWidthDraw * index) / (count - 1)
    );

  const tensionBarPositions = tensionRows.map(makeBarPositions);
  const compressionBarPositions = compressionRows.map(makeBarPositions);

  const tensionBarCount = tensionRows[0];
  const midIndex = Math.max(
    Math.floor(tensionBarCount / 2) -
      (tensionBarCount % 2 === 0 ? 1 : 0),
    0
  );
  const spacingX1 =
    tensionBarCount > 1 ? tensionBarPositions[0][midIndex] : 0;
  const spacingX2 =
    tensionBarCount > 1 ? tensionBarPositions[0][midIndex + 1] : 0;

  const tickHalf = 5;
  const spacingY = tensionBarYs[0] + tensionBarRadius + 18;
  const showSpacing = tensionBarCount > 1;
  const svgW = drawW + padding * 2 + 40;
  const svgH = drawH + padding * 2 + (showSpacing ? 58 : 30);

  const spacingLabel =
    clearSpacing !== null
      ? `s(clear) = ${clearSpacing.toFixed(0)} mm`
      : "s (schematic)";
  const spacingColor =
    spacingOk === false
      ? "#e05353"
      : spacingOk === true
        ? "#39c98a"
        : "var(--text)";

  return (
    <div className="flex flex-col items-center overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
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
          y1={originY + d * scale}
          x2={originX + drawW}
          y2={originY + d * scale}
          stroke="var(--text-muted)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {tensionBarPositions.flatMap((positions, rowIndex) =>
          positions.map((x, barIndex) => (
            <circle
              key={`tension-${rowIndex}-${barIndex}`}
              cx={x}
              cy={tensionBarYs[rowIndex]}
              r={tensionBarRadius}
              fill="#f5941f"
            />
          ))
        )}

        {compressionBarPositions.flatMap((positions, rowIndex) =>
          positions.map((x, barIndex) => (
            <circle
              key={`compression-${rowIndex}-${barIndex}`}
              cx={x}
              cy={compressionBarYs[rowIndex]}
              r={compressionBarRadius}
              fill="#4d7cff"
            />
          ))
        )}

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

        <line
          x1={originX - 12}
          y1={originY}
          x2={originX - 12}
          y2={originY + d * scale}
          stroke="var(--text-muted)"
          strokeWidth={1}
        />
        <text
          x={originX - 17}
          y={(originY + originY + d * scale) / 2}
          textAnchor="end"
          fontSize="9"
          fill="var(--text-muted)"
          dominantBaseline="middle"
        >
          d = {d} mm
        </text>

        {dPrime !== null && compressionBarsRequired > 0 && (
          <>
            <line
              x1={originX + drawW + 12}
              y1={originY}
              x2={originX + drawW + 12}
              y2={originY + dPrime * scale}
              stroke="var(--text-muted)"
              strokeWidth={1}
            />
            <text
              x={originX + drawW + 17}
              y={(originY + originY + dPrime * scale) / 2}
              fontSize="9"
              fill="var(--text-muted)"
              dominantBaseline="middle"
            >
              d′ = {dPrime} mm
            </text>
          </>
        )}

        {showSpacing && (
          <>
            <line x1={spacingX1} y1={tensionBarYs[0]} x2={spacingX1} y2={spacingY} stroke="var(--text-muted)" strokeWidth={1} />
            <line x1={spacingX2} y1={tensionBarYs[0]} x2={spacingX2} y2={spacingY} stroke="var(--text-muted)" strokeWidth={1} />
            <line x1={spacingX1} y1={spacingY} x2={spacingX2} y2={spacingY} stroke="var(--text-muted)" strokeWidth={1} />
            <line x1={spacingX1} y1={spacingY - tickHalf} x2={spacingX1} y2={spacingY + tickHalf} stroke="var(--text-muted)" strokeWidth={1} />
            <line x1={spacingX2} y1={spacingY - tickHalf} x2={spacingX2} y2={spacingY + tickHalf} stroke="var(--text-muted)" strokeWidth={1} />
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
          {compressionBarsRequired > 0
            ? `Tension ${tensionRows.join(" + ")} × ${barDiameter}mm; compression ${compressionRows.join(" + ")} × ${compressionBarDiameter}mm`
            : `${tensionRows.join(" + ")} × ${barDiameter}mm bars`}
        </text>
      </svg>
      <p className="mt-1 text-[9px] text-[var(--text-muted)]">
        Schematic cross-section — not to scale. Cover shown is assumed for illustration
        {clearSpacing !== null ? "; spacing value is the actual code check." : "."}
      </p>
    </div>
  );
}
