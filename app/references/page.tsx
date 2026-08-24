import Link from "next/link";

export default function ReferencesPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6">
      <section className="mx-auto w-full max-w-[760px]">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-5 text-center sm:p-8">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--blue)]">
            References
          </span>

          <h1 className="mt-2 break-words text-[22px] font-extrabold sm:text-[28px]">
            References Page
          </h1>

          <p className="mx-auto mt-3 max-w-[520px] text-[12px] leading-relaxed text-[var(--text-muted)] sm:text-[14px]">
            The complete list of references used for the learning modules and
            reinforced concrete design calculators will be added here.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href="/"
              className="inline-flex min-h-9 items-center justify-center rounded-md bg-[var(--yellow)] px-4 text-[11px] font-semibold text-[#171200] hover:brightness-105"
            >
              Return Home
            </Link>

            <Link
              href="/nscp-aci-318"
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg-section)] px-4 text-[11px] font-semibold text-[var(--text)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
            >
              NSCP · ACI 318
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}