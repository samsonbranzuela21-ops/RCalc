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
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);

  function closeMobileMenu() {
    setMobilePanel(null);
  }

  function toggleMobilePanel(panel: Exclude<MobilePanel, null>) {
    setMobilePanel((current) => (current === panel ? null : panel));
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-[860px] items-center justify-between gap-4 px-5">
        <HeaderLogo onNavigate={closeMobileMenu} />
        <DesktopNavigation />
      </div>

      <MobileNavigation
        activePanel={mobilePanel}
        onNavigate={closeMobileMenu}
        onToggle={toggleMobilePanel}
      />

      <MobileMenuPanel
        activePanel={mobilePanel}
        onNavigate={closeMobileMenu}
      />
    </header>
  );
}
