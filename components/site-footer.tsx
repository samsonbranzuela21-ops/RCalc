import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-8">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--text)]">
          <img src="/rcalc-icon.svg" alt="RCalc logo" className="h-5 w-5" />
          <span>
            <span className="text-[#f5941f]">RC</span>alc
          </span>
        </div>

        <nav className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
          <Link href="/about" className="hover:text-[var(--text)]">About</Link>
          <span className="text-[#f5941f]">|</span>
          <Link href="/references" className="hover:text-[var(--text)]">References</Link>
          <span className="text-[#f5941f]">|</span>
          <Link href="/developer" className="hover:text-[var(--text)]">Developers</Link>
        </nav>

        <p className="text-[10px] text-[var(--text-muted)]">
          RCalc — undergraduate thesis project, 2025 · NSCP 2015 · ACI 318
        </p>
      </div>
    </footer>
  );
}