// Edit values here — every page using <PresetBox preset="..."> updates automatically.
// light = default (no .dark class on <html>), dark = when next-themes adds .dark.

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
  card: {
    light: { background: "#ffffff", text: "#14151a", border: "#e2e3ea" },
    dark: { background: "#12131a", text: "#e8e9ee", border: "#23242f" },
  },
  surface: {
    light: { background: "#f5f6fa", text: "#14151a", border: "#e2e3ea" },
    dark: { background: "#0a0a0f", text: "#e8e9ee", border: "#23242f" },
  },
  highlight: {
    light: { background: "#fff4e5", text: "#7a4a00", border: "#f5941f" },
    dark: { background: "#2a1d05", text: "#f5941f", border: "#f5941f" },
  },
  success: {
    light: { background: "#e6f9f1", text: "#0f7a53", border: "#39c98a" },
    dark: { background: "#0a2018", text: "#39c98a", border: "#39c98a" },
  },
  danger: {
    light: { background: "#fdeaea", text: "#a12a2a", border: "#e05353" },
    dark: { background: "#2a0f0f", text: "#e05353", border: "#e05353" },
  },
};