import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Learning Modules",
    description:
      "Organized lessons, formulas, illustrations, and examples that help students review reinforced concrete design topics.",
    color: "var(--blue)",
  },
  {
    number: "02",
    title: "Design Calculators",
    description:
      "Interactive calculators that show design results and step-by-step solutions based on the provided inputs.",
    color: "var(--orange)",
  },
  {
    number: "03",
    title: "Code-Based Reference",
    description:
      "Selected equations and design checks are guided by NSCP 2015 and applicable ACI 318 provisions.",
    color: "var(--green)",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-[calc(100vh-3rem)] bg-[var(--bg)] px-4 py-12 text-[var(--text)] sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-[860px]">
        <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-5 py-12 text-center sm:px-10 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(var(--hero-grid) 1px, transparent 1px), linear-gradient(90deg, var(--hero-grid) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative mx-auto max-w-[680px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--orange)] sm:text-[11px]">
              About the Platform
            </p>

            <h1 className="mt-3 text-[28px] font-extrabold tracking-[-0.03em] sm:text-[38px]">
              About <span className="text-[var(--blue)]">RCalc</span>
            </h1>

            <p className="mt-5 text-[13px] leading-7 text-[var(--text-muted)] sm:text-[15px]">
              <strong className="font-bold text-[var(--text)]">
                <span className="text-[var(--orange)]">RC</span>alc
              </strong>{" "}
              is a web-based learning platform developed to support Civil
              Engineering students in studying Reinforced Concrete Design. It
              combines learning modules and automated design calculators to help
              users understand important concepts and practice solving design
              problems.
            </p>

            <p className="mt-4 text-[13px] leading-7 text-[var(--text-muted)] sm:text-[15px]">
              The platform is intended as a supplementary learning tool for
              students and instructors of the South East Asian Institute of
              Technology. It supports classroom discussions, independent study,
              and step-by-step practice using commonly applied reinforced
              concrete design procedures.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/modules"
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--yellow)] px-5 text-[11px] font-bold text-[#171200] shadow-sm hover:brightness-105 active:scale-[0.98]"
              >
                Explore Modules
              </Link>

              <Link
                href="/calculators"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)] px-5 text-[11px] font-bold text-[var(--text)] hover:border-[var(--blue)] hover:text-[var(--blue)] active:scale-[0.98]"
              >
                Open Calculators
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 transition-colors hover:bg-[var(--bg-hover)]"
            >
              <span
                className="text-[10px] font-extrabold tracking-[0.15em]"
                style={{ color: feature.color }}
              >
                {feature.number}
              </span>

              <h2 className="mt-2 text-[14px] font-bold text-[var(--text)]">
                {feature.title}
              </h2>

              <p className="mt-2 text-[11px] leading-5 text-[var(--text-muted)]">
                {feature.description}
              </p>
            </article>
          ))}
        </section>

        <p className="mx-auto mt-6 max-w-[720px] text-center text-[10px] leading-5 text-[var(--text-faint)]">
          RCalc is intended for learning and academic use. Final engineering
          designs must still be checked by a qualified professional using the
          complete official design standards.
        </p>
      </div>
    </main>
  );
}
