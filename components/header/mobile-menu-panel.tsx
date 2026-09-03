import Link from "next/link";

import { calculators, modules } from "@/lib/data";
import type { MobilePanel } from "@/components/header/mobile-navigation";

const regularNavItems = [
  { label: "Examples", href: "/examples" },
  { label: "References", href: "/references" },
  { label: "About", href: "/about" },
];

interface MobileMenuPanelProps {
  activePanel: MobilePanel;
  onNavigate: () => void;
}

export function MobileMenuPanel({
  activePanel,
  onNavigate,
}: MobileMenuPanelProps) {
  if (!activePanel) return null;

  return (
    <div className="absolute inset-x-0 top-full max-h-[calc(100vh-5.5rem)] overflow-y-auto border-b border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 shadow-xl md:hidden">
      <div className="mx-auto max-w-[860px]">
        {activePanel === "modules" && (
          <ModulesPanel onNavigate={onNavigate} />
        )}

        {activePanel === "calculators" && (
          <CalculatorsPanel onNavigate={onNavigate} />
        )}

        {activePanel === "more" && (
          <div className="space-y-1">
            {regularNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className="block rounded-md px-3 py-3 text-[11px] font-semibold text-[var(--text)] active:scale-[0.99] active:bg-[var(--bg-hover)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModulesPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <>
      <Link
        href="/modules"
        onClick={onNavigate}
        className="mb-1 flex min-h-10 items-center justify-between rounded-md px-3 text-[11px] font-semibold text-[var(--blue)] active:bg-[var(--bg-hover)]"
      >
        View all modules
        <span aria-hidden="true">›</span>
      </Link>

      {modules.map((moduleItem) => (
        <Link
          key={moduleItem.slug}
          href={`/modules/${moduleItem.slug}`}
          onClick={onNavigate}
          className="block rounded-md px-3 py-2.5 active:scale-[0.99] active:bg-[var(--bg-hover)]"
        >
          <span className="block text-[11px] font-semibold text-[var(--text)]">
            Module {moduleItem.index}: {moduleItem.title}
          </span>
          <span className="mt-0.5 block truncate text-[9px] text-[var(--text-muted)]">
            {moduleItem.description}
          </span>
        </Link>
      ))}
    </>
  );
}

function CalculatorsPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <>
      <Link
        href="/calculators"
        onClick={onNavigate}
        className="mb-1 flex min-h-10 items-center justify-between rounded-md px-3 text-[11px] font-semibold text-[var(--blue)] active:bg-[var(--bg-hover)]"
      >
        View all calculators
        <span aria-hidden="true">›</span>
      </Link>

      {calculators.map((section) => (
        <div key={section.label} className="py-1">
          <p className="px-3 pb-1 pt-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
            {section.label}
          </p>

          {section.items.map((item) =>
            item.href ? (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className="block rounded-md px-3 py-2.5 active:scale-[0.99] active:bg-[var(--bg-hover)]"
              >
                <span className="block text-[11px] font-semibold text-[var(--text)]">
                  {item.name}
                </span>
                <span className="mt-0.5 block truncate text-[9px] text-[var(--text-muted)]">
                  {item.description}
                </span>
              </Link>
            ) : (
              <div
                key={item.name}
                title="Coming soon"
                className="cursor-not-allowed rounded-md px-3 py-2.5 opacity-45"
              >
                <span className="block text-[11px] font-semibold text-[var(--text)]">
                  {item.name}
                </span>
                <span className="mt-0.5 block truncate text-[9px] text-[var(--text-muted)]">
                  {item.description}
                </span>
              </div>
            )
          )}
        </div>
      ))}
    </>
  );
}
