import type { ReactNode } from "react";

interface ModuleCoverProps {
  index: number;
  accent: string;
}

export function ModuleCover({ index, accent }: ModuleCoverProps) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden border-b border-[var(--border)] bg-[var(--bg)]">
      <svg
        viewBox="0 0 640 320"
        aria-hidden="true"
        className="h-full w-full"
      >
        <g opacity="0.24" stroke="var(--border)" strokeWidth="1">
          {Array.from({ length: 13 }, (_, gridIndex) => (
            <line
              key={"vertical-" + gridIndex}
              x1={40 + gridIndex * 48}
              y1="24"
              x2={40 + gridIndex * 48}
              y2="296"
            />
          ))}
          {Array.from({ length: 7 }, (_, gridIndex) => (
            <line
              key={"horizontal-" + gridIndex}
              x1="32"
              y1={32 + gridIndex * 44}
              x2="608"
              y2={32 + gridIndex * 44}
            />
          ))}
        </g>

        {drawModuleCover(index, accent)}
      </svg>
    </div>
  );
}

function drawModuleCover(index: number, accent: string): ReactNode {
  if (index === 2 || index === 5) {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1="96" y1="254" x2="548" y2="254" stroke="var(--text-muted)" strokeWidth="3" />
        <line x1="116" y1="274" x2="116" y2="54" stroke="var(--text-muted)" strokeWidth="3" />
        <path
          d="M116 78 C190 82 230 104 274 146 C320 190 370 226 432 238 C478 246 514 248 548 248"
          stroke={accent}
          strokeWidth="8"
        />
        <path d="M116 116 C218 120 270 140 332 176" stroke="var(--text-faint)" strokeWidth="4" strokeDasharray="9 10" />
        <circle cx="432" cy="238" r="10" fill={accent} stroke="var(--bg)" strokeWidth="4" />
      </g>
    );
  }

  if (index === 4) {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M172 92 H468 V138 H374 V248 H266 V138 H172 Z" fill="var(--bg-surface)" stroke={accent} strokeWidth="7" />
        <line x1="228" y1="118" x2="412" y2="118" stroke="var(--text-muted)" strokeWidth="4" />
        <circle cx="286" cy="224" r="12" fill={accent} stroke="var(--bg)" strokeWidth="5" />
        <circle cx="354" cy="224" r="12" fill={accent} stroke="var(--bg)" strokeWidth="5" />
        <path d="M138 268 H502" stroke="var(--text-muted)" strokeWidth="3" />
      </g>
    );
  }

  if (index === 6 || index === 7) {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="246" y="72" width="148" height="190" rx="6" fill="var(--bg-surface)" stroke={accent} strokeWidth="7" />
        <rect x="270" y="96" width="100" height="142" rx="4" stroke="var(--text-muted)" strokeWidth="4" strokeDasharray="10 8" />
        <path d="M170 244 L470 86" stroke={accent} strokeWidth="7" strokeDasharray="14 11" />
        <circle cx="320" cy="168" r="11" fill={accent} stroke="var(--bg)" strokeWidth="5" />
      </g>
    );
  }

  if (index === 3) {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="142" y="154" width="356" height="70" rx="5" fill="var(--bg-surface)" stroke={accent} strokeWidth="7" />
        <line x1="142" y1="188" x2="498" y2="188" stroke={accent} strokeWidth="4" strokeDasharray="12 9" />
        {Array.from({ length: 4 }, (_, barIndex) => (
          <circle
            key={"beam-bar-" + barIndex}
            cx={214 + barIndex * 72}
            cy="204"
            r="11"
            fill={accent}
            stroke="var(--bg)"
            strokeWidth="5"
          />
        ))}
        <path d="M142 154 L112 254 M498 154 L528 254" stroke="var(--text-muted)" strokeWidth="5" />
      </g>
    );
  }

  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M148 232 L320 88 L492 232 Z" fill="var(--bg-surface)" stroke={accent} strokeWidth="7" />
      <path d="M148 232 H492 M320 88 V232" stroke="var(--text-muted)" strokeWidth="4" />
      <path d="M220 172 H420" stroke={accent} strokeWidth="5" strokeDasharray="12 10" />
      <circle cx="148" cy="232" r="10" fill={accent} stroke="var(--bg)" strokeWidth="4" />
      <circle cx="320" cy="88" r="10" fill={accent} stroke="var(--bg)" strokeWidth="4" />
      <circle cx="492" cy="232" r="10" fill={accent} stroke="var(--bg)" strokeWidth="4" />
    </g>
  );
}
