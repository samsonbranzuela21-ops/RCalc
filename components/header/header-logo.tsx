import Link from "next/link";

interface HeaderLogoProps {
  onNavigate?: () => void;
}

export function HeaderLogo({
  onNavigate,
}: HeaderLogoProps) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex min-h-11 flex-shrink-0 items-center gap-2 rounded-md px-1 text-base font-bold text-[var(--text)]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#ffbd00] text-[#171200]">
        <img
          src="/rcalc-icon.svg"
          alt="RCalc logo"
          className="h-8 w-8"
        />
      </span>

      <span>
        <span className="text-[#f5941f]">RC</span>alc
      </span>
    </Link>
  );
}
