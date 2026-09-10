import Link from "next/link";
import Image from "next/image";

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
        <Image
          src="/rcalc-icon.svg"
          alt="RCalcs logo"
          width={32}
          height={32}
          className="h-8 w-8"
        />
      </span>

      <span>
        <span className="text-[#f5941f]">RC</span>alcs
      </span>
    </Link>
  );
}
