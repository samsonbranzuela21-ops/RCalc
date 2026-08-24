"use client";

import { useState } from "react";
import Link from "next/link";
import { modules } from "@/lib/data";

export function ModulesList() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex((current) => (current === index ? null : index));
  }

  return (
    <div className="flex-1 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3 text-[11px] font-bold text-[var(--text)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#f5941f]" />
        LEARNING MODULES
      </div>

      {modules.map((m) => {
        const isOpen = openIndex === m.index;

        return (
          <div key={m.index} className="border-b border-[var(--border)] last:border-b-0">
            <button
              onClick={() => toggle(m.index)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left"
            >
              <span className="w-4 flex-shrink-0 text-[10px] text-[var(--text-muted)]">{m.index}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-[var(--text)]">{m.title}</div>
                <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">{m.description}</div>
              </div>
              <span
                className={`ml-auto flex-shrink-0 text-[12px] text-[var(--text-muted)] transition-transform duration-150 ${
                  isOpen ? "rotate-90" : ""
                }`}
              >
                ›
              </span>
            </button>

            {isOpen && m.topics.length > 0 && (
              <ul className="ml-[26px] space-y-1 border-l border-[var(--border)] px-4 pb-3 pl-3">
                {m.topics.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/modules/${m.slug}/${t.slug}`}
                      className="block text-[10px] text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}