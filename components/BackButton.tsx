"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
* Floating back button — fixed to the viewport (stays in place while
* scrolling), hidden on the home page ("/").
*
* - Pass href when you know the exact parent page to go to
* (safer — always lands somewhere correct, e.g. Topic → its Module).
* - Omit href to fall back to browser history (router.back()) —
* fine for pages where "back" always means "wherever I came from".
*/
export function BackButton({ href }: { href?: string }) {
const router = useRouter();
const pathname = usePathname();

if (pathname === "/") {
return null;
}

const className =
"fixed left-4 top-[3.25rem] z-40 mt-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] shadow-sm transition hover:text-[var(--text)] hover:shadow-md active:scale-95";

if (href) {
return (
<Link href={href} className={className} aria-label="Go back">
<ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
</Link>
);
}

return (
<button type="button" onClick={() => router.back()} className={className} aria-label="Go back">
<ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
</button>
);
}

/* ── Usage ───────────────────────────────────────────────────────

Since the button is fixed, where you place the JSX in the page no
longer affects where it appears on screen — it always floats top-left
of the viewport, just below the sticky header. Placement in the tree
only matters for the href you pass it.

// Topic page (app/modules/[slug]/[topicSlug]/page.tsx):
<BackButton href={`/modules/${module_.slug}`} />

// Module page (app/modules/[slug]/page.tsx) — back to the modules list:
<BackButton href="/modules" />

// References page, or anywhere "back" just means "previous page":
<BackButton />

On "/" (home) it renders nothing at all, so it's safe to include it
in a shared layout without excluding the home route yourself.
──────────────────────────────────────────────────────────────── */