import Link from "next/link";
import { calculators } from "@/lib/data";

const labelColor: Record<string, string> = {
  orange: "text-[#f5941f]",
  blue: "text-[#4d7cff]",
  green: "text-[#39c98a]",
  purple: "text-[#a780ff]",
};

export function CalculatorsList() {
  return (
    <div className="flex-1 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3 text-[11px] font-bold text-[var(--text)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#4d7cff]" />
        RC CALCULATORS
      </div>

      {calculators.map((section) => (
        <div key={section.label}>
          <div className={`px-4 pb-1 pt-2.5 text-[9px] font-medium uppercase tracking-wider ${labelColor[section.color]}`}>
            {section.label}
          </div>
          {section.items.map((item) =>
            item.href ? (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-2 text-[11px] font-semibold text-[var(--text)] last:border-b-0 hover:bg-[var(--border)]/30"
              >
                {item.name}
                <span className="ml-auto text-[12px] text-[var(--text-muted)]">›</span>
              </Link>
            ) : (
              <div
                key={item.name}
                className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-2 text-[11px] font-semibold text-[var(--text)] last:border-b-0"
              >
                {item.name}
                <span className="ml-auto text-[12px] text-[var(--text-muted)]">›</span>
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}