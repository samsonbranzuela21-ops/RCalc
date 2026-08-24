import "./globals.css";
import "katex/dist/katex.min.css";

import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackButton } from "@/components/BackButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
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