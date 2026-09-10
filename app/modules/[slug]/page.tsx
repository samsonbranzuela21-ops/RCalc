import { notFound } from "next/navigation";
import { ModuleOverviewPage } from "@/components/modules/ModuleOverviewPage";
import { catalogModules } from "@/lib/modules";

const MODULE1_SLUG = "introduction-to-rc-design";

export function generateStaticParams() {
  return catalogModules
    .filter((module_) => module_.slug !== MODULE1_SLUG)
    .map((module_) => ({ slug: module_.slug }));
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const module_ = catalogModules.find((item) => item.slug === slug);

  if (!module_) {
    notFound();
  }

  if (module_.slug === MODULE1_SLUG) {
    notFound();
  }

  return <ModuleOverviewPage module_={module_} />;
}
