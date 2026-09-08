import { ModuleCatalogCard } from "@/components/module-catalog-card";
import { catalogModules } from "@/lib/modules";

const moduleColors = [
  "var(--blue)",
  "var(--purple)",
  "var(--yellow)",
  "var(--teal)",
  "var(--orange)",
  "var(--blue)",
  "var(--purple)",
  "var(--teal)",
];

export default function ModulesPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--yellow)]">
            Reinforced Concrete Learning
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Learning Modules
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            Follow structured lessons from concrete and steel fundamentals to
            beam, column, shear, and serviceability design.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {catalogModules.map((moduleItem, index) => (
            <ModuleCatalogCard
              key={moduleItem.slug}
              accent={moduleColors[index % moduleColors.length]}
              item={moduleItem}
            />
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--text-faint)]">
          {catalogModules.length} learning modules · {catalogModules.reduce(
            (total, moduleItem) => total + moduleItem.topics.length,
            0
          )} topics available.
        </p>
      </div>
    </main>
  );
}
