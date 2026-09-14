import test from "node:test";
import assert from "node:assert/strict";
import {
  catalogModules,
  getModuleTopicCount,
  getModuleTopicGroups,
  getTopicGroupForRoute,
  getTopicHomeModule,
  modules,
} from "../lib/modules.ts";

const expectedTitles = [
  "Fundamentals of Reinforced Concrete Design",
  "Moment-Curvature Behavior",
  "Flexural Analysis of Rectangular Beams",
  "Flexural Design of Beams and One-Way Slabs",
  "Analysis and Design of Flanged Beams",
  "Serviceability Requirements",
  "Analysis and Design of Reinforced Concrete Columns",
  "Shear and Reinforcement Design",
];

test("the catalogue uses the requested eight modules in order", () => {
  assert.deepEqual(catalogModules.map((module_) => module_.title), expectedTitles);
  assert.strictEqual(modules, catalogModules);
});

test("grouped lessons preserve every topic route and expose one page per group", () => {
  const sourceRoutes = catalogModules.flatMap((module_) =>
    module_.topics.map((topic) => `/modules/${module_.slug}/${topic.slug}`),
  );
  const sourceTopicSlugs = new Set(
    catalogModules.flatMap((module_) => module_.topics.map((topic) => topic.slug)),
  );
  const groupedLinks = catalogModules.flatMap((module_) =>
    getModuleTopicGroups(module_).flatMap((group) => group.topics),
  );
  const groupedLessons = catalogModules.flatMap((module_) =>
    getModuleTopicGroups(module_),
  );
  const routeSet = new Set(sourceRoutes);

  assert.equal(sourceRoutes.length, 103);
  assert.equal(routeSet.size, 103);
  assert.equal(sourceTopicSlugs.size, 96);
  assert.equal(groupedLinks.length, 96);
  assert.equal(groupedLessons.length, 41);
  assert.equal(
    new Set(groupedLessons.map((group) => group.topics[0]?.href)).size,
    groupedLessons.length,
    "Each merged group has one distinct canonical page",
  );
  assert.deepEqual(
    new Set(groupedLinks.map(({ topic }) => topic.slug)),
    sourceTopicSlugs,
  );
  const foundations = catalogModules.find(
    (module_) => module_.slug === "introduction-to-rc-design",
  );
  assert.deepEqual(
    getModuleTopicGroups(foundations)[0].topics.map(({ topic }) => topic.slug),
    ["course-details", "units-conversion", "design-process"],
  );
  assert.equal(
    getModuleTopicGroups(foundations)[0].topics[0].topic.title,
    "Course Introduction, Units, and Design Process",
  );
  for (const topicSlug of ["course-details", "units-conversion", "design-process"]) {
    assert.equal(
      getTopicGroupForRoute("introduction-to-rc-design", topicSlug)?.canonicalHref,
      "/modules/introduction-to-rc-design/course-details",
    );
  }
  for (const link of groupedLinks) {
    assert.ok(routeSet.has(link.href), `Missing topic route: ${link.href}`);
  }
  for (const module_ of catalogModules) {
    for (const topic of module_.topics) {
      const groupHome = getTopicGroupForRoute(module_.slug, topic.slug);
      assert.ok(groupHome, `Topic has no merged page: ${module_.slug}/${topic.slug}`);
      assert.ok(
        routeSet.has(groupHome.canonicalHref),
        `Missing canonical route: ${groupHome.canonicalHref}`,
      );
    }
  }
  for (const module_ of catalogModules) {
    assert.equal(
      getModuleTopicCount(module_),
      getModuleTopicGroups(module_).length,
    );
  }
});

test("duplicate topic routes return to their single primary module", () => {
  const cases = [
    ["srrc-beam-capacity-and-design", "design-of-singly-reinforced-rc-beams", "flexural-design-of-beams-slabs"],
    ["flexural-design-of-beams-slabs", "steel-ratio", "srrc-beam-capacity-and-design"],
    ["serviceability-requirements", "cracking-moment", "moment-curvature-behavior"],
    ["flexural-design-of-beams-slabs", "doubly-reinforced-beams", "srrc-beam-capacity-and-design"],
  ];

  for (const [routeModuleSlug, topicSlug, expectedHomeSlug] of cases) {
    assert.equal(
      getTopicHomeModule(routeModuleSlug, topicSlug)?.slug,
      expectedHomeSlug,
    );
  }
});
