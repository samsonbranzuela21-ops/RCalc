// Edit values here — every page using <PresetBox preset="...">
// updates automatically.
//
// light = default theme
// dark = when next-themes adds .dark to <html>

export type ColorPresetName =
  | "card"
  | "surface"
  | "highlight"
  | "success"
  | "danger";

export interface ColorPresetValues {
  background: string;
  text: string;
  border: string;
}

export interface ColorPreset {
  light: ColorPresetValues;
  dark: ColorPresetValues;
}

export const colorPresets: Record<ColorPresetName, ColorPreset> = {
  /* Main cards: modules, calculators and information panels */
  card: {
    light: {
      background: "#ffffff",
      text: "#18202d",
      border: "#dce3ec",
    },
    dark: {
      background: "#111722",
      text: "#f4f7ff",
      border: "#252d3b",
    },
  },

  /* Page sections and secondary containers */
  surface: {
    light: {
      background: "#f4f6fa",
      text: "#18202d",
      border: "#dce3ec",
    },
    dark: {
      background: "#090e18",
      text: "#f4f7ff",
      border: "#252d3b",
    },
  },

  /* Important notes and yellow-highlighted content */
  highlight: {
    light: {
      background: "#fff8df",
      text: "#725500",
      border: "#e6a900",
    },
    dark: {
      background: "#2a2108",
      text: "#ffbd00",
      border: "#ffbd00",
    },
  },

  /* Successful calculations and passing checks */
  success: {
    light: {
      background: "#e8f8f0",
      text: "#117447",
      border: "#15965b",
    },
    dark: {
      background: "#0b261c",
      text: "#22c77a",
      border: "#22c77a",
    },
  },

  /* Errors, warnings and failed design checks */
  danger: {
    light: {
      background: "#fdecec",
      text: "#a72f2f",
      border: "#d84343",
    },
    dark: {
      background: "#2b1114",
      text: "#ef5350",
      border: "#ef5350",
    },
  },
};