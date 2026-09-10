import Link from "next/link";

import { UnitConverter } from "@/components/module-1/units-conversion/UnitConverter";

const unitCategories = [
  {
    title: "Length",
    color: "var(--blue)",
    units: [
      ["millimeter", "mm"],
      ["centimeter", "cm"],
      ["meter", "m"],
    ],
    relationship: "1 m = 100 cm = 1,000 mm",
  },
  {
    title: "Force",
    color: "var(--orange)",
    units: [
      ["newton", "N"],
      ["kilonewton", "kN"],
    ],
    relationship: "1 kN = 1,000 N",
  },
  {
    title: "Stress or Strength",
    color: "var(--purple)",
    units: [
      ["pascal", "Pa"],
      ["kilopascal", "kPa"],
      ["megapascal", "MPa"],
    ],
    relationship: "1 MPa = 1,000 kPa = 1,000,000 Pa",
  },
  {
    title: "Area",
    color: "var(--teal)",
    units: [
      ["square millimeter", "mm²"],
      ["square meter", "m²"],
    ],
    relationship: "1 m² = 1,000,000 mm²",
  },
  {
    title: "Moment",
    color: "var(--yellow)",
    units: [
      ["newton millimeter", "N·mm"],
      ["kilonewton meter", "kN·m"],
    ],
    relationship: "1 kN·m = 1,000,000 N·mm",
  },
] as const;

const conversionFactors = [
  ["Length", "1 m = 1,000 mm", true],
  ["Force", "1 kN = 1,000 N", true],
  ["Stress", "1 MPa = 1 N/mm²", true],
  ["Area", "1 m² = 1,000,000 mm²", false],
  ["Moment", "1 kN·m = 1,000,000 N·mm", true],
] as const;

const examples = [
  {
    number: "01",
    title: "Convert 3.5 m to millimeters",
    calculation: "3.5 m × 1,000 = 3,500 mm",
    note: "Multiply meters by 1,000 to get millimeters.",
  },
  {
    number: "02",
    title: "Convert 250 kN to newtons",
    calculation: "250 kN × 1,000 = 250,000 N",
    note: "Multiply kilonewtons by 1,000 to get newtons.",
  },
  {
    number: "03",
    title: "Convert 2.5 MPa to N/mm²",
    calculation: "2.5 MPa = 2.5 N/mm²",
    note: "A megapascal is equivalent to one newton per square millimeter.",
  },
] as const;

export function UnitsConversion() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="grid items-center gap-8 border-b border-[var(--border)] pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] lg:gap-12">
          <div>
            <Link
              href="/modules/introduction-to-rc-design/course-details"
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--blue)]"
            >
              &larr; Previous: Course Details
            </Link>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[var(--blue)]">
              Module 1: Principles of Reinforced Concrete
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Topic 2: Units Conversion
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
              Learn how to convert common units used in reinforced concrete
              design and structural calculations.
            </p>
          </div>

          <UnitsHeaderIllustration />
        </header>

        <div className="mx-auto mt-8 max-w-5xl space-y-8">
          <section className="rounded-2xl border border-[var(--blue)]/25 bg-[var(--blue)]/8 p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--blue)]">
              Why it matters
            </p>
            <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
              Why Unit Conversion Is Important
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
              Correct unit conversion is important in reinforced concrete
              design because dimensions, loads, stresses, and material
              properties must use consistent units. An incorrect conversion
              can produce an incorrect design result even when the formula is
              used correctly.
            </p>
          </section>

          <section aria-labelledby="common-units-heading">
            <SectionHeading
              eyebrow="Know your quantities"
              id="common-units-heading"
              title="Common Units in Reinforced Concrete Design"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {unitCategories.map((category) => (
                <article
                  key={category.title}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
                  style={{ borderTopColor: category.color, borderTopWidth: "3px" }}
                >
                  <h3 className="text-sm font-extrabold">{category.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {category.units.map(([name, symbol]) => (
                      <li key={symbol} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-[var(--text-muted)]">{name}</span>
                        <span className="rounded-md bg-[var(--bg)] px-2 py-1 font-bold" style={{ color: category.color }}>
                          {symbol}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 border-t border-[var(--border)] pt-3 text-xs font-bold leading-5 text-[var(--text)]">
                    {category.relationship}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="conversion-table-heading">
            <SectionHeading
              eyebrow="Keep this nearby"
              id="conversion-table-heading"
              title="Common Conversion Factors"
            />
            <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
              <div className="grid grid-cols-[minmax(100px,0.7fr)_minmax(0,1.3fr)] border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)] sm:px-5">
                <span>Quantity</span>
                <span>Conversion</span>
              </div>
              {conversionFactors.map(([quantity, conversion, highlighted]) => (
                <div
                  key={quantity}
                  className={`grid grid-cols-[minmax(100px,0.7fr)_minmax(0,1.3fr)] items-center border-b border-[var(--border)] px-4 py-3 last:border-b-0 sm:px-5 ${highlighted ? "bg-[var(--blue)]/5" : ""}`}
                >
                  <span className="text-sm font-bold text-[var(--text-muted)]">{quantity}</span>
                  <span className={`text-sm font-extrabold ${highlighted ? "text-[var(--blue)]" : "text-[var(--text)]"}`}>
                    {conversion}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="examples-heading">
            <SectionHeading
              eyebrow="See the pattern"
              id="examples-heading"
              title="Examples"
            />
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {examples.map((example) => (
                <article key={example.number} className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
                  <span className="text-[10px] font-extrabold tracking-[0.16em] text-[var(--orange)]">EXAMPLE {example.number}</span>
                  <h3 className="mt-3 text-sm font-extrabold leading-5">{example.title}</h3>
                  <p className="mt-4 rounded-lg bg-[var(--bg)] px-3 py-3 text-base font-extrabold leading-6 text-[var(--blue)]">
                    {example.calculation}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">{example.note}</p>
                </article>
              ))}
            </div>
          </section>

          <UnitConverter />

          <aside className="rounded-xl border-l-4 border-[var(--orange)] bg-[var(--orange)]/10 px-4 py-4 sm:px-5">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              <strong className="font-extrabold text-[var(--orange)]">Remember:</strong>{" "}
              Always check that all values use consistent units before
              starting a reinforced concrete design calculation.
            </p>
          </aside>

          <nav
            aria-label="Course topic navigation"
            className="flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <Link
              href="/modules/introduction-to-rc-design/course-details"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-bold text-[var(--text-muted)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
            >
              &larr; Previous: Course Details
            </Link>
            <Link
              href="/modules/introduction-to-rc-design/design-process"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-bold text-white hover:brightness-110"
            >
              Next: Design Process &rarr;
            </Link>
          </nav>
        </div>
      </div>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  id,
  title,
}: {
  eyebrow: string;
  id: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--orange)]">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-xl font-extrabold sm:text-2xl">{title}</h2>
    </div>
  );
}

function UnitsHeaderIllustration() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-5">
      <svg
        viewBox="0 0 480 230"
        role="img"
        aria-label="Unit conversion illustration with ruler, force arrow, and concrete cube"
        className="h-auto w-full"
      >
        <defs>
          <pattern id="units-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.45" />
          </pattern>
          <marker id="units-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="var(--blue)" />
          </marker>
        </defs>
        <rect width="480" height="230" rx="12" fill="url(#units-grid)" />
        <text x="24" y="28" fill="var(--text-muted)" fontSize="11" fontWeight="700" letterSpacing="1.5">UNIT CONVERSION MAP</text>

        <g transform="translate(32 53)">
          <rect x="0" y="18" width="250" height="32" rx="4" fill="#d7dce4" stroke="var(--text)" strokeWidth="2" />
          {Array.from({ length: 11 }, (_, index) => (
            <line key={index} x1={12 + index * 23} y1="50" x2={12 + index * 23} y2={index % 5 === 0 ? 12 : 24} stroke="var(--blue)" strokeWidth={index % 5 === 0 ? 2 : 1} />
          ))}
          <text x="16" y="42" fill="var(--blue)" fontSize="10" fontWeight="800">mm</text>
          <text x="216" y="42" fill="var(--blue)" fontSize="10" fontWeight="800">m</text>
          <line x1="16" y1="2" x2="218" y2="2" stroke="var(--blue)" strokeWidth="2" markerEnd="url(#units-arrow)" />
          <text x="117" y="-5" textAnchor="middle" fill="var(--orange)" fontSize="10" fontWeight="800">÷ 1,000</text>
          <text x="125" y="78" textAnchor="middle" fill="var(--text-muted)" fontSize="10">length</text>
        </g>

        <g transform="translate(32 149)">
          <line x1="0" y1="15" x2="152" y2="15" stroke="var(--blue)" strokeWidth="4" strokeLinecap="round" markerEnd="url(#units-arrow)" />
          <text x="10" y="39" fill="var(--blue)" fontSize="12" fontWeight="800">N</text>
          <text x="128" y="39" fill="var(--blue)" fontSize="12" fontWeight="800">kN</text>
          <text x="76" y="-2" textAnchor="middle" fill="var(--orange)" fontSize="10" fontWeight="800">÷ 1,000</text>
          <text x="76" y="59" textAnchor="middle" fill="var(--text-muted)" fontSize="10">force</text>
        </g>

        <g transform="translate(290 101)">
          <path d="M0 31 L47 15 L94 31 L47 47 Z" fill="#d7dce4" stroke="var(--text)" strokeWidth="2" />
          <path d="M0 31 V79 L47 96 L94 79 V31" fill="#b9c1ce" stroke="var(--text)" strokeWidth="2" />
          <path d="M16 34 L47 44 L78 34" fill="none" stroke="var(--blue)" strokeWidth="3" />
          <text x="47" y="119" textAnchor="middle" fill="var(--blue)" fontSize="12" fontWeight="900">MPa</text>
          <text x="47" y="136" textAnchor="middle" fill="var(--text-muted)" fontSize="10">stress</text>
        </g>

        <line x1="202" y1="164" x2="278" y2="164" stroke="var(--blue)" strokeWidth="2" strokeDasharray="5 5" markerEnd="url(#units-arrow)" />
        <text x="240" y="155" textAnchor="middle" fill="var(--orange)" fontSize="9" fontWeight="800">× 1,000,000</text>
      </svg>
    </div>
  );
}
