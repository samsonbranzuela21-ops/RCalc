import Link from "next/link";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Modules", href: "/modules" },
  { label: "Calculators", href: "/calculators" },
  { label: "Examples", href: "/examples" },
  { label: "References", href: "/references" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  return (
    <header
      className="
        sticky top-0 z-50
        border-b border-[#202735]
        bg-[#090e18]/95
        backdrop-blur-md
      "
    >
      <div className="mx-auto flex h-12 max-w-[860px] items-center justify-between gap-4 px-5">
        {/* Logo */}
        <Link
          href="/"
          className="flex flex-shrink-0 items-center gap-1.5 text-[12px] font-bold text-white"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#ffbd00] text-[11px] font-black text-[#171200]">
            <img src="/rcalc-icon.svg" alt="RCalc logo" className="h-5 w-5" />
          </span>

          <span>
            <span className="text-[#f5941f]">RC</span>alc
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-5 text-[10px] text-[#77849b] md:flex">
          {navItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={
                index === 0
                  ? "rounded bg-[#ffbd00]/10 px-2 py-1 font-semibold text-[#ffbd00]"
                  : "hover:text-white"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Account actions */}
        <div className="flex flex-shrink-0 items-center gap-3">
          <Link
            href="/signin"
            className="hidden text-[10px] font-medium text-[#aab3c3] hover:text-white sm:block"
          >
            Sign In
          </Link>

          <Link
            href="/dashboard"
            className="
              rounded-md bg-[#ffbd00] px-3 py-1.5
              text-[10px] font-bold text-[#171200]
              hover:bg-[#ffd02c]
            "
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}