import Link from "next/link";
import { BookOpen, Calculator } from "lucide-react";

import { stats } from "@/lib/data";
import { StatPill } from "@/components/stat-pill";

export function HeroSection() {
  return (
    <section
      className="
        relative min-h-[308px] overflow-hidden
        border-b border-[var(--border)]
        bg-[var(--hero-bg)]
      "
      style={{
        backgroundImage: `
          linear-gradient(
            var(--hero-grid) 1px,
            transparent 1px
          ),
          linear-gradient(
            90deg,
            var(--hero-grid) 1px,
            transparent 1px
          )
        `,
        backgroundSize: "32px 32px",
        backgroundPosition: "center top",
      }}
    >
      <div
        className="
          relative mx-auto flex min-h-[308px] w-full max-w-[860px]
          flex-col items-center justify-center
          px-4 pb-8 pt-10 text-center
          sm:px-5 sm:pt-12
        "
      >
        {/* Main heading */}
        <h1
          className="
            text-[34px] font-extrabold leading-[1.03]
            tracking-[-0.04em] text-[var(--hero-title)]
            sm:text-[42px]
            md:text-[48px]
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
            text-[10px] leading-[1.7]
            text-[var(--hero-description)]
            sm:text-[11px]
            md:text-[12px]
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
        <div className="mt-5 flex items-center justify-center">
          {stats.map((stat) => (
            <StatPill key={stat.label} {...stat} />
          ))}
        </div>

        {/* Main buttons */}
        <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-2">
          <Link
            href="/modules"
            className="
              inline-flex min-h-9 items-center justify-center gap-2
              rounded-md bg-[var(--yellow)] px-4
              text-[10px] font-semibold text-[#171200]
              shadow-sm
              hover:brightness-105
              active:scale-[0.98]
              sm:text-[11px]
            "
          >
            <BookOpen className="h-3.5 w-3.5" />
            Start Learning
          </Link>

          <Link
            href="/calculators"
            className="
              inline-flex min-h-9 items-center justify-center gap-2
              rounded-md border border-[var(--border)]
              bg-[var(--bg-surface)] px-4
              text-[10px] font-semibold text-[var(--text)]
              hover:border-[var(--yellow)]
              hover:text-[var(--yellow)]
              active:scale-[0.98]
              sm:text-[11px]
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