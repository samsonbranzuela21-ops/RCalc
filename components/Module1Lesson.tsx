import Link from "next/link";

import { InlineKatex } from "@/components/Katex";
import { Module1Illustration } from "@/components/Module1Illustration";
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
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-5 sm:py-10">
      <div className="mx-auto max-w-[900px]">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
          <Link href="/modules" className="hover:text-[var(--yellow)]">
            Modules
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/modules/${moduleSlug}`} className="hover:text-[var(--yellow)]">
            {moduleTitle}
          </Link>
        </div>

        <header className="mt-5 border-b border-[var(--border)] pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-[var(--blue)]/40 bg-[var(--blue)]/10 px-2 py-1 text-[10px] font-bold text-[var(--blue)]">
              Module 1 · Introduction &amp; Materials
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              Topic {topics.findIndex((item) => item.slug === topic.slug) + 1} of {topics.length}
            </span>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--orange)]">
            {topic.eyebrow}
          </p>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.03em] sm:text-[32px]">
            {topic.title}
          </h1>
          <p className="mt-2 max-w-[680px] text-[13px] leading-relaxed text-[var(--text-muted)]">
            {topic.summary}
          </p>
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_210px] lg:items-start">
          <article className="min-w-0">
            <Module1Illustration kind={topic.illustration} />

            <section className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
              <h2 className="text-[15px] font-extrabold">Learning objectives</h2>
              <ul className="mt-3 grid gap-2 text-[12px] leading-relaxed text-[var(--text-muted)]">
                {topic.objectives.map((objective) => (
                  <li key={objective} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--yellow)]" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-5 space-y-4">
              {topic.sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-[var(--yellow)] text-[10px] font-extrabold text-[#171200]">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-extrabold">{section.title}</h2>
                      <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                        {section.summary}
                      </p>
                    </div>
                  </div>

                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-4 text-[12px] leading-[1.75] text-[var(--text-muted)]">
                      {paragraph}
                    </p>
                  ))}

                  {section.bullets && (
                    <ul className="mt-4 space-y-2 text-[12px] leading-relaxed text-[var(--text-muted)]">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--blue)]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.formulas && (
                    <div className="mt-4 space-y-2">
                      {section.formulas.map((formula) => (
                        <div key={formula.label} className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-3">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--orange)]">
                            {formula.label}
                          </p>
                          <div className="min-w-max text-[13px] text-[var(--text)]">
                            <InlineKatex math={formula.math} />
                          </div>
                          {formula.note && (
                            <p className="mt-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
                              {formula.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {section.note && (
                    <div className="mt-4 rounded-lg border-l-2 border-[var(--orange)] bg-[var(--orange)]/10 px-3 py-2.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
                      <span className="font-bold text-[var(--orange)]">Remember: </span>
                      {section.note}
                    </div>
                  )}
                </section>
              ))}
            </div>

            <details className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5">
              <summary className="cursor-pointer text-[13px] font-extrabold">
                Self-check: {topic.checkQuestion}
              </summary>
              <p className="mt-3 text-[12px] leading-relaxed text-[var(--text-muted)]">
                {topic.checkAnswer}
              </p>
            </details>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
              {previousTopic ? (
                <Link
                  href={`/modules/${moduleSlug}/${previousTopic.slug}`}
                  className="rounded-md border border-[var(--border)] px-3 py-2 text-[11px] font-semibold text-[var(--text-muted)] hover:border-[var(--yellow)] hover:text-[var(--yellow)]"
                >
                  ← {previousTopic.title}
                </Link>
              ) : (
                <span />
              )}
              {nextTopic && (
                <Link
                  href={`/modules/${moduleSlug}/${nextTopic.slug}`}
                  className="rounded-md bg-[var(--yellow)] px-3 py-2 text-[11px] font-bold text-[#171200] hover:brightness-105"
                >
                  Next: {nextTopic.title} →
                </Link>
              )}
            </div>
          </article>

          <aside className="lg:sticky lg:top-5">
            <nav
              aria-label="Module 1 topic sections"
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3"
            >
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--orange)]">
                In this topic
              </p>
              <div className="space-y-1">
                {topic.sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex gap-2 rounded-md px-2 py-2 text-[11px] leading-snug text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--yellow)]"
                  >
                    <span className="font-bold text-[var(--blue)]">{index + 1}.</span>
                    <span>{section.title}</span>
                  </a>
                ))}
              </div>
              <div className="mt-3 border-t border-[var(--border)] pt-3">
                <Link
                  href={`/modules/${moduleSlug}`}
                  className="block rounded-md px-2 py-2 text-[11px] font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--yellow)]"
                >
                  ← All Module 1 topics
                </Link>
                <Link
                  href="/nscp-aci-318"
                  className="mt-1 block rounded-md px-2 py-2 text-[11px] font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--yellow)]"
                >
                  Open code reference →
                </Link>
              </div>
            </nav>
          </aside>
        </div>

        <p className="mt-6 text-[10px] leading-relaxed text-[var(--text-muted)]">
          Educational overview based on the supplied CE72 Module 1 material and the introductory NSCP 2015 / ACI 318 design framework. Always verify the adopted code edition, amendments, project specifications, and professional design requirements.
        </p>
      </div>
    </main>
  );
}
