import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogModules } from "@/lib/modules";

export function generateStaticParams() {
  return catalogModules.flatMap((m) =>
    m.topics.map((t) => ({ slug: m.slug, topicSlug: t.slug }))
  );
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string; topicSlug: string }>;
}) {
  const { slug, topicSlug } = await params;
  const module_ = catalogModules.find((m) => m.slug === slug);
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

      </div>
    </div>
  );
}
