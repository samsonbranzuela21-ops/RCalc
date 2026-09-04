export type MobilePanel = "modules" | "calculators" | "more" | null;

interface MobileNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileNavigation({
  isOpen,
  onToggle,
}: MobileNavigationProps) {
  return (
    <nav aria-label="Mobile navigation" className="md:hidden">
      <button
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-panel"
        aria-haspopup="true"
        onClick={onToggle}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text)] hover:bg-[var(--bg-hover)]"
      >
        <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
        <span aria-hidden="true" className="flex w-4 flex-col gap-1">
          <span className={`h-0.5 w-full rounded-full bg-current transition-transform ${isOpen ? "translate-y-1.5 rotate-45" : ""}`} />
          <span className={`h-0.5 w-full rounded-full bg-current transition-opacity ${isOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-full rounded-full bg-current transition-transform ${isOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
        </span>
      </button>
    </nav>
  );
}
