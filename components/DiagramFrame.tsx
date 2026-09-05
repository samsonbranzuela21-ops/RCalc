import type { ReactNode } from "react";

/** Shared presentation from the column P–M diagram. Scrolling stays inside the card. */
export function DiagramFrame({ children, legend, title }: { children: ReactNode; legend?: ReactNode; title?: string }) {
  return <div data-diagram-frame className="min-w-0 max-w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
    {title && <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">{title}</h2>}
    <div className="max-w-full overflow-x-auto overscroll-x-contain">{children}</div>
    {legend && <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-3 text-[10px] text-[var(--text-muted)]">{legend}</div>}
  </div>;
}

export function DiagramLegend({ color, label, dashed = false, dot = false }: { color: string; label: string; dashed?: boolean; dot?: boolean }) {
  return <span className="flex items-center gap-1.5"><span aria-hidden="true" className={dot ? "h-2.5 w-2.5 rounded-full" : "h-0 w-6 border-t-2"} style={{ backgroundColor: dot ? color : undefined, borderColor: color, borderStyle: dashed ? "dashed" : "solid" }} />{label}</span>;
}

export const diagramSvgClass = "block h-auto w-full min-w-[560px]";

export function DiagramSurface({ width, height }: { width: number; height: number }) {
  return <rect x="1" y="1" width={width - 2} height={height - 2} rx="6" fill="var(--bg)" stroke="var(--border)" />;
}
