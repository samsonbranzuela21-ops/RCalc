import { notFound } from "next/navigation";
import { ModuleOverviewPage } from "@/components/modules/ModuleOverviewPage";
import { catalogModules } from "@/lib/modules";

export default function Module1Page() {
  const module_ = catalogModules.find((item) => item.slug === "introduction-to-rc-design");

  if (!module_) {
    notFound();
  }

  return <ModuleOverviewPage module_={module_} />;
}
