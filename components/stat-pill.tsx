import Link from "next/link";

interface StatPillProps {
  label: string;
  color: string;
  href?: string;
}

export function StatPill({
  label,
  color,
  href,
}: StatPillProps) {
  const className = `
    inline-flex min-h-7 items-center justify-center
    rounded-md
    border border-[var(--hero-pill-border)]
    bg-[var(--hero-pill-bg)]
    px-3 py-1
    text-[9px] font-medium
    shadow-sm
    sm:text-[10px]
    ${color}
    ${
      href
        ? "cursor-pointer hover:border-[var(--yellow)] hover:text-[var(--yellow)] active:scale-[0.98]"
        : ""
    }
  `;

  if (href) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return <span className={className}>{label}</span>;
}