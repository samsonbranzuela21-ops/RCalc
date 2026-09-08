export interface Topic {
  slug: string;
  title: string;
}

export interface ModuleItem {
  index: number;
  slug: string;
  title: string;
  description: string;
  topics: Topic[];
  progress: number | null;
}

export const catalogModules: ModuleItem[] = [
  {
    index: 1,
    slug: "introduction-to-rc-design",
    title: "Principles of Reinforced Concrete",
    description:
      "Units, design process, concrete, reinforcing steel, reinforced concrete, and design codes",
    topics: [
      { slug: "course-details", title: "Course Details" },
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
    title: "Moment-Curvature Relationship",
    description:
      "Cracking, service stages, steel yielding, concrete crushing, and NSCP 2015 capacity",
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
    title: "Singly Reinforced Beam Capacity",
    description:
      "Nominal and ultimate moment, factored loads, and SRRC beam design using NSCP 2015",
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
    title: "Flexural Design of Beams and Slabs",
    description:
      "Singly and doubly reinforced beams, approximate moments, and one-way slabs",
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
    title: "Analysis and Design of T-Beams",
    description:
      "Effective flange width, moment capacity, and reinforcement of RC T-beams",
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
      "Minimum thickness, effective inertia, deflection, and crack control for RC beams",
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
    title: "Reinforced Concrete Columns",
    description:
      "Column types, slenderness, and P-M interaction for short and non-sway columns",
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
    title: "Shear Analysis and Design",
    description:
      "Shear reinforcement and spacing checks for reinforced concrete beams and columns",
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

// Keep the homepage's existing module list stable while the full catalog uses
// the eight source modules above.
export const modules: ModuleItem[] = [
  {
    index: 1,
    slug: "introduction-to-rc-design",
    title: "Introduction & Materials",
    description: "Foundational properties of concrete and reinforcing steel",
    topics: [
      { slug: "units-conversion", title: "Units Conversion" },
      { slug: "concrete", title: "Concrete Properties" },
      { slug: "reinforcing-steel", title: "Reinforcing Steel" },
      { slug: "reinforced-concrete", title: "Reinforced Concrete Basics" },
      { slug: "design-codes", title: "Design Codes (NSCP / ACI 318)" },
    ],
    progress: 100,
  },
  {
    index: 2,
    slug: "moment-curvature-behavior",
    title: "Moment-Curvature Relationship",
    description: "Behavioral stages from uncracked section to concrete crushing",
    topics: [
      { slug: "moment-curvature-relationship", title: "Moment–curvature relationship" },
      { slug: "stage-1-2-uncracked-section", title: "Stage 1 & 2 — uncracked section" },
      { slug: "stage-3-service-loads", title: "Stage 3 — service loads" },
      { slug: "stage-4-reinforcing-steel-yields", title: "Stage 4 — reinforcing steel yields" },
      { slug: "stage-5-concrete-crushes", title: "Stage 5 — concrete crushes" },
      { slug: "stage-5-based-on-nscp-2015", title: "Stage 5 — based on NSCP 2015" },
    ],
    progress: 85,
  },
  {
    index: 3,
    slug: "flexural-design-of-beams-slabs",
    title: "Beam Design",
    description: "Singly and doubly reinforced beams, one-way slabs",
    topics: [
      { slug: "design-of-singly-reinforced-rc-beams", title: "Design of singly reinforced RC beams" },
      { slug: "ultimate-moment-capacity-of-doubly-reinforced-rc-beams", title: "Ultimate moment capacity of doubly reinforced RC beams" },
      { slug: "design-of-doubly-reinforced-rectangular-beams", title: "Design of doubly-reinforced rectangular beams" },
      { slug: "approximate-moment", title: "Approximate moment" },
      { slug: "design-of-one-way-rc-slab", title: "Design of one-way RC slab" },
    ],
    progress: 60,
  },
  {
    index: 4,
    slug: "t-beam-analysis-and-design",
    title: "T-Beams",
    description: "Analysis and design of RC T-beams and flanged sections",
    topics: [
      { slug: "analysis-and-design-of-rc-t-beams", title: "Analysis and design of RC T-beams" },
    ],
    progress: 30,
  },
  {
    index: 5,
    slug: "serviceability-requirements",
    title: "Serviceability",
    description: "Deflection, crack width, and serviceability requirements",
    topics: [
      { slug: "serviceability-requirements-overview", title: "Serviceability requirements" },
    ],
    progress: 0,
  },
  {
    index: 6,
    slug: "column-design",
    title: "Column Design",
    description: "Short and slender columns, P-M interaction diagrams",
    topics: [
      { slug: "reinforced-concrete-column", title: "Reinforced concrete column" },
      { slug: "analysis-of-short-columns-p-m-interaction", title: "Analysis of short columns — P-M interaction" },
      { slug: "analysis-of-slender-columns-non-sway-columns", title: "Analysis of slender columns — non-sway columns" },
    ],
    progress: null,
  },
  {
    index: 7,
    slug: "shear-design-of-columns",
    title: "Shear in Columns",
    description: "Shear analysis and design of column sections",
    topics: [
      { slug: "shear-analysis-and-design-of-columns", title: "Shear analysis and design of columns" },
    ],
    progress: null,
  },
];
