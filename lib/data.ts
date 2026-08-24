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

export const stats = [
  { icon: "📘", label: "7 Modules", color: "text-[#4d7cff]" },
  { icon: "🧮", label: "10 Calculators", color: "text-[#f5941f]" },
  { icon: "📐", label: "NSCP · ACI 318", color: "text-[#39c98a]" },
  { icon: "🧭", label: "Step-by-Step", color: "text-[#a780ff]" },
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
      },
      {
        name: "L-Beam Design",
        description: "L-shaped flanged section design",
        icon: "◺",
        color: "blue",
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
        name: "Bar Spacing Check",
        description: "Verify minimum and maximum bar spacing",
        icon: "↔",
        color: "red",
      },
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
        description: "Reinforcement for one-way spanning slab",
        icon: "▤",
        color: "green",
      },
    ],
  },
  {
    label: "Column Design",
    color: "purple",
    items: [
      {
        name: "Column Design",
        description: "Axial load and steel area for RC column",
        icon: "🏛️",
        color: "purple",
      },
      {
        name: "Column Interaction Diagram",
        description: "P-M interaction envelope generation",
        icon: "📈",
        color: "purple",
      },
    ],
  },
];

export const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Calculators", href: "/calculators" },
      { label: "Modules", href: "/modules" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "NSCP 2015", href: "/resources/nscp" },
      { label: "ACI 318", href: "/resources/aci" },
      { label: "Documentation", href: "/docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export { modules } from "./modules";
export type { ModuleItem } from "./modules";