"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/shared/theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={!isDark}
      title={isDark ? "Light mode" : "Dark mode"}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-[#4d7cff] bg-[#4d7cff] p-[3px] shadow-sm transition-colors hover:bg-[#3f70e8] active:scale-95"
    >
      <span
        className={`flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ${
          isDark ? "translate-x-0" : "translate-x-[18px]"
        }`}
      >
        {isDark ? (
          <Moon aria-hidden="true" className="h-3 w-3 text-[#556b9a]" />
        ) : (
          <Sun aria-hidden="true" className="h-3 w-3 text-[#f59e0b]" />
        )}
      </span>
    </button>
  );
}
