import Link from "next/link";

import { calculators, modules } from "@/lib/data";
import type { MobilePanel } from "@/components/header/mobile-navigation";

const regularNavItems = [
  { label: "Examples", href: "/examples" },
  { label: "References", href: "/references" },
  { label: "About", href: "/about" },
];

interface MobileMenuPanelProps {
  isOpen: boolean;
  activePanel: MobilePanel;
  onTogglePanel: (panel: Exclude<MobilePanel, null>) => void;
  onNavigate: () => void;
}

export function MobileMenuPanel({
  isOpen,
  activePanel,
  onTogglePanel,
  onNavigate,
}: MobileMenuPanelProps) {
  if (!isOpen) return null;

  return (
    <div id="mobile-navigation-panel" role="dialog" aria-label="Mobile navigation menu" className="absolute inset-x-0 top-full z-50 max-h-[calc(100vh-3rem)] overflow-y-auto border-b border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 shadow-xl md:hidden">
      <div className="mx-auto max-w-[860px]">
        <Link
          href="/"
          onClick={onNavigate}
          className="block rounded-md px-3 py-3 text-[11px] font-semibold text-[var(--text)] active:bg-[var(--bg-hover)]"
        >
          Home
        </Link>

        <div className="border-t border-[var(--border)] pt-2">
          <SubmenuButton label="Modules" open={activePanel === "modules"} onClick={() => onTogglePanel("modules")} />
          {activePanel === "modules" && <div className="mt-1 border-l-2 border-[var(--blue)] pl-2"><ModulesPanel onNavigate={onNavigate} /></div>}
        </div>

        <div className="mt-2 border-t border-[var(--border)] pt-2">
          <SubmenuButton label="Calculators" open={activePanel === "calculators"} onClick={() => onTogglePanel("calculators")} />
          {activePanel === "calculators" && <div className="mt-1 border-l-2 border-[var(--blue)] pl-2"><CalculatorsPanel onNavigate={onNavigate} /></div>}
        </div>

        <div className="mt-2 border-t border-[var(--border)] pt-2">
          <p className="px-3 pb-1 pt-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">More</p>
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
        </div>
      </div>
    </div>
  );
}

function SubmenuButton({ label, open, onClick }: { label: string; open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-[11px] font-semibold text-[var(--text)] hover:bg-[var(--bg-hover)]"
    >
      {label}
      <span aria-hidden="true" className={`text-[9px] text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
    </button>
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
