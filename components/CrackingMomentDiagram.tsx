import { DiagramFrame, diagramSvgClass } from "@/components/DiagramFrame";
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
  const compressionFaceY = tensionAtBottom ? top : bottom;
  const compressionDepth = tensionAtBottom
    ? neutralAxisFromTop
    : sectionDepth - neutralAxisFromTop;

  return (
    <DiagramFrame>
      <svg
        viewBox="0 0 720 430"
        className={diagramSvgClass}
        role="img"
        aria-label={`${direction} bending transformed section and stress distribution at cracking`}
      >
        <defs>
          <marker
            id="cracking-stress-arrow"
            markerWidth="6"
            markerHeight="6"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill="context-stroke" />
          </marker>
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

        <rect
          x="28"
          y="28"
          width="664"
          height="348"
          rx="6"
          fill="var(--bg)"
          stroke="var(--border)"
        />

        <g transform="translate(160 40)">
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
            strokeDasharray="7 5"
          />

          <text
            x={sectionX + 5}
            y={neutralAxisY - 7}
            textAnchor="start"
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
          {mode === "rectangle" && (
            <g aria-label={`Neutral-axis depth c = ${compressionDepth.toFixed(2)} mm from the compression face`}>
              {[compressionFaceY, neutralAxisY].map((y) => (
                <line
                  key={y}
                  x1={tensionX + 30}
                  x2={tensionX + 50}
                  y1={y}
                  y2={y}
                  stroke="var(--text-muted)"
                />
              ))}
              <line
                x1={tensionX + 40}
                x2={tensionX + 40}
                y1={compressionFaceY}
                y2={neutralAxisY}
                stroke="var(--text-muted)"
                markerStart="url(#cracking-dim-arrow)"
                markerEnd="url(#cracking-dim-arrow)"
              />
              <text
                x={tensionX + 50}
                y={(compressionFaceY + neutralAxisY) / 2 + 3}
                fontSize="10"
                fontWeight="600"
                fill="var(--text)"
              >
                {`c = ${compressionDepth.toFixed(2)} mm`}
              </text>
            </g>
          )}

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
          {[top, bottom].map((faceY) => {
            const isCompression = faceY === compressionFaceY;
            const edgeX = isCompression ? compressionX : tensionX;

            return [0.25, 0.5, 0.75, 1].map((fraction) => {
              const y = neutralAxisY + (faceY - neutralAxisY) * fraction;
              const x = stressAxisX + (edgeX - stressAxisX) * fraction;

              return (
                <line
                  key={`${faceY}-${fraction}`}
                  x1={isCompression ? x : stressAxisX}
                  x2={isCompression ? stressAxisX : x}
                  y1={y}
                  y2={y}
                  stroke={isCompression ? "#4d7cff" : "#e05a5a"}
                  strokeWidth="1"
                  markerEnd="url(#cracking-stress-arrow)"
                />
              );
            });
          })}

          <text
            x={stressAxisX}
            y={top - 12}
            textAnchor="middle"
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
            x={stressAxisX}
            y={bottom + 17}
            textAnchor="middle"
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

        </g>

        <text
          x="360"
          y="408"
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="var(--text-muted)"
        >
          {direction === "positive"
            ? "Positive moment - bottom tension"
            : "Negative moment - top tension"}
        </text>
      </svg>

      <div className="flex flex-wrap justify-center gap-4 pt-2 text-[10px] text-[var(--text-muted)]">
        <Legend color="#4d7cff" label="Compression" />
        <Legend color="#e05a5a" label="Tension" />
        <Legend color="#f5941f" label="Tension region" />
        <Legend color="var(--text-muted)" label="Neutral axis" dashed />
      </div>
    </DiagramFrame>
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

function Legend({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-0 w-6 border-t-2"
        style={{ borderColor: color, borderStyle: dashed ? "dashed" : "solid" }}
      />
      {label}
    </span>
  );
}
