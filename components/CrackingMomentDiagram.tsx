interface CrackingMomentDiagramProps {
  b?: number;
  h?: number;
  fr: number;
  mode: "rectangle" | "custom";
}

export function CrackingMomentDiagram({
  b,
  h,
  fr,
  mode,
}: CrackingMomentDiagramProps) {
  const top = 42;
  const sectionX = 55;
  const sectionW = 105;
  const sectionH = 205;
  const bottom = top + sectionH;
  const neutralAxisY = top + sectionH / 2;
  const stressAxisX = 270;
  const tensionX = 330;

  return (
    <div className="w-full overflow-x-auto pb-2 [scrollbar-color:#737373_#171717] [scrollbar-gutter:stable] [scrollbar-width:auto]">
      <svg
        viewBox="0 0 400 315"
        className="mx-auto block h-auto min-w-[370px] max-w-[470px]"
        role="img"
        aria-label="Uncracked concrete section and linear flexural stress distribution at the cracking moment"
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
            <path d="M0,3.5 L7,0 L7,7 Z" fill="var(--text-muted)" />
          </marker>
          <pattern
            id="cracking-hatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="#f5941f" strokeOpacity="0.45" />
          </pattern>
        </defs>

        <line
          x1={sectionX}
          y1="22"
          x2={sectionX + sectionW}
          y2="22"
          stroke="var(--text-muted)"
          markerStart="url(#cracking-dim-arrow)"
          markerEnd="url(#cracking-dim-arrow)"
        />
        <text x={sectionX + sectionW / 2} y="14" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
          {mode === "rectangle" ? `b = ${(b ?? 0).toFixed(0)} mm` : "Gross section"}
        </text>

        <rect
          x={sectionX}
          y={top}
          width={sectionW}
          height={sectionH}
          fill="var(--bg-surface)"
          stroke="var(--text)"
          strokeWidth="2"
        />
        <rect
          x={sectionX}
          y={neutralAxisY}
          width={sectionW}
          height={sectionH / 2}
          fill="url(#cracking-hatch)"
        />
        <line
          x1={sectionX - 15}
          y1={neutralAxisY}
          x2={tensionX + 30}
          y2={neutralAxisY}
          stroke="var(--text-muted)"
          strokeDasharray="4 3"
        />
        <text x={sectionX - 20} y={neutralAxisY + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">
          N.A.
        </text>

        <line
          x1="28"
          y1={top}
          x2="28"
          y2={bottom}
          stroke="var(--text-muted)"
          markerStart="url(#cracking-dim-arrow)"
          markerEnd="url(#cracking-dim-arrow)"
        />
        <text x="20" y={(top + bottom) / 2} textAnchor="middle" fontSize="9" fill="var(--text-muted)" transform={`rotate(-90 20 ${(top + bottom) / 2})`}>
          {mode === "rectangle" ? `h = ${(h ?? 0).toFixed(0)} mm` : "overall depth"}
        </text>

        <line
          x1={stressAxisX}
          y1={top}
          x2={stressAxisX}
          y2={bottom}
          stroke="var(--text)"
          strokeWidth="1.5"
        />
        <line
          x1={stressAxisX}
          y1={neutralAxisY}
          x2={stressAxisX - 55}
          y2={top}
          stroke="#4d7cff"
          strokeWidth="2"
        />
        <line
          x1={stressAxisX}
          y1={neutralAxisY}
          x2={tensionX}
          y2={bottom}
          stroke="#e05a5a"
          strokeWidth="2"
        />
        <line x1={stressAxisX - 55} y1={top} x2={stressAxisX} y2={top} stroke="var(--text-muted)" />
        <line x1={stressAxisX} y1={bottom} x2={tensionX} y2={bottom} stroke="var(--text-muted)" />

        <text x={stressAxisX - 60} y={top + 4} textAnchor="end" fontSize="10" fill="#4d7cff">
          compression
        </text>
        <text x={tensionX + 6} y={bottom + 4} fontSize="10" fill="#e05a5a">
          fᵣ = {fr.toFixed(3)} MPa
        </text>
        <text x={tensionX + 6} y={bottom + 18} fontSize="9" fill="var(--text-muted)">
          first flexural cracking
        </text>

        <text x={sectionX + sectionW / 2} y="285" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text)">
          Uncracked gross section
        </text>
        <text x={stressAxisX} y="285" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text)">
          Linear stress distribution
        </text>
        <text x="200" y="308" textAnchor="middle" fontSize="9" fill="var(--text-muted)">
          Schematic at Mcr — not to scale
        </text>
      </svg>
    </div>
  );
}
