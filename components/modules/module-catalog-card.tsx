import Link from "next/link";

import { ModuleCover } from "@/components/modules/module-cover";
import { getModuleTopicCount, type ModuleItem } from "@/lib/modules";

interface ModuleCatalogCardProps {
  accent: string;
  item: ModuleItem;
}

export function ModuleCatalogCard({
  accent,
  item,
}: ModuleCatalogCardProps) {
  const topicCount = getModuleTopicCount(item);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:border-[var(--yellow)]">
      <ModuleCover index={item.index} accent={accent} />

      <div className="flex flex-1 flex-col p-4">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: accent }}
        >
          Module {String(item.index).padStart(2, "0")} · {topicCount}{" "}
          {topicCount === 1 ? "lesson page" : "lesson pages"}
        </p>

        <h2 className="mt-2 text-base font-bold leading-tight text-[var(--text)]">
          {item.title}
        </h2>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
          {item.description}
        </p>

        <ul aria-label="Combined lessons" className="mt-3 space-y-1.5">
          {item.topicGroups.map((group) => (
            <li
              key={group.title}
              className="text-[10px] leading-snug text-[var(--text-muted)]"
            >
              <span className="mr-1 text-[var(--text-faint)]" aria-hidden="true">
                ·
              </span>
              {group.title}
            </li>
          ))}
        </ul>

        <Link
          href={"/modules/" + item.slug}
          className="mt-5 flex min-h-11 items-center justify-center rounded-md bg-[var(--blue)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
        >
          Start Learning
        </Link>
      </div>
    </article>
  );
}
