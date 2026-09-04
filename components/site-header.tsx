"use client";

import { useState } from "react";

import { DesktopNavigation } from "@/components/header/desktop-navigation";
import { HeaderLogo } from "@/components/header/header-logo";
import {
  MobileNavigation,
  type MobilePanel,
} from "@/components/header/mobile-navigation";
import { MobileMenuPanel } from "@/components/header/mobile-menu-panel";

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    setMobilePanel(null);
  }

  function toggleMobileMenu() {
    setMobileMenuOpen((open) => {
      if (open) setMobilePanel(null);
      return !open;
    });
  }

  function toggleMobilePanel(panel: Exclude<MobilePanel, null>) {
    setMobilePanel((current) => (current === panel ? null : panel));
  }

  return (
    <header className="relative sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-[860px] items-center justify-between gap-4 px-5">
        <HeaderLogo onNavigate={closeMobileMenu} />
        <div className="flex items-center">
          <DesktopNavigation />
          <MobileNavigation
            isOpen={mobileMenuOpen}
            onToggle={toggleMobileMenu}
          />
        </div>
      </div>

      <MobileMenuPanel
        isOpen={mobileMenuOpen}
        activePanel={mobilePanel}
        onTogglePanel={toggleMobilePanel}
        onNavigate={closeMobileMenu}
      />
    </header>
  );
}
