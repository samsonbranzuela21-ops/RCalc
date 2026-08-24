import { CalculatorsList } from "@/components/calculators-list";

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto max-w-[560px]">
        <h1 className="text-[22px] font-extrabold">Calculators</h1>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
          Automated design calculators for reinforced concrete elements — NSCP 2015 / ACI 318.
        </p>

        <div className="mt-6">
          <CalculatorsList />
        </div>
      </div>
    </div>
  );
}