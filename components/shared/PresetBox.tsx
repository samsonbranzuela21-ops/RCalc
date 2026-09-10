import { colorPresets, type ColorPresetName } from "@/lib/color-presets";

type Tag = keyof React.JSX.IntrinsicElements;

interface PresetBoxProps {
  preset: ColorPresetName;
  as?: Tag;
  children: React.ReactNode;
  className?: string;
}

export function PresetBox({
  preset,
  as: Tag = "div",
  children,
  className = "",
}: PresetBoxProps) {
  const p = colorPresets[preset];

  const style = {
    "--pb-light-bg": p.light.background,
    "--pb-light-text": p.light.text,
    "--pb-light-border": p.light.border,
    "--pb-dark-bg": p.dark.background,
    "--pb-dark-text": p.dark.text,
    "--pb-dark-border": p.dark.border,
  } as React.CSSProperties;

  return (
    <Tag className={`preset-box ${className}`} style={style}>
      {children}
    </Tag>
  );
}