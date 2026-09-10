import Link from "next/link";

export function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="mb-2.5 text-[10px] font-semibold uppercase text-[var(--text-muted)]">{title}</h4>
      {links.map((l) => (
        <Link key={l.label} href={l.href} className="mb-1.5 block text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]">
          {l.label}
        </Link>
      ))}
    </div>
  );
}