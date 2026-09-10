"use client";

import katex from "katex";

export function InlineKatex({
  math,
  className = "",
}: {
  math: string;
  className?: string;
}) {
  // Formula strings are often assembled in JSX/JavaScript template literals.
  // Normalise an accidentally doubled command slash before KaTeX parses it;
  // otherwise commands such as `\\left` are displayed as plain text (`left`).
  // Keep intentional `\\` row separators in aligned/cases expressions intact.
  const normalizedMath = math.replace(/\\\\(?=[A-Za-z])/g, "\\");
  const html = katex.renderToString(normalizedMath, {
    output: "html",
    throwOnError: false,
  });

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
