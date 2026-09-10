import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogModules } from "@/lib/modules";

const MODULE1_SLUG = "introduction-to-rc-design";

export function generateStaticParams() {
  return catalogModules.filter((module_) => module_.slug !== MODULE1_SLUG).flatMap((module_) =>
    module_.topics.map((topic) => ({ slug: module_.slug, topicSlug: topic.slug }))
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

  if (module_.slug === MODULE1_SLUG) {
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
