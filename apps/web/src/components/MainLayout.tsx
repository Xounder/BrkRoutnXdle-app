import React, { useState, useCallback } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import type { ViewType, CalendarEvent } from "@brkroutnxdle/shared";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#EFF8F7",
    }}>
      <Header
        currentDate={currentDate}
        currentView={currentView}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
        onViewChange={onViewChange}
        onSettingsClick={onSettingsClick}
      />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        <main style={{ flex: 1, overflow: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}