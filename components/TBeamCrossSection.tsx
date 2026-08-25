interface TBeamCrossSectionProps {
  beff: number;
  bw: number;
  hf: number;
  d: number;
  a: number;
  barDiameter: number;
  barsRequired: number;
  barsPerLayer: number;
  sectionCase: "flange" | "web";
}

function distributeBars(total: number, maximumPerLayer = 8): number[] {
  const layers: number[] = [];
  let remaining = total;

  while (remaining > 0) {
    const count = Math.min(maximumPerLayer, remaining);
    layers.push(count);
    remaining -= count;
  }

  return layers;
}

export function TBeamCrossSection({
  beff,
  bw,
  hf,
  d,
  a,
  barDiameter,
  barsRequired,
  barsPerLayer,
  sectionCase,
}: TBeamCrossSectionProps) {
  const flangeWidth = 230;
  const webWidth = Math.max(54, Math.min(100, (bw / beff) * flangeWidth));
  const flangeHeight = Math.max(28, Math.min(58, (hf / d) * 230));
  const sectionTop = 42;
  const sectionHeight = 238;
  const webTop = sectionTop + flangeHeight;
  const webBottom = sectionTop + sectionHeight;
  const flangeLeft = 46;
  const flangeRight = flangeLeft + flangeWidth;
  const centerX = flangeLeft + flangeWidth / 2;
  const webLeft = centerX - webWidth / 2;
  const webRight = centerX + webWidth / 2;
  const effectiveDepthY = sectionTop + 0.88 * sectionHeight;
  const compressionDepth = Math.min(
    sectionHeight,
    Math.max(3, (a / d) * (effectiveDepthY - sectionTop))
  );
  const compressionBottom = sectionTop + compressionDepth;
  const barLayers = distributeBars(barsRequired, barsPerLayer);
  const barRadius = Math.max(3.2, Math.min(5.5, barDiameter / 5));

  return (
    <div className="flex flex-col items-center overflow-x-auto">
      <svg
        viewBox="0 0 360 340"
        className="min-w-[330px] w-full max-w-[430px]"
        role="img"
        aria-label="T-beam cross-section with effective flange, web, compression block, and tension reinforcement"
      >
        <defs>
          <marker
            id="tbeam-dimension-arrow"
            markerWidth="7"
            markerHeight="7"
            refX="3.5"
            refY="3.5"
            orient="auto-start-reverse"
          >
            <path d="M0,3.5 L7,0 L7,7 Z" fill="var(--text-muted)" />
          </marker>
          <pattern
            id="tbeam-compression-hatch"
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

        {/* Effective flange width dimension */}
        <line
          x1={flangeLeft}
          y1="22"
          x2={flangeRight}
          y2="22"
          stroke="var(--text-muted)"
          strokeWidth="1"
          markerStart="url(#tbeam-dimension-arrow)"
          markerEnd="url(#tbeam-dimension-arrow)"
        />
        <line x1={flangeLeft} y1="27" x2={flangeLeft} y2={sectionTop} stroke="var(--text-muted)" />
        <line x1={flangeRight} y1="27" x2={flangeRight} y2={sectionTop} stroke="var(--text-muted)" />
        <text x={centerX} y="15" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
          bₑ = {beff.toFixed(0)} mm
        </text>

        {/* T-beam outline */}
        <path
          d={`M ${flangeLeft} ${sectionTop}
              H ${flangeRight}
              V ${webTop}
              H ${webRight}
              V ${webBottom}
              H ${webLeft}
              V ${webTop}
              H ${flangeLeft}
              Z`}
          fill="none"
          stroke="var(--text)"
          strokeWidth="2"
        />

        {/* Equivalent rectangular compression block */}
        {sectionCase === "flange" ? (
          <rect
            x={flangeLeft}
            y={sectionTop}
            width={flangeWidth}
            height={compressionDepth}
            fill="url(#tbeam-compression-hatch)"
          />
        ) : (
          <>
            <rect
              x={flangeLeft}
              y={sectionTop}
              width={flangeWidth}
              height={flangeHeight}
              fill="url(#tbeam-compression-hatch)"
            />
            <rect
              x={webLeft}
              y={webTop}
              width={webWidth}
              height={Math.max(0, compressionBottom - webTop)}
              fill="url(#tbeam-compression-hatch)"
            />
          </>
        )}

        {/* Compression-block depth a */}
        <line
          x1={flangeRight + 18}
          y1={sectionTop}
          x2={flangeRight + 18}
          y2={compressionBottom}
          stroke="#f5941f"
          strokeWidth="1"
          markerStart="url(#tbeam-dimension-arrow)"
          markerEnd="url(#tbeam-dimension-arrow)"
        />
        <text
          x={flangeRight + 26}
          y={(sectionTop + compressionBottom) / 2 + 3}
          fontSize="10"
          fill="#f5941f"
        >
          a = {a.toFixed(1)} mm
        </text>

        {/* Flange thickness */}
        <line
          x1={flangeLeft - 15}
          y1={sectionTop}
          x2={flangeLeft - 15}
          y2={webTop}
          stroke="var(--text-muted)"
          strokeWidth="1"
          markerStart="url(#tbeam-dimension-arrow)"
          markerEnd="url(#tbeam-dimension-arrow)"
        />
        <text
          x={flangeLeft - 20}
          y={(sectionTop + webTop) / 2 + 3}
          textAnchor="end"
          fontSize="9"
          fill="var(--text-muted)"
        >
          hₑ = {hf.toFixed(0)}
        </text>

        {/* Effective depth */}
        <line
          x1="15"
          y1={sectionTop}
          x2="15"
          y2={effectiveDepthY}
          stroke="var(--text-muted)"
          strokeWidth="1"
          markerStart="url(#tbeam-dimension-arrow)"
          markerEnd="url(#tbeam-dimension-arrow)"
        />
        <text
          x="10"
          y={(sectionTop + effectiveDepthY) / 2}
          textAnchor="end"
          fontSize="9"
          fill="var(--text-muted)"
        >
          d = {d.toFixed(0)}
        </text>

        {/* Web-width dimension */}
        <line
          x1={webLeft}
          y1={webBottom + 20}
          x2={webRight}
          y2={webBottom + 20}
          stroke="var(--text-muted)"
          strokeWidth="1"
          markerStart="url(#tbeam-dimension-arrow)"
          markerEnd="url(#tbeam-dimension-arrow)"
        />
        <text
          x={centerX}
          y={webBottom + 36}
          textAnchor="middle"
          fontSize="9"
          fill="var(--text-muted)"
        >
          bₓ = {bw.toFixed(0)} mm
        </text>

        {/* Tension reinforcement; count follows the calculator result */}
        {barLayers.map((count, layerIndex) => {
          const layerY = effectiveDepthY - layerIndex * (barRadius * 2 + 7);
          const usableWidth = Math.max(8, webWidth - 18);

          return Array.from({ length: count }, (_, index) => {
            const x =
              count === 1
                ? centerX
                : webLeft + 9 + (index * usableWidth) / (count - 1);

            return (
              <circle
                key={`${layerIndex}-${index}`}
                cx={x}
                cy={layerY}
                r={barRadius}
                fill="#f5941f"
                stroke="var(--bg)"
                strokeWidth="1"
              />
            );
          });
        })}

        <text x={webRight + 12} y={effectiveDepthY + 4} fontSize="10" fill="#f5941f">
          Aₛ: {barsRequired}-ϕ{barDiameter}
        </text>

        <text x={centerX} y="333" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
          T-beam section — schematic, not to scale
        </text>
      </svg>
    </div>
  );
}
