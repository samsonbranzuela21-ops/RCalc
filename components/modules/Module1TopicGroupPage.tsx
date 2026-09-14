import Link from "next/link";
import { notFound } from "next/navigation";

import { Module1Lesson } from "@/components/module-1/lessons/Module1Lesson";
import { getModule1Topic } from "@/lib/module1";
import {
  catalogModules,
  getModuleTopicGroups,
} from "@/lib/modules";

const MODULE1_SLUG = "introduction-to-rc-design";

export function Module1TopicGroupPage({
  canonicalTopicSlug,
}: {
  canonicalTopicSlug: string;
}) {
  const module_ = catalogModules.find((item) => item.slug === MODULE1_SLUG);
  if (!module_) notFound();

  const groups = getModuleTopicGroups(module_);
  const groupIndex = groups.findIndex(
    (group) => group.topics[0]?.topic.slug === canonicalTopicSlug,
  );
  const group = groups[groupIndex];
  if (!group) notFound();

  const nextGroup = groups[groupIndex + 1];
  const nextTopic = nextGroup?.topics[0];

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/modules/${module_.slug}`}
          className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--blue)]"
        >
          &larr; Back to Module 1
        </Link>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--blue)]">
          Module 1: Principles of Reinforced Concrete
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {group.title}
        </h1>

        <div className="mt-8 space-y-8">
          {group.topics.map(({ topic }) => {
            const lesson = getModule1Topic(topic.slug);
            if (!lesson) {
              return (
                <section
                  key={topic.slug}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-7"
                >
                  <h2 className="text-xl font-extrabold">{topic.title}</h2>
                </section>
              );
            }

            const topicIndex = module_.topics.findIndex(
              (item) => item.slug === topic.slug,
            );

            return (
              <Module1Lesson
                key={topic.slug}
                moduleSlug={module_.slug}
                moduleTitle={module_.title}
                topic={lesson}
                topics={module_.topics}
                previousTopic={module_.topics[topicIndex - 1] ?? null}
                nextTopic={module_.topics[topicIndex + 1] ?? null}
                embedded
                topicTitle={topic.title}
              />
            );
          })}
        </div>

        {nextTopic && nextGroup && (
          <nav
            aria-label="Combined lesson navigation"
            className="mt-8 flex justify-end border-t border-[var(--border)] pt-6"
          >
            <Link
              href={nextTopic.href}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-bold text-white hover:brightness-110"
            >
              Next: {nextGroup.title} &rarr;
            </Link>
          </nav>
        )}
      </div>
    </main>
  );
}
