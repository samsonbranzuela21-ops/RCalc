import Link from "next/link";
import { modules } from "@/lib/data";

const numeralColor = ["#4d7cff", "#4d7cff", "#a780ff", "#39c98a", "#8b8d9b", "#a780ff", "#8b8d9b"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

export function ModulesList() {
  return (
    <div className="flex-1 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#f5941f]">
          Learning Modules
        </span>
        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[var(--border)] text-[9px] text-[var(--text-muted)]">
          ?
        </span>
        <Link
          href="/modules"
          className="ml-auto text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          All ›
        </Link>
      </div>

      {modules.map((m) => {
        const color = numeralColor[(m.index - 1) % numeralColor.length];
        return (
          <Link
            key={m.index}
            href={`/modules/${m.slug}`}
            className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--border)]/30"
          >
            <span
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border text-[11px] font-bold"
              style={{ borderColor: color, color }}
            >
              {ROMAN[m.index - 1] ?? m.index}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-bold text-[var(--text)]">{m.title}</div>
              <div className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                {m.topics.length} topics · {m.description}
              </div>
            </div>
            <span className="flex-shrink-0 text-[13px] text-[var(--text-muted)]">›</span>
          </Link>
        );
      })}
    </div>
  );
}