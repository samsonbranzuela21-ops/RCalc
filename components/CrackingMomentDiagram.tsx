import type {
  BendingDirection,
  CrackingSectionMode,
  ReinforcementMode,
} from "@/lib/cracking-moment";

interface CrackingMomentDiagramProps {
  b?: number;
  h?: number;
  fr: number;

  mode: CrackingSectionMode;
  direction: BendingDirection;
  reinforcementMode: ReinforcementMode;

  neutralAxisFromTop: number;
  tensionSteelY: number | null;
  compressionSteelY: number | null;
}

export function CrackingMomentDiagram({
  b,
  h,
  fr,
  mode,
  direction,
  reinforcementMode,
  neutralAxisFromTop,
  tensionSteelY,
  compressionSteelY,
}: CrackingMomentDiagramProps) {
  const top = 42;
  const sectionX = 55;
  const sectionW = 105;
  const sectionH = 205;
  const bottom = top + sectionH;

  const sectionDepth =
    mode === "rectangle" && h
      ? h
      : 1;

  const neutralAxisY =
    mode === "rectangle"
      ? top +
        (neutralAxisFromTop /
          sectionDepth) *
          sectionH
      : top + sectionH / 2;

  function steelY(
    coordinate: number | null
  ) {
    if (coordinate === null) {
      return null;
    }

    return (
      top +
      (coordinate / sectionDepth) *
        sectionH
    );
  }

  const tensionY =
    steelY(tensionSteelY);

  const compressionY =
    steelY(compressionSteelY);

  const stressAxisX = 270;
  const compressionX = 215;
  const tensionX = 330;

  const tensionAtBottom =
    direction === "positive";

  return (
    <div className="w-full overflow-x-auto pb-2 [scrollbar-color:#737373_#171717] [scrollbar-gutter:stable] [scrollbar-width:auto]">
      <svg
        viewBox="0 0 400 315"
        className="mx-auto block h-auto min-w-[370px] max-w-[470px]"
        role="img"
        aria-label={`${direction} bending transformed section and stress distribution at cracking`}
      >
        <defs>
          <marker
            id="cracking-dim-arrow"
            markerWidth="7"
            markerHeight="7"
            refX="3.5"
            refY="3.5"
            orient="auto-start-reverse"
          >
            <path
              d="M0,3.5 L7,0 L7,7 Z"
              fill="var(--text-muted)"
            />
          </marker>

          <pattern
            id="cracking-hatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="#f5941f"
              strokeOpacity="0.45"
            />
          </pattern>
        </defs>

        {/* Width dimension */}
        <line
          x1={sectionX}
          y1="22"
          x2={sectionX + sectionW}
          y2="22"
          stroke="var(--text-muted)"
          markerStart="url(#cracking-dim-arrow)"
          markerEnd="url(#cracking-dim-arrow)"
        />

        <text
          x={sectionX + sectionW / 2}
          y="14"
          textAnchor="middle"
          fontSize="10"
          fill="var(--text-muted)"
        >
          {mode === "rectangle"
            ? `b = ${(b ?? 0).toFixed(0)} mm`
            : "Custom section"}
        </text>

        {/* Concrete section */}
        <rect
          x={sectionX}
          y={top}
          width={sectionW}
          height={sectionH}
          fill="var(--bg-surface)"
          stroke="var(--text)"
          strokeWidth="2"
        />

        {/* Tension region */}
        <rect
          x={sectionX}
          y={
            tensionAtBottom
              ? neutralAxisY
              : top
          }
          width={sectionW}
          height={
            tensionAtBottom
              ? bottom - neutralAxisY
              : neutralAxisY - top
          }
          fill="url(#cracking-hatch)"
        />

        {/* Tension steel */}
        {mode === "rectangle" &&
          tensionY !== null && (
            <SteelLayer
              y={tensionY}
              color="#e05a5a"
              label="As"
            />
          )}

        {/* Compression steel */}
        {mode === "rectangle" &&
          compressionY !== null && (
            <SteelLayer
              y={compressionY}
              color="#4d7cff"
              label="As'"
            />
          )}

        {/* Neutral axis */}
        <line
          x1={sectionX - 15}
          y1={neutralAxisY}
          x2={tensionX + 30}
          y2={neutralAxisY}
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
        />

        <text
          x={sectionX - 20}
          y={neutralAxisY + 3}
          textAnchor="end"
          fontSize="9"
          fill="var(--text-muted)"
        >
          N.A.
        </text>

        {/* Height dimension */}
        <line
          x1="28"
          y1={top}
          x2="28"
          y2={bottom}
          stroke="var(--text-muted)"
          markerStart="url(#cracking-dim-arrow)"
          markerEnd="url(#cracking-dim-arrow)"
        />

        <text
          x="20"
          y={(top + bottom) / 2}
          textAnchor="middle"
          fontSize="9"
          fill="var(--text-muted)"
          transform={`rotate(
            -90
            20
            ${(top + bottom) / 2}
          )`}
        >
          {mode === "rectangle"
            ? `h = ${(h ?? 0).toFixed(0)} mm`
            : "overall depth"}
        </text>

        {/* Stress axis */}
        <line
          x1={stressAxisX}
          y1={top}
          x2={stressAxisX}
          y2={bottom}
          stroke="var(--text)"
          strokeWidth="1.5"
        />

        {/* Top stress line */}
        <line
          x1={stressAxisX}
          y1={neutralAxisY}
          x2={
            tensionAtBottom
              ? compressionX
              : tensionX
          }
          y2={top}
          stroke={
            tensionAtBottom
              ? "#4d7cff"
              : "#e05a5a"
          }
          strokeWidth="2"
        />

        {/* Bottom stress line */}
        <line
          x1={stressAxisX}
          y1={neutralAxisY}
          x2={
            tensionAtBottom
              ? tensionX
              : compressionX
          }
          y2={bottom}
          stroke={
            tensionAtBottom
              ? "#e05a5a"
              : "#4d7cff"
          }
          strokeWidth="2"
        />

        {/* Top stress label */}
        <text
          x={
            tensionAtBottom
              ? compressionX - 5
              : tensionX + 5
          }
          y={top + 4}
          textAnchor={
            tensionAtBottom
              ? "end"
              : "start"
          }
          fontSize="9"
          fill={
            tensionAtBottom
              ? "#4d7cff"
              : "#e05a5a"
          }
        >
          {tensionAtBottom
            ? "compression"
            : `fr = ${fr.toFixed(3)} MPa`}
        </text>

        {/* Bottom stress label */}
        <text
          x={
            tensionAtBottom
              ? tensionX + 5
              : compressionX - 5
          }
          y={bottom + 4}
          textAnchor={
            tensionAtBottom
              ? "start"
              : "end"
          }
          fontSize="9"
          fill={
            tensionAtBottom
              ? "#e05a5a"
              : "#4d7cff"
          }
        >
          {tensionAtBottom
            ? `fr = ${fr.toFixed(3)} MPa`
            : "compression"}
        </text>

        <text
          x={sectionX + sectionW / 2}
          y="285"
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="var(--text)"
        >
          {reinforcementMode === "none"
            ? "Gross section"
            : "Transformed section"}
        </text>

        <text
          x={stressAxisX}
          y="285"
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="var(--text)"
        >
          Linear stress distribution
        </text>

        <text
          x="200"
          y="308"
          textAnchor="middle"
          fontSize="9"
          fill="var(--text-muted)"
        >
          {direction === "positive"
            ? "Positive moment - bottom tension"
            : "Negative moment - top tension"}
        </text>
      </svg>
    </div>
  );
}

function SteelLayer({
  y,
  color,
  label,
}: {
  y: number;
  color: string;
  label: string;
}) {
  return (
    <g>
      {[76, 107, 138].map((x) => (
        <circle
          key={x}
          cx={x}
          cy={y}
          r="4.5"
          fill={color}
          stroke="var(--text)"
          strokeWidth="0.8"
        />
      ))}

      <text
        x="168"
        y={y + 3}
        fontSize="8"
        fill={color}
      >
        {label}
      </text>
    </g>
  );
}