import { DiagramFrame, DiagramLegend, DiagramSurface } from "@/components/shared/DiagramFrame";
import type { FlangedBeamAnalysisResult } from "@/lib/flanged-beam-analysis";

const blue = "#4d7cff";
const barBlue = "#60bfff";
const orange = "#f5941f";
const red = "#e05a5a";

export function TBeamAnalysisDiagram({ shape, result: r, bw, hf, fc, overallHeight }: { shape: "T" | "L"; result: FlangedBeamAnalysisResult; bw: number; hf: number; fc: number; overallHeight?: number }) {
  const top = 65;
  const height = 255;
  const depth = overallHeight ?? Math.max(r.dExtreme * 1.08, hf * 1.5, r.a * 1.05);
  const y = (value: number) => top + value * height / depth;
  const flangeX = 45;
  const flangeW = 185;
  const webW = Math.max(44, flangeW * bw / r.beff);
  const webX = shape === "L" ? flangeX : flangeX + (flangeW - webW) / 2;
  const webBottom = top + height;
  const flangeBottom = y(hf);
  const naY = y(r.c);
  const blockBottom = Math.min(y(r.a), webBottom);
  const strainX = 365;
  const strainExtent = Math.max(r.c, r.dExtreme - r.c, 1);
  const strainAt = (value: number) => strainX + 42 * (r.c - value) / strainExtent;
  const stressX = 555;
  const forceX = 805;
  const flangeForceY = y(hf / 2);
  const webForceY = y(r.a / 2);
  // The two resultants can have nearly identical centroids when a just exceeds hf.
  // Separate the web arrow visually, while its leader still marks the true centroid.
  const webArrowY = r.sectionCase === "web" ? Math.max(webForceY, flangeForceY + 30) : webForceY;
  const layers = [
    ...r.compressionLayers.map((layer, index) => ({ ...layer, label: "s'" + (index + 1), role: "compression" })),
    ...r.tensionLayers.map((layer, index) => ({ ...layer, label: "s" + (index + 1), role: "tension" })),
  ];
  const barsAt = (count: number) => count === 1 ? [webX + webW / 2] :
    Array.from({ length: count }, (_, index) => webX + 7 + index * (webW - 14) / (count - 1));
  const barRadius = Math.min(3.5, webW / (2 * Math.max(2, ...layers.map((layer) => layer.barCount))));
  const beamLabel = shape === "L" ? "L-beam" : "T-beam";
  const title = r.compressionLayers.length ? `Doubly reinforced ${beamLabel} section analysis` : `Singly reinforced ${beamLabel} section analysis`;

  return <DiagramFrame title={title} legend={<>
    <DiagramLegend color={barBlue} label="Reinforcing bars" dot />
    <DiagramLegend color={blue} label="Concrete compression" />
    <DiagramLegend color={orange} label="Compression force / stress" />
    <DiagramLegend color={red} label="Tension force / strain" />
    <DiagramLegend color="var(--text-muted)" label="Neutral axis / dimensions" dashed />
  </>}>
    <svg viewBox="0 0 1010 400" role="img" aria-label={title + ": section, strain, stress and internal forces"} className="block h-auto w-full min-w-[820px]">
      <DiagramSurface width={1010} height={400} />
      <defs>
        <marker id="t-blue" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill={blue} /></marker>
        <marker id="t-orange" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill={orange} /></marker>
        <marker id="t-red" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill={red} /></marker>
      </defs>
      <text x={flangeX + flangeW / 2} y={top - 18} textAnchor="middle" fontSize="10" fill="var(--text-muted)">bf = {r.beff.toFixed(0)} mm</text>
      <path d={"M" + flangeX + " " + top + " H" + (flangeX + flangeW) + " V" + flangeBottom + " H" + (webX + webW) + " V" + webBottom + " H" + webX + " V" + flangeBottom + " H" + flangeX + " Z"} fill="var(--bg-surface)" stroke="var(--text)" strokeWidth="1.5" />
      <rect x={flangeX} y={top} width={flangeW} height={Math.min(naY, flangeBottom) - top} fill={blue} fillOpacity=".15" />
      {naY > flangeBottom && <rect x={webX} y={flangeBottom} width={webW} height={Math.min(naY, webBottom) - flangeBottom} fill={blue} fillOpacity=".15" />}
      <line x1={flangeX} x2={strainX + 44} y1={naY} y2={naY} stroke="var(--text-muted)" strokeDasharray="5 4" />
      <text x={flangeX - 4} y={naY - 5} textAnchor="end" fontSize="9" fill="var(--text)">N.A.</text>
      <text x={webX + webW / 2} y={webBottom + 13} textAnchor="middle" fontSize="9" fill="var(--text-muted)">bw = {bw.toFixed(0)} mm</text>
      {overallHeight && <text x={flangeX - 6} y={webBottom + 13} textAnchor="end" fontSize="9" fill="var(--text-muted)">h = {overallHeight.toFixed(0)} mm</text>}
      <text x={flangeX + flangeW + 8} y={flangeBottom + 3} fontSize="9" fill="var(--text-muted)">hf = {hf.toFixed(0)} mm</text>
      {layers.map((layer) => <g key={"bars-" + layer.label} data-layer-role={layer.role} data-web-left={webX} data-web-right={webX + webW}>
        {barsAt(layer.barCount).map((x, index) => <circle key={index} cx={x} cy={y(layer.depth)} r={barRadius} fill={barBlue} />)}
        <text x={flangeX + flangeW + 8} y={y(layer.depth) + 3} fontSize="8.5" fill={barBlue}>d{layer.label} = {layer.depth.toFixed(0)}</text>
      </g>)}
      <text x={flangeX + flangeW / 2} y="360" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--text)">1. Reinforced section</text>

      <line x1={strainX} x2={strainX} y1={top} y2={webBottom} stroke="var(--text)" />
      <polygon points={strainX + "," + top + " " + strainAt(0) + "," + top + " " + strainX + "," + naY} fill={blue} fillOpacity=".23" stroke={blue} />
      <polygon points={strainX + "," + naY + " " + strainX + "," + y(r.dExtreme) + " " + strainAt(r.dExtreme) + "," + y(r.dExtreme)} fill={red} fillOpacity=".2" stroke={red} />
      <line x1={strainAt(0)} x2={strainAt(r.dExtreme)} y1={top} y2={y(r.dExtreme)} stroke="var(--text)" strokeWidth="2" />
      {layers.map((layer) => <circle key={"strain-" + layer.label} cx={strainAt(layer.depth)} cy={y(layer.depth)} r="3" fill={layer.stress < 0 ? red : orange} />)}
      <text x={strainAt(0) + 5} y={top - 9} fontSize="10" fill="var(--text)">εcu = 0.003</text>
      <text x={strainAt(r.dExtreme) - 5} y={y(r.dExtreme) + 13} textAnchor="end" fontSize="10" fill="var(--text)">εt = {r.epsilonT.toFixed(4)}</text>
      <text x={strainX} y="360" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--text)">2. Strain distribution</text>

      <line x1={stressX} x2={stressX} y1={top} y2={webBottom} stroke="var(--text)" />
      <text x={stressX + 38} y={top - 18} textAnchor="middle" fontSize="10" fill="var(--text)">0.85f′c = {(0.85 * fc).toFixed(1)} MPa</text>
      <rect x={stressX} y={top} width="70" height={Math.max(1, blockBottom - top)} fill="none" stroke="var(--text)" />
      {Array.from({ length: 4 }, (_, index) => <line key={index} x1={stressX + 65} x2={stressX + 5} y1={top + (index + .5) * (blockBottom - top) / 4} y2={top + (index + .5) * (blockBottom - top) / 4} stroke={blue} markerEnd="url(#t-blue)" />)}
      <text x={stressX - 8} y={blockBottom + 4} textAnchor="end" fontSize="10" fill="var(--text)">a = {r.a.toFixed(1)}</text>
      {layers.map((layer) => <g key={"stress-" + layer.label}>
        <line x1={layer.stress < 0 ? stressX : stressX + 70} x2={layer.stress < 0 ? stressX + 70 : stressX} y1={y(layer.depth)} y2={y(layer.depth)} stroke={layer.stress < 0 ? red : orange} markerEnd={layer.stress < 0 ? "url(#t-red)" : "url(#t-orange)"} />
        <text x={stressX + 75} y={y(layer.depth) + 3} fontSize="8.5" fill={layer.stress < 0 ? red : orange}>f{layer.label} = {layer.stress.toFixed(0)} MPa</text>
      </g>)}
      <text x={stressX + 38} y="360" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--text)">3. Stress distribution</text>

      {r.sectionCase === "web" && <g>
        <line x1={forceX + 34} x2={forceX - 50} y1={flangeForceY} y2={flangeForceY} stroke={blue} strokeWidth="2" markerEnd="url(#t-blue)" />
        <text x={forceX + 40} y={flangeForceY - 5} fontSize="9" fill={blue}>Cf = {(r.concreteFlangeForce / 1000).toFixed(1)} kN</text>
      </g>}
      {webArrowY > webForceY + 1 && <g aria-label="Dashed leader marks the web force centroid">
        <path d={`M${forceX - 50} ${webArrowY} H${forceX - 60} V${webForceY}`} fill="none" stroke={blue} strokeDasharray="3 3" />
        <circle cx={forceX - 60} cy={webForceY} r="2" fill={blue} />
      </g>}
      <line x1={forceX + 34} x2={forceX - 50} y1={webArrowY} y2={webArrowY} stroke={blue} strokeWidth="2" markerEnd="url(#t-blue)" />
      <text x={forceX + 40} y={webArrowY - 5} fontSize="9" fill={blue}>{r.sectionCase === "flange" ? "Cc" : "Cw"} = {(r.concreteWebForce / 1000).toFixed(1)} kN</text>
      {layers.map((layer) => {
        const tension = layer.netForce < 0;
        return <g key={"force-" + layer.label}>
          <line x1={tension ? forceX - 48 : forceX + 34} x2={tension ? forceX + 34 : forceX - 48} y1={y(layer.depth)} y2={y(layer.depth)} stroke={tension ? red : orange} strokeWidth="2" markerEnd={tension ? "url(#t-red)" : "url(#t-orange)"} />
          <text x={forceX + 42} y={y(layer.depth) + 3} fontSize="9" fill={tension ? red : orange}>F{layer.label} = {Math.abs(layer.netForce / 1000).toFixed(1)} kN</text>
        </g>;
      })}
      <text x={forceX} y="360" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--text)">4. Internal forces</text>
      <text x="510" y="383" textAnchor="middle" fontSize="9" fill="var(--text-muted)">Bar positions are schematic; check actual spacing, cover and development separately.</text>
    </svg>
  </DiagramFrame>;
}
