import Link from "next/link";
import { calculators } from "@/lib/data";

const labelColor: Record<string, string> = {
  slate: "text-[var(--text-muted)]",
  orange: "text-[#f5941f]",
  blue: "text-[#4d7cff]",
  teal: "text-[#2dd4bf]",
  red: "text-[#e05353]",
  green: "text-[#39c98a]",
  purple: "text-[#a780ff]",
};

const iconBg: Record<string, string> = {
  slate: "bg-[var(--text-muted)]/15",
  orange: "bg-[#f5941f]/15",
  blue: "bg-[#4d7cff]/15",
  teal: "bg-[#2dd4bf]/15",
  red: "bg-[#e05353]/15",
  green: "bg-[#39c98a]/15",
  purple: "bg-[#a780ff]/15",
};

export function CalculatorsList() {
  const totalCount = calculators.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <div className="flex-1 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <span className="h-1.5 w-1.5 rounded-full bg-[#4d7cff]" />
        <span className="text-[11px] font-bold text-[var(--text)]">RC CALCULATORS</span>
        <span className="rounded-full bg-[var(--bg)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--text-muted)]">
          {totalCount}
        </span>
        <Link
          href="/calculators"
          className="ml-auto text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          All ›
        </Link>
      </div>

      {calculators.map((section) => (
        <div key={section.label}>
          <div
            className={`px-4 pb-1 pt-2.5 text-[9px] font-medium uppercase tracking-wider ${labelColor[section.color]}`}
          >
            {section.label}
          </div>
          {section.items.map((item) => {
            const content = (
              <>
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[12px] ${iconBg[item.color]}`}
                >
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-[var(--text)]">{item.name}</div>
                  <div className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                    {item.description}
                  </div>
                </div>
                <span className="ml-auto flex-shrink-0 text-[12px] text-[var(--text-muted)]">›</span>
              </>
            );

            return item.href ? (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-2.5 last:border-b-0 hover:bg-[var(--border)]/30"
              >
                {content}
              </Link>
            ) : (
              <div
                key={item.name}
                className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-2.5 opacity-60 last:border-b-0"
              >
                {content}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}