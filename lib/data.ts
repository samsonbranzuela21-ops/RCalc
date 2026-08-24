interface CalculatorItem {
  name: string;
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
    label: "Beam Design",
    color: "blue",
    items: [
      { name: "Flexural Beam Design", icon: "", color: "blue", href: "/calculators/flexural-beam-design" },
      { name: "Shear Design", icon: "", color: "blue", href: "/calculators/shear-capacity-design" },
      { name: "Deflection Check", icon: "", color: "blue", href: "/calculators/deflection-check" },
    ],
  },
  {
    label: "Column Design",
    color: "orange",
    items: [
      { name: "Axial Load Capacity", icon: "🏛️", color: "orange" },
      { name: "Biaxial Bending", icon: "🔀", color: "orange" },
      { name: "Slenderness Check", icon: "📐", color: "orange" },
    ],
  },
  {
    label: "Slab Design",
    color: "green",
    items: [
      { name: "One-Way Slab", icon: "▭", color: "green" },
      { name: "Two-Way Slab", icon: "▦", color: "green" },
    ],
  },
  {
    label: "Foundation Design",
    color: "purple",
    items: [
      { name: "Isolated Footing", icon: "🧱", color: "purple" },
      { name: "Combined Footing", icon: "🧩", color: "purple" },
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