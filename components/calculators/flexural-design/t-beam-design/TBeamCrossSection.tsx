import { DiagramSurface } from "@/components/shared/DiagramFrame";
import type { TBeamSteelLayerResult } from "@/lib/t-beam";

interface TBeamCrossSectionProps {
  beff: number;
  bw: number;
  hf: number;
  d: number;
  a: number;
  ok: boolean;
  barDiameter: number;
  sectionCase: "flange" | "web";
  cover: number;
  stirrup: number;
  tensionLayers: TBeamSteelLayerResult[];
  compressionLayers: TBeamSteelLayerResult[];
  shape?: "T" | "L";
}

const BLUE = "#60bfff";
const DIMENSION = "var(--text-muted)";

export function TBeamCrossSection({
  beff, bw, hf, d, a, ok, barDiameter, sectionCase,
  cover, stirrup, tensionLayers, compressionLayers,
  shape = "T",
}: TBeamCrossSectionProps) {
  // The design accepts d rather than h; infer only the bottom cover extension for the sketch.
  const inferredHeight = d + cover + stirrup + barDiameter / 2;
  const left = 105;
  const top = 62;
  const flangeWidth = 290;
  const height = 296;
  const bottom = top + height;
  const webWidth = Math.max(90, flangeWidth * bw / beff);
  const center = shape === "L" ? left + webWidth / 2 : left + flangeWidth / 2;
  const webLeft = center - webWidth / 2;
  const webRight = center + webWidth / 2;
  const sx = webWidth / bw;
  const sy = height / inferredHeight;
  const toY = (depth: number) => top + depth * sy;
  const flangeBottom = toY(hf);
  const blockBottom = toY(Math.min(a, inferredHeight));
  const tensionArea = tensionLayers.reduce((sum, layer) => sum + layer.area, 0);
  const tensionCentroid = tensionLayers.reduce((sum, layer) =>
    sum + layer.area * layer.depth, 0) / tensionArea;
  const compressionArea = compressionLayers.reduce((sum, layer) => sum + layer.area, 0);
  const compressionCentroid = compressionArea > 0
    ? compressionLayers.reduce((sum, layer) => sum + layer.area * layer.depth, 0) / compressionArea
    : null;
  const insideLeft = webLeft + (cover + stirrup) * sx;
  const insideRight = webRight - (cover + stirrup) * sx;
  const envelopeTop = toY(cover + stirrup / 2);
  const envelopeBottom = toY(inferredHeight - cover - stirrup / 2);

  function drawBars(layers: TBeamSteelLayerResult[], role: string) {
    return layers.flatMap((layer, layerIndex) => {
      const radius = Math.max(4.5, Math.min(7.5, layer.diameter * sx / 2));
      const first = insideLeft + layer.diameter * sx / 2;
      const last = insideRight - layer.diameter * sx / 2;
      return Array.from({ length: layer.barCount }, (_, index) => {
        const x = layer.barCount === 1 ? center :
          first + (last - first) * index / (layer.barCount - 1);
        return <circle key={role + "-" + layerIndex + "-" + index}
          cx={x} cy={toY(layer.depth)} r={radius}
          fill={BLUE} stroke="var(--bg)" strokeWidth="1.5" />;
      });
    });
  }

  return (
    <svg viewBox="0 0 500 430" className="mt-2 block h-auto w-full"
       role="img" aria-label={`${shape}-beam section with adopted reinforcement, stirrup envelope, and compression-block depth a`}>
      <defs>
        <marker id="t-design-arrow" markerWidth="7" markerHeight="7" refX="3.5"
          refY="3.5" orient="auto-start-reverse">
          <path d="M0,0 L7,3.5 L0,7 z" fill={DIMENSION} />
        </marker>
        <marker id="t-design-a-arrow" markerWidth="7" markerHeight="7" refX="3.5"
          refY="3.5" orient="auto-start-reverse">
          <path d="M0,0 L7,3.5 L0,7 z" fill="#f5941f" />
        </marker>
      </defs>
      <DiagramSurface width={500} height={430} />
      {sectionCase === "flange" ? (
        <rect x={left} y={top} width={flangeWidth} height={Math.max(0, blockBottom - top)}
          fill="#f5941f" fillOpacity="0.13" />
      ) : (
        <>
          <rect x={left} y={top} width={flangeWidth} height={flangeBottom - top}
            fill="#f5941f" fillOpacity="0.13" />
          <rect x={webLeft} y={flangeBottom} width={webWidth}
            height={Math.max(0, blockBottom - flangeBottom)}
            fill="#f5941f" fillOpacity="0.13" />
        </>
      )}
      <path d={"M " + left + " " + top + " H " + (left + flangeWidth) +
        " V " + flangeBottom + " H " + webRight + " V " + bottom +
        " H " + webLeft + " V " + flangeBottom + " H " + left + " Z"}
        fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d={"M " + (webLeft + (cover + stirrup / 2) * sx) + " " + envelopeTop +
        " H " + (webRight - (cover + stirrup / 2) * sx) +
        " V " + envelopeBottom + " H " +
        (webLeft + (cover + stirrup / 2) * sx) + " Z"}
        fill="none" stroke={DIMENSION} strokeDasharray="6 5" strokeWidth="1.4" />

      {ok && <><line x1={webLeft - 12} y1={toY(tensionCentroid)}
        x2={webRight + 12} y2={toY(tensionCentroid)}
        stroke={BLUE} strokeDasharray="5 5" strokeWidth="1.5" />
        <text x={webLeft - 18} y={toY(tensionCentroid) + 4}
          textAnchor="end" fill={BLUE} fontSize="10" fontWeight="600"
          paintOrder="stroke" stroke="var(--bg)" strokeWidth="4"
          strokeLinejoin="round">tension-steel centroid</text></>}
      {ok && compressionCentroid !== null && <>
        <line x1={webLeft - 12} y1={toY(compressionCentroid)}
          x2={webRight + 12} y2={toY(compressionCentroid)}
          stroke={BLUE} strokeDasharray="5 5" strokeWidth="1.5" />
        <text x={webLeft - 18} y={toY(compressionCentroid) + 4}
          textAnchor="end" fill={BLUE} fontSize="10" fontWeight="600"
          paintOrder="stroke" stroke="var(--bg)" strokeWidth="4"
          strokeLinejoin="round">compression-steel centroid</text>
      </>}

      {ok ? <>
        {drawBars(tensionLayers, "tension")}
        {drawBars(compressionLayers, "compression")}
      </> : <text x={center} y={top + height * 0.6}
        textAnchor="middle" fill={DIMENSION} fontSize="11">No feasible bar layout</text>}

      <Dimension x1={left} y1={32} x2={left + flangeWidth} y2={32}
        label={"bf = " + beff.toFixed(0) + " mm"} />
      <Dimension x1={68} y1={top} x2={68} y2={bottom}
        label={"h ≈ " + inferredHeight.toFixed(0) + " mm"} vertical />
      <Dimension x1={432} y1={top} x2={432} y2={toY(d)}
        label={"d = " + d.toFixed(0) + " mm"} vertical />
      {blockBottom - top >= 28 ? (
        <Dimension x1={406} y1={top} x2={406} y2={blockBottom}
          label="" vertical color="#f5941f" />
      ) : (
        <g stroke="#f5941f" strokeWidth="1.5">
          <line x1={406} y1={top} x2={406} y2={blockBottom} />
          <line x1={401} y1={top} x2={411} y2={top} />
          <line x1={401} y1={blockBottom} x2={411} y2={blockBottom} />
        </g>
      )}
      <text x={405} y={52} fill="#f5941f" fontSize="11" fontWeight="600">
        a = {a.toFixed(1)} mm
      </text>
      <Dimension x1={webLeft} y1={402} x2={webRight} y2={402}
        label={"bw = " + bw.toFixed(0) + " mm"} />
      <text x={left - 9} y={(top + flangeBottom) / 2} textAnchor="end"
        fill={DIMENSION} fontSize="10">hf = {hf.toFixed(0)}</text>
      <text x="250" y="425" textAnchor="middle" fill={DIMENSION} fontSize="9">
        {shape === "L" ? "One-sided flange shown; " : ""}Section depth is inferred from d and bottom cover; bars follow the adopted row depths.
      </text>
    </svg>
  );
}

function Dimension({ x1, y1, x2, y2, label, vertical = false, color = DIMENSION }: {
  x1: number; y1: number; x2: number; y2: number; label: string;
  vertical?: boolean; color?: string;
}) {
  const labelX = x1 - 9;
  const labelY = (y1 + y2) / 2;
  return <g>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1"
      markerStart={color === "#f5941f" ? "url(#t-design-a-arrow)" : "url(#t-design-arrow)"}
      markerEnd={color === "#f5941f" ? "url(#t-design-a-arrow)" : "url(#t-design-arrow)"} />
    {label && vertical ? <text x={labelX} y={labelY} textAnchor="middle" fill={color}
      fontSize="10" transform={"rotate(-90 " + labelX + " " + labelY + ")"}>
      {label}
    </text> : label ? <text x={(x1 + x2) / 2} y={y1 - 8}
      textAnchor="middle" fill={color} fontSize="10">{label}</text> : null}
  </g>;
}
