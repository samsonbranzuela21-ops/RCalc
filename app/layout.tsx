import "./globals.css";
import "katex/dist/katex.min.css";

import type { ReactNode } from "react";

import { Providers } from "./providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BackButton } from "@/components/shared/BackButton";

export const metadata = {
  title: "RCalcs | Reinforced Concrete Design",
  description:
    "Web-based learning platform for Reinforced Concrete Design.",
  icons: {
    icon: "/rcalc-logo.png",
  },
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

          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
