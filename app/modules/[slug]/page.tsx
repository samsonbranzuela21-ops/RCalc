import Link from "next/link";
import { notFound } from "next/navigation";
import { modules } from "@/lib/data";

export function generateStaticParams() {
  return modules.map((m) => ({ slug: m.slug }));
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const module_ = modules.find((m) => m.slug === slug);

  if (!module_) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto max-w-[640px]">
        <Link href="/" className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]">
          ‹ Back to modules
        </Link>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-muted)]">Module {module_.index}</span>
        </div>
        <h1 className="mt-1 text-[24px] font-extrabold">{module_.title}</h1>
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">{module_.description}</p>

        {module_.topics.length > 0 && (
          <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4">
            <div className="text-[11px] font-bold text-[var(--text)]">Topics covered</div>
            <ul className="mt-3 space-y-1">
              {module_.topics.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/modules/${module_.slug}/${t.slug}`}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-[12px] text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                  >
                    <span className="h-1 w-1 flex-shrink-0 rounded-full bg-[#f5941f]" />
                    <span className="flex-1">{t.title}</span>
                    <span className="text-[12px]">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}