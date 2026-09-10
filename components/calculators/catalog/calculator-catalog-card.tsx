import Link from "next/link";

import { CalculatorCover } from "@/components/calculators/catalog/calculator-cover";

interface CalculatorCatalogCardProps {
  category: string;
  accent: string;
  item: {
    name: string;
    description: string;
    href?: string;
  };
}

export function CalculatorCatalogCard({
  category,
  accent,
  item,
}: CalculatorCatalogCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:border-[var(--blue)]">
      <CalculatorCover category={category} accent={accent} />

      <div className="flex flex-1 flex-col p-4">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: accent }}
        >
          {category}
        </p>

        <h3 className="mt-2 text-base font-bold leading-tight text-[var(--text)]">
          {item.name}
        </h3>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
          {item.description}
        </p>

        {item.href ? (
          <Link
            href={item.href}
            className="mt-5 flex min-h-11 items-center justify-center rounded-md bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
          >
            Open Calculator
          </Link>
        ) : (
          <span className="mt-5 flex min-h-11 items-center justify-center rounded-md bg-[var(--bg-hover)] px-4 py-2 text-sm font-semibold text-[var(--text-muted)]">
            Coming Soon
          </span>
        )}
      </div>
    </article>
  );
}
