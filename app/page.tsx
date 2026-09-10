import { HeroSection } from "@/components/layout/hero-section";
import { ModulesList } from "@/components/modules/modules-list";
import { CalculatorsList } from "@/components/calculators/catalog/calculators-list";

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 55% at 0% 4%, var(--home-glow-blue), transparent 72%),
            radial-gradient(ellipse 68% 58% at 100% 28%, var(--home-glow-yellow), transparent 76%),
            linear-gradient(var(--home-grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--home-grid) 1px, transparent 1px)
          `,
          backgroundSize: "auto, auto, 46px 46px, 46px 46px",
          backgroundPosition: "center, center, center top, center top",
          maskImage: "linear-gradient(to bottom, black 0%, black 56%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 56%, transparent 100%)",
        }}
      />

      <div className="relative z-10">
        <HeroSection />

        <div className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <ModulesList />
            <CalculatorsList />
          </div>
        </div>
      </div>
    </main>
  );
}
