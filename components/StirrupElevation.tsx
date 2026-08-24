interface StirrupElevationProps {
  d: number;
  spacingFinal: number | null;
  stirrupCase: "none" | "minimum" | "calculated" | "section-inadequate";
  legs: number;
  stirrupDiameter: number;
}

export function StirrupElevation({
  d,
  spacingFinal,
  stirrupCase,
  legs,
  stirrupDiameter,
}: StirrupElevationProps) {
  if (stirrupCase === "section-inadequate") {
    return (
      <p className="text-[10px] text-[#e05353]">
        Section inadequate for shear — no elevation shown.
      </p>
    );
  }

  const beamHeightMm = d + 60; // schematic, assumed cover
  const numStirrupsShown = 4;
  const spacing = spacingFinal ?? 150; // fallback schematic spacing if no stirrups required
  const endPadding = 45;
  const spanMm = spacing * (numStirrupsShown - 1) + endPadding * 2;

  const drawTargetW = 260;
  const scale = drawTargetW / spanMm;
  const drawW = spanMm * scale;
  const drawH = beamHeightMm * scale;

  const padding = 25;
  const originX = padding;
  const originY = padding;

  const showStirrups = stirrupCase !== "none";
  const stirrupXs = showStirrups
    ? Array.from(
        { length: numStirrupsShown },
        (_, i) => originX + endPadding * scale + i * spacing * scale
      )
    : [];

  const svgW = drawW + padding * 2;
  const svgH = drawH + padding * 2 + (showStirrups ? 45 : 10);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[300px]">
        {/* beam elevation outline */}
        <rect
          x={originX}
          y={originY}
          width={drawW}
          height={drawH}
          fill="none"
          stroke="var(--text)"
          strokeWidth={1.5}
        />

        {/* stirrups (side view — vertical legs) */}
        {stirrupXs.map((x, i) => (
          <rect
            key={i}
            x={x - 1.5}
            y={originY + 4}
            width={3}
            height={drawH - 8}
            fill="none"
            stroke="#f5941f"
            strokeWidth={2}
          />
        ))}

        {/* spacing dimension between first two stirrups */}
        {showStirrups && stirrupXs.length >= 2 && (
          <>
            <line
              x1={stirrupXs[0]}
              y1={originY + drawH + 10}
              x2={stirrupXs[1]}
              y2={originY + drawH + 10}
              stroke="var(--text-muted)"
              strokeWidth={1}
            />
            <line
              x1={stirrupXs[0]}
              y1={originY + drawH + 6}
              x2={stirrupXs[0]}
              y2={originY + drawH + 14}
              stroke="var(--text-muted)"
              strokeWidth={1}
            />
            <line
              x1={stirrupXs[1]}
              y1={originY + drawH + 6}
              x2={stirrupXs[1]}
              y2={originY + drawH + 14}
              stroke="var(--text-muted)"
              strokeWidth={1}
            />
            <text
              x={(stirrupXs[0] + stirrupXs[1]) / 2}
              y={originY + drawH + 26}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill="var(--text)"
            >
              s = {spacing.toFixed(0)} mm
            </text>
          </>
        )}

        {!showStirrups && (
          <text
            x={originX + drawW / 2}
            y={originY + drawH / 2}
            textAnchor="middle"
            fontSize="9"
            fill="var(--text-muted)"
            dominantBaseline="middle"
          >
            No stirrups required by calculation
          </text>
        )}
      </svg>
      <p className="mt-1 text-[9px] text-[var(--text-muted)]">
        Schematic beam elevation — not to scale.
        {showStirrups ? ` ${legs}-leg ${stirrupDiameter}mm stirrups shown, spacing is the actual governing value.` : ""}
      </p>
    </div>
  );
}