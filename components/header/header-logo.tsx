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
      <span className="rcalc-logo-mark h-10 w-10 shrink-0 overflow-hidden rounded-md">
        <Image
          src="/rcalc-logo.png"
          alt="RCalcs logo"
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
        />
      </span>

      <span>
        <span className="text-[#f5941f]">RC</span>alcs
      </span>
    </Link>
  );
}
