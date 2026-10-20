import React, { useState, useCallback } from "react";
import { AppShell, AppShellHeader, AppShellNavbar, AppShellMain } from "@mantine/core";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import type { ViewType } from "@brkroutnxdle/shared";
import { breakpoints } from "../theme/breakpoints";

interface MainLayoutProps {
  children: React.ReactNode;
  currentDate: Date;
  currentView: ViewType;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: ViewType) => void;
  onSettingsClick: () => void;
}

export function MainLayout({
  children,
  currentDate,
  currentView,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  onSettingsClick,
}: MainLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setMobileNavOpen((prev) => !prev);
  }, []);

  const mainStyle: React.CSSProperties = {
    height: "100%",
    minHeight: 0,
    overflow: "auto",
  };

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 280,
        breakpoint: breakpoints.sm,
        collapsed: { mobile: !mobileNavOpen },
      }}
      padding={0}
      transitionDuration={200}
      transitionTimingFunction="ease"
      className="brk-app-shell"
      style={{ overflow: "hidden" }}
    >
      <AppShellHeader>
        <Header
          currentDate={currentDate}
          currentView={currentView}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
          onViewChange={onViewChange}
          onSettingsClick={onSettingsClick}
        />
      </AppShellHeader>
      <AppShellNavbar>
        <Sidebar
          isCollapsed={mobileNavOpen}
          onToggle={toggleSidebar}
          onSettingsClick={onSettingsClick}
        />
      </AppShellNavbar>
      <AppShellMain style={mainStyle}>
        {children}
      </AppShellMain>
    </AppShell>
  );
}
