import Link from "next/link";

import { calculators, modules } from "@/lib/data";

const regularNavItems = [
  { label: "Examples", href: "/examples" },
  { label: "References", href: "/references" },
  { label: "About", href: "/about" },
];

export function DesktopNavigation() {
  return (
    <nav
      aria-label="Main navigation"
      className="hidden items-center gap-5 text-[10px] text-[var(--text-muted)] md:flex"
    >
      <Link
        href="/"
        className="rounded bg-[#ffbd00]/10 px-2 py-1 font-semibold text-[#d99c00] hover:text-[var(--yellow)] dark:text-[#ffbd00]"
      >
        Home
      </Link>

      <details className="group relative">
        <summary className="flex cursor-pointer list-none items-center gap-1 py-4 hover:text-[var(--text)] group-open:text-[var(--blue)] [&::-webkit-details-marker]:hidden">
          Modules
          <span
            aria-hidden="true"
            className="text-[8px] transition-transform group-open:rotate-180"
          >
            ▼
          </span>
        </summary>

        <div className="invisible absolute left-1/2 top-full z-50 w-[300px] -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-1.5 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:opacity-100 group-open:visible group-open:opacity-100">
          <Link
            href="/modules"
            className="mb-1 flex items-center justify-between rounded-md border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--blue)] hover:bg-[var(--bg-hover)]"
          >
            View all modules
            <span aria-hidden="true">›</span>
          </Link>

          <div className="max-h-[65vh] overflow-y-auto">
            {modules.map((moduleItem) => (
              <Link
                key={moduleItem.slug}
                href={`/modules/${moduleItem.slug}`}
                className="block rounded-md px-3 py-2.5 hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)]"
              >
                <span className="block text-[10px] font-semibold text-[var(--text)]">
                  Module {moduleItem.index}: {moduleItem.title}
                </span>
                <span className="mt-0.5 block truncate text-[8px] text-[var(--text-muted)]">
                  {moduleItem.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </details>

      <details className="group relative">
        <summary className="flex cursor-pointer list-none items-center gap-1 py-4 hover:text-[var(--text)] group-open:text-[var(--blue)] [&::-webkit-details-marker]:hidden">
          Calculators
          <span
            aria-hidden="true"
            className="text-[8px] transition-transform group-open:rotate-180"
          >
            ▼
          </span>
        </summary>

        <div className="invisible absolute left-1/2 top-full z-50 w-[310px] -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-1.5 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:opacity-100 group-open:visible group-open:opacity-100">
          <Link
            href="/calculators"
            className="mb-1 flex items-center justify-between rounded-md border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--blue)] hover:bg-[var(--bg-hover)]"
          >
            View all calculators
            <span aria-hidden="true">›</span>
          </Link>

          <div className="max-h-[65vh] overflow-y-auto">
            {calculators.map((section) => (
              <div key={section.label} className="py-1">
                <p className="px-3 pb-1 pt-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                  {section.label}
                </p>

                {section.items.map((item) =>
                  item.href ? (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block rounded-md px-3 py-2 hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)]"
                    >
                      <span className="block text-[10px] font-semibold text-[var(--text)]">
                        {item.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[8px] text-[var(--text-muted)]">
                        {item.description}
                      </span>
                    </Link>
                  ) : (
                    <div
                      key={item.name}
                      title="Coming soon"
                      className="cursor-not-allowed rounded-md px-3 py-2 opacity-45"
                    >
                      <span className="block text-[10px] font-semibold text-[var(--text)]">
                        {item.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[8px] text-[var(--text-muted)]">
                        {item.description}
                      </span>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </details>

      {regularNavItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="hover:text-[var(--text)]"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
