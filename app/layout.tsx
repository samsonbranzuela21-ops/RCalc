import "./globals.css";
import { Providers } from "./providers";
import "katex/dist/katex.min.css";
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
          {children}
          <div className="fixed bottom-4 left-4 z-50">
            <ThemeToggle />
          </div>
        </Providers>
      </body>
    </html>
  );
}