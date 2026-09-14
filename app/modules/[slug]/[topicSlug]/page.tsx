import { notFound, permanentRedirect } from "next/navigation";

import { GroupedTopicPage } from "@/components/modules/GroupedTopicPage";
import { catalogModules, getTopicGroupForRoute } from "@/lib/modules";

const MODULE1_SLUG = "introduction-to-rc-design";

export function generateStaticParams() {
  return catalogModules
    .filter((module_) => module_.slug !== MODULE1_SLUG)
    .flatMap((module_) =>
      module_.topics.map((topic) => ({ slug: module_.slug, topicSlug: topic.slug })),
    );
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string; topicSlug: string }>;
}) {
  const { slug, topicSlug } = await params;
  const routeModule = catalogModules.find((module_) => module_.slug === slug);
  const topic = routeModule?.topics.find((item) => item.slug === topicSlug);

  if (!routeModule || !topic || routeModule.slug === MODULE1_SLUG) {
    notFound();
  }

  const topicGroup = getTopicGroupForRoute(routeModule.slug, topic.slug);
  if (!topicGroup) {
    notFound();
  }

  const currentHref = `/modules/${routeModule.slug}/${topic.slug}`;
  if (topicGroup.canonicalHref !== currentHref) {
    permanentRedirect(topicGroup.canonicalHref);
  }

  return <GroupedTopicPage module_={topicGroup.module} group={topicGroup.group} />;
}
