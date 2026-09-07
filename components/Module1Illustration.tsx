import {
  DiagramFrame,
  DiagramLegend,
  DiagramSurface,
  diagramSvgClass,
} from "@/components/DiagramFrame";
import type { Module1Illustration as IllustrationKind } from "@/lib/module1";

interface Module1IllustrationProps {
  kind: IllustrationKind;
}

const BLUE = "#4d7cff";
const ORANGE = "#f5941f";
const GREEN = "#39c98a";
const RED = "#e05a5a";

export function Module1Illustration({ kind }: Module1IllustrationProps) {
  const title = {
    units: "Unit system at a glance",
    concrete: "Concrete as a composite material",
    steel: "Simplified reinforcing-steel response",
    "reinforced-concrete": "Composite action in a beam",
    codes: "From code requirements to a design decision",
  }[kind];

  return (
    <DiagramFrame
      title={title}
      legend={
        <>
          {kind === "units" && <DiagramLegend color={BLUE} label="Length / force" />}
          {kind === "concrete" && <DiagramLegend color={BLUE} label="Concrete ingredients" />}
          {kind === "steel" && <DiagramLegend color={ORANGE} label="Steel response" />}
          {kind === "reinforced-concrete" && (
            <>
              <DiagramLegend color={BLUE} label="Compression" />
              <DiagramLegend color={ORANGE} label="Tension steel" dot />
            </>
          )}
          {kind === "codes" && <DiagramLegend color={GREEN} label="Reviewable workflow" />}
        </>
      }
    >
      <svg
        viewBox="0 0 620 250"
        role="img"
        aria-label={title}
        className={diagramSvgClass}
      >
        <DiagramSurface width={620} height={250} />
        <IllustrationContent kind={kind} />
      </svg>
    </DiagramFrame>
  );
}

function IllustrationContent({ kind }: Module1IllustrationProps) {
  if (kind === "units") return <UnitsIllustration />;
  if (kind === "concrete") return <ConcreteIllustration />;
  if (kind === "steel") return <SteelIllustration />;
  if (kind === "reinforced-concrete") return <ReinforcedConcreteIllustration />;
  return <CodesIllustration />;
}

function UnitsIllustration() {
  return (
    <g>
      <UnitCard x={48} y={72} title="Length" value="mm" detail="m × 1000" color={BLUE} />
      <UnitCard x={228} y={72} title="Force" value="N" detail="kN × 1000" color={BLUE} />
      <UnitCard x={408} y={72} title="Stress" value="MPa" detail="N / mm²" color={GREEN} />
      <line x1="178" y1="112" x2="218" y2="112" stroke={ORANGE} strokeWidth="2" />
      <line x1="358" y1="112" x2="398" y2="112" stroke={ORANGE} strokeWidth="2" />
      <text x="310" y="180" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">
        1 kN·m = 10⁶ N·mm
      </text>
      <text x="310" y="202" textAnchor="middle" fontSize="10.5" fill="var(--text-muted)">
        Convert before substituting into mm-based equations.
      </text>
    </g>
  );
}

function UnitCard({
  x,
  y,
  title,
  value,
  detail,
  color,
}: {
  x: number;
  y: number;
  title: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width="130" height="80" rx="7" fill="var(--bg-surface)" stroke={color} strokeOpacity="0.7" />
      <text x={x + 65} y={y + 20} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
        {title}
      </text>
      <text x={x + 65} y={y + 47} textAnchor="middle" fontSize="22" fontWeight="800" fill={color}>
        {value}
      </text>
      <text x={x + 65} y={y + 66} textAnchor="middle" fontSize="9.5" fill="var(--text-muted)">
        {detail}
      </text>
    </g>
  );
}

function ConcreteIllustration() {
  return (
    <g>
      <rect x="54" y="48" width="180" height="150" fill="#aeb7c7" fillOpacity="0.28" stroke="var(--text)" strokeWidth="1.5" />
      <circle cx="88" cy="83" r="17" fill={BLUE} fillOpacity="0.75" />
      <circle cx="151" cy="76" r="11" fill={ORANGE} fillOpacity="0.8" />
      <circle cx="198" cy="105" r="22" fill={BLUE} fillOpacity="0.8" />
      <circle cx="112" cy="135" r="23" fill={ORANGE} fillOpacity="0.75" />
      <circle cx="183" cy="160" r="13" fill={BLUE} fillOpacity="0.75" />
      <circle cx="72" cy="177" r="10" fill={ORANGE} fillOpacity="0.85" />
      <text x="144" y="220" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
        Paste + fine aggregate + coarse aggregate + air
      </text>

      <text x="330" y="63" fontSize="12" fontWeight="700" fill="var(--text)">Concrete design properties</text>
      <PropertyRow y={92} label="f′c" value="compressive strength" color={BLUE} />
      <PropertyRow y={122} label="Ec" value="elastic stiffness" color={GREEN} />
      <PropertyRow y={152} label="fr" value="modulus of rupture" color={ORANGE} />
      <PropertyRow y={182} label="εcu" value="ultimate compression strain model" color={RED} />
    </g>
  );
}

function PropertyRow({ y, label, value, color }: { y: number; label: string; value: string; color: string }) {
  return (
    <g>
      <circle cx="336" cy={y - 4} r="4" fill={color} />
      <text x="350" y={y} fontSize="11" fontWeight="700" fill="var(--text)">{label}</text>
      <text x="390" y={y} fontSize="10.5" fill="var(--text-muted)">{value}</text>
    </g>
  );
}

function SteelIllustration() {
  return (
    <g>
      <line x1="68" y1="198" x2="68" y2="48" stroke="var(--text)" />
      <line x1="68" y1="198" x2="292" y2="198" stroke="var(--text)" />
      <path d="M68 198 L112 168 L172 112 L220 72 C238 58 258 54 286 52" fill="none" stroke={ORANGE} strokeWidth="3" />
      <line x1="172" y1="112" x2="292" y2="112" stroke="var(--text-muted)" strokeDasharray="5 4" />
      <text x="68" y="38" fontSize="10" fill="var(--text-muted)">Stress, fs</text>
      <text x="292" y="218" textAnchor="end" fontSize="10" fill="var(--text-muted)">Strain, εs</text>
      <text x="182" y="103" fontSize="10" fill={ORANGE}>fy</text>
      <text x="156" y="133" fontSize="10" fill="var(--text-muted)">εy = fy / Es</text>

      <rect x="352" y="61" width="204" height="125" rx="7" fill="var(--bg-surface)" stroke="var(--border)" />
      <text x="370" y="86" fontSize="11" fontWeight="700" fill="var(--text)">Key idea</text>
      <text x="370" y="111" fontSize="10.5" fill="var(--text-muted)">Elastic: fs = Esεs</text>
      <text x="370" y="134" fontSize="10.5" fill="var(--text-muted)">Yield check: εs ≥ εy</text>
      <text x="370" y="157" fontSize="10.5" fill="var(--text-muted)">Es ≈ 200,000 MPa</text>
    </g>
  );
}

function ReinforcedConcreteIllustration() {
  return (
    <g>
      <rect x="80" y="42" width="220" height="156" fill="var(--bg-surface)" stroke="var(--text)" strokeWidth="2" />
      <path d="M81 43 H299 V112 H81 Z" fill={BLUE} fillOpacity="0.2" />
      <line x1="64" y1="112" x2="318" y2="112" stroke={RED} strokeDasharray="6 4" strokeWidth="1.5" />
      <text x="325" y="115" fontSize="10" fill={RED}>N.A.</text>
      <circle cx="112" cy="171" r="8" fill={ORANGE} />
      <circle cx="178" cy="171" r="8" fill={ORANGE} />
      <circle cx="244" cy="171" r="8" fill={ORANGE} />
      <text x="190" y="72" textAnchor="middle" fontSize="11" fontWeight="700" fill={BLUE}>Compression</text>
      <text x="190" y="218" textAnchor="middle" fontSize="11" fontWeight="700" fill={ORANGE}>Tension steel</text>
      <line x1="386" y1="74" x2="472" y2="74" stroke={BLUE} strokeWidth="3" />
      <line x1="386" y1="176" x2="472" y2="176" stroke={ORANGE} strokeWidth="3" />
      <text x="486" y="78" fontSize="11" fill="var(--text)">Concrete carries compression</text>
      <text x="486" y="180" fontSize="11" fill="var(--text)">Steel carries tension</text>
      <text x="428" y="132" textAnchor="middle" fontSize="10.5" fill="var(--text-muted)">Bond transfers force</text>
    </g>
  );
}

function CodesIllustration() {
  const steps = [
    ["1", "Loads"],
    ["2", "Analysis"],
    ["3", "Strength"],
    ["4", "Service"],
    ["5", "Detail"],
  ];
  return (
    <g>
      <text x="40" y="52" fontSize="12" fontWeight="700" fill="var(--text)">NSCP 2015 / ACI 318 framework</text>
      {steps.map(([number, label], index) => {
        const x = 42 + index * 108;
        return (
          <g key={number}>
            <rect x={x} y="88" width="86" height="66" rx="7" fill="var(--bg-surface)" stroke={index === 4 ? GREEN : "var(--border)"} />
            <circle cx={x + 43} cy="109" r="11" fill={index === 4 ? GREEN : BLUE} />
            <text x={x + 43} y="113" textAnchor="middle" fontSize="10" fontWeight="800" fill="white">{number}</text>
            <text x={x + 43} y="138" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text)">{label}</text>
            {index < steps.length - 1 && <line x1={x + 88} y1="121" x2={x + 104} y2="121" stroke={ORANGE} strokeWidth="2" />}
          </g>
        );
      })}
      <text x="310" y="193" textAnchor="middle" fontSize="11" fill="var(--text-muted)">
        Every result should be traceable to an assumption and a code check.
      </text>
    </g>
  );
}
