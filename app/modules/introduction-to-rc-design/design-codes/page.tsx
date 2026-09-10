import { notFound } from "next/navigation";

import { Module1Lesson } from "@/components/module-1/lessons/Module1Lesson";
import { getModule1Topic } from "@/lib/module1";
import { catalogModules } from "@/lib/modules";

export default function DesignCodesPage() {
  const module_ = catalogModules.find((item) => item.slug === "introduction-to-rc-design");
  const topic = getModule1Topic("design-codes");

  if (!module_ || !topic) {
    notFound();
  }

  const topicIndex = module_.topics.findIndex((item) => item.slug === "design-codes");

  return (
    <Module1Lesson
      moduleSlug={module_.slug}
      moduleTitle={module_.title}
      topic={topic}
      topics={module_.topics}
      previousTopic={module_.topics[topicIndex - 1] ?? null}
      nextTopic={module_.topics[topicIndex + 1] ?? null}
    />
  );
}
