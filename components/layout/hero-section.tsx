import Link from "next/link";
import { BookOpen, Calculator } from "lucide-react";

import { stats } from "@/lib/data";
import { StatPill } from "@/components/shared/stat-pill";

export function HeroSection() {
  return (
    <section
      className="
        relative min-h-[400px] overflow-hidden
        border-b border-transparent
        bg-transparent
      "
    >
      <div
        className="
          relative mx-auto flex min-h-[400px] w-full max-w-6xl
          flex-col items-center justify-center
          px-4 pb-10 pt-14 text-center
          sm:px-6 sm:pt-16 lg:px-8
        "
      >
        {/* Main heading */}
        <h1
          className="
            text-[40px] font-extrabold leading-[1.04]
            tracking-[-0.04em] text-[var(--hero-title)]
            sm:text-[52px]
            md:text-[64px]
          "
        >
          Reinforced{" "}
          <span className="text-[var(--yellow)]">
            Concrete
          </span>
          <br />
          Design
        </h1>

        {/* Description */}
        <p
          className="
            mx-auto mt-4 max-w-[470px]
            text-[14px] leading-[1.75]
            text-[var(--hero-description)]
            sm:text-[15px]
            md:text-base
          "
        >
          Interactive calculators and structured learning modules for{" "}
          <strong className="font-semibold text-[var(--hero-title)]">
            Reinforced Concrete Design
          </strong>
          . Study theory, then solve problems with professional engineering
          tools.
        </p>

        {/* Only NSCP · ACI 318 */}
        <div className="mt-6 flex items-center justify-center">
          {stats.map((stat) => (
            <StatPill key={stat.label} {...stat} />
          ))}
        </div>

        {/* Main buttons */}
        <div className="mt-8 flex w-full flex-wrap items-center justify-center gap-3">
          <Link
            href="/modules"
            className="
              inline-flex min-h-12 items-center justify-center gap-2
              rounded-md bg-[var(--yellow)] px-5
              text-sm font-semibold text-[#171200]
              shadow-sm
              hover:brightness-105
              active:scale-[0.98]
            sm:text-base
            "
          >
            <BookOpen className="h-3.5 w-3.5" />
            Start Learning
          </Link>

          <Link
            href="/calculators"
            className="
              inline-flex min-h-12 items-center justify-center gap-2
              rounded-md border border-[var(--border)]
              bg-[var(--bg-surface)] px-5
              text-sm font-semibold text-[var(--text)]
              hover:border-[var(--yellow)]
              hover:text-[var(--yellow)]
              active:scale-[0.98]
            sm:text-base
            "
          >
            <Calculator className="h-3.5 w-3.5" />
            Open Calculators
          </Link>
        </div>
      </div>
    </section>
  );
}
