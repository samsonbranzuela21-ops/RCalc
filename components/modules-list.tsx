import Link from "next/link";

import { modules } from "@/lib/data";
import { PresetBox } from "@/components/PresetBox";
import { PresetText } from "@/components/PresetText";

const numeralColors = [
  "var(--blue)",
  "var(--blue)",
  "var(--purple)",
  "var(--blue)",
  "var(--teal)",
  "var(--blue)",
  "var(--purple)",
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

export function ModulesList() {
  return (
    <PresetBox
      preset="card"
      as="div"
      className="w-full flex-1 overflow-hidden rounded-lg border md:w-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--yellow)]" />

        <PresetText
          preset="sectionLabel"
          as="span"
          className="uppercase tracking-wider"
        >
          <span className="text-[var(--yellow)]">Learning Modules</span>
        </PresetText>

        <span className="rounded-full bg-[var(--badge-bg)] px-1.5 py-0.5 text-[8px] font-semibold text-[var(--text-muted)]">
          {modules.length}
        </span>

        <Link
          href="/modules"
          className="ml-auto text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--yellow)]"
        >
          All ›
        </Link>
      </div>

      {/* Module rows */}
      {modules.map((moduleItem) => {
        const color =
          numeralColors[(moduleItem.index - 1) % numeralColors.length];

        return (
          <Link
            key={moduleItem.index}
            href={`/modules/${moduleItem.slug}`}
            className="group flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--bg-hover)]"
          >
            <span
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border text-[10px] font-bold"
              style={{
                color,
                borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
              }}
            >
              {ROMAN[moduleItem.index - 1] ?? moduleItem.index}
            </span>

            <div className="min-w-0 flex-1">
              <PresetText
                preset="itemTitle"
                as="div"
                className="truncate"
              >
                {moduleItem.title}
              </PresetText>

              <PresetText
                preset="itemDescription"
                as="div"
                className="mt-0.5 truncate"
              >
                {moduleItem.topics.length} topics · {moduleItem.description}
              </PresetText>
            </div>

            <span className="flex-shrink-0 text-[13px] text-[var(--text-faint)] group-hover:text-[var(--yellow)]">
              ›
            </span>
          </Link>
        );
      })}
    </PresetBox>
  );
}