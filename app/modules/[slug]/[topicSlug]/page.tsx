import Link from "next/link";
import { notFound } from "next/navigation";
import { modules } from "@/lib/data";

export function generateStaticParams() {
  return modules.flatMap((m) =>
    m.topics.map((t) => ({ slug: m.slug, topicSlug: t.slug }))
  );
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string; topicSlug: string }>;
}) {
  const { slug, topicSlug } = await params;
  const module_ = modules.find((m) => m.slug === slug);
  const topic = module_?.topics.find((t) => t.slug === topicSlug);

  if (!module_ || !topic) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto max-w-[640px]">
        <Link
          href={`/modules/${module_.slug}`}
          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          ‹ Back to {module_.title}
        </Link>

        <div className="mt-4 text-[11px] text-[var(--text-muted)]">
          Module {module_.index} · {module_.title}
        </div>
        <h1 className="mt-1 text-[22px] font-extrabold">{topic.title}</h1>

        {/* ─────────────────────────────────────────────────────────
            LESSON CONTENT GOES HERE.
            Replace this block with your actual learning content —
            text, formulas, images, examples, etc. for "{topic.title}".
           ───────────────────────────────────────────────────────── */}
        <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-5 text-[13px] leading-relaxed text-[var(--text-muted)]">
          Content for this topic hasn&apos;t been added yet.
        </div>
      </div>
    </div>
  );
}