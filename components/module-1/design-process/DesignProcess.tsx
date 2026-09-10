import Link from "next/link";
import Image from "next/image";

const designSteps = [
  {
    title: "Identify the Design Requirements",
    description:
      "Determine the structural member to be designed, its span or height, support condition, applied loads, required dimensions, and intended use.",
  },
  {
    title: "Determine the Material Properties",
    description:
      "Identify the concrete compressive strength, steel yield strength, unit weight, concrete cover, and other required material properties.",
  },
  {
    title: "Calculate the Applied Loads",
    description:
      "Determine the dead load, live load, and other applicable loads. Apply the required load combination to obtain the factored design load.",
  },
  {
    title: "Analyze the Structural Member",
    description:
      "Determine the forces acting on the member, such as bending moment, shear force, axial load, or a combination of these forces.",
  },
  {
    title: "Design the Reinforcement",
    description:
      "Calculate the required longitudinal reinforcement and transverse reinforcement based on the design forces and the applicable design equations.",
  },
  {
    title: "Check the Design",
    description:
      "Check the strength, minimum reinforcement, maximum reinforcement, spacing, deflection, strain, and other applicable requirements.",
  },
  {
    title: "Prepare the Reinforcement Details",
    description:
      "Specify the bar diameter, number of bars, spacing, placement, ties, stirrups, hooks, and concrete cover.",
  },
  {
    title: "Final Review",
    description:
      "Confirm that all calculations, units, assumptions, reinforcement details, and code requirements are correct.",
  },
] as const;

const flowSteps = [
  "Design Requirements",
  "Material Properties",
  "Loads and Load Combinations",
  "Structural Analysis",
  "Reinforcement Design",
  "Strength and Serviceability Checks",
  "Reinforcement Detailing",
  "Final Design",
] as const;

const checks = [
  ["Strength Check", "Is the member strong enough for the applied load?", "var(--blue)"],
  ["Reinforcement Check", "Is the provided reinforcement within the required limits?", "var(--orange)"],
  ["Serviceability Check", "Are deflection and cracking within acceptable limits?", "var(--teal)"],
  ["Detailing Check", "Are the bar size, spacing, cover, and placement correct?", "var(--purple)"],
] as const;

export function DesignProcess() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="grid items-center gap-8 border-b border-[var(--border)] pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] lg:gap-12">
          <div>
            <Link
              href="/modules/introduction-to-rc-design/units-conversion"
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--blue)]"
            >
              &larr; Previous: Units Conversion
            </Link>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[var(--blue)]">
              Module 1: Principles of Reinforced Concrete
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Topic 3: Design Process
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
              Learn the general steps used in analyzing and designing
              reinforced concrete structural members.
            </p>
          </div>

          <DesignProcessHeaderIllustration />
        </header>

        <div className="mx-auto mt-8 max-w-5xl space-y-8">
          <section className="rounded-2xl border border-[var(--blue)]/25 bg-[var(--blue)]/8 p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--blue)]">
              Start with the method
            </p>
            <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
              What Is the Reinforced Concrete Design Process?
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
              The reinforced concrete design process is an organized method
              used to determine the required dimensions, materials,
              reinforcement, and strength of a structural member. The process
              begins with identifying the loads and continues through
              analysis, reinforcement design, code checking, and detailing.
            </p>
          </section>

          <section aria-labelledby="design-steps-heading">
            <SectionHeading
              eyebrow="Work through the sequence"
              id="design-steps-heading"
              title="Main Design Process"
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {designSteps.map((step, index) => (
                <article
                  key={step.title}
                  className="relative overflow-hidden rounded-2xl border border-[var(--border)] border-t-4 border-t-[var(--blue)] bg-[var(--bg-surface)] p-5 shadow-sm sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--blue)] text-sm font-extrabold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--orange)]">
                        Step {index + 1}
                      </p>
                      <h3 className="mt-1 text-base font-extrabold leading-6">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="flowchart-heading">
            <SectionHeading
              eyebrow="Keep the order visible"
              id="flowchart-heading"
              title="General Reinforced Concrete Design Flow"
            />
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm sm:p-7">
              <div className="mx-auto max-w-2xl">
                {flowSteps.map((step, index) => (
                  <div key={step}>
                    <div className="flex items-center gap-3 rounded-xl border-2 border-[var(--blue)] bg-[var(--blue)]/10 px-4 py-4 sm:px-6">
                      <span className="text-xs font-extrabold text-[var(--orange)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-extrabold sm:text-base">{step}</span>
                    </div>
                    {index < flowSteps.length - 1 && (
                      <div className="flex h-10 items-center justify-center text-2xl font-bold leading-none text-[var(--orange)]">
                        &darr;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section aria-labelledby="checks-heading">
            <SectionHeading
              eyebrow="Before the design is final"
              id="checks-heading"
              title="Important Checks Before Finalizing the Design"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {checks.map(([title, description, color]) => (
                <article
                  key={title}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
                  style={{ borderTopColor: color, borderTopWidth: "3px" }}
                >
                  <h3 className="text-sm font-extrabold">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="factors-heading">
            <SectionHeading
              eyebrow="Design beyond the equation"
              id="factors-heading"
              title="Factors Considered in Reinforced Concrete Design"
            />
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <FactorCard
                title="Strength & Serviceability"
                description="Provide enough strength for the applied loads and control deflection and cracking so the building remains safe and usable."
                reference="Dreamstime · Safety shield icon"
                referenceHref="https://www.dreamstime.com/illustration/safety-shield-icon.html"
                imageSrc="/design-process/strength-serviceability.png"
                imageAlt="Strength and serviceability building safety illustration"
              />
              <FactorCard
                title="Economic"
                description="Select practical member sizes and reinforcement that meet the design requirements while keeping construction economical."
                reference="Vecteezy · Economic blue gradient concept icon"
                referenceHref="https://www.vecteezy.com/vector-art/14026116-economic-blue-gradient-concept-icon-business-and-commerce-improvement-financial-segment-pestle-tool-abstract-idea-thin-line-illustration-isolated-outline-drawing"
                imageSrc="/design-process/economic.png"
                imageAlt="Economic design illustration"
              />
              <FactorCard
                title="Environmental"
                description="Minimize environmental impact by using materials efficiently and considering sustainability throughout the design."
                reference="fity.club"
                referenceHref="https://fity.club/lists/suggestions/protect-the-environment-logo/"
                imageSrc="/design-process/environmental.png"
                imageAlt="Environmental design illustration"
              />
            </div>
          </section>

          <aside className="rounded-2xl border border-[var(--blue)]/30 bg-[var(--blue)]/8 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--blue)]">
              Design References
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)] sm:text-base">
              The design process follows the applicable requirements of NSCP
              2015 and ACI 318. The exact equations and limits depend on the
              type of structural member and the design condition.
            </p>
          </aside>

          <nav
            aria-label="Course topic navigation"
            className="flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <Link
              href="/modules/introduction-to-rc-design/units-conversion"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-bold text-[var(--text-muted)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
            >
              &larr; Previous: Units Conversion
            </Link>
            <Link
              href="/modules/introduction-to-rc-design/factors-considered-in-reinforced-concrete-design"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-bold text-white hover:brightness-110"
            >
              Next: Factors Considered &rarr;
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

function FactorCard({
  title,
  description,
  reference,
  referenceHref,
  imageSrc,
  imageAlt,
}: {
  title: string;
  description: string;
  reference: string;
  referenceHref: string;
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
      <figure>
        <div className="flex h-44 items-center justify-center border-b border-[var(--border)] bg-[var(--bg)] px-5 py-4">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={190}
            height={140}
            className="h-full w-full max-w-[190px] object-contain"
          />
        </div>
        <figcaption className="px-5 pt-3 text-[10px] text-[var(--text-muted)]">
          Reference: {" "}
          <a
            href={referenceHref}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--blue)] underline-offset-2 hover:underline"
          >
            {reference}
          </a>
        </figcaption>
      </figure>
      <div className="p-5">
        <h3 className="text-base font-extrabold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
      </div>
    </article>
  );
}

function DesignProcessHeaderIllustration() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-5">
      <svg
        viewBox="0 0 600 230"
        role="img"
        aria-label="Design process flow from loads through checking"
        className="h-auto w-full"
      >
        <defs>
          <pattern id="process-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.45" />
          </pattern>
          <marker id="process-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="var(--orange)" />
          </marker>
        </defs>
        <rect width="560" height="230" rx="12" fill="url(#process-grid)" />
        <text x="24" y="28" fill="var(--text-muted)" fontSize="11" fontWeight="700" letterSpacing="1.5">DESIGN WORKFLOW</text>

        <ProcessBox x={24} title="Loads" detail="actions" member />
        <ProcessArrow x1={112} x2={134} />
        <ProcessBox x={140} title="Analysis" detail="forces" />
        <ProcessArrow x1={228} x2={250} />
        <ProcessBox x={256} title="Design" detail="capacity" />
        <ProcessArrow x1={344} x2={366} />
        <ProcessBox x={372} title="Reinforcement" detail="bars" rebars />
        <ProcessArrow x1={460} x2={482} />
        <ProcessBox x={488} title="Checking" detail="code" />

        <text x="300" y="188" textAnchor="middle" fill="var(--text)" fontSize="13" fontWeight="800">Loads &rarr; Analysis &rarr; Design &rarr; Reinforcement &rarr; Checking</text>
        <text x="300" y="210" textAnchor="middle" fill="var(--text-muted)" fontSize="10">An organized chain of decisions</text>
      </svg>
    </div>
  );
}

function ProcessBox({
  x,
  title,
  detail,
  member = false,
  rebars = false,
}: {
  x: number;
  title: string;
  detail: string;
  member?: boolean;
  rebars?: boolean;
}) {
  return (
    <g transform={`translate(${x} 65)`}>
      <rect width="84" height="82" rx="8" fill="var(--bg-surface)" stroke="var(--blue)" strokeWidth="2" />
      {member ? (
        <g transform="translate(25 10)">
          <rect x="0" y="22" width="34" height="9" fill="#c8ced8" stroke="var(--blue)" strokeWidth="1.5" />
          <rect x="4" y="31" width="7" height="18" fill="#c8ced8" stroke="var(--blue)" strokeWidth="1.5" />
          <rect x="23" y="31" width="7" height="18" fill="#c8ced8" stroke="var(--blue)" strokeWidth="1.5" />
        </g>
      ) : rebars ? (
        <g transform="translate(24 14)">
          <rect x="0" y="7" width="36" height="25" rx="2" fill="#c8ced8" stroke="var(--text)" strokeWidth="1.5" />
          <line x1="6" y1="14" x2="30" y2="14" stroke="var(--blue)" strokeWidth="2.5" />
          <line x1="6" y1="25" x2="30" y2="25" stroke="var(--blue)" strokeWidth="2.5" />
        </g>
      ) : (
        <circle cx="42" cy="31" r="15" fill="var(--blue)" fillOpacity="0.14" stroke="var(--blue)" strokeWidth="2" />
      )}
      <text x="42" y="63" textAnchor="middle" fill="var(--text)" fontSize="10" fontWeight="800">{title}</text>
      <text x="42" y="76" textAnchor="middle" fill="var(--text-muted)" fontSize="8">{detail}</text>
    </g>
  );
}

function ProcessArrow({ x1, x2 }: { x1: number; x2: number }) {
  return <line x1={x1} y1="106" x2={x2} y2="106" stroke="var(--orange)" strokeWidth="2.5" markerEnd="url(#process-arrow)" />;
}
