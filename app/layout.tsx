import "./globals.css";
import { Providers } from "./providers";
import "katex/dist/katex.min.css";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackButton } from "@/components/BackButton";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <SiteHeader />
      <body>
        <BackButton />
        <Providers>
          {children}
          <div className="fixed bottom-4 left-4 z-50">
            <ThemeToggle />
          </div>
        </Providers>
      </body>
      <SiteFooter />
    </html>
  );
}

