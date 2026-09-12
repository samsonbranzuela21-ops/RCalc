import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] py-10 sm:py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-base font-bold text-[var(--text)]">
          <span className="rcalc-logo-mark h-9 w-9 shrink-0 overflow-hidden rounded-md">
            <Image src="/rcalc-logo.png" alt="RCalcs logo" width={36} height={36} className="h-9 w-9 object-contain" />
          </span>
          <span>
            <span className="text-[#f5941f]">RC</span>alcs
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
          RCalcs — undergraduate thesis project, 2026 · NSCP 2015 · ACI 318
        </p>
      </div>
    </footer>
  );
}
