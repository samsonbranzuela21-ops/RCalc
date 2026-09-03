import Link from "next/link";

export type MobilePanel = "modules" | "calculators" | "more" | null;

interface MobileNavigationProps {
  activePanel: MobilePanel;
  onNavigate: () => void;
  onToggle: (panel: Exclude<MobilePanel, null>) => void;
}

const buttonBase =
  "flex min-h-9 flex-shrink-0 items-center justify-center gap-1 rounded-md px-1.5 text-[10px] font-semibold active:bg-[var(--bg-hover)]";

export function MobileNavigation({
  activePanel,
  onNavigate,
  onToggle,
}: MobileNavigationProps) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="relative flex min-h-10 items-center justify-center gap-1 overflow-x-auto whitespace-nowrap border-t border-[var(--border)] bg-[var(--bg)]/95 px-2 md:hidden"
    >
      <Link
        href="/"
        onClick={onNavigate}
        className="flex min-h-9 flex-shrink-0 items-center justify-center rounded-md px-1.5 text-[10px] font-semibold text-[var(--text)] active:bg-[var(--bg-hover)]"
      >
        Home
      </Link>

      <Separator />

      <MenuButton
        label="Modules"
        panel="modules"
        activePanel={activePanel}
        onToggle={onToggle}
      />

      <Separator />

      <MenuButton
        label="Calculators"
        panel="calculators"
        activePanel={activePanel}
        onToggle={onToggle}
      />

      <Separator />

      <MenuButton
        label="More"
        panel="more"
        activePanel={activePanel}
        onToggle={onToggle}
      />
    </nav>
  );
}

function Separator() {
  return (
    <span aria-hidden="true" className="text-[var(--text-faint)]">
      |
    </span>
  );
}

function MenuButton({
  label,
  panel,
  activePanel,
  onToggle,
}: {
  label: string;
  panel: Exclude<MobilePanel, null>;
  activePanel: MobilePanel;
  onToggle: (panel: Exclude<MobilePanel, null>) => void;
}) {
  const isOpen = activePanel === panel;

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={() => onToggle(panel)}
      className={`${buttonBase} ${
        isOpen ? "text-[var(--blue)]" : "text-[var(--text-muted)]"
      }`}
    >
      {label}
      <span
        aria-hidden="true"
        className={`text-[7px] transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      >
        ▼
      </span>
    </button>
  );
}
