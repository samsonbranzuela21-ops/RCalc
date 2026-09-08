import { CalculatorCatalogCard } from "@/components/calculator-catalog-card";
import { calculators } from "@/lib/data";

const sectionColors: Record<string, string> = {
  slate: "var(--text-muted)",
  orange: "var(--orange)",
  blue: "var(--blue)",
  teal: "var(--teal)",
  red: "var(--red)",
  green: "var(--green)",
  purple: "var(--purple)",
};

export default function CalculatorsPage() {
  const totalCount = calculators.reduce(
    (total, section) => total + section.items.length,
    0
  );

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--blue)]">
            RC Calculator Library
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Reinforced Concrete Calculators
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            Choose a calculator to check, analyze, or design reinforced
            concrete elements using the project&apos;s NSCP 2015 and ACI 318
            tools.
          </p>
        </div>

        <div className="mt-10 space-y-8">
          {calculators.map((section) => {
            const accent =
              sectionColors[section.color] ?? sectionColors.slate;
            const sectionId =
              "calculator-section-" +
              section.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

            return (
              <section
                key={section.label}
                aria-labelledby={sectionId}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-4">
                  <div>
                    <h2
                      id={sectionId}
                      className="text-xl font-extrabold"
                      style={{ color: accent }}
                    >
                      {section.label}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {section.items.length}{" "}
                      {section.items.length === 1
                        ? "calculator"
                        : "calculators"}{" "}
                      in this group
                    </p>
                  </div>

                  <span className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
                    {section.items.length}{" "}
                    {section.items.length === 1 ? "tool" : "tools"}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {section.items.map((item) => (
                    <CalculatorCatalogCard
                      key={item.name}
                      category={section.label}
                      accent={accent}
                      item={item}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--text-faint)]">
          {totalCount} calculators available across {calculators.length} design
          categories.
        </p>
      </div>
    </main>
  );
}
