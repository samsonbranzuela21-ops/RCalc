"use client";

import katex from "katex";

export function InlineKatex({
  math,
  className = "",
}: {
  math: string;
  className?: string;
}) {
  const html = katex.renderToString(math, {
    output: "html",
    throwOnError: false,
  });

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}