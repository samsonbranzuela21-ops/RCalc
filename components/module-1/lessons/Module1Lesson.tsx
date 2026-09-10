import Link from "next/link";

import { InlineKatex } from "@/components/shared/Katex";
import { Module1Illustration } from "@/components/module-1/lessons/Module1Illustration";
import type { Module1TopicContent } from "@/lib/module1";

interface ModuleTopicLink {
  slug: string;
  title: string;
}

interface Module1LessonProps {
  moduleSlug: string;
  moduleTitle: string;
  topic: Module1TopicContent;
  topics: ModuleTopicLink[];
  previousTopic: ModuleTopicLink | null;
  nextTopic: ModuleTopicLink | null;
}

export function Module1Lesson({
  moduleSlug,
  moduleTitle,
  topic,
  topics,
  previousTopic,
  nextTopic,
}: Module1LessonProps) {
  return (
    <main className="module-lesson-shell min-h-screen px-4 py-8 text-[var(--text)] sm:px-6 sm:py-12 lg:px-8">
      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
          <Link href="/modules" className="hover:text-[var(--blue)]">
            Modules
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/modules/${moduleSlug}`} className="hover:text-[var(--blue)]">
            {moduleTitle}
          </Link>
        </div>

        <header className="relative mt-5 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)]/90 p-6 shadow-sm backdrop-blur-sm sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[var(--blue)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[var(--orange)]/8 blur-3xl" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--blue)]/40 bg-[var(--blue)]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--blue)]">
              Module 1 <span aria-hidden="true">&middot;</span> {moduleTitle}
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)]">
              Topic {topics.findIndex((item) => item.slug === topic.slug) + 1} of {topics.length}
            </span>
          </div>
          <p className="relative mt-7 text-xs font-bold uppercase tracking-[0.2em] text-[var(--orange)]">
            {topic.eyebrow}
          </p>
          <h1 className="relative mt-3 max-w-4xl text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl lg:text-5xl">
            {topic.title}
          </h1>
          <p className="relative mt-4 max-w-3xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
            {topic.summary}
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-start">
          <article className="min-w-0">
            <div className="overflow-x-auto rounded-2xl">
              <Module1Illustration kind={topic.illustration} />
            </div>

            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--orange)]">Your learning target</p>
              <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">Learning objectives</h2>
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-[var(--text-muted)] sm:grid-cols-2">
                {topic.objectives.map((objective) => (
                  <li key={objective} className="flex gap-2">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--blue)]" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-6 space-y-5">
              {topic.sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm sm:p-7"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--blue)] text-xs font-extrabold text-white shadow-sm">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-lg font-extrabold sm:text-xl">{section.title}</h2>
                      <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">
                        {section.summary}
                      </p>
                    </div>
                  </div>

                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-5 text-sm leading-7 text-[var(--text-muted)] sm:text-[15px]">
                      {paragraph}
                    </p>
                  ))}

                  {section.bullets && (
                    <ul className="mt-5 space-y-3 text-sm leading-6 text-[var(--text-muted)]">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2">
                          <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--orange)]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.formulas && (
                    <div className="mt-4 space-y-2">
                      {section.formulas.map((formula) => (
                        <div key={formula.label} className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-4">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--orange)]">
                            {formula.label}
                          </p>
                          <div className="min-w-max text-sm text-[var(--text)]">
                            <InlineKatex math={formula.math} />
                          </div>
                          {formula.note && (
                              <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                              {formula.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {section.note && (
                    <div className="mt-5 rounded-xl border-l-4 border-[var(--orange)] bg-[var(--orange)]/10 px-4 py-3 text-sm leading-6 text-[var(--text-muted)]">
                      <span className="font-bold text-[var(--orange)]">Remember: </span>
                      {section.note}
                    </div>
                  )}
                </section>
              ))}
            </div>

            <details className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm sm:p-7">
              <summary className="cursor-pointer text-sm font-extrabold sm:text-base">
                Self-check: {topic.checkQuestion}
              </summary>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                {topic.checkAnswer}
              </p>
            </details>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
              {previousTopic ? (
                <Link
                  href={`/modules/${moduleSlug}/${previousTopic.slug}`}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs font-bold text-[var(--text-muted)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
                >
                  ← {previousTopic.title}
                </Link>
              ) : (
                <span />
              )}
              {nextTopic && (
                <Link
                  href={`/modules/${moduleSlug}/${nextTopic.slug}`}
                  className="rounded-lg bg-[var(--blue)] px-4 py-2.5 text-xs font-bold text-white hover:brightness-110"
                >
                  Next: {nextTopic.title} →
                </Link>
              )}
            </div>
          </article>

          <aside className="lg:sticky lg:top-24">
            <nav
              aria-label="Module 1 topic sections"
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm"
            >
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--orange)]">
                In this topic
              </p>
              <div className="space-y-1">
                {topic.sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex gap-2 rounded-lg px-2 py-2.5 text-xs leading-snug text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--blue)]"
                  >
                    <span className="font-bold text-[var(--blue)]">{index + 1}.</span>
                    <span>{section.title}</span>
                  </a>
                ))}
              </div>
              <div className="mt-3 border-t border-[var(--border)] pt-3">
                <Link
                  href={`/modules/${moduleSlug}`}
                    className="block rounded-lg px-2 py-2.5 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--blue)]"
                >
                  ← All Module 1 topics
                </Link>
                <Link
                  href="/nscp-aci-318"
                    className="mt-1 block rounded-lg px-2 py-2.5 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--blue)]"
                >
                  Open code reference →
                </Link>
              </div>
            </nav>
          </aside>
        </div>

        <p className="mt-8 text-xs leading-6 text-[var(--text-muted)]">
          Educational overview based on the supplied CE72 Module 1 material and the introductory NSCP 2015 / ACI 318 design framework. Always verify the adopted code edition, amendments, project specifications, and professional design requirements.
        </p>
      </div>
    </main>
  );
}
