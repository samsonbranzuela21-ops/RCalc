interface StrainStressDiagramProps {
  b: number;
  d: number;
  c: number;
  a: number;
  fc: number;
  isDoublyReinforced?: boolean;
  dPrime?: number;
  compressionSteelYields?: boolean | null;
  fsPrime?: number | null;
  fy?: number;
  As?: number;
  AsPrime?: number;
  numBars?: number;
  numBarsPrime?: number;
}

export function StrainStressDiagram({
  b,
  d,
  c,
  a,
  fc,
  isDoublyReinforced = false,
  dPrime,
  compressionSteelYields,
  fsPrime,
  fy,
  As,
  AsPrime,
  numBars = 5,
  numBarsPrime = 2,
}: StrainStressDiagramProps) {
  if (isDoublyReinforced && dPrime) {
    return (
      <DoublyReinforcedDiagram
        b={b}
        d={d}
        dPrime={dPrime}
        c={c}
        a={a}
        fc={fc}
        fy={fy}
        As={As}
        AsPrime={AsPrime}
        numBars={numBars}
        numBarsPrime={numBarsPrime}
        compressionSteelYields={compressionSteelYields}
        fsPrime={fsPrime}
      />
    );
  }

  return (
    <SinglyReinforcedDiagram
      b={b}
      d={d}
      c={c}
      a={a}
      fc={fc}
      numBars={numBars}
    />
  );
}

// ============================================================
// SINGLY REINFORCED — cross-section / strain / stress / forces
// ============================================================
function SinglyReinforcedDiagram({
  b,
  d,
  c,
  a,
  fc,
  numBars,
}: {
  b: number;
  d: number;
  c: number;
  a: number;
  fc: number;
  numBars: number;
}) {
  const top = 60;
  const sectionHeight = 190;
  const bottom = top + sectionHeight;
  const safeD = Math.max(d, 1);
  const scale = sectionHeight / safeD;

  const naY = top + Math.min(Math.max(c, 0), safeD) * scale;
  const blockHeight = Math.max(4, Math.min(Math.max(a, 0) * scale, sectionHeight));
  const steelY = bottom - 12;

  const sectionX = 60;
  const sectionW = 82;
  const strainCx = 250;
  const stressX = 370;
  const stressW = 56;
  const forcesX = 520;

  const barXs = createBarPositions(numBars, sectionX, sectionW, 10);
  const concreteForceY = top + blockHeight / 2;
  const leverArmMidY = (concreteForceY + steelY) / 2;
  const steelPositionTolerance = 1e-9;
  const bottomSteelState =
    d > c + steelPositionTolerance
      ? "tension"
      : d < c - steelPositionTolerance
        ? "compression"
        : "zero";
  const bottomSteelColor =
    bottomSteelState === "tension" ? "#e05a5a" : "#f5941f";
  const bottomSteelMarker =
    bottomSteelState === "tension" ? "url(#force-red)" : "url(#force-orange)";
  const bottomSteelArrowStartX =
    bottomSteelState === "tension" ? forcesX - 50 : forcesX;
  const bottomSteelArrowEndX =
    bottomSteelState === "tension" ? forcesX : forcesX - 50;
  const strainTopX = strainCx - 38;
  const strainBottomX = strainCx + 38;
  const panelLabelY = bottom + 55;

  return (
    <svg
      viewBox="0 0 620 380"
      role="img"
      aria-label="Singly reinforced section, strain distribution, stress distribution, and internal forces"
      className="mx-auto block h-auto min-w-[520px] max-w-[820px]"
    >
      <Defs />

      <line x1={sectionX} y1={top - 16} x2={sectionX + sectionW} y2={top - 16} stroke="var(--text-muted)" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={sectionX + sectionW / 2} y={top - 22} textAnchor="middle" fontSize="10" fill="var(--text-muted)">B = {Number.isFinite(b) ? b : 0} mm</text>

      <rect x={sectionX} y={top} width={sectionW} height={sectionHeight} fill="var(--bg-surface)" stroke="var(--text)" strokeWidth="1.5" />
      <rect x={sectionX} y={top} width={sectionW} height={Math.max(naY - top, 0)} fill="#4d7cff" fillOpacity="0.12" />
      <line x1={sectionX} y1={naY} x2={strainCx + 44} y2={naY} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 3" />
      <text x={sectionX - 6} y={naY + 3} textAnchor="end" fontSize="9" fontWeight="600" fill="var(--text)">N.A.</text>

      {barXs.map((x) => (
        <circle key={x} cx={x} cy={steelY} r="3.6" fill="var(--text)" />
      ))}
      <text x={sectionX + sectionW / 2} y={steelY + 18} textAnchor="middle" fontSize="11" fontStyle="italic" fill="var(--text)">Aₛ</text>

      <line x1={sectionX - 34} y1={top} x2={sectionX - 34} y2={bottom} stroke="var(--text-muted)" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={sectionX - 40} y={(top + bottom) / 2} textAnchor="middle" fontSize="9" fill="var(--text-muted)" transform={`rotate(-90 ${sectionX - 40} ${(top + bottom) / 2})`}>D</text>
      <line x1={sectionX - 17} y1={top} x2={sectionX - 17} y2={steelY} stroke="var(--text-muted)" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={sectionX - 23} y={(top + steelY) / 2} textAnchor="middle" fontSize="9" fill="var(--text-muted)" transform={`rotate(-90 ${sectionX - 23} ${(top + steelY) / 2})`}>d = {Number.isFinite(d) ? d : 0}</text>

      <text x={sectionX + sectionW / 2} y={panelLabelY} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--text)">Singly reinforced section</text>

      <line x1={strainCx} y1={top} x2={strainCx} y2={bottom} stroke="var(--text)" strokeWidth="1.2" />
      <line x1={strainTopX} y1={top} x2={strainBottomX} y2={steelY} stroke="var(--text)" strokeWidth="2" />
      <circle cx={strainCx} cy={naY} r="2" fill="var(--text)" />
      <line x1={strainTopX} y1={top} x2={strainCx} y2={top} stroke="var(--text-muted)" strokeWidth="1" />
      <text x={strainTopX - 6} y={top - 10} textAnchor="end" fontSize="10.5" fill="var(--text)">εc = 0.003</text>
      <line x1={strainCx} y1={steelY} x2={strainBottomX} y2={steelY} stroke="var(--text-muted)" strokeWidth="1" />
      <text x={strainBottomX + 6} y={steelY + 4} textAnchor="start" fontSize="10.5" fill="var(--text)">εt ≥ 0.005</text>
      <line x1={strainCx - 50} y1={top} x2={strainCx - 50} y2={naY} stroke="var(--text-muted)" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={strainCx - 56} y={(top + naY) / 2 + 3} textAnchor="end" fontSize="10.5" fontStyle="italic" fill="var(--text)">c</text>
      <text x={strainCx} y={panelLabelY} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--text)">Strain distribution</text>

      <line x1={stressX} y1={top} x2={stressX} y2={bottom} stroke="var(--text)" strokeWidth="1.2" />
      <line x1={stressX} y1={top - 16} x2={stressX + stressW} y2={top - 16} stroke="var(--text-muted)" strokeWidth="1" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={stressX + stressW / 2} y={top - 23} textAnchor="middle" fontSize="10.5" fill="var(--text)">0.85f′c = {(0.85 * fc).toFixed(1)} MPa</text>
      <rect x={stressX} y={top} width={stressW} height={blockHeight} fill="none" stroke="var(--text)" strokeWidth="1.5" />
      {Array.from({ length: 4 }, (_, i) => {
        const y = top + ((i + 0.5) * blockHeight) / 4;
        return <line key={i} x1={stressX} y1={y} x2={stressX + stressW} y2={y} stroke="var(--text)" strokeWidth="1" />;
      })}
      <line x1={stressX - 16} y1={top} x2={stressX - 16} y2={top + blockHeight} stroke="var(--text-muted)" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={stressX - 22} y={top + blockHeight / 2 + 3} textAnchor="end" fontSize="10.5" fill="var(--text)">a = β₁c</text>
      <rect x={stressX} y={steelY - 6} width={stressW} height="6" fill="#e05a5a" opacity="0.75" />
      <text x={stressX + stressW / 2} y={steelY + 18} textAnchor="middle" fontSize="10.5" fill="var(--text)">fₛ = fy</text>
      <text x={stressX + stressW / 2} y={panelLabelY} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--text)">Stress distribution</text>

      <line x1={forcesX} y1={concreteForceY} x2={forcesX - 50} y2={concreteForceY} stroke="#4d7cff" strokeWidth="1.8" markerEnd="url(#force-blue)" />
      <text x={forcesX - 2} y={concreteForceY - 8} textAnchor="end" fontSize="10.5" fill="#4d7cff">FC = 0.85f′c·ab</text>
      <line x1={forcesX - 26} y1={concreteForceY} x2={forcesX - 26} y2={steelY} stroke="var(--text-muted)" strokeWidth="1" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={forcesX - 32} y={leverArmMidY + 3} textAnchor="end" fontSize="10.5" fontStyle="italic" fill="var(--text)">z = d − a/2</text>
      {bottomSteelState !== "zero" && (
        <line x1={bottomSteelArrowStartX} y1={steelY} x2={bottomSteelArrowEndX} y2={steelY} stroke={bottomSteelColor} strokeWidth="1.8" markerEnd={bottomSteelMarker} />
      )}
      <text x={forcesX + 8} y={steelY + 4} textAnchor="start" fontSize="10.5" fill={bottomSteelColor}>
        {bottomSteelState === "tension"
          ? "FT = Aₛfy"
          : bottomSteelState === "compression"
            ? "FC,s = Aₛfy"
            : "Fₛ = 0"}
      </text>
      <text x={forcesX - 26} y={panelLabelY} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="var(--text)">Internal forces</text>
    </svg>
  );
}

// ============================================================
// DOUBLY REINFORCED — "(A+B) = (B) + (A)" decomposition
// ============================================================
function DoublyReinforcedDiagram({
  b,
  d,
  dPrime,
  c,
  a,
  fc,
  fy,
  As,
  AsPrime,
  numBars,
  numBarsPrime,
  compressionSteelYields,
  fsPrime,
}: {
  b: number;
  d: number;
  dPrime: number;
  c: number;
  a: number;
  fc: number;
  fy?: number;
  As?: number;
  AsPrime?: number;
  numBars: number;
  numBarsPrime: number;
  compressionSteelYields?: boolean | null;
  fsPrime?: number | null;
}) {
  const top = 80;
  const sectionHeight = 200;
  const bottom = top + sectionHeight;
  const safeD = Math.max(d, 1);
  const scale = sectionHeight / safeD;

  const naY = top + Math.min(Math.max(c, 0), safeD) * scale;
  const dPrimeY = top + Math.min(Math.max(dPrime, 0), safeD) * scale;
  const blockHeight = Math.max(4, Math.min(Math.max(a, 0) * scale, sectionHeight));
  const steelY = bottom - 12;

  // Panels laid out left to right with generous spacing so nothing clips.
  // Total width budget: 900, well within the 940-wide viewBox.
  const sectionX = 50;
  const sectionW = 70;
  const compressionBarXs = createBarPositions(
    numBarsPrime,
    sectionX,
    sectionW,
    12
  );
  const tensionBarXs = createBarPositions(
    numBars,
    sectionX,
    sectionW,
    10
  );

  const strainCx = 230;

  const combinedX = 340;
  const combinedW = 46;

  const eqX = 420;

  const bX = 480;
  const bW = 46;

  const plusX = 580;

  const aX = 615;
  const aW = 46;

  const strainTopX = strainCx - 34;
  const strainBottomX = strainCx + 34;
  const strainXatY = (y: number) => strainTopX + ((strainBottomX - strainTopX) * (y - top)) / (steelY - top);

  const captionY = bottom + 30;
  const noteY1 = bottom + 58;
  const noteY2 = bottom + 76;

  const fsPrimeLabel = compressionSteelYields ? "fy" : `${fsPrime?.toFixed(0)}`;
  const asMinusAsPrimeLabel =
    As !== undefined && AsPrime !== undefined ? `(As−A′s) = ${(As - AsPrime).toFixed(0)} mm²` : "(As−A′s)";

  const steelPositionTolerance = 1e-9;
  const upperSteelState =
    dPrime > c + steelPositionTolerance
      ? "tension"
      : dPrime < c - steelPositionTolerance
        ? "compression"
        : "zero";
  const lowerSteelState =
    d > c + steelPositionTolerance
      ? "tension"
      : d < c - steelPositionTolerance
        ? "compression"
        : "zero";

  const upperSteelColor =
    upperSteelState === "tension" ? "#4d7cff" : "#f5941f";
  const lowerSteelColor =
    lowerSteelState === "tension" ? "#4d7cff" : "#f5941f";
  const upperSteelMarker =
    upperSteelState === "tension" ? "url(#force-blue)" : "url(#force-orange)";
  const lowerSteelMarker =
    lowerSteelState === "tension" ? "url(#force-blue)" : "url(#force-orange)";

  const upperForceLabel =
    upperSteelState === "tension"
      ? "T′s = A′s f′s"
      : upperSteelState === "compression"
        ? "C′s = A′s f′s"
        : "F′s = 0";
  const lowerForceLabel =
    lowerSteelState === "tension"
      ? "Tₛ = Aₛfy"
      : lowerSteelState === "compression"
        ? "Cₛ = Aₛfy"
        : "Fₛ = 0";

  return (
    <div className="w-full overflow-x-auto pb-2 [scrollbar-color:#737373_#171717] [scrollbar-gutter:stable] [scrollbar-width:auto]">
    <svg
      viewBox="0 0 900 420"
      role="img"
      aria-label="Doubly reinforced section, strain distribution, and stress diagram decomposition"
      className="block h-auto w-[900px] min-w-[900px] max-w-none"
    >
      <Defs />

      {/* ---- (a) Beam cross-section ---- */}
      <line x1={sectionX} y1={top - 16} x2={sectionX + sectionW} y2={top - 16} stroke="var(--text-muted)" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={sectionX + sectionW / 2} y={top - 22} textAnchor="middle" fontSize="9.5" fill="var(--text-muted)">b = {Number.isFinite(b) ? b : 0}</text>

      <rect x={sectionX} y={top} width={sectionW} height={sectionHeight} fill="var(--bg-surface)" stroke="var(--text)" strokeWidth="1.5" />
      <rect x={sectionX} y={top} width={sectionW} height={Math.max(naY - top, 0)} fill="#4d7cff" fillOpacity="0.12" />
      <line x1={sectionX} y1={naY} x2={strainCx + 40} y2={naY} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 3" />

      {compressionBarXs.map((x) => (
        <circle key={`top-${x}`} cx={x} cy={dPrimeY} r="3.2" fill="#f5941f" />
      ))}
      <text x={sectionX - 8} y={dPrimeY + 3} textAnchor="end" fontSize="9.5" fill="#f5941f">A′s</text>

      {tensionBarXs.map((x) => (
        <circle key={`bot-${x}`} cx={x} cy={steelY} r="3.4" fill="var(--text)" />
      ))}
      <text x={sectionX - 8} y={steelY + 3} textAnchor="end" fontSize="9.5" fill="var(--text)">Aₛ</text>

      <line x1={sectionX - 32} y1={top} x2={sectionX - 32} y2={steelY} stroke="var(--text-muted)" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={sectionX - 38} y={(top + steelY) / 2} textAnchor="middle" fontSize="9" fill="var(--text-muted)" transform={`rotate(-90 ${sectionX - 38} ${(top + steelY) / 2})`}>d</text>
      <line x1={sectionX + sectionW + 12} y1={top} x2={sectionX + sectionW + 12} y2={dPrimeY} stroke="var(--text-muted)" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={sectionX + sectionW + 17} y={(top + dPrimeY) / 2 + 3} fontSize="9" fill="#f5941f">d′</text>

      <text x={sectionX + sectionW / 2} y={captionY} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text)">Beam cross-section</text>

      {/* ---- (b) Strain diagram ---- */}
      <line x1={strainCx} y1={top} x2={strainCx} y2={bottom} stroke="var(--text)" strokeWidth="1.2" />
      <line x1={strainTopX} y1={top} x2={strainBottomX} y2={steelY} stroke="var(--text)" strokeWidth="2" />
      <line x1={strainTopX} y1={top} x2={strainCx} y2={top} stroke="var(--text-muted)" strokeWidth="1" />
      <line x1={strainCx} y1={steelY} x2={strainBottomX} y2={steelY} stroke="var(--text-muted)" strokeWidth="1" />
      <circle cx={strainCx} cy={naY} r="2" fill="var(--text)" />

      <text x={strainTopX - 4} y={top - 10} textAnchor="end" fontSize="10" fill="var(--text)">εcu = 0.003</text>

      <circle cx={strainXatY(dPrimeY)} cy={dPrimeY} r="2" fill="#f5941f" />
      <line x1={strainXatY(dPrimeY)} y1={dPrimeY} x2={strainCx} y2={dPrimeY} stroke="#f5941f" strokeWidth="0.8" strokeDasharray="2 2" />
      <text x={strainXatY(dPrimeY) - 6} y={dPrimeY - 4} textAnchor="end" fontSize="9.5" fill="#f5941f">ε′s</text>

      <text x={strainBottomX + 6} y={steelY + 4} fontSize="10" fill="var(--text)">εs</text>

      <line x1={strainCx - 46} y1={top} x2={strainCx - 46} y2={naY} stroke="var(--text-muted)" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={strainCx - 52} y={(top + naY) / 2 + 3} textAnchor="end" fontSize="10" fontStyle="italic" fill="var(--text)">c</text>

      <text x={strainCx} y={captionY} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text)">Strain diagram</text>

      {/* ---- Combined stress diagram (A+B) ---- */}
      <line x1={combinedX} y1={top} x2={combinedX} y2={bottom} stroke="var(--text)" strokeWidth="1.2" />
      <line x1={combinedX} y1={top - 15} x2={combinedX + combinedW} y2={top - 15} stroke="var(--text-muted)" strokeWidth="1" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={combinedX + combinedW / 2} y={top - 22} textAnchor="middle" fontSize="9.5" fill="var(--text)">0.85f′c = {(0.85 * fc).toFixed(1)} MPa</text>

      <rect x={combinedX} y={top} width={combinedW} height={blockHeight} fill="none" stroke="var(--text)" strokeWidth="1.5" />
      {Array.from({ length: 3 }, (_, i) => {
        const y = top + ((i + 0.5) * blockHeight) / 3;
        return <line key={i} x1={combinedX} y1={y} x2={combinedX + combinedW} y2={y} stroke="var(--text)" strokeWidth="0.9" />;
      })}
      <text x={combinedX - 6} y={top + blockHeight / 2 + 3} textAnchor="end" fontSize="9.5" fontStyle="italic" fill="var(--text)">a</text>

      {upperSteelState !== "zero" && (
        <line
          x1={upperSteelState === "tension" ? combinedX : combinedX + combinedW + 14}
          y1={dPrimeY}
          x2={upperSteelState === "tension" ? combinedX + combinedW + 14 : combinedX}
          y2={dPrimeY}
          stroke={upperSteelColor}
          strokeWidth="1.4"
          markerEnd={upperSteelMarker}
        />
      )}
      <text x={combinedX + combinedW + 18} y={dPrimeY + 3} fontSize="9.5" fill={upperSteelColor}>{upperForceLabel}</text>

      {lowerSteelState !== "zero" && (
        <line
          x1={lowerSteelState === "tension" ? combinedX : combinedX + combinedW + 14}
          y1={steelY}
          x2={lowerSteelState === "tension" ? combinedX + combinedW + 14 : combinedX}
          y2={steelY}
          stroke={lowerSteelColor}
          strokeWidth="1.4"
          markerEnd={lowerSteelMarker}
        />
      )}
      <text x={combinedX + combinedW + 18} y={steelY + 3} fontSize="9.5" fill={lowerSteelColor}>{lowerForceLabel}</text>

      <text x={combinedX + combinedW / 2} y={captionY} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text)">Stress diagram (A+B)</text>

      {/* = sign — bold, high-contrast so it's always visible */}
      <text x={eqX} y={(top + bottom) / 2 + 8} textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--text)">
        =
      </text>

      {/* ---- (B) Stress diagram — pure couple, A's·fy at d' and d ---- */}
      <line x1={bX} y1={top} x2={bX} y2={bottom} stroke="var(--text)" strokeWidth="1.2" />
      <rect x={bX} y={dPrimeY} width={bW} height={Math.max(steelY - dPrimeY, 2)} fill="none" stroke="var(--text)" strokeWidth="1.3" strokeDasharray="3 2" />

      {upperSteelState !== "zero" && (
        <line
          x1={upperSteelState === "tension" ? bX : bX + bW + 14}
          y1={dPrimeY}
          x2={upperSteelState === "tension" ? bX + bW + 14 : bX}
          y2={dPrimeY}
          stroke={upperSteelColor}
          strokeWidth="1.4"
          markerEnd={upperSteelMarker}
        />
      )}
      <text x={bX + bW + 18} y={dPrimeY - 3} fontSize="9.5" fill={upperSteelColor}>{upperForceLabel}</text>

      {lowerSteelState !== "zero" && (
        <line
          x1={lowerSteelState === "tension" ? bX : bX + bW + 14}
          y1={steelY}
          x2={lowerSteelState === "tension" ? bX + bW + 14 : bX}
          y2={steelY}
          stroke={lowerSteelColor}
          strokeWidth="1.4"
          markerEnd={lowerSteelMarker}
        />
      )}
      <text x={bX + bW + 18} y={steelY + 10} fontSize="9.5" fill={lowerSteelColor}>{lowerForceLabel}</text>

      <line x1={bX - 18} y1={dPrimeY} x2={bX - 18} y2={steelY} stroke="var(--text-muted)" strokeWidth="1" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={bX - 24} y={(dPrimeY + steelY) / 2 + 3} textAnchor="end" fontSize="9.5" fontStyle="italic" fill="var(--text)">d − d′</text>

      <text x={bX + bW / 2} y={captionY} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text)">(B) Stress diagram</text>

      {/* + sign */}
      <text x={plusX} y={(top + bottom) / 2 + 8} textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--text)">
        +
      </text>

      {/* ---- (A) Stress diagram — equivalent singly-reinforced portion ---- */}
      <line x1={aX} y1={top} x2={aX} y2={bottom} stroke="var(--text)" strokeWidth="1.2" />
      <line x1={aX} y1={top - 15} x2={aX + aW} y2={top - 15} stroke="var(--text-muted)" strokeWidth="1" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={aX + aW / 2} y={top - 22} textAnchor="middle" fontSize="9.5" fill="var(--text)">0.85f′c = {(0.85 * fc).toFixed(1)} MPa</text>

      <rect x={aX} y={top} width={aW} height={blockHeight} fill="none" stroke="var(--text)" strokeWidth="1.5" />
      <line x1={aX - 14} y1={top} x2={aX - 14} y2={top + blockHeight} stroke="var(--text-muted)" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
      <text x={aX - 20} y={top + blockHeight / 2 + 3} textAnchor="end" fontSize="9.5" fontStyle="italic" fill="var(--text)">a</text>

      {lowerSteelState !== "zero" && (
        <line
          x1={lowerSteelState === "tension" ? aX : aX + aW + 14}
          y1={steelY}
          x2={lowerSteelState === "tension" ? aX + aW + 14 : aX}
          y2={steelY}
          stroke={lowerSteelColor}
          strokeWidth="1.4"
          markerEnd={lowerSteelMarker}
        />
      )}
      <text x={aX + aW + 18} y={steelY + 3} fontSize="9.5" fill={lowerSteelColor}>
        {lowerSteelState === "tension"
          ? "T = (As−A′s)fy"
          : lowerSteelState === "compression"
            ? "C = (As−A′s)fy"
            : "F = 0"}
      </text>

      <line
        x1={aX + aW + 110}
        y1={top + blockHeight / 2}
        x2={aX + aW + 110}
        y2={steelY}
        stroke="var(--text-muted)"
        strokeWidth="1"
        markerStart="url(#dim-arrow)"
        markerEnd="url(#dim-arrow)"
      />
      <text
        x={aX + aW + 104}
        y={(top + blockHeight / 2 + steelY) / 2}
        textAnchor="end"
        fontSize="9.5"
        fontStyle="italic"
        fill="var(--text)"
        transform={`rotate(-90 ${aX + aW + 104} ${(top + blockHeight / 2 + steelY) / 2})`}
      >
        d − a/2
      </text>

      <text x={aX + aW / 2} y={captionY} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text)">(A) Stress diagram</text>

      {/* footer note */}
      <text x={430} y={noteY1} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
        f′s = {fsPrimeLabel} MPa{fy ? ` · fy = ${fy} MPa` : ""}
      </text>
      <text x={430} y={noteY2} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
        {asMinusAsPrimeLabel}
      </text>
    </svg>
    </div>
  );
}

function createBarPositions(
  count: number,
  sectionX: number,
  sectionWidth: number,
  sideInset: number
) {
  const validCount = Math.max(
    1,
    Math.floor(Number.isFinite(count) ? count : 1)
  );
  const firstBarX = sectionX + sideInset;
  const lastBarX = sectionX + sectionWidth - sideInset;

  if (validCount === 1) {
    return [sectionX + sectionWidth / 2];
  }

  return Array.from(
    { length: validCount },
    (_, index) =>
      firstBarX +
      ((lastBarX - firstBarX) * index) / (validCount - 1)
  );
}

function Defs() {
  return (
    <defs>
      <marker id="dim-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
        <path d="M0,3 L6,0 L6,6 Z" fill="var(--text-muted)" />
      </marker>
      <marker id="force-blue" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="#4d7cff" />
      </marker>
      <marker id="force-orange" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="#f5941f" />
      </marker>
      <marker id="force-red" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="#e05a5a" />
      </marker>
    </defs>
  );
}
