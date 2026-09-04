import "./globals.css";
import "katex/dist/katex.min.css";

import type { ReactNode } from "react";

import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackButton } from "@/components/BackButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "RCalc | Reinforced Concrete Design",
  description:
    "Web-based learning platform for Reinforced Concrete Design.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <SiteHeader />

          <BackButton />

          {children}

          <div className="fixed bottom-4 left-4 z-50">
            <ThemeToggle />
          </div>

          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}