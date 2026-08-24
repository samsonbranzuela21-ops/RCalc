export function StatPill({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <span className="rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-[11px] text-[var(--text-muted)]">
      <span className={color}>{icon}</span> {label}
    </span>
  );
}