export interface Topic {
  slug: string;
  title: string;
}

export interface TopicReference {
  moduleSlug: string;
  topicSlug: string;
}

export type TopicGroupReference = string | TopicReference;

export interface TopicGroup {
  title: string;
  topics: TopicGroupReference[];
}

interface ModuleData {
  index: number;
  slug: string;
  title: string;
  description: string;
  topics: Topic[];
  progress: number | null;
}

export interface ModuleItem extends ModuleData {
  topicGroups: TopicGroup[];
}

const sourceModules: ModuleData[] = [
  {
    index: 1,
    slug: "introduction-to-rc-design",
    title: "Fundamentals of Reinforced Concrete Design",
    description:
      "Build a foundation in units, materials, reinforced-concrete behavior, and design codes.",
    topics: [
      {
        slug: "course-details",
        title: "Course Introduction, Units, and Design Process",
      },
      { slug: "units-conversion", title: "Units Conversion" },
      { slug: "design-process", title: "Design Process" },
      {
        slug: "factors-considered-in-reinforced-concrete-design",
        title: "Factors Considered in Reinforced Concrete Design",
      },
      { slug: "concrete", title: "Concrete" },
      { slug: "concrete-properties", title: "Properties of Concrete" },
      { slug: "concrete-models", title: "Concrete Models" },
      { slug: "reinforcing-steel", title: "Reinforcing Steel" },
      {
        slug: "reinforcing-steel-properties",
        title: "Properties of Reinforcing Steel",
      },
      { slug: "reinforcing-steel-models", title: "Reinforcing Steel Models" },
      { slug: "reinforced-concrete", title: "Reinforced Concrete" },
      {
        slug: "reinforced-concrete-structures",
        title: "Reinforced Concrete Structures",
      },
      { slug: "design-codes", title: "Design Codes (NSCP / ACI 318)" },
    ],
    progress: 100,
  },
  {
    index: 2,
    slug: "moment-curvature-behavior",
    title: "Moment-Curvature Behavior",
    description:
      "Follow reinforced-concrete response from the uncracked section through cracking, yielding, and crushing.",
    topics: [
      { slug: "moment-curvature-relationship", title: "Moment-curvature relationship" },
      { slug: "cracking-moment", title: "Cracking moment" },
      { slug: "cracking-of-plain-concrete", title: "Cracking of plain concrete" },
      {
        slug: "stage-1-2-uncracked-section",
        title: "Stage 1 - just before cracking",
      },
      { slug: "stage-2-just-after-cracking", title: "Stage 2 - just after cracking" },
      { slug: "stage-3-service-loads", title: "Stage 3 - service loads" },
      {
        slug: "stage-4-reinforcing-steel-yields",
        title: "Stage 4 - reinforcing steel yields",
      },
      { slug: "stage-5-concrete-crushes", title: "Stage 5 - concrete crushes" },
      {
        slug: "stage-5-based-on-nscp-2015",
        title: "Stage 5 - based on NSCP 2015",
      },
      { slug: "moment-curvature-practice", title: "Moment-curvature practice problems" },
      {
        slug: "moment-curvature-numerical-analysis",
        title: "Moment-curvature numerical analysis",
      },
    ],
    progress: 85,
  },
  {
    index: 3,
    slug: "srrc-beam-capacity-and-design",
    title: "Flexural Analysis of Rectangular Beams",
    description:
      "Study rectangular-beam strain, stress, reinforcement behavior, and moment capacity.",
    topics: [
      { slug: "nominal-moment-of-srrc-beams", title: "Nominal moment of SRRC beams" },
      { slug: "nominal-moment-calculation", title: "Nominal moment calculation" },
      {
        slug: "ultimate-moment-capacity-of-srrc-beams",
        title: "Ultimate moment capacity of SRRC beams",
      },
      { slug: "strength-reduction-factors", title: "Strength-reduction factors" },
      { slug: "factored-moment", title: "Factored moment" },
      { slug: "dead-load", title: "Dead load" },
      { slug: "live-load", title: "Live load" },
      { slug: "wind-load", title: "Wind load" },
      { slug: "earthquake-load", title: "Earthquake load" },
      { slug: "design-of-singly-reinforced-rc-beams", title: "Design of singly reinforced RC beams" },
      { slug: "concrete-cover", title: "Concrete cover" },
      { slug: "minimum-beam-depth", title: "Minimum beam depth" },
      { slug: "minimum-reinforcement-spacing", title: "Minimum reinforcement spacing" },
      { slug: "skin-reinforcement-in-deep-beams", title: "Skin reinforcement in deep beams" },
      { slug: "steel-ratio", title: "Steel ratio" },
      { slug: "minimum-steel-ratio", title: "Minimum steel ratio" },
    ],
    progress: 60,
  },
  {
    index: 4,
    slug: "flexural-design-of-beams-slabs",
    title: "Flexural Design of Beams and One-Way Slabs",
    description:
      "Design rectangular beams and one-way slabs for flexure, reinforcement, and spacing.",
    topics: [
      {
        slug: "design-of-singly-reinforced-rc-beams",
        title: "Design of singly reinforced RC beams",
      },
      { slug: "minimum-beam-depth", title: "Minimum beam depth" },
      { slug: "minimum-reinforcement-spacing", title: "Minimum reinforcement spacing" },
      {
        slug: "minimum-reinforcement-spacing-layered-rebars",
        title: "Minimum reinforcement spacing for layered rebars",
      },
      { slug: "skin-reinforcement-in-deep-beams", title: "Skin reinforcement in deep beams" },
      { slug: "steel-ratio", title: "Steel ratio" },
      { slug: "minimum-steel-ratio", title: "Minimum steel ratio" },
      { slug: "code-requirements-beam-design", title: "Code requirements for beam design" },
      { slug: "minimum-tension-steel", title: "Minimum tension steel" },
      {
        slug: "ultimate-moment-capacity-of-doubly-reinforced-rc-beams",
        title: "Ultimate moment capacity of doubly reinforced RC beams",
      },
      { slug: "doubly-reinforced-beams", title: "Doubly-reinforced beams" },
      {
        slug: "design-of-doubly-reinforced-rectangular-beams",
        title: "Design of doubly reinforced rectangular beams",
      },
      {
        slug: "compression-and-tension-reinforcements",
        title: "Compression and tension reinforcements",
      },
      { slug: "closed-stirrups", title: "Closed stirrups" },
      { slug: "approximate-moment", title: "Approximate moments using NSCP 2015" },
      { slug: "design-of-one-way-rc-slab", title: "Design of one-way RC slab" },
      {
        slug: "minimum-shrinkage-temperature-reinforcement",
        title: "Minimum shrinkage and temperature reinforcement",
      },
    ],
    progress: 30,
  },
  {
    index: 5,
    slug: "t-beam-analysis-and-design",
    title: "Analysis and Design of Flanged Beams",
    description:
      "Analyze and design T-beams using the flange and reinforcement lessons in this module.",
    topics: [
      {
        slug: "analysis-and-design-of-rc-t-beams",
        title: "Analysis and design of RC T-beams",
      },
      { slug: "effective-flange-width", title: "Effective flange width" },
      { slug: "isolated-t-beam-geometry-limits", title: "Isolated T-beam geometry limits" },
      {
        slug: "moment-capacity-of-srtb",
        title: "Moment capacity of singly reinforced T-beams (SRTB)",
      },
      { slug: "design-of-srtb", title: "Design of singly reinforced T-beams" },
      { slug: "code-requirements-for-t-beams", title: "Code requirements for T-beams" },
      {
        slug: "moment-capacity-of-drtb",
        title: "Moment capacity of doubly reinforced T-beams (DRTB)",
      },
      { slug: "design-of-drtb", title: "Design of doubly reinforced T-beams" },
    ],
    progress: 0,
  },
  {
    index: 6,
    slug: "serviceability-requirements",
    title: "Serviceability Requirements",
    description:
      "Check minimum thickness, cracking, immediate and long-term deflection, and service limits.",
    topics: [
      { slug: "serviceability-requirements-overview", title: "Serviceability requirements" },
      { slug: "why-limit-deflections", title: "Why limit deflections of RC beams?" },
      { slug: "minimum-thickness", title: "Minimum thickness" },
      { slug: "effective-moment-of-inertia", title: "Effective moment of inertia" },
      { slug: "maximum-permissible-deflection", title: "Maximum permissible deflection" },
      { slug: "examples-of-deflection-equations", title: "Examples of deflection equations" },
      { slug: "modulus-of-elasticity", title: "Modulus of elasticity" },
      { slug: "modulus-of-rupture", title: "Modulus of rupture" },
      { slug: "cracking-moment", title: "Cracking moment" },
      { slug: "long-term-deflection", title: "Long-term deflection" },
      { slug: "deflection-control", title: "Deflection control" },
      { slug: "crack-control", title: "Crack control" },
    ],
    progress: null,
  },
  {
    index: 7,
    slug: "column-design",
    title: "Analysis and Design of Reinforced Concrete Columns",
    description:
      "Understand column behavior, slenderness, axial-flexural strength, and longitudinal reinforcement.",
    topics: [
      { slug: "reinforced-concrete-column", title: "Reinforced concrete columns" },
      { slug: "types-of-rc-columns", title: "Types of RC columns" },
      { slug: "short-vs-long-columns", title: "Short vs. long columns" },
      { slug: "single-vs-double-curvature-bending", title: "Single vs. double curvature bending" },
      { slug: "radius-of-gyration", title: "Radius of gyration" },
      { slug: "effective-length-factor", title: "Effective length factor" },
      { slug: "effective-length-factor-alignment-chart", title: "Effective length factor using the alignment chart" },
      { slug: "additional-slenderness", title: "Additional slenderness" },
      { slug: "analysis-of-short-columns-p-m-interaction", title: "Analysis of short columns - P-M interaction" },
      { slug: "interaction-diagram", title: "Interaction diagram" },
      { slug: "p-m-interaction-diagram", title: "P-M interaction diagram" },
      { slug: "plane-of-symmetry", title: "Plane of symmetry" },
      { slug: "longitudinal-reinforcement-requirements", title: "Longitudinal reinforcement requirements" },
      { slug: "analysis-of-slender-columns-non-sway-columns", title: "Analysis of slender columns - non-sway columns" },
      { slug: "slenderness-effects", title: "Slenderness effects" },
      { slug: "critical-buckling-load", title: "Critical buckling load" },
      { slug: "effective-flexural-rigidity", title: "Effective flexural rigidity" },
      { slug: "minimum-factored-moment", title: "Minimum factored moment" },
    ],
    progress: null,
  },
  {
    index: 8,
    slug: "shear-design-of-columns",
    title: "Shear and Reinforcement Design",
    description:
      "Check beam and column shear strength, reinforcement, and spacing requirements.",
    topics: [
      { slug: "shear-analysis-and-design-of-beams", title: "Shear analysis and design of beams" },
      { slug: "location-of-factored-shear", title: "Location of factored shear" },
      { slug: "minimum-transverse-reinforcement-area-beams", title: "Minimum transverse reinforcement area" },
      { slug: "maximum-spacing-shear-reinforcement-beams", title: "Maximum spacing of shear reinforcement" },
      { slug: "shear-analysis-and-design-of-columns", title: "Shear analysis and design of columns" },
      { slug: "minimum-transverse-reinforcement-area-columns", title: "Minimum transverse reinforcement area for columns" },
      { slug: "minimum-spiral-reinforcement-ratio", title: "Minimum spiral reinforcement ratio" },
      { slug: "maximum-spacing-shear-reinforcement-columns", title: "Maximum spacing of shear reinforcement for columns" },
    ],
    progress: null,
  },
];

const topicGroupsByModule: Record<string, TopicGroup[]> = {
  "introduction-to-rc-design": [
    {
      title: "Course introduction, units, and design process",
      topics: ["course-details", "units-conversion", "design-process"],
    },
    {
      title: "Design factors, reinforced concrete structures, and design codes",
      topics: [
        "factors-considered-in-reinforced-concrete-design",
        "reinforced-concrete-structures",
        "design-codes",
      ],
    },
    {
      title: "Concrete properties and stress-strain models",
      topics: ["concrete", "concrete-properties", "concrete-models"],
    },
    {
      title: "Reinforcing steel properties and stress-strain models",
      topics: [
        "reinforcing-steel",
        "reinforcing-steel-properties",
        "reinforcing-steel-models",
      ],
    },
    {
      title: "Basic behavior of reinforced concrete",
      topics: ["reinforced-concrete"],
    },
  ],
  "moment-curvature-behavior": [
    {
      title: "Moment-curvature relationship and member stiffness",
      topics: [
        "moment-curvature-relationship",
        "moment-curvature-practice",
        "moment-curvature-numerical-analysis",
      ],
    },
    {
      title: "Cracking, steel yielding, and concrete crushing",
      topics: [
        "cracking-moment",
        "cracking-of-plain-concrete",
        "stage-1-2-uncracked-section",
        "stage-2-just-after-cracking",
        "stage-4-reinforcing-steel-yields",
        "stage-5-concrete-crushes",
        "stage-5-based-on-nscp-2015",
      ],
    },
    {
      title: "Service stages and interpretation of moment-curvature diagrams",
      topics: ["stage-3-service-loads"],
    },
  ],
  "srrc-beam-capacity-and-design": [
    {
      title: "Singly and doubly reinforced rectangular beam behavior",
      topics: [
        "nominal-moment-of-srrc-beams",
        { moduleSlug: "flexural-design-of-beams-slabs", topicSlug: "doubly-reinforced-beams" },
      ],
    },
    {
      title: "Beam section properties, strain distribution, and stress distribution",
      topics: ["nominal-moment-calculation"],
    },
    {
      title: "Neutral axis and equivalent compression stress block",
      topics: ["ultimate-moment-capacity-of-srrc-beams"],
    },
    {
      title: "Tension and compression reinforcement behavior",
      topics: [
        {
          moduleSlug: "flexural-design-of-beams-slabs",
          topicSlug: "compression-and-tension-reinforcements",
        },
      ],
    },
    {
      title: "Steel yielding and non-yielding conditions",
      topics: [
        {
          moduleSlug: "flexural-design-of-beams-slabs",
          topicSlug: "ultimate-moment-capacity-of-doubly-reinforced-rc-beams",
        },
      ],
    },
    {
      title: "Nominal moment capacity and strength-reduction factor",
      topics: [
        "strength-reduction-factors",
        "factored-moment",
        "dead-load",
        "live-load",
        "wind-load",
        "earthquake-load",
      ],
    },
    {
      title: "Reinforcement ratio and beam adequacy checking",
      topics: ["steel-ratio", "minimum-steel-ratio"],
    },
  ],
  "flexural-design-of-beams-slabs": [
    {
      title: "Singly and doubly reinforced beam design",
      topics: [
        "design-of-singly-reinforced-rc-beams",
        "code-requirements-beam-design",
        "design-of-doubly-reinforced-rectangular-beams",
      ],
    },
    {
      title: "Effective depth and required reinforcement area",
      topics: ["minimum-beam-depth", "minimum-tension-steel"],
    },
    {
      title: "Bar selection, arrangement, and spacing",
      topics: [
        "minimum-reinforcement-spacing",
        "minimum-reinforcement-spacing-layered-rebars",
        "skin-reinforcement-in-deep-beams",
        "closed-stirrups",
        { moduleSlug: "srrc-beam-capacity-and-design", topicSlug: "concrete-cover" },
      ],
    },
    {
      title: "Positive and negative moment design",
      topics: ["approximate-moment"],
    },
    {
      title: "One-way slab classification and thickness; main flexural reinforcement",
      topics: ["design-of-one-way-rc-slab"],
    },
    {
      title: "Shrinkage-temperature reinforcement and spacing checks",
      topics: ["minimum-shrinkage-temperature-reinforcement"],
    },
  ],
  "t-beam-analysis-and-design": [
    {
      title: "T-beam behavior",
      topics: ["analysis-and-design-of-rc-t-beams"],
    },
    {
      title: "Flange dimensions and effective flange width",
      topics: ["effective-flange-width", "isolated-t-beam-geometry-limits"],
    },
    {
      title: "Compression-block location, flexural analysis, and compression-steel behavior",
      topics: ["moment-capacity-of-srtb", "moment-capacity-of-drtb"],
    },
    {
      title: "T-beam reinforcement design",
      topics: ["design-of-srtb", "design-of-drtb"],
    },
    {
      title: "Reinforcement arrangement and spacing checks",
      topics: ["code-requirements-for-t-beams"],
    },
  ],
  "serviceability-requirements": [
    {
      title: "Minimum thickness and service-load requirements",
      topics: ["serviceability-requirements-overview", "why-limit-deflections", "minimum-thickness"],
    },
    {
      title: "Immediate and long-term deflection",
      topics: ["examples-of-deflection-equations", "long-term-deflection", "deflection-control"],
    },
    {
      title: "Effective moment of inertia and cracking effects",
      topics: ["effective-moment-of-inertia", "modulus-of-elasticity", "modulus-of-rupture"],
    },
    {
      title: "Crack control and deflection-limit checks",
      topics: ["maximum-permissible-deflection", "crack-control"],
    },
  ],
  "column-design": [
    {
      title: "Column types, axial loading, and failure behavior",
      topics: ["reinforced-concrete-column"],
    },
    {
      title: "Tied and spiral column behavior",
      topics: ["types-of-rc-columns"],
    },
    {
      title: "Short-column and slenderness effects",
      topics: [
        "short-vs-long-columns",
        "single-vs-double-curvature-bending",
        "radius-of-gyration",
        "effective-length-factor",
        "effective-length-factor-alignment-chart",
        "additional-slenderness",
        "analysis-of-slender-columns-non-sway-columns",
        "slenderness-effects",
        "critical-buckling-load",
        "effective-flexural-rigidity",
        "minimum-factored-moment",
      ],
    },
    {
      title: "Axial load and bending moment",
      topics: ["analysis-of-short-columns-p-m-interaction"],
    },
    {
      title: "Column P-M interaction and capacity checking",
      topics: ["interaction-diagram", "p-m-interaction-diagram", "plane-of-symmetry"],
    },
    {
      title: "Longitudinal reinforcement requirements",
      topics: ["longitudinal-reinforcement-requirements"],
    },
  ],
  "shear-design-of-columns": [
    {
      title: "Shear behavior, stresses, and cracking",
      topics: ["shear-analysis-and-design-of-beams", "location-of-factored-shear"],
    },
    {
      title: "Concrete shear strength",
      topics: ["shear-analysis-and-design-of-columns"],
    },
    {
      title: "Web reinforcement and stirrup design",
      topics: ["minimum-transverse-reinforcement-area-beams"],
    },
    {
      title: "Required shear reinforcement and spacing",
      topics: ["maximum-spacing-shear-reinforcement-beams"],
    },
    {
      title: "Maximum spacing and reinforcement checks",
      topics: [
        "minimum-transverse-reinforcement-area-columns",
        "minimum-spiral-reinforcement-ratio",
        "maximum-spacing-shear-reinforcement-columns",
      ],
    },
  ],
};

export const catalogModules: ModuleItem[] = sourceModules.map((module_) => {
  const topicGroups = topicGroupsByModule[module_.slug];
  if (!topicGroups) {
    throw new Error(`Missing topic groups for module ${module_.slug}`);
  }
  return { ...module_, topicGroups };
});

export interface ResolvedTopicReference {
  routeModule: ModuleItem;
  topic: Topic;
  href: string;
}

export interface ResolvedTopicGroup {
  title: string;
  topics: ResolvedTopicReference[];
}

function getTopicReference(reference: TopicGroupReference, owner: ModuleItem) {
  return typeof reference === "string"
    ? { moduleSlug: owner.slug, topicSlug: reference }
    : reference;
}

export function getModuleTopicGroups(module_: ModuleItem): ResolvedTopicGroup[] {
  return module_.topicGroups.map((group) => ({
    title: group.title,
    topics: group.topics.flatMap((reference) => {
      const route = getTopicReference(reference, module_);
      const routeModule = catalogModules.find((item) => item.slug === route.moduleSlug);
      const topic = routeModule?.topics.find((item) => item.slug === route.topicSlug);
      return routeModule && topic
        ? [{
            routeModule,
            topic,
            href: `/modules/${routeModule.slug}/${topic.slug}`,
          }]
        : [];
    }),
  }));
}

export function getModuleTopicCount(module_: ModuleItem): number {
  return getModuleTopicGroups(module_).length;
}

export function getTopicGroupForRoute(routeModuleSlug: string, topicSlug: string) {
  const candidates = catalogModules.flatMap((module_) =>
    getModuleTopicGroups(module_).map((group) => ({ module: module_, group })),
  );
  const exactMatch = candidates.find(({ group }) =>
    group.topics.some(
      ({ routeModule, topic }) =>
        routeModule.slug === routeModuleSlug && topic.slug === topicSlug,
    ),
  );
  const topicMatch =
    exactMatch ??
    candidates.find(({ group }) =>
      group.topics.some(({ topic }) => topic.slug === topicSlug),
    );
  const canonicalTopic = topicMatch?.group.topics[0];

  if (topicMatch && canonicalTopic) {
    return {
      module: topicMatch.module,
      group: topicMatch.group,
      canonicalHref: canonicalTopic.href,
    };
  }

  return undefined;
}

export function getTopicHomeModule(
  routeModuleSlug: string,
  topicSlug: string,
): ModuleItem | undefined {
  const exactHome = catalogModules.find((module_) =>
    module_.topicGroups.some((group) =>
      group.topics.some((reference) => {
        const route = getTopicReference(reference, module_);
        return route.moduleSlug === routeModuleSlug && route.topicSlug === topicSlug;
      }),
    ),
  );
  if (exactHome) {
    return exactHome;
  }

  const topicHome = catalogModules.find((module_) =>
    module_.topicGroups.some((group) =>
      group.topics.some((reference) => getTopicReference(reference, module_).topicSlug === topicSlug),
    ),
  );
  return topicHome ?? catalogModules.find((module_) => module_.slug === routeModuleSlug);
}

// Keep a single module list while retaining the previous public export.
export const modules: ModuleItem[] = catalogModules;
