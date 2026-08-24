"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text)]"
    >
      {isDark ? "☀️ Light mode" : "🌙 Dark mode"}
    </button>
  );
}