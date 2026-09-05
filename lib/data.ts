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
  {
    label: "NSCP · ACI 318",
    color: "text-[var(--green)]",
  },
];

export const calculators: CalculatorSection[] = [
  {
    label: "Analysis",
    color: "slate",
    items: [
      {
        name: "Beam Capacity Check",
        description: "Verify adequacy of existing RC beam section",
        icon: "✅",
        color: "slate",
        href: "/calculators/beam-capacity-check",
      },
    ],
  },
  {
    label: "Flexural Design",
    color: "blue",
    items: [
      {
        name: "Cracking Moment",
        description: "Compute Mcr using modulus of rupture",
        icon: "📉",
        color: "blue",
        href: "/calculators/cracking-moment",
      },
      {
        name: "Rectangular Beam",
        description: "Design singly reinforced rectangular beam",
        icon: "▭",
        color: "blue",
        href: "/calculators/flexural-beam-design",
      },
      {
        name: "T-Beam Design",
        description: "Flanged section flexural design",
        icon: "⊤",
        color: "blue",
        href: "/calculators/t-beam-design",
      },
      {
        name: "L-Beam Design",
        description: "L-shaped flanged section design",
        icon: "◺",
        color: "blue",
        href: "/calculators/l-beam-design",
      },
    ],
  },
  {
    label: "Shear Design",
    color: "teal",
    items: [
      {
        name: "Shear Beam Design",
        description: "Stirrup spacing and shear capacity",
        icon: "✂️",
        color: "teal",
        href: "/calculators/shear-capacity-design",
      },
    ],
  },
  {
    label: "Serviceability",
    color: "red",
    items: [
      {
        name: "Deflection Check",
        description: "Immediate and long-term deflection",
        icon: "〰️",
        color: "red",
        href: "/calculators/deflection-check",
      },
    ],
  },
  {
    label: "Slab Design",
    color: "green",
    items: [
      {
        name: "One-Way Slab Design",
        description: "Design reinforcement for a one-way reinforced-concrete slab",
        href: "/calculators/one-way-slab-design",
        icon: "▤",
        color: "green",
      },
    ],
  },
  {
    label: "Column Analysis",
    color: "purple",
    items: [
      {
        name: "Column P-M Interaction",
        description:
          "Check short-column capacity under axial load and bending moment",
        icon: "▥",
        color: "purple",
        href: "/calculators/column-interaction",
      },
      {
        name: "Column Ties and Spiral Check",
        description:
          "Check column ties, spacing, and spiral reinforcement detailing",
        icon: "▥",
        color: "red",
        href: "/calculators/column-ties-check",
      },
    ],
  },
];

export const footerColumns = [
  {
    title: "Product",
    links: [
      {
        label: "Calculators",
        href: "/calculators",
      },
      {
        label: "Modules",
        href: "/modules",
      },
      {
        label: "Changelog",
        href: "/changelog",
      },
    ],
  },
  {
    title: "Resources",
    links: [
      {
        label: "NSCP · ACI 318",
        href: "/nscp-aci-318",
      },
      {
        label: "References",
        href: "/references",
      },
      {
        label: "Documentation",
        href: "/docs",
      },
    ],
  },
  {
    title: "Company",
    links: [
      {
        label: "About",
        href: "/about",
      },
      {
        label: "Contact",
        href: "/contact",
      },
    ],
  },
];

export { modules } from "./modules";
export type { ModuleItem } from "./modules";
