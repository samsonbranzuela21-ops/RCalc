import Link from "next/link";
import type { ReactNode } from "react";

const courseInformation = [
  ["Course", "Reinforced Concrete Design"],
  ["Course Code", "CE 72"],
  ["Program", "Bachelor of Science in Civil Engineering"],
  ["Institution", "South East Asian Institute of Technology"],
  ["Main Members", "Beams, columns, and slabs"],
  ["Design References", "NSCP 2015 and ACI 318"],
] as const;

const learningCards = [
  {
    title: "Concrete",
    description: "Properties, behavior, and strength",
    color: "var(--blue)",
    icon: <ConcreteIcon />,
  },
  {
    title: "Reinforcing Steel",
    description: "Properties and stress-strain behavior",
    color: "var(--orange)",
    icon: <SteelIcon />,
  },
  {
    title: "Structural Members",
    description: "Beams, columns, and slabs",
    color: "var(--purple)",
    icon: <MembersIcon />,
  },
  {
    title: "Design Process",
    description: "Loads, analysis, reinforcement, and checking",
    color: "var(--teal)",
    icon: <ProcessIcon />,
  },
] as const;

const objectives = [
  "Explain the purpose of Reinforced Concrete Design.",
  "Identify the roles of concrete and reinforcing steel.",
  "Recognize the main reinforced concrete structural members.",
  "Describe the basic design process.",
  "Identify the purpose of NSCP 2015 and ACI 318.",
];

export function CourseDetails() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="grid items-center gap-8 border-b border-[var(--border)] pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] lg:gap-12">
          <div>
            <Link
              href="/modules/introduction-to-rc-design"
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--blue)]"
            >
              &larr; Back to Module 1
            </Link>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[var(--blue)]">
              Module 1: Principles of Reinforced Concrete
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Topic 1: Course Details
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
              An introduction to the Reinforced Concrete Design course, its
              purpose, topics, and importance in Civil Engineering.
            </p>
          </div>

          <CourseHeaderIllustration />
        </header>

        <div className="mx-auto mt-8 max-w-5xl space-y-8">
          <section className="rounded-2xl border border-[var(--blue)]/25 bg-[var(--blue)]/8 p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--blue)]">
              Start here
            </p>
            <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
              Course Overview
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
              Reinforced Concrete Design is a subject that explains how
              concrete and steel work together to resist different structural
              loads. It introduces the basic materials, design procedures,
              structural members, reinforcement, and design codes used in
              reinforced concrete construction.
            </p>
          </section>

          <section aria-labelledby="course-information-heading">
            <SectionHeading
              eyebrow="The course at a glance"
              id="course-information-heading"
              title="Course Information"
            />
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {courseInformation.map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:grid-cols-[minmax(105px,0.7fr)_minmax(0,1.3fr)] sm:items-start sm:gap-4"
                >
                  <dt className="text-xs font-bold text-[var(--text-muted)]">
                    {label}
                  </dt>
                  <dd className="text-sm font-semibold leading-6 text-[var(--text)]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="learning-heading">
            <SectionHeading
              eyebrow="Build the foundation"
              id="learning-heading"
              title="What Students Will Learn"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {learningCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `color-mix(in srgb, ${card.color} 13%, transparent)` }}
                  >
                    {card.icon}
                  </div>
                  <h3 className="mt-4 text-sm font-extrabold">{card.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="roadmap-heading">
            <SectionHeading
              eyebrow="From materials to design"
              id="roadmap-heading"
              title="Course Roadmap"
            />
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-7">
              <div className="flex flex-col items-center gap-3 md:flex-row md:items-stretch md:justify-between md:gap-2">
                <RoadmapStep
                  icon={<ConcreteAndSteelIcon />}
                  label={
                    <>
                      Concrete +<br />
                      Reinforcing Steel
                    </>
                  }
                />
                <RoadmapArrow />
                <RoadmapStep icon={<CompositeIcon />} label="Reinforced Concrete" />
                <RoadmapArrow />
                <RoadmapStep
                  icon={<MembersIcon />}
                  label={
                    <>
                      Structural Members
                      <span className="mt-1 block text-[10px] font-medium text-[var(--text-muted)]">
                        Beams &bull; Columns &bull; Slabs
                      </span>
                    </>
                  }
                />
                <RoadmapArrow />
                <RoadmapStep
                  icon={<CodeBookIcon />}
                  label={
                    <>
                      Design Using
                      <span className="mt-1 block text-[10px] font-medium text-[var(--text-muted)]">
                        NSCP 2015 / ACI 318
                      </span>
                    </>
                  }
                />
              </div>
            </div>
          </section>

          <section aria-labelledby="objectives-heading">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-7">
              <SectionHeading
                eyebrow="Your first checkpoint"
                id="objectives-heading"
                title="After completing this topic, students should be able to:"
              />
              <ul className="mt-5 grid gap-3 text-sm leading-6 text-[var(--text-muted)] sm:grid-cols-2">
                {objectives.map((objective) => (
                  <li key={objective} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--orange)]" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <aside className="rounded-xl border-l-4 border-[var(--orange)] bg-[var(--orange)]/10 px-4 py-4 sm:px-5">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              <strong className="font-extrabold text-[var(--orange)]">Important:</strong>{" "}
              This topic provides the basic foundation for the succeeding
              Reinforced Concrete Design lessons.
            </p>
          </aside>

          <nav
            aria-label="Course topic navigation"
            className="flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <Link
              href="/modules/introduction-to-rc-design"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-bold text-[var(--text-muted)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
            >
              &larr; Back to Module 1
            </Link>
            <Link
              href="/modules/introduction-to-rc-design/units-conversion"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-bold text-white hover:brightness-110"
            >
              Next: Units Conversion &rarr;
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
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--orange)]">
        {eyebrow}
      </p>
      <h2 id={id} className="mt-2 text-xl font-extrabold sm:text-2xl">
        {title}
      </h2>
    </div>
  );
}

function RoadmapStep({
  icon,
  label,
}: {
  icon: ReactNode;
  label: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-center justify-center text-center md:min-w-0 md:flex-1">
      <div className="flex h-20 w-28 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2">
        {icon}
      </div>
      <p className="mt-3 text-xs font-extrabold leading-5 sm:text-sm">{label}</p>
    </div>
  );
}

function RoadmapArrow() {
  return (
    <span className="text-2xl font-bold leading-none text-[var(--orange)] md:flex md:items-center">
      <span className="md:hidden">&darr;</span>
      <span className="hidden md:inline">&rarr;</span>
    </span>
  );
}

function CourseHeaderIllustration() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-5">
      <svg
        viewBox="0 0 480 230"
        role="img"
        aria-label="Simple reinforced concrete beam, column, and slab illustration"
        className="h-auto w-full"
      >
        <defs>
          <pattern id="header-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.45" />
          </pattern>
        </defs>
        <rect width="480" height="230" rx="12" fill="url(#header-grid)" />
        <text x="24" y="28" fill="var(--text-muted)" fontSize="11" fontWeight="700" letterSpacing="1.5">
          STRUCTURAL ELEMENTS
        </text>

        <g transform="translate(32 58)">
          <rect x="0" y="34" width="170" height="42" rx="4" fill="#c8ced8" stroke="var(--text)" strokeWidth="2" />
          <line x1="14" y1="48" x2="156" y2="48" stroke="var(--blue)" strokeWidth="4" />
          <line x1="14" y1="63" x2="156" y2="63" stroke="var(--blue)" strokeWidth="4" />
          <line x1="28" y1="26" x2="28" y2="86" stroke="var(--orange)" strokeWidth="2" opacity="0.85" />
          <line x1="142" y1="26" x2="142" y2="86" stroke="var(--orange)" strokeWidth="2" opacity="0.85" />
          <text x="85" y="110" textAnchor="middle" fill="var(--text)" fontSize="13" fontWeight="800">BEAM</text>
          <text x="85" y="127" textAnchor="middle" fill="var(--text-muted)" fontSize="10">concrete + steel</text>
        </g>

        <g transform="translate(246 58)">
          <rect x="24" y="14" width="58" height="122" rx="4" fill="#c8ced8" stroke="var(--text)" strokeWidth="2" />
          <line x1="37" y1="22" x2="37" y2="128" stroke="var(--blue)" strokeWidth="4" />
          <line x1="69" y1="22" x2="69" y2="128" stroke="var(--blue)" strokeWidth="4" />
          <line x1="18" y1="40" x2="88" y2="40" stroke="var(--orange)" strokeWidth="2" />
          <line x1="18" y1="76" x2="88" y2="76" stroke="var(--orange)" strokeWidth="2" />
          <line x1="18" y1="112" x2="88" y2="112" stroke="var(--orange)" strokeWidth="2" />
          <text x="53" y="158" textAnchor="middle" fill="var(--text)" fontSize="13" fontWeight="800">COLUMN</text>
        </g>

        <g transform="translate(344 58)">
          <path d="M0 50 L62 30 L122 50 L60 70 Z" fill="#d7dce4" stroke="var(--text)" strokeWidth="2" />
          <path d="M0 50 V72 L60 93 L122 72 V50" fill="#b9c1ce" stroke="var(--text)" strokeWidth="2" />
          <path d="M15 52 L60 67 L106 52" fill="none" stroke="var(--blue)" strokeWidth="3" />
          <text x="61" y="123" textAnchor="middle" fill="var(--text)" fontSize="13" fontWeight="800">SLAB</text>
        </g>

        <line x1="32" y1="202" x2="448" y2="202" stroke="var(--orange)" strokeWidth="2" strokeDasharray="7 7" />
        <circle cx="32" cy="202" r="4" fill="var(--orange)" />
        <circle cx="448" cy="202" r="4" fill="var(--orange)" />
        <text x="240" y="220" textAnchor="middle" fill="var(--text-muted)" fontSize="10">Understanding the parts before designing the whole</text>
      </svg>
    </div>
  );
}

function ConcreteAndSteelIcon() {
  return (
    <svg viewBox="0 0 112 64" aria-hidden="true" className="h-full w-full">
      <rect x="13" y="18" width="58" height="31" rx="3" fill="#c8ced8" stroke="var(--text)" strokeWidth="1.5" />
      <line x1="19" y1="27" x2="65" y2="27" stroke="var(--blue)" strokeWidth="3" />
      <line x1="19" y1="40" x2="65" y2="40" stroke="var(--blue)" strokeWidth="3" />
      <path d="M78 27 H102" stroke="var(--orange)" strokeWidth="4" strokeLinecap="round" />
      <path d="M83 22 L78 27 L83 32" fill="none" stroke="var(--orange)" strokeWidth="2" />
    </svg>
  );
}

function ConcreteIcon() {
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true" className="h-8 w-8">
      <rect x="6" y="7" width="32" height="30" rx="3" fill="#c8ced8" stroke="var(--blue)" strokeWidth="2" />
      <circle cx="15" cy="17" r="2" fill="var(--text-muted)" />
      <circle cx="27" cy="14" r="2" fill="var(--text-muted)" />
      <circle cx="23" cy="28" r="2" fill="var(--text-muted)" />
      <circle cx="33" cy="23" r="2" fill="var(--text-muted)" />
    </svg>
  );
}

function SteelIcon() {
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true" className="h-8 w-8">
      <path d="M8 31 C16 18 27 25 36 11" fill="none" stroke="var(--orange)" strokeWidth="4" strokeLinecap="round" />
      <path d="M12 32 L9 27 M18 27 L15 22 M24 24 L21 19 M30 18 L27 13" stroke="var(--orange)" strokeWidth="1.5" />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true" className="h-8 w-8">
      <rect x="5" y="8" width="34" height="7" rx="2" fill="#c8ced8" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="9" y="15" width="7" height="24" rx="1" fill="#c8ced8" stroke="var(--purple)" strokeWidth="1.5" />
      <rect x="28" y="15" width="7" height="24" rx="1" fill="#c8ced8" stroke="var(--purple)" strokeWidth="1.5" />
      <line x1="5" y1="34" x2="39" y2="34" stroke="var(--purple)" strokeWidth="2" />
    </svg>
  );
}

function ProcessIcon() {
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true" className="h-8 w-8">
      <circle cx="12" cy="22" r="5" fill="var(--teal)" />
      <circle cx="32" cy="11" r="5" fill="var(--teal)" />
      <circle cx="32" cy="33" r="5" fill="var(--teal)" />
      <path d="M16 20 L27 14 M16 24 L27 30" stroke="var(--teal)" strokeWidth="2" />
    </svg>
  );
}

function CompositeIcon() {
  return (
    <svg viewBox="0 0 112 64" aria-hidden="true" className="h-full w-full">
      <rect x="18" y="15" width="76" height="35" rx="3" fill="#c8ced8" stroke="var(--text)" strokeWidth="1.5" />
      <line x1="26" y1="25" x2="86" y2="25" stroke="var(--blue)" strokeWidth="3" />
      <line x1="26" y1="40" x2="86" y2="40" stroke="var(--blue)" strokeWidth="3" />
      <text x="56" y="35" textAnchor="middle" fill="var(--text)" fontSize="8" fontWeight="800">RC</text>
    </svg>
  );
}

function CodeBookIcon() {
  return (
    <svg viewBox="0 0 112 64" aria-hidden="true" className="h-full w-full">
      <path d="M27 14 H78 V52 H27 Z" fill="#d7dce4" stroke="var(--text)" strokeWidth="1.5" />
      <path d="M27 14 C15 14 15 22 15 28 V52 C15 45 20 42 27 42" fill="#b9c1ce" stroke="var(--text)" strokeWidth="1.5" />
      <path d="M78 14 C90 14 90 22 90 28 V52 C90 45 85 42 78 42" fill="#b9c1ce" stroke="var(--text)" strokeWidth="1.5" />
      <text x="53" y="30" textAnchor="middle" fill="var(--blue)" fontSize="9" fontWeight="900">NSCP</text>
      <text x="53" y="41" textAnchor="middle" fill="var(--orange)" fontSize="8" fontWeight="900">/ ACI</text>
    </svg>
  );
}
