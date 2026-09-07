import {
  DiagramFrame,
  DiagramLegend,
  DiagramSurface,
  diagramSvgClass,
} from "@/components/DiagramFrame";

interface FlexuralBeamDiagramProps {
  b: number;
  d: number;
  barDiameter: number;
  barsRequired: number;
  clearSpacing?: number | null;
  spacingOk?: boolean | null;
  tensionBarsPerLayer?: number[];
  dPrime?: number | null;
  c?: number | null;
  a?: number | null;
  compressionBarDiameter?: number;
  compressionBarsRequired?: number;
  compressionClearSpacing?: number | null;
  compressionSpacingOk?: boolean | null;
  compressionBarsPerLayer?: number[];
}

const WIDTH = 760;
const HEIGHT = 450;
const SECTION_X = 155;
const SECTION_Y = 62;
const SECTION_W = 190;
const SECTION_H = 270;
const COVER_TO_BAR = 50;
const SIDE_COVER = 30;

const TENSION_COLOR = "#f5941f";
const COMPRESSION_COLOR = "#4d7cff";
const NEUTRAL_AXIS_COLOR = "#e05a5a";

export function FlexuralBeamDiagram({
  b,
  d,
  barDiameter,
  barsRequired,
  clearSpacing = null,
  spacingOk = null,
  tensionBarsPerLayer,
  dPrime = null,
  c = null,
  a = null,
  compressionBarDiameter = 0,
  compressionBarsRequired = 0,
  compressionClearSpacing = null,
  compressionSpacingOk = null,
  compressionBarsPerLayer,
}: FlexuralBeamDiagramProps) {
  const tensionRows = normalizeRows(tensionBarsPerLayer, barsRequired);
  const compressionRows = normalizeRows(
    compressionBarsPerLayer,
    compressionBarsRequired
  );
  const hasCompressionSteel = compressionBarsRequired > 0 && dPrime !== null;

  const tensionRowSpacing = barDiameter + Math.max(barDiameter, 25);
  const tensionTotalBars = sum(tensionRows);
  const tensionBottomOffset =
    tensionRows.length === 2
      ? (tensionRows[1] / tensionTotalBars) * tensionRowSpacing
      : 0;
  const tensionUpperOffset =
    tensionRows.length === 2
      ? (tensionRows[0] / tensionTotalBars) * tensionRowSpacing
      : 0;
  const tensionDepths =
    tensionRows.length === 2
      ? [d + tensionBottomOffset, d - tensionUpperOffset]
      : [d];

  const compressionRowSpacing =
    compressionBarDiameter + Math.max(compressionBarDiameter, 25);
  const compressionTotalBars = sum(compressionRows);
  const compressionTopOffset =
    compressionRows.length === 2
      ? (compressionRows[1] / compressionTotalBars) * compressionRowSpacing
      : 0;
  const compressionLowerOffset =
    compressionRows.length === 2
      ? (compressionRows[0] / compressionTotalBars) * compressionRowSpacing
      : 0;
  const compressionDepths =
    hasCompressionSteel && dPrime !== null
      ? compressionRows.length === 2
        ? [dPrime - compressionTopOffset, dPrime + compressionLowerOffset]
        : [dPrime]
      : [];

  const overallDepth = Math.max(d + COVER_TO_BAR + tensionBottomOffset, 1);
  const depthToY = (depth: number) =>
    SECTION_Y + clamp(depth, 0, overallDepth) * (SECTION_H / overallDepth);
  const tensionBarYs = tensionDepths.map(depthToY);
  const compressionBarYs = compressionDepths.map(depthToY);
  const dY = depthToY(d);
  const dPrimeY = dPrime === null ? null : depthToY(dPrime);
  const neutralAxisY =
    c !== null && Number.isFinite(c) ? depthToY(c) : null;
  const compressionBlockY =
    a !== null && Number.isFinite(a) ? depthToY(a) : null;

  const barRadius = clamp((barDiameter / 2) * (SECTION_H / overallDepth), 4, 9);
  const compressionBarRadius = clamp(
    (compressionBarDiameter / 2) * (SECTION_H / overallDepth),
    4,
    9
  );
  const barPositions = (count: number) => {
    const usableWidth = SECTION_W - 2 * SIDE_COVER;
    return Array.from({ length: count }, (_, index) =>
      count === 1
        ? SECTION_X + SECTION_W / 2
        : SECTION_X + SIDE_COVER + (usableWidth * index) / (count - 1)
    );
  };
  const tensionBarPositions = tensionRows.map(barPositions);
  const compressionBarPositions = compressionRows.map(barPositions);

  const tensionBarCount = tensionRows[0];
  const spacingIndex = Math.max(
    Math.floor(tensionBarCount / 2) -
      (tensionBarCount % 2 === 0 ? 1 : 0),
    0
  );
  const spacingX1 =
    tensionBarCount > 1
      ? tensionBarPositions[0][spacingIndex]
      : SECTION_X + SECTION_W / 2;
  const spacingX2 =
    tensionBarCount > 1
      ? tensionBarPositions[0][spacingIndex + 1]
      : spacingX1;
  const spacingY = tensionBarYs[0] + barRadius + 22;
  const showTensionSpacing = tensionBarCount > 1;
  const tensionSpacingColor = spacingColor(spacingOk);
  const compressionSpacingColor = spacingColor(compressionSpacingOk);

  return (
    <DiagramFrame
      title="Flexural beam reinforcement layout"
      legend={
        <>
          <DiagramLegend color={TENSION_COLOR} label="Tension steel" dot />
          <DiagramLegend
            color={COMPRESSION_COLOR}
            label="Compression steel"
            dot
          />
          <DiagramLegend color={NEUTRAL_AXIS_COLOR} label="Neutral axis" />
          <DiagramLegend color="var(--text-muted)" label="Dimensions" dashed />
        </>
      }
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Flexural beam reinforcement cross-section and spacing diagram"
        className={diagramSvgClass}
      >
        <DiagramSurface width={WIDTH} height={HEIGHT} />
        <defs>
          <marker
            id="flexural-dimension-arrow"
            markerWidth="7"
            markerHeight="7"
            refX="3.5"
            refY="3.5"
            orient="auto-start-reverse"
          >
            <path d="M0,3.5 L7,0 L7,7 Z" fill="var(--text-muted)" />
          </marker>
        </defs>

        <rect
          x={SECTION_X}
          y={SECTION_Y}
          width={SECTION_W}
          height={SECTION_H}
          rx="2"
          fill="var(--bg-surface)"
          stroke="var(--text)"
          strokeWidth="2"
        />

        {compressionBlockY !== null && (
          <rect
            x={SECTION_X}
            y={SECTION_Y}
            width={SECTION_W}
            height={Math.max(compressionBlockY - SECTION_Y, 0)}
            fill={COMPRESSION_COLOR}
            fillOpacity="0.1"
          />
        )}

        {neutralAxisY !== null && (
          <>
            <line
              x1={SECTION_X - 20}
              x2={SECTION_X + SECTION_W + 25}
              y1={neutralAxisY}
              y2={neutralAxisY}
              stroke={NEUTRAL_AXIS_COLOR}
              strokeWidth="1.2"
              strokeDasharray="6 4"
            />
            <text
              x={SECTION_X + SECTION_W + 31}
              y={neutralAxisY + 3}
              fontSize="10"
              fill={NEUTRAL_AXIS_COLOR}
            >
              N.A.
            </text>
          </>
        )}

        {tensionBarPositions.flatMap((positions, rowIndex) =>
          positions.map((x, barIndex) => (
            <circle
              key={`tension-${rowIndex}-${barIndex}`}
              cx={x}
              cy={tensionBarYs[rowIndex]}
              r={barRadius}
              fill={TENSION_COLOR}
              stroke="var(--bg-surface)"
              strokeWidth="1"
            />
          ))
        )}

        {hasCompressionSteel &&
          compressionBarPositions.flatMap((positions, rowIndex) =>
            positions.map((x, barIndex) => (
              <circle
                key={`compression-${rowIndex}-${barIndex}`}
                cx={x}
                cy={compressionBarYs[rowIndex]}
                r={compressionBarRadius}
                fill={COMPRESSION_COLOR}
                stroke="var(--bg-surface)"
                strokeWidth="1"
              />
            ))
          )}

        <DimensionLine
          x1={SECTION_X}
          x2={SECTION_X + SECTION_W}
          y1={SECTION_Y - 18}
          y2={SECTION_Y - 18}
          label={`b = ${formatNumber(b)} mm`}
          labelX={SECTION_X + SECTION_W / 2}
          labelY={SECTION_Y - 26}
          textAnchor="middle"
        />

        <DimensionLine
          x1={SECTION_X - 38}
          x2={SECTION_X - 38}
          y1={SECTION_Y}
          y2={dY}
          label={`d = ${formatNumber(d)} mm`}
          labelX={SECTION_X - 48}
          labelY={(SECTION_Y + dY) / 2}
          textAnchor="end"
          rotateLabel
        />

        {dPrimeY !== null && hasCompressionSteel && (
          <DimensionLine
            x1={SECTION_X + SECTION_W + 38}
            x2={SECTION_X + SECTION_W + 38}
            y1={SECTION_Y}
            y2={dPrimeY}
            label={`d′ = ${formatNumber(dPrime ?? 0)} mm`}
            labelX={SECTION_X + SECTION_W + 48}
            labelY={(SECTION_Y + dPrimeY) / 2}
            textAnchor="start"
            rotateLabel
          />
        )}

        {neutralAxisY !== null && (
          <DimensionLine
            x1={SECTION_X + SECTION_W + 70}
            x2={SECTION_X + SECTION_W + 70}
            y1={SECTION_Y}
            y2={neutralAxisY}
            label={`c = ${formatNumber(c ?? 0)} mm`}
            labelX={SECTION_X + SECTION_W + 80}
            labelY={(SECTION_Y + neutralAxisY) / 2}
            textAnchor="start"
            rotateLabel
          />
        )}

        {showTensionSpacing && (
          <SpacingDimension
            x1={spacingX1}
            x2={spacingX2}
            y={spacingY}
            label={
              clearSpacing === null
                ? "s (schematic)"
                : `s = ${clearSpacing.toFixed(1)} mm`
            }
            color={tensionSpacingColor}
          />
        )}

        <text
          x={SECTION_X + SECTION_W / 2}
          y={SECTION_Y + SECTION_H + 38}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="var(--text)"
        >
          {hasCompressionSteel ? "Doubly reinforced section" : "Singly reinforced section"}
        </text>
        <text
          x={SECTION_X + SECTION_W / 2}
          y={SECTION_Y + SECTION_H + 55}
          textAnchor="middle"
          fontSize="10"
          fill="var(--text-muted)"
        >
          Tension: {tensionRows.join(" + ")} × {formatNumber(barDiameter)} mm
        </text>
        {hasCompressionSteel && (
          <text
            x={SECTION_X + SECTION_W / 2}
            y={SECTION_Y + SECTION_H + 70}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-muted)"
          >
            Compression: {compressionRows.join(" + ")} × {formatNumber(compressionBarDiameter)} mm
          </text>
        )}

        <g aria-label="Flexural beam design notes">
          <text x="500" y="92" fontSize="12" fontWeight="700" fill="var(--text)">
            Design section
          </text>
          <text x="500" y="116" fontSize="10.5" fill="var(--text-muted)">
            {hasCompressionSteel ? "Doubly reinforced" : "Singly reinforced"}
          </text>
          <text x="500" y="142" fontSize="10" fill="var(--text-muted)">
            Tension layers: {tensionRows.join(" + ")}
          </text>
          {hasCompressionSteel && (
            <text x="500" y="162" fontSize="10" fill="var(--text-muted)">
              Compression layers: {compressionRows.join(" + ")}
            </text>
          )}
          <text x="500" y="198" fontSize="10" fontWeight="600" fill={tensionSpacingColor}>
            Tension spacing: {spacingStatus(clearSpacing, spacingOk)}
          </text>
          {hasCompressionSteel && (
            <text x="500" y="220" fontSize="10" fontWeight="600" fill={compressionSpacingColor}>
              Compression spacing: {spacingStatus(compressionClearSpacing, compressionSpacingOk)}
            </text>
          )}
          <text x="500" y="266" fontSize="9.5" fill="var(--text-muted)">
            Schematic section; bars are arranged
          </text>
          <text x="500" y="282" fontSize="9.5" fill="var(--text-muted)">
            according to the calculated layers.
          </text>
        </g>
      </svg>
    </DiagramFrame>
  );
}

function DimensionLine({
  x1,
  x2,
  y1,
  y2,
  label,
  labelX,
  labelY,
  textAnchor,
  rotateLabel = false,
}: {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  label: string;
  labelX: number;
  labelY: number;
  textAnchor: "start" | "middle" | "end";
  rotateLabel?: boolean;
}) {
  return (
    <>
      <line
        x1={x1}
        x2={x2}
        y1={y1}
        y2={y2}
        stroke="var(--text-muted)"
        strokeWidth="1"
        markerStart="url(#flexural-dimension-arrow)"
        markerEnd="url(#flexural-dimension-arrow)"
      />
      <text
        x={labelX}
        y={labelY}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        fontSize="10"
        fill="var(--text-muted)"
        transform={
          rotateLabel
            ? `rotate(-90 ${labelX} ${labelY})`
            : undefined
        }
      >
        {label}
      </text>
    </>
  );
}

function SpacingDimension({
  x1,
  x2,
  y,
  label,
  color,
}: {
  x1: number;
  x2: number;
  y: number;
  label: string;
  color: string;
}) {
  return (
    <g>
      <line x1={x1} x2={x1} y1={y - 6} y2={y} stroke="var(--text-muted)" />
      <line x1={x2} x2={x2} y1={y - 6} y2={y} stroke="var(--text-muted)" />
      <line x1={x1} x2={x2} y1={y} y2={y} stroke="var(--text-muted)" />
      <line x1={x1} x2={x1} y1={y - 5} y2={y + 5} stroke="var(--text-muted)" />
      <line x1={x2} x2={x2} y1={y - 5} y2={y + 5} stroke="var(--text-muted)" />
      <text
        x={(x1 + x2) / 2}
        y={y + 16}
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="600"
        fill={color}
      >
        {label}
      </text>
    </g>
  );
}

function normalizeRows(rows: number[] | undefined, fallback: number): number[] {
  const validRows = rows
    ?.map((count) => Math.max(0, Math.floor(count)))
    .filter((count) => count > 0);
  if (validRows && validRows.length > 0) return validRows.slice(0, 2);
  return [Math.max(1, Math.floor(Number.isFinite(fallback) ? fallback : 1))];
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(0) : "—";
}

function spacingColor(ok: boolean | null | undefined) {
  return ok === false ? "#e05353" : ok === true ? "#39c98a" : "var(--text-muted)";
}

function spacingStatus(
  spacing: number | null | undefined,
  ok: boolean | null | undefined
) {
  if (spacing === null || spacing === undefined) return "not applicable";
  return `${spacing.toFixed(1)} mm — ${ok === false ? "NOT OK" : ok === true ? "OK" : "check"}`;
}
