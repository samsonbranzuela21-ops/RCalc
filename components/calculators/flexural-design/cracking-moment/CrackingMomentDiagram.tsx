import { DiagramFrame, DiagramLegend, DiagramSurface } from "@/components/shared/DiagramFrame";
import { InlineKatex } from "@/components/shared/Katex";
import type { CrackingMomentResult, ReinforcementLayerResult } from "@/lib/cracking-moment";

const TENSION = "#60bfff";
const COMPRESSION = "#f5941f";
const TENSION_ZONE = "#38bdf8";
const COMPRESSION_ZONE = "#fb923c";
const GROSS_AXIS = "#94a3b8";
const TRANSFORMED_AXIS = "#39c98a";
const CRACKED_AXIS = "#e05353";

export function CrackingMomentDiagram({ result }: { result: CrackingMomentResult }) {
  return (
    <DiagramFrame
      title="Beam cross-section, cracking moment, and curvature"
      legend={
        <>
          <DiagramLegend color={TENSION} label="Tension reinforcement" dot />
          <DiagramLegend color={COMPRESSION} label="Compression reinforcement" dot />
          <DiagramLegend color={COMPRESSION_ZONE} label="Concrete compression zone" />
          <DiagramLegend color={TENSION_ZONE} label="Concrete tension zone" />
          <DiagramLegend color={GROSS_AXIS} label="Concrete-only centroid" dashed />
          {result.layers.length > 0 && <DiagramLegend color={TRANSFORMED_AXIS} label="Selected before-cracking N.A." dashed />}
          {result.input.curvatureBasis === "after-cracking" && <DiagramLegend color={CRACKED_AXIS} label="After-cracking N.A." dashed />}
        </>
      }
    >
      <div className="grid min-w-[760px] gap-3 lg:grid-cols-[minmax(430px,1.15fr)_minmax(300px,.85fr)]">
        <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
          <h3 className="text-xs font-bold">Beam cross-section</h3>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            Proportional geometry, actual bar counts and layer depths, and the pre-cracking neutral axis.
          </p>
          <SectionSketch result={result} />
        </section>

        <div className="grid content-start gap-3">
          <ResultCard result={result} />
          {result.layers.length > 0 && <LayerSchedule result={result} />}
          <StressGraph result={result} />
        </div>
      </div>
    </DiagramFrame>
  );
}

function SectionSketch({ result }: { result: CrackingMomentResult }) {
  const { sectionShape } = result.input;
  const isFlanged = sectionShape === "t" || sectionShape === "l";
  const h = result.input.h ?? 1;
  const fullWidth = sectionShape === "rectangular" ? result.input.b ?? 1 : isFlanged ? result.input.bf ?? 1 : 300;
  const webWidth = isFlanged ? result.input.bw ?? 1 : fullWidth;
  const hf = isFlanged ? result.input.hf ?? 0 : 0;
  const maxDrawW = 250;
  const maxDrawH = 315;
  const scale = Math.min(maxDrawW / fullWidth, maxDrawH / h);
  const drawW = fullWidth * scale;
  const drawH = h * scale;
  const webW = webWidth * scale;
  const flangeH = hf * scale;
  const top = 54;
  const centerX = 260;
  const flangeLeft = centerX - drawW / 2;
  const webLeft = sectionShape === "l" ? flangeLeft : centerX - webW / 2;
  const bottom = top + drawH;
  const grossY = top + result.grossCentroidFromTop * scale;
  const selectedY = top + result.selectedCentroidFromTop * scale;
  const crackedY = top + result.crackedCentroidFromTop * scale;
  const steelIncluded = result.input.momentBasis === "uncracked" && result.layers.length > 0;
  const afterCracking = result.input.curvatureBasis === "after-cracking";
  const neutralY = selectedY;
  const positive = result.input.direction === "positive";
  const sectionPath = !isFlanged
    ? `M${flangeLeft},${top} H${flangeLeft + drawW} V${bottom} H${flangeLeft} Z`
    : `M${flangeLeft},${top} H${flangeLeft + drawW} V${top + flangeH} H${webLeft + webW} V${bottom} H${webLeft} V${top + flangeH} H${flangeLeft} Z`;

  return (
    <svg viewBox="0 0 520 430" className="mt-2 block h-auto w-full" role="img" aria-label={`${shapeLabel(sectionShape)} section before cracking`}>
      <defs>
        <marker id="cracking-dimension-arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse">
          <path d="M0,0 L7,3.5 L0,7 z" fill="var(--text-muted)" />
        </marker>
        <clipPath id="cracking-section-clip"><path d={sectionPath} /></clipPath>
      </defs>
      <DiagramSurface width={520} height={430} />
      <path d={sectionPath} fill="var(--bg-surface)" stroke="none" />
      <g clipPath="url(#cracking-section-clip)">
        <rect x={flangeLeft} y={positive ? top : neutralY} width={drawW} height={positive ? neutralY - top : bottom - neutralY} fill={COMPRESSION_ZONE} fillOpacity="0.18" />
        <rect x={flangeLeft} y={positive ? neutralY : top} width={drawW} height={positive ? bottom - neutralY : neutralY - top} fill={TENSION_ZONE} fillOpacity="0.14" />
      </g>
      <path d={sectionPath} fill="none" stroke="var(--text)" strokeWidth="2" strokeLinejoin="round" />

      <text x={webLeft + webW / 2} y={positive ? top + Math.max(14, (neutralY - top) / 2) : neutralY + Math.max(14, (bottom - neutralY) / 2)} textAnchor="middle" fill={COMPRESSION} fontSize="9" fontWeight="600">compression</text>
      <text x={webLeft + webW / 2} y={positive ? neutralY + Math.max(14, (bottom - neutralY) / 2) : top + Math.max(14, (neutralY - top) / 2)} textAnchor="middle" fill={TENSION} fontSize="9" fontWeight="600">tension</text>

      {result.layers.map((layer, index) => (
        <SteelLayer
          key={`${layer.role}-${index}`}
          layer={layer}
          y={top + layer.depth * scale}
          left={layer.depth <= hf && isFlanged ? flangeLeft : webLeft}
          width={layer.depth <= hf && isFlanged ? drawW : webW}
          scale={scale}
        />
      ))}

      <Axis y={grossY} x1={flangeLeft - 10} x2={flangeLeft + drawW + 10} color={GROSS_AXIS} label={`concrete-only centroid = ${f(result.grossCentroidFromTop)} mm`} />
      {steelIncluded && Math.abs(selectedY - grossY) > 0.5 && (
        <Axis y={selectedY} x1={flangeLeft - 10} x2={flangeLeft + drawW + 10} color={TRANSFORMED_AXIS} label={`selected before-cracking N.A. = ${f(result.selectedCentroidFromTop)} mm`} below />
      )}
      {afterCracking && <Axis y={crackedY} x1={flangeLeft - 10} x2={flangeLeft + drawW + 10} color={CRACKED_AXIS} label={`after-cracking N.A. = ${f(result.crackedCentroidFromTop)} mm`} below />}

      {sectionShape !== "custom" && <Dimension x1={flangeLeft} y1={30} x2={flangeLeft + drawW} y2={30} label={`${sectionShape === "rectangular" ? "b" : "bf"} = ${f(fullWidth, 0)} mm`} />}
      <Dimension x1={flangeLeft - 28} y1={top} x2={flangeLeft - 28} y2={bottom} label={`h = ${f(h, 0)} mm`} vertical />
      {isFlanged && (
        <>
          <Dimension x1={webLeft} y1={bottom + 22} x2={webLeft + webW} y2={bottom + 22} label={`bw = ${f(webWidth, 0)} mm`} />
          <Dimension x1={flangeLeft + drawW + 25} y1={top} x2={flangeLeft + drawW + 25} y2={top + flangeH} label={`hf = ${f(hf, 0)} mm`} vertical />
        </>
      )}
      <text x="260" y="414" textAnchor="middle" fill="var(--text-muted)" fontSize="9">
        {sectionShape === "custom" ? "Generic outline for the entered gross properties." : "Drawing is proportional to the entered section dimensions."}
      </text>
    </svg>
  );
}

function SteelLayer({ layer, y, left, width, scale }: { layer: ReinforcementLayerResult; y: number; left: number; width: number; scale: number }) {
  const padding = Math.min(18, width * 0.12);
  const usable = Math.max(0, width - 2 * padding);
  const radius = Math.max(3.5, Math.min(8, layer.diameter * scale / 2));
  const color = layer.role === "tension" ? TENSION : COMPRESSION;
  return (
    <g>
      {Array.from({ length: layer.count }, (_, index) => {
        const x = layer.count === 1 ? left + width / 2 : left + padding + usable * index / (layer.count - 1);
        return <circle key={index} cx={x} cy={y} r={radius} fill={color} stroke="var(--bg)" strokeWidth="1.5" />;
      })}
      <text x={left + width + 8} y={y + 3} fill={color} fontSize="8">
        {layer.role === "tension" ? "As" : "As′"}
      </text>
    </g>
  );
}

function Axis({ y, x1, x2, color, label, below = false }: { y: number; x1: number; x2: number; color: string; label: string; below?: boolean }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeDasharray="5 4" />
      <text x={x1 + 4} y={y + (below ? 12 : -6)} fill={color} fontSize="8">{label}</text>
    </g>
  );
}

function Dimension({ x1, y1, x2, y2, label, vertical = false }: { x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean }) {
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-muted)" markerStart="url(#cracking-dimension-arrow)" markerEnd="url(#cracking-dimension-arrow)" />
      {vertical ? (
        <text x={x1 - 8} y={(y1 + y2) / 2} textAnchor="middle" fill="var(--text-muted)" fontSize="9" transform={`rotate(-90 ${x1 - 8} ${(y1 + y2) / 2})`}>{label}</text>
      ) : (
        <text x={(x1 + x2) / 2} y={y1 - 7} textAnchor="middle" fill="var(--text-muted)" fontSize="9">{label}</text>
      )}
    </g>
  );
}

function ResultCard({ result }: { result: CrackingMomentResult }) {
  const steelIncluded = result.input.momentBasis === "uncracked" && result.layers.length > 0;
  const afterCracking = result.input.curvatureBasis === "after-cracking";
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Cracking moment result</p>
      <div className="mt-2 rounded-md border border-[#f5941f]/40 bg-[#f5941f]/10 p-3">
        <p className="text-xs font-bold">{steelIncluded ? "Before-cracking Yg and Ig include steel" : "Before-cracking Yg and Ig use concrete only"}</p>
        <div className="mt-1 overflow-x-auto text-sm font-bold text-[#f5941f]">
          <InlineKatex math={`M_{cr}=${f(result.Mcr, 3)}\\;\\text{kN}\\cdot\\text{m}`} />
        </div>
        <div className="mt-1 overflow-x-auto text-xs font-bold text-[#39c98a]">
          <InlineKatex math={`\\phi_{cr}^{${afterCracking ? "+" : "-"}}=${result.curvaturePerM.toExponential(4)}\\;\\text{m}^{-1}`} />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Metric label="Selected before-cracking Ig" value={`${result.selectedInertia.toExponential(3)} mm⁴`} />
        <Metric label="Selected Yg to tension face" value={`${f(result.selectedYt)} mm`} />
        <Metric label="Selected N.A. from top" value={`${f(result.selectedCentroidFromTop)} mm`} />
        <Metric label="Curvature stage" value={afterCracking ? "Just after cracking" : "Just before cracking"} />
        {afterCracking && <>
          <Metric label="After-cracking INA" value={`${result.crackedInertia.toExponential(3)} mm⁴`} />
          <Metric label="cNA from compression face" value={`${f(result.crackedNeutralAxisFromCompressionFace)} mm`} />
        </>}
      </div>
    </section>
  );
}

function LayerSchedule({ result }: { result: CrackingMomentResult }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Reinforcement layers</p>
      <div className="mt-2 space-y-2">
        {result.layers.map((layer, index) => (
          <div key={`${layer.role}-${index}`} className="flex gap-2 rounded-md border border-[var(--border)] p-2">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: layer.role === "tension" ? TENSION : COMPRESSION }} />
            <div>
              <p className="text-[11px] font-bold">{layer.role === "tension" ? "Tension" : "Compression"}: {layer.count}–{f(layer.diameter, 0)} mm</p>
              <p className="text-[10px] text-[var(--text-muted)]">
                Depth from top: {f(layer.depth)} mm · Area: {f(layer.area, 2)} mm² · before-cracking factor: {f(layer.transformFactor, 3)}
                {result.input.curvatureBasis === "after-cracking" && <> · after-cracking factor: {f(layer.crackedTransformFactor, 3)}</>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StressGraph({ result }: { result: CrackingMomentResult }) {
  const positive = result.input.direction === "positive";
  const h = result.input.h ?? 1;
  const centroid = result.selectedCentroidFromTop;
  const yt = result.selectedYt;
  const compressionDepth = positive ? centroid : h - centroid;
  const compressionStress = result.fr * compressionDepth / yt;
  const top = 26;
  const bottom = 158;
  const axisY = top + centroid / h * (bottom - top);
  const stressAxisX = 250;
  const tensionWidth = 98;
  const compressionWidth = Math.min(110, Math.max(42, tensionWidth * compressionStress / result.fr));
  const tensionFaceY = positive ? bottom : top;
  const compressionFaceY = positive ? top : bottom;
  const tensionX = stressAxisX - tensionWidth;
  const compressionX = stressAxisX + compressionWidth;
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Linear stress at first cracking</p>
      <p className="mt-1 text-[9px] text-[var(--text-muted)]">The zero-stress axis uses the selected before-cracking centroid used to calculate Mcr.</p>
      <figure className="mx-auto mt-3 w-full max-w-[500px]">
        <svg viewBox="0 0 420 184" className="block h-auto w-full" role="img" aria-labelledby="cracking-stress-title cracking-stress-description">
          <title id="cracking-stress-title">Proportional linear elastic stress diagram at first cracking</title>
          <desc id="cracking-stress-description">
            The beam section and triangular compression and tension stress blocks share the selected before-cracking neutral axis.
          </desc>

          <rect x="48" y={top} width="64" height={bottom - top} rx="3" fill="var(--bg-surface)" />
          <rect x="48" y={positive ? top : axisY} width="64" height={positive ? axisY - top : bottom - axisY} fill={COMPRESSION_ZONE} fillOpacity="0.20" />
          <rect x="48" y={positive ? axisY : top} width="64" height={positive ? bottom - axisY : axisY - top} fill={TENSION_ZONE} fillOpacity="0.18" />
          <rect x="48" y={top} width="64" height={bottom - top} rx="3" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" />

          <line x1="28" y1={axisY} x2="392" y2={axisY} stroke={GROSS_AXIS} strokeWidth="1.25" strokeDasharray="7 6" />
          <line x1={stressAxisX} y1={top} x2={stressAxisX} y2={bottom} stroke="var(--text-muted)" strokeWidth="1.5" />
          <polygon points={`${stressAxisX},${axisY} ${stressAxisX},${tensionFaceY} ${tensionX},${tensionFaceY}`} fill={TENSION_ZONE} fillOpacity="0.25" stroke={TENSION} strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points={`${stressAxisX},${axisY} ${stressAxisX},${compressionFaceY} ${compressionX},${compressionFaceY}`} fill={COMPRESSION_ZONE} fillOpacity="0.32" stroke={COMPRESSION} strokeWidth="2.5" strokeLinejoin="round" />

          <text x="56" y={axisY - 8} fill="var(--text-muted)" fontSize="11" fontWeight="600">N.A.</text>
          <text x="18" y={positive ? 178 : 17} fill={TENSION} fontSize="12" fontWeight="700">fr = {f(result.fr, 3)} MPa</text>
          <text x="402" y={positive ? 17 : 178} textAnchor="end" fill={COMPRESSION} fontSize="12" fontWeight="700">fc = {f(compressionStress, 3)} MPa</text>
          <text x="80" y={positive ? top + 18 : bottom - 9} textAnchor="middle" fill={COMPRESSION} fontSize="11" fontWeight="600">C</text>
          <text x="80" y={positive ? bottom - 9 : top + 18} textAnchor="middle" fill={TENSION} fontSize="11" fontWeight="600">T</text>
        </svg>
        <figcaption className="mt-2 text-center text-[9px] leading-relaxed text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text)]">{positive ? "Positive moment" : "Negative moment"}</span>
          {positive ? " — bottom fiber in tension" : " — top fiber in tension"}
          <span className="block">Stress varies linearly before cracking.</span>
        </figcaption>
      </figure>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-[var(--bg-surface)] p-2"><p className="text-[9px] text-[var(--text-muted)]">{label}</p><p className="mt-0.5 break-words text-[10px] font-bold">{value}</p></div>;
}

function shapeLabel(shape: CrackingMomentResult["input"]["sectionShape"]) {
  if (shape === "t") return "T-beam";
  if (shape === "l") return "L-beam";
  if (shape === "custom") return "Custom";
  return "Rectangular beam";
}

function f(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}
