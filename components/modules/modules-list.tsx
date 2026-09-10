import Link from "next/link";

import { catalogModules } from "@/lib/modules";
import { PresetBox } from "@/components/shared/PresetBox";
import { PresetText } from "@/components/shared/PresetText";

const numeralColors = [
  "var(--blue)",
  "var(--blue)",
  "var(--purple)",
  "var(--blue)",
  "var(--teal)",
  "var(--blue)",
  "var(--purple)",
  "var(--teal)",
];

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function ModulesList() {
  return (
    <PresetBox
      preset="card"
      as="div"
      className="w-full flex-1 overflow-hidden rounded-lg border md:w-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-5 py-4">
        <span className="h-2 w-2 rounded-full bg-[var(--yellow)]" />

        <PresetText
          preset="sectionLabel"
          as="span"
          className="uppercase tracking-wider"
        >
          <span className="text-[var(--yellow)]">Learning Modules</span>
        </PresetText>

        <span className="rounded-full bg-[var(--badge-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
          {catalogModules.length}
        </span>

        <Link
          href="/modules"
          className="ml-auto rounded px-2 py-1 text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--yellow)]"
        >
          All ›
        </Link>
      </div>

      {/* Module rows */}
      {catalogModules.map((moduleItem) => {
        const color =
          numeralColors[(moduleItem.index - 1) % numeralColors.length];

        return (
          <Link
            key={moduleItem.index}
            href={`/modules/${moduleItem.slug}`}
            className="group flex min-h-16 items-center gap-3 border-b border-[var(--border)] px-5 py-4 last:border-b-0 hover:bg-[var(--bg-hover)]"
          >
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border text-xs font-bold"
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
