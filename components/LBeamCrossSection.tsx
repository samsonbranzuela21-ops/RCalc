interface LBeamCrossSectionProps {
  beff: number;
  effectiveOverhang: number;
  bw: number;
  hf: number;
  d: number;
  a: number;
  barDiameter: number;
  barsRequired: number;
  barsPerLayer: number;
  sectionCase: "flange" | "web";
}

function distributeBars(total: number, maximumPerLayer: number) {
  const layers: number[] = [];
  let remaining = total;

  while (remaining > 0) {
    const count = Math.min(maximumPerLayer, remaining);
    layers.push(count);
    remaining -= count;
  }

  return layers;
}

export function LBeamCrossSection({
  beff,
  effectiveOverhang,
  bw,
  hf,
  d,
  a,
  barDiameter,
  barsRequired,
  barsPerLayer,
  sectionCase,
}: LBeamCrossSectionProps) {
  const flangeWidth = 220;
  const webWidth = Math.max(55, Math.min(105, (bw / beff) * flangeWidth));
  const flangeHeight = Math.max(28, Math.min(58, (hf / d) * 230));
  const top = 44;
  const sectionHeight = 235;
  const flangeLeft = 55;
  const flangeRight = flangeLeft + flangeWidth;
  const webLeft = flangeLeft;
  const webRight = webLeft + webWidth;
  const webTop = top + flangeHeight;
  const bottom = top + sectionHeight;
  const effectiveDepthY = top + sectionHeight * 0.88;
  const compressionDepth = Math.min(
    sectionHeight,
    Math.max(3, (a / d) * (effectiveDepthY - top))
  );
  const compressionBottom = top + compressionDepth;
  const barRadius = Math.max(3.2, Math.min(5.5, barDiameter / 5));
  const layers = distributeBars(barsRequired, barsPerLayer);

  return (
    <div className="w-full overflow-x-auto pb-2 [scrollbar-color:#737373_#171717] [scrollbar-gutter:stable] [scrollbar-width:auto]">
      <svg
        viewBox="0 0 380 345"
        className="mx-auto block h-auto min-w-[350px] max-w-[450px]"
        role="img"
        aria-label="L-beam cross-section with one-sided effective flange, compression block, and tension reinforcement"
      >
        <defs>
          <marker
            id="lbeam-dim-arrow"
            markerWidth="7"
            markerHeight="7"
            refX="3.5"
            refY="3.5"
            orient="auto-start-reverse"
          >
            <path d="M0,3.5 L7,0 L7,7 Z" fill="var(--text-muted)" />
          </marker>
          <pattern
            id="lbeam-compression-hatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill="#f5941f" fillOpacity="0.14" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="#f5941f"
              strokeOpacity="0.65"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <line
          x1={flangeLeft}
          y1="22"
          x2={flangeRight}
          y2="22"
          stroke="var(--text-muted)"
          markerStart="url(#lbeam-dim-arrow)"
          markerEnd="url(#lbeam-dim-arrow)"
        />
        <line x1={flangeLeft} y1="27" x2={flangeLeft} y2={top} stroke="var(--text-muted)" />
        <line x1={flangeRight} y1="27" x2={flangeRight} y2={top} stroke="var(--text-muted)" />
        <text x={(flangeLeft + flangeRight) / 2} y="15" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
          bₑ = {beff.toFixed(0)} mm
        </text>

        {/* One-sided L-beam outline */}
        <path
          d={`M ${flangeLeft} ${top}
              H ${flangeRight}
              V ${webTop}
              H ${webRight}
              V ${bottom}
              H ${webLeft}
              Z`}
          fill="none"
          stroke="var(--text)"
          strokeWidth="2"
        />

        {sectionCase === "flange" ? (
          <rect
            x={flangeLeft}
            y={top}
            width={flangeWidth}
            height={compressionDepth}
            fill="url(#lbeam-compression-hatch)"
          />
        ) : (
          <>
            <rect
              x={flangeLeft}
              y={top}
              width={flangeWidth}
              height={flangeHeight}
              fill="url(#lbeam-compression-hatch)"
            />
            <rect
              x={webLeft}
              y={webTop}
              width={webWidth}
              height={Math.max(0, compressionBottom - webTop)}
              fill="url(#lbeam-compression-hatch)"
            />
          </>
        )}

        <line
          x1={flangeRight + 18}
          y1={top}
          x2={flangeRight + 18}
          y2={compressionBottom}
          stroke="#f5941f"
          markerStart="url(#lbeam-dim-arrow)"
          markerEnd="url(#lbeam-dim-arrow)"
        />
        <text x={flangeRight + 25} y={(top + compressionBottom) / 2 + 3} fontSize="9.5" fill="#f5941f">
          a = {a.toFixed(1)} mm
        </text>

        <line
          x1={flangeLeft - 17}
          y1={top}
          x2={flangeLeft - 17}
          y2={webTop}
          stroke="var(--text-muted)"
          markerStart="url(#lbeam-dim-arrow)"
          markerEnd="url(#lbeam-dim-arrow)"
        />
        <text x={flangeLeft - 23} y={(top + webTop) / 2 + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">
          hₑ = {hf.toFixed(0)}
        </text>

        <line
          x1="17"
          y1={top}
          x2="17"
          y2={effectiveDepthY}
          stroke="var(--text-muted)"
          markerStart="url(#lbeam-dim-arrow)"
          markerEnd="url(#lbeam-dim-arrow)"
        />
        <text x="11" y={(top + effectiveDepthY) / 2} textAnchor="end" fontSize="9" fill="var(--text-muted)" transform={`rotate(-90 11 ${(top + effectiveDepthY) / 2})`}>
          d = {d.toFixed(0)} mm
        </text>

        <line
          x1={webLeft}
          y1={bottom + 19}
          x2={webRight}
          y2={bottom + 19}
          stroke="var(--text-muted)"
          markerStart="url(#lbeam-dim-arrow)"
          markerEnd="url(#lbeam-dim-arrow)"
        />
        <text x={(webLeft + webRight) / 2} y={bottom + 34} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
          bₓ = {bw.toFixed(0)} mm
        </text>

        <line
          x1={webRight}
          y1={webTop - 12}
          x2={flangeRight}
          y2={webTop - 12}
          stroke="var(--text-muted)"
          markerStart="url(#lbeam-dim-arrow)"
          markerEnd="url(#lbeam-dim-arrow)"
        />
        <text x={(webRight + flangeRight) / 2} y={webTop - 18} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
          bₒ = {effectiveOverhang.toFixed(0)} mm
        </text>

        {layers.map((count, layerIndex) => {
          const y = effectiveDepthY - layerIndex * (barRadius * 2 + 7);
          const usableWidth = Math.max(8, webWidth - 18);

          return Array.from({ length: count }, (_, index) => {
            const x =
              count === 1
                ? (webLeft + webRight) / 2
                : webLeft + 9 + (index * usableWidth) / (count - 1);

            return (
              <circle
                key={`${layerIndex}-${index}`}
                cx={x}
                cy={y}
                r={barRadius}
                fill="#f5941f"
                stroke="var(--bg)"
                strokeWidth="1"
              />
            );
          });
        })}

        <text x={webRight + 10} y={effectiveDepthY + 4} fontSize="10" fill="#f5941f">
          Aₛ: {barsRequired}-ϕ{barDiameter}
        </text>
        <text x="190" y="340" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
          Interior-side flange shown to the right — schematic, not to scale
        </text>
      </svg>
    </div>
  );
}
