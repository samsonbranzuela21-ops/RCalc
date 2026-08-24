import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { ModulesList } from "@/components/modules-list";
import { CalculatorsList } from "@/components/calculators-list";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader />
      <HeroSection />

      <div className="mx-auto flex max-w-[860px] items-start gap-4 px-5 pb-16 pt-8">
        <ModulesList />
        <CalculatorsList />
      </div>

      <SiteFooter />
    </div>
  );
}