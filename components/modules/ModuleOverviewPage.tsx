import Link from "next/link";
import { catalogModules, type ModuleItem } from "@/lib/modules";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function ModuleOverviewPage({ module_ }: { module_: ModuleItem }) {
  const nextModule = catalogModules.find((item) => item.index === module_.index + 1);

  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto max-w-[640px]">
        <span className="inline-flex items-center rounded-md border border-[#4d7cff]/40 bg-[#4d7cff]/10 px-2 py-1 text-[10px] font-semibold text-[#4d7cff]">
          Module {ROMAN[module_.index - 1] ?? module_.index}
        </span>

        <h1 className="mt-3 text-[24px] font-extrabold">{module_.title}</h1>
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">{module_.description}</p>

        {module_.topics.length > 0 && (
          <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d7cff]">
                Topics
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {module_.topics.length} topics
              </span>
            </div>

            <ul>
              {module_.topics.map((topic) => (
                <li key={topic.slug} className="border-b border-[var(--border)] last:border-b-0">
                  <Link
                    href={`/modules/${module_.slug}/${topic.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--border)]/30"
                  >
                    <span className="flex-1 text-[12px] font-medium text-[#4d7cff]">
                      {topic.title}
                    </span>
                    <span aria-hidden="true" className="text-[var(--text-faint)]">
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
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
