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
    title: "Moment–Curvature Relationship",
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