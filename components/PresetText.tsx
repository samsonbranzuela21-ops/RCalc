import { textPresets, type TextPresetName } from "@/lib/text-presets";

type Tag = keyof React.JSX.IntrinsicElements;

interface PresetTextProps {
  preset: TextPresetName;
  as?: Tag;
  children: React.ReactNode;
  className?: string;
}

export function PresetText({
  preset,
  as: Tag = "span",
  children,
  className = "",
}: PresetTextProps) {
  const p = textPresets[preset];

  const style = {
    "--pt-mobile-size": p.mobile.fontSize,
    "--pt-mobile-color": p.mobile.color,
    "--pt-mobile-weight": p.mobile.fontWeight,
    "--pt-desktop-size": p.desktop.fontSize,
    "--pt-desktop-color": p.desktop.color,
    "--pt-desktop-weight": p.desktop.fontWeight,
  } as React.CSSProperties;

  return (
    <Tag className={`preset-text ${className}`} style={style}>
      {children}
    </Tag>
  );
}