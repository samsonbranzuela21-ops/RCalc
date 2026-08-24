import Link from "next/link";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Modules", href: "/modules" },
  { label: "Calculators", href: "/calculators" },
  { label: "Examples", href: "/examples" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-8 py-3">
      <Link href="/" className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--text)]">
        <img src="/rcalc-icon.svg" alt="RCalc logo" className="h-5 w-5" />
        <span>
          <span className="text-[#f5941f]">RC</span>alc
        </span>
      </Link>

      <nav className="flex gap-6 text-[11px] text-[var(--text-muted)]">
        {navItems.map((item, i) => (
          <Link
            key={item.label}
            href={item.href}
            className={i === 0 ? "text-[var(--text)]" : "hover:text-[var(--text)]"}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3 text-[11px] text-[var(--text)]">
        <Link href="#">Sign In</Link>
        <Link href="#" className="rounded-md bg-[#f5941f] px-3 py-1.5 text-[11px] font-semibold text-[#1a1300]">
          Dashboard
        </Link>
      </div>
    </header>
  );
}