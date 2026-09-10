import Link from "next/link";
import { notFound } from "next/navigation";

import { catalogModules } from "@/lib/modules";

export default function ConcreteModelsPage() {
  const module_ = catalogModules.find((item) => item.slug === "introduction-to-rc-design");
  const topic = module_?.topics.find((item) => item.slug === "concrete-models");

  if (!module_ || !topic) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto max-w-[640px]">
        <Link
          href={`/modules/${module_.slug}`}
          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          &larr; Back to {module_.title}
        </Link>
        <div className="mt-4 text-[11px] text-[var(--text-muted)]">
          Module {module_.index} &middot; {module_.title}
        </div>
        <h1 className="mt-1 text-[22px] font-extrabold">{topic.title}</h1>
      </div>
    </main>
  );
}
