// Edit values here — every page using <PresetText preset="...">
// updates automatically.
//
// mobile = below 768px
// desktop = 768px and above

export type TextPresetName =
  | "largeText"
  | "heading"
  | "body"
  | "label"
  | "caption"
  | "sectionLabel"
  | "itemTitle"
  | "itemDescription"
  | "topicLink";

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
    mobile: {
      fontSize: "12px",
      color: "var(--blue)",
      fontWeight: 700,
    },
    desktop: {
      fontSize: "16px",
      color: "var(--blue)",
      fontWeight: 700,
    },
  },

  heading: {
    mobile: {
      fontSize: "18px",
      color: "var(--text)",
      fontWeight: 800,
    },
    desktop: {
      fontSize: "24px",
      color: "var(--text)",
      fontWeight: 800,
    },
  },

  body: {
    mobile: {
      fontSize: "13px",
      color: "var(--text)",
      fontWeight: 400,
    },
    desktop: {
      fontSize: "15px",
      color: "var(--text)",
      fontWeight: 400,
    },
  },

  label: {
    mobile: {
      fontSize: "10px",
      color: "var(--text-muted)",
      fontWeight: 500,
    },
    desktop: {
      fontSize: "11px",
      color: "var(--text-muted)",
      fontWeight: 500,
    },
  },

  caption: {
    mobile: {
      fontSize: "9px",
      color: "var(--text-muted)",
      fontWeight: 400,
    },
    desktop: {
      fontSize: "10px",
      color: "var(--text-muted)",
      fontWeight: 400,
    },
  },

  sectionLabel: {
    mobile: {
      fontSize: "10px",
      color: "var(--text)",
      fontWeight: 700,
    },
    desktop: {
      fontSize: "10px",
      color: "var(--text)",
      fontWeight: 700,
    },
  },

  itemTitle: {
    mobile: {
      fontSize: "11px",
      color: "var(--text)",
      fontWeight: 600,
    },
    desktop: {
      fontSize: "11px",
      color: "var(--text)",
      fontWeight: 600,
    },
  },

  itemDescription: {
    mobile: {
      fontSize: "9px",
      color: "var(--text-muted)",
      fontWeight: 400,
    },
    desktop: {
      fontSize: "9px",
      color: "var(--text-muted)",
      fontWeight: 400,
    },
  },

  topicLink: {
    mobile: {
      fontSize: "10px",
      color: "var(--text-muted)",
      fontWeight: 400,
    },
    desktop: {
      fontSize: "11px",
      color: "var(--text-muted)",
      fontWeight: 400,
    },
  },
};