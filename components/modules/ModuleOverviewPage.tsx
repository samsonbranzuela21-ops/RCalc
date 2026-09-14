import Link from "next/link";
import {
  catalogModules,
  getModuleTopicCount,
  getModuleTopicGroups,
  type ModuleItem,
} from "@/lib/modules";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function ModuleOverviewPage({ module_ }: { module_: ModuleItem }) {
  const nextModule = catalogModules.find((item) => item.index === module_.index + 1);
  const topicGroups = getModuleTopicGroups(module_);
  const topicCount = getModuleTopicCount(module_);

  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto max-w-[640px]">
        <span className="inline-flex items-center rounded-md border border-[#4d7cff]/40 bg-[#4d7cff]/10 px-2 py-1 text-[10px] font-semibold text-[#4d7cff]">
          Module {ROMAN[module_.index - 1] ?? module_.index}
        </span>

        <h1 className="mt-3 text-[24px] font-extrabold">{module_.title}</h1>
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">{module_.description}</p>

        {topicCount > 0 && (
          <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7cff]">
                Combined Lessons
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {topicCount} lesson pages
              </span>
            </div>

            <div>
              {topicGroups.map((group) => {
                const canonicalTopic = group.topics[0];
                if (!canonicalTopic) return null;

                return (
                  <section
                    key={group.title}
                    className="border-b border-[var(--border)] px-4 last:border-b-0"
                  >
                    <Link
                      href={canonicalTopic.href}
                      className="flex min-h-12 items-center gap-3 py-3 hover:text-[var(--blue)]"
                    >
                      <span className="flex-1 text-[12px] font-medium leading-snug text-[var(--blue)]">
                        {group.title}
                      </span>
                      <span aria-hidden="true" className="text-[var(--text-faint)]">
                        &rarr;
                      </span>
                    </Link>
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {nextModule && (
          <div className="mt-6 flex justify-end">
            <Link
              href={`/modules/${nextModule.slug}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#f5941f] px-3 py-2 text-[11px] font-semibold text-[#1a1300]"
            >
              {nextModule.title} &rsaquo;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
