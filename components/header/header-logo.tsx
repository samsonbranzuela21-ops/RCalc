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
      className="flex flex-shrink-0 items-center gap-1.5 text-[12px] font-bold text-[var(--text)]"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded bg-[#ffbd00] text-[#171200]">
        <img
          src="/rcalc-icon.svg"
          alt="RCalc logo"
          className="h-5 w-5"
        />
      </span>

      <span>
        <span className="text-[#f5941f]">RC</span>alc
      </span>
    </Link>
  );
}