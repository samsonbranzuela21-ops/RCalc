interface StatItem {
  label: string;
  color: string;
  href?: string;
}

interface CalculatorItem {
  name: string;
  description: string;
  icon: string;
  color: string;
  href?: string;
}

interface CalculatorSection {
  label: string;
  color: string;
  items: CalculatorItem[];
}

export const stats: StatItem[] = [
  { label: "NSCP · ACI 318", color: "text-[var(--green)]", href: "/nscp-aci-318" },
];

export const calculators: CalculatorSection[] = [
  {
    label: "Rectangular Beam Analysis",
    color: "slate",
    items: [
      { name: "Rectangular Beam Analysis", description: "Verify the capacity of an existing rectangular beam", icon: "✓", color: "slate", href: "/calculators/rectangular-beam-analysis" },
      { name: "Cracking Moment", description: "Compute Mcr using the modulus of rupture", icon: "Mcr", color: "slate", href: "/calculators/rectangular-cracking-moment" },
    ],
  },
  {
    label: "Rectangular Beam Design",
    color: "blue",
    items: [
      { name: "Rectangular Beam Design", description: "Design a reinforced rectangular beam for flexure", icon: "▭", color: "blue", href: "/calculators/flexural-beam-design" },
      { name: "Shear Beam Design", description: "Design stirrup spacing and shear capacity", icon: "V", color: "teal", href: "/calculators/shear-capacity-design" },
      { name: "Deflection Check", description: "Check immediate and long-term deflection", icon: "δ", color: "red", href: "/calculators/deflection-check" },
    ],
  },
  {
    label: "T-Beam Analysis and Design",
    color: "orange",
    items: [
      { name: "T-Beam Analysis", description: "Analyze the flexural capacity of an existing T-beam", icon: "T", color: "orange", href: "/calculators/t-beam-analysis" },
      { name: "T-Beam Design", description: "Design an interior flanged beam for positive bending", icon: "T", color: "orange", href: "/calculators/t-beam-design" },
    ],
  },
  {
    label: "L-Beam Analysis and Design",
    color: "teal",
    items: [
      { name: "L-Beam Analysis", description: "Analyze the flexural capacity of an existing L-beam", icon: "L", color: "teal", href: "/calculators/l-beam-analysis" },
      { name: "L-Beam Design", description: "Design an edge flanged beam for positive bending", icon: "L", color: "teal", href: "/calculators/l-beam-design" },
    ],
  },
  {
    label: "Slab Design",
    color: "green",
    items: [
      { name: "One-Way Slab Design", description: "Design reinforcement for a one-way reinforced-concrete slab", href: "/calculators/one-way-slab-design", icon: "▤", color: "green" },
    ],
  },
  {
    label: "Column Analysis and Detailing",
    color: "purple",
    items: [
      { name: "Column P-M Interaction", description: "Check short-column capacity under axial load and bending moment", icon: "▥", color: "purple", href: "/calculators/column-interaction" },
      { name: "Column Ties and Spiral Check", description: "Check column ties, spacing, and spiral reinforcement detailing", icon: "▥", color: "red", href: "/calculators/column-ties-check" },
    ],
  },
];

export { modules } from "./modules";
export type { ModuleItem } from "./modules";
