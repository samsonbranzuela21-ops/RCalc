import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] py-10 sm:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-base font-bold text-[var(--text)]">
          <img src="/rcalc-icon.svg" alt="RCalc logo" className="h-7 w-7" />
          <span>
            <span className="text-[#f5941f]">RC</span>alc
          </span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--text-muted)] sm:gap-3">
          <Link href="/about" className="min-h-10 rounded-md px-3 py-2 hover:bg-[var(--bg-hover)] hover:text-[var(--text)]">About</Link>
          <span className="text-[#f5941f]">|</span>
          <Link href="/references" className="min-h-10 rounded-md px-3 py-2 hover:bg-[var(--bg-hover)] hover:text-[var(--text)]">References</Link>
          <span className="text-[#f5941f]">|</span>
          <Link href="/developer" className="min-h-10 rounded-md px-3 py-2 hover:bg-[var(--bg-hover)] hover:text-[var(--text)]">Developers</Link>
        </nav>

        <p className="text-center text-xs leading-relaxed text-[var(--text-muted)]">
          RCalc — undergraduate thesis project, 2026 · NSCP 2015 · ACI 318
        </p>
      </div>
    </footer>
  );
}
