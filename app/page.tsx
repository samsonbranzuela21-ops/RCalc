
import { HeroSection } from "@/components/hero-section";
import { ModulesList } from "@/components/modules-list";
import { CalculatorsList } from "@/components/calculators-list";


export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <HeroSection />

      <div className="mx-auto flex max-w-[860px] items-start gap-4 px-5 pb-16 pt-8">
        <ModulesList />
        <CalculatorsList />
      </div>

    </div>
  );
}