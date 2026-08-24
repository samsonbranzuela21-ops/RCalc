import { stats } from "@/lib/data";
import { StatPill } from "./stat-pill";

export function HeroSection() {
  return (
    <section className="px-5 pb-8 pt-14 text-center">
      <h1 className="text-[32px] font-extrabold leading-[1.2]">
        <span className="text-[#4d7cff]">Reinforced</span>{" "}
        <span className="text-[#f5941f]">Concrete</span>
        <br />
        Design
      </h1>

      <p className="mx-auto mt-3 max-w-[440px] text-[12px] leading-relaxed text-[var(--text-muted)]">
        Interactive calculators and structured learning modules for{" "}
        <b className="text-[var(--text)]">Reinforced Concrete Design</b>. Study
        theory, then solve problems with professional engineering tools.
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {stats.map((s) => (
          <StatPill key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-5 flex justify-center">
        <a href="/references" className="flex items-center gap-1.5 rounded-md bg-[#f5941f] px-4 py-2 text-[12px] font-semibold text-[#1a1300]">
          NSCP 2015 / ACI 318
        </a>
      </div>
    </section>
  );
}