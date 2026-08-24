import { HeroSection } from "@/components/hero-section";
import { ModulesList } from "@/components/modules-list";
import { CalculatorsList } from "@/components/calculators-list";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <HeroSection />

      <div className="mx-auto flex max-w-[860px] flex-col items-start gap-4 px-5 pb-16 md:flex-row">
        <ModulesList />
        <CalculatorsList />
      </div>
    </main>
  );
}