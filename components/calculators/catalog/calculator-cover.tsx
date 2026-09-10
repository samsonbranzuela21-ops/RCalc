import type { ReactNode } from "react";

interface CalculatorCoverProps {
  category: string;
  accent: string;
}

export function CalculatorCover({
  category,
  accent,
}: CalculatorCoverProps) {
  const categoryName = category.toLowerCase();

  return (
    <div className="relative aspect-[16/9] overflow-hidden border-b border-[var(--border)] bg-[var(--bg)]">
      <svg
        viewBox="0 0 640 320"
        aria-hidden="true"
        className="h-full w-full"
      >
        <g opacity="0.24" stroke="var(--border)" strokeWidth="1">
          {Array.from({ length: 13 }, (_, index) => (
            <line
              key={"vertical-" + index}
              x1={40 + index * 48}
              y1="24"
              x2={40 + index * 48}
              y2="296"
            />
          ))}
          {Array.from({ length: 7 }, (_, index) => (
            <line
              key={"horizontal-" + index}
              x1="32"
              y1={32 + index * 44}
              x2="608"
              y2={32 + index * 44}
            />
          ))}
        </g>

        {drawTechnicalCover(categoryName, accent)}
      </svg>
    </div>
  );
}

function drawTechnicalCover(category: string, accent: string): ReactNode {
  if (category.includes("column")) {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="128" y1="254" x2="520" y2="254" stroke="var(--text-muted)" />
        <line x1="164" y1="274" x2="164" y2="62" stroke="var(--text-muted)" />
        <path
          d="M164 254 C220 230 280 188 318 144 C358 98 404 76 470 70"
          stroke={accent}
          strokeWidth="8"
        />
        <path
          d="M164 254 C222 266 284 258 338 230 C404 196 450 146 490 92"
          stroke="var(--text-faint)"
          strokeWidth="4"
          strokeDasharray="10 10"
        />
        <circle cx="318" cy="144" r="10" fill="var(--bg-surface)" stroke={accent} strokeWidth="5" />
        <text x="486" y="64" fill="var(--text-muted)" fontSize="18">P-M</text>
      </g>
    );
  }

  if (category.includes("serviceability")) {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="92" y1="252" x2="548" y2="252" stroke="var(--text-muted)" strokeWidth="3" />
        <line x1="112" y1="276" x2="112" y2="54" stroke="var(--text-muted)" strokeWidth="3" />
        <path
          d="M112 78 C198 84 230 104 274 142 C322 184 362 224 430 236 C474 244 510 246 548 246"
          stroke={accent}
          strokeWidth="8"
        />
        <path d="M112 112 C204 116 250 130 304 162" stroke="var(--text-faint)" strokeWidth="4" strokeDasharray="8 9" />
        <circle cx="430" cy="236" r="9" fill={accent} stroke="var(--bg)" strokeWidth="4" />
      </g>
    );
  }

  if (category.includes("slab")) {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="108" y="108" width="424" height="102" rx="8" fill="var(--bg-surface)" stroke={accent} strokeWidth="6" />
        {Array.from({ length: 7 }, (_, index) => (
          <line
            key={"slab-bar-" + index}
            x1={142 + index * 58}
            y1="124"
            x2={142 + index * 58}
            y2="194"
            stroke="var(--text-muted)"
            strokeWidth="4"
          />
        ))}
        <line x1="96" y1="248" x2="544" y2="248" stroke="var(--text-muted)" strokeWidth="3" />
        <path d="M118 238 L118 258 M522 238 L522 258" stroke="var(--text-muted)" strokeWidth="3" />
      </g>
    );
  }

  if (category.includes("shear")) {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="128" y="112" width="384" height="112" rx="5" fill="var(--bg-surface)" stroke={accent} strokeWidth="6" />
        {Array.from({ length: 5 }, (_, index) => (
          <rect
            key={"stirrup-" + index}
            x={166 + index * 70}
            y="126"
            width="40"
            height="84"
            rx="4"
            stroke="var(--text-muted)"
            strokeWidth="4"
          />
        ))}
        <path d="M112 250 L528 70" stroke={accent} strokeWidth="7" strokeDasharray="16 12" />
      </g>
    );
  }

  if (category.includes("flexural")) {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="222" y="54" width="196" height="220" rx="4" fill="var(--bg-surface)" stroke={accent} strokeWidth="6" />
        <line x1="222" y1="152" x2="418" y2="152" stroke={accent} strokeWidth="4" strokeDasharray="12 9" />
        {Array.from({ length: 4 }, (_, index) => (
          <circle
            key={"bottom-bar-" + index}
            cx={258 + index * 42}
            cy="246"
            r="12"
            fill={accent}
            stroke="var(--bg)"
            strokeWidth="5"
          />
        ))}
        <path d="M190 82 H450" stroke="var(--text-muted)" strokeWidth="3" />
        <path d="M190 246 H450" stroke="var(--text-muted)" strokeWidth="3" />
      </g>
    );
  }

  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1="108" y1="252" x2="532" y2="252" stroke="var(--text-muted)" strokeWidth="3" />
      <rect x="146" y="166" width="348" height="58" rx="5" fill="var(--bg-surface)" stroke={accent} strokeWidth="6" />
      <path d="M146 166 L118 252 M494 166 L522 252" stroke="var(--text-muted)" strokeWidth="5" />
      <path d="M320 112 V154 M292 128 L320 102 L348 128" stroke={accent} strokeWidth="7" />
      <circle cx="212" cy="206" r="10" fill={accent} stroke="var(--bg)" strokeWidth="4" />
      <circle cx="428" cy="206" r="10" fill={accent} stroke="var(--bg)" strokeWidth="4" />
    </g>
  );
}
