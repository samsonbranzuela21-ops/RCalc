import { HeroSection } from "@/components/hero-section";
import { ModulesList } from "@/components/modules-list";
import { CalculatorsList } from "@/components/calculators-list";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <HeroSection />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-6 px-4 pb-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <ModulesList />
        <CalculatorsList />
      </div>
    </main>
  );
}
