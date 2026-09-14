import Link from "next/link";

import {
  getModuleTopicGroups,
  type ModuleItem,
  type ResolvedTopicGroup,
} from "@/lib/modules";

export function GroupedTopicPage({
  module_,
  group,
}: {
  module_: ModuleItem;
  group: ResolvedTopicGroup;
}) {
  const moduleGroups = getModuleTopicGroups(module_);
  const groupIndex = moduleGroups.findIndex((item) => item.title === group.title);
  const nextGroup = moduleGroups[groupIndex + 1];
  const nextTopic = nextGroup?.topics[0];

  return (
    <main className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto max-w-[720px]">
        <Link
          href={`/modules/${module_.slug}`}
          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          &larr; Back to {module_.title}
        </Link>

        <p className="mt-4 text-[11px] text-[var(--text-muted)]">
          Module {module_.index} &middot; {module_.title}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold">{group.title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          This page combines {group.topics.length} related lesson
          {group.topics.length === 1 ? "" : "s"}.
        </p>

        <div className="mt-6 space-y-3">
          {group.topics.map(({ topic }) => (
            <section
              key={`${module_.slug}/${topic.slug}`}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-4"
            >
              <h2 className="text-base font-bold">{topic.title}</h2>
            </section>
          ))}
        </div>

        {nextTopic && (
          <div className="mt-6 flex justify-end border-t border-[var(--border)] pt-5">
            <Link
              href={nextTopic.href}
              className="rounded-lg bg-[var(--blue)] px-4 py-2.5 text-xs font-bold text-white hover:brightness-110"
            >
              Next: {nextGroup.title} &rarr;
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
