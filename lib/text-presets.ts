// Edit values here — every page using <PresetText preset="..."> updates automatically.
// mobile = below 768px, desktop = 768px and up.

export type TextPresetName =
  | "largeText"
  | "heading"
  | "body"
  | "label"
  | "caption";

export interface TextPresetValues {
  fontSize: string;
  color: string;
  fontWeight: string | number;
}

export interface TextPreset {
  mobile: TextPresetValues;
  desktop: TextPresetValues;
}

export const textPresets: Record<TextPresetName, TextPreset> = {
  largeText: {
    mobile: { fontSize: "12px", color: "#2563eb", fontWeight: 700 },
    desktop: { fontSize: "16px", color: "#2563eb", fontWeight: 700 },
  },
  heading: {
    mobile: { fontSize: "18px", color: "var(--text)", fontWeight: 800 },
    desktop: { fontSize: "24px", color: "var(--text)", fontWeight: 800 },
  },
  body: {
    mobile: { fontSize: "13px", color: "var(--text)", fontWeight: 400 },
    desktop: { fontSize: "15px", color: "var(--text)", fontWeight: 400 },
  },
  label: {
    mobile: { fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 },
    desktop: { fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 },
  },
  caption: {
    mobile: { fontSize: "9px", color: "var(--text-muted)", fontWeight: 400 },
    desktop: { fontSize: "10px", color: "var(--text-muted)", fontWeight: 400 },
  },
};