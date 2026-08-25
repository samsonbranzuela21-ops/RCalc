import Link from "next/link";

import { calculators } from "@/lib/data";
import { PresetBox } from "@/components/PresetBox";
import { PresetText } from "@/components/PresetText";

const sectionColors: Record<string, string> = {
  slate: "var(--text-muted)",
  orange: "var(--orange)",
  blue: "var(--blue)",
  teal: "var(--teal)",
  red: "var(--red)",
  green: "var(--green)",
  purple: "var(--purple)",
};

export function CalculatorsList() {
  const totalCount = calculators.reduce(
    (total, section) => total + section.items.length,
    0
  );

  return (
    <PresetBox
      preset="card"
      as="div"
      className="w-full flex-1 overflow-hidden rounded-lg border md:w-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-3 sm:px-4">
        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--blue)]" />

        <PresetText
          preset="sectionLabel"
          as="span"
          className="uppercase tracking-wider"
        >
          <span className="text-[var(--blue)]">RC Calculators</span>
        </PresetText>

        <span className="rounded-full bg-[var(--badge-bg)] px-1.5 py-0.5 text-[8px] font-semibold text-[var(--text-muted)]">
          {totalCount}
        </span>

        <Link
          href="/calculators"
          className="ml-auto flex-shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--blue)] active:bg-[var(--bg-hover)] active:text-[var(--blue)]"
        >
          All ›
        </Link>
      </div>

      {/* Calculator sections */}
      {calculators.map((section) => {
        const sectionColor =
          sectionColors[section.color] ?? sectionColors.slate;

        return (
          <div key={section.label}>
            <div
              className="border-b border-[var(--border)] bg-[var(--bg-section)] px-3 pb-1.5 pt-2.5 text-[8px] font-semibold uppercase tracking-[0.14em] sm:px-4"
              style={{ color: sectionColor }}
            >
              {section.label}
            </div>

            {section.items.map((item) => {
              const content = (
                <>
                  <div className="min-w-0 flex-1">
                    <PresetText
                      preset="itemTitle"
                      as="div"
                      className="truncate"
                    >
                      {item.name}
                    </PresetText>

                    <PresetText
                      preset="itemDescription"
                      as="div"
                      className="mt-0.5 truncate"
                    >
                      {item.description}
                    </PresetText>
                  </div>

                  <span className="ml-auto flex-shrink-0 text-[13px] text-[var(--text-faint)] transition-colors duration-150 group-hover:text-[var(--blue)] group-active:text-[var(--blue)]">
                    ›
                  </span>
                </>
              );

              return item.href ? (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex touch-manipulation select-none items-center gap-2.5 border-b border-[var(--border)] px-3 py-2.5 transition-[background-color,transform] duration-150 ease-out last:border-b-0 hover:bg-[var(--bg-hover)] active:scale-[0.995] active:bg-[var(--bg-hover)] focus-visible:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--blue)] motion-reduce:transition-none motion-reduce:transform-none sm:px-4"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={item.name}
                  title="Coming soon"
                  className="flex items-center gap-2.5 border-b border-[var(--border)] px-3 py-2.5 opacity-50 last:border-b-0 sm:px-4"
                >
                  {content}
                </div>
              );
            })}
          </div>
        );
      })}
    </PresetBox>
  );
}
