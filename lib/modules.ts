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
    title: "Introduction to RC Design",
    description: "Fundamentals of reinforced concrete behavior and design philosophy",
    topics: [
      { slug: "units-conversion", title: "Units conversion" },
      { slug: "concrete", title: "Concrete" },
      { slug: "reinforcing-steel", title: "Reinforcing steel" },
      { slug: "reinforced-concrete", title: "Reinforced concrete" },
      { slug: "design-codes", title: "Design codes" },
    ],
    progress: 100,
  },
  {
    index: 2,
    slug: "moment-curvature-behavior",
    title: "Moment–Curvature Behavior",
    description: "Section behavior from uncracked to ultimate stage per NSCP 2015",
    topics: [
      { slug: "moment-curvature-relationship", title: "Moment–curvature relationship" },
      { slug: "stage-1-2-uncracked-section", title: "Stage 1 & 2 — uncracked section" },
      { slug: "stage-3-service-loads", title: "Stage 3 — service loads" },
      { slug: "stage-4-reinforcing-steel-yields", title: "Stage 4 — reinforcing steel yields" },
      { slug: "stage-5-concrete-crushes", title: "Stage 5 — concrete crushes" },
      { slug: "stage-5-based-on-nscp-2015", title: "Stage 5 — based on NSCP 2015" },
    ],
    progress: 100,
  },
  {
    index: 3,
    slug: "flexural-design-of-beams-slabs",
    title: "Flexural Design of Beams & Slabs",
    description: "Singly and doubly reinforced beam design, plus one-way slab design",
    topics: [
      { slug: "design-of-singly-reinforced-rc-beams", title: "Design of singly reinforced RC beams" },
      { slug: "ultimate-moment-capacity-of-doubly-reinforced-rc-beams", title: "Ultimate moment capacity of doubly reinforced RC beams" },
      { slug: "design-of-doubly-reinforced-rectangular-beams", title: "Design of doubly-reinforced rectangular beams" },
      { slug: "approximate-moment", title: "Approximate moment" },
      { slug: "design-of-one-way-rc-slab", title: "Design of one-way RC slab" },
    ],
    progress: 65,
  },
  {
    index: 4,
    slug: "t-beam-analysis-and-design",
    title: "T-Beam Analysis and Design",
    description: "Analysis and design of reinforced concrete T-beams",
    topics: [
      { slug: "analysis-and-design-of-rc-t-beams", title: "Analysis and design of RC T-beams" },
    ],
    progress: 40,
  },
  {
    index: 5,
    slug: "serviceability-requirements",
    title: "Serviceability Requirements",
    description: "Deflection and serviceability limit checks",
    topics: [
      { slug: "serviceability-requirements-overview", title: "Serviceability requirements" },
    ],
    progress: 0,
  },
  {
    index: 6,
    slug: "column-design",
    title: "Column Design",
    description: "Axial and combined axial-bending capacity of columns",
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
    title: "Shear Design of Columns",
    description: "Shear analysis and design of columns",
    topics: [
      { slug: "shear-analysis-and-design-of-columns", title: "Shear analysis and design of columns" },
    ],
    progress: null,
  },
];