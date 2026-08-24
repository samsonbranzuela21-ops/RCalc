import { ModulesList } from "@/components/modules-list";
import { BackButton } from "@/components/BackButton";

export default function ModulesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] px-5 py-10 text-[var(--text)]">
      <div className="mx-auto max-w-[560px]">
        <h1 className="text-[22px] font-extrabold">Modules</h1>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">
          Structured learning modules for reinforced concrete design — NSCP 2015 / ACI 318.
        </p>

        <div className="mt-6">
          <ModulesList />
        </div>
      </div>
    </div>
  );
}