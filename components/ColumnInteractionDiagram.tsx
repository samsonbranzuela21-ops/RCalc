import type {
  ColumnInteractionResult,
  InteractionPoint,
} from "@/lib/column-interaction";

interface ColumnInteractionDiagramProps {
  result: ColumnInteractionResult | null;
  Pu: number;
  Mu: number;
}

const WIDTH = 720;
const HEIGHT = 430;
const MARGIN = { top: 28, right: 28, bottom: 54, left: 76 };

function pathFromPoints(
  points: InteractionPoint[],
  x: (value: number) => number,
  y: (value: number) => number,
  design: boolean
) {
  return points
    .map((point, index) => {
      const moment = design ? point.phiMn : point.Mn;
      const axial = design ? point.phiPn : point.Pn;
      return `${index === 0 ? "M" : "L"} ${x(moment).toFixed(2)} ${y(axial).toFixed(2)}`;
    })
    .join(" ");
}

export function ColumnInteractionDiagram({
  result,
  Pu,
  Mu,
}: ColumnInteractionDiagramProps) {
  if (!result) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-center text-[12px] text-[var(--text-muted)]">
        Enter the column data and calculate to generate the P-M interaction diagram.
      </div>
    );
  }

  const moments = [
    ...result.nominalCurve.map((point) => point.Mn),
    ...result.designCurve.map((point) => point.phiMn),
    Math.abs(Mu),
  ];
  const axialLoads = [
    ...result.nominalCurve.map((point) => point.Pn),
    ...result.designCurve.map((point) => point.phiPn),
    Pu,
  ];
  const xMaximum = Math.max(...moments, 1) * 1.12;
  const rawMinimum = Math.min(...axialLoads, 0);
  const rawMaximum = Math.max(...axialLoads, 1);
  const yPadding = (rawMaximum - rawMinimum) * 0.08;
  const yMinimum = rawMinimum - yPadding;
  const yMaximum = rawMaximum + yPadding;
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = (value: number) => MARGIN.left + (value / xMaximum) * plotWidth;
  const y = (value: number) =>
    MARGIN.top + ((yMaximum - value) / (yMaximum - yMinimum)) * plotHeight;
  const xTicks = Array.from({ length: 6 }, (_, index) => (xMaximum * index) / 5);
  const yTicks = Array.from(
    { length: 6 },
    (_, index) => yMinimum + ((yMaximum - yMinimum) * index) / 5
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
      <svg
        role="img"
        aria-label="Nominal and design axial load-moment interaction diagram"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full min-w-[560px]"
      >
        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={plotWidth}
          height={plotHeight}
          rx="6"
          fill="var(--bg)"
          stroke="var(--border)"
        />

        {xTicks.map((tick) => (
          <g key={`x-${tick}`}>
            <line
              x1={x(tick)}
              x2={x(tick)}
              y1={MARGIN.top}
              y2={MARGIN.top + plotHeight}
              stroke="var(--border)"
              strokeDasharray="3 5"
            />
            <text
              x={x(tick)}
              y={HEIGHT - 29}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-muted)"
            >
              {tick.toFixed(0)}
            </text>
          </g>
        ))}

        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={MARGIN.left}
              x2={MARGIN.left + plotWidth}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--border)"
              strokeDasharray="3 5"
            />
            <text
              x={MARGIN.left - 10}
              y={y(tick) + 3}
              textAnchor="end"
              fontSize="10"
              fill="var(--text-muted)"
            >
              {tick.toFixed(0)}
            </text>
          </g>
        ))}

        {yMinimum <= 0 && yMaximum >= 0 && (
          <line
            x1={MARGIN.left}
            x2={MARGIN.left + plotWidth}
            y1={y(0)}
            y2={y(0)}
            stroke="var(--text-muted)"
          />
        )}

        <path
          d={pathFromPoints(result.nominalCurve, x, y, false)}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="7 5"
        />
        <path
          d={pathFromPoints(result.designCurve, x, y, true)}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="3"
        />

        {result.keyPoints.map((point) => (
          <g key={point.key}>
            <circle
              cx={x(point.phiMn)}
              cy={y(point.phiPn)}
              r="4"
              fill="#8b5cf6"
              stroke="var(--bg-surface)"
              strokeWidth="2"
            />
            <text
              x={x(point.phiMn) + 7}
              y={y(point.phiPn) - 7}
              fontSize="10"
              fontWeight="700"
              fill="var(--text)"
            >
              {point.key}
            </text>
          </g>
        ))}

        <g>
          <circle
            cx={x(Math.abs(Mu))}
            cy={y(Pu)}
            r="6"
            fill={result.status === "SAFE" ? "#22c55e" : "#ef4444"}
            stroke="#ffffff"
            strokeWidth="2"
          />
          <text
            x={x(Math.abs(Mu)) + 9}
            y={y(Pu) + 4}
            fontSize="10"
            fontWeight="700"
            fill="var(--text)"
          >
            Demand
          </text>
        </g>

        <text
          x={MARGIN.left + plotWidth / 2}
          y={HEIGHT - 7}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="var(--text)"
        >
          Moment, M (kN·m)
        </text>
        <text
          x="15"
          y={MARGIN.top + plotHeight / 2}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="var(--text)"
          transform={`rotate(-90 15 ${MARGIN.top + plotHeight / 2})`}
        >
          Axial load, P (kN)
        </text>
      </svg>

      <div className="flex flex-wrap justify-center gap-4 pt-2 text-[10px] text-[var(--text-muted)]">
        <Legend color="#94a3b8" label="Nominal Pn-Mn" dashed />
        <Legend color="#8b5cf6" label="Design φPn-φMn" />
        <Legend
          color={result.status === "SAFE" ? "#22c55e" : "#ef4444"}
          label="Applied Pu-Mu"
          dot
        />
      </div>
    </div>
  );
}

function Legend({
  color,
  label,
  dashed = false,
  dot = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  dot?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={dot ? "h-2.5 w-2.5 rounded-full" : "h-0 w-6 border-t-2"}
        style={{
          backgroundColor: dot ? color : undefined,
          borderColor: color,
          borderStyle: dashed ? "dashed" : "solid",
        }}
      />
      {label}
    </span>
  );
}
