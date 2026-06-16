import React from "react";
import type { ViewType } from "@brkroutnxdle/shared";
import { ViewType as ViewTypeEnum } from "@brkroutnxdle/shared";

interface HeaderProps {
  currentDate: Date;
  currentView: ViewType;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: ViewType) => void;
  onSettingsClick: () => void;
}

const VIEW_LABELS: Record<ViewType, string> = {
  [ViewTypeEnum.Day]: "Day",
  [ViewTypeEnum.Week]: "Week",
  [ViewTypeEnum.Month]: "Month",
};

const VIEWS: ViewType[] = [ViewTypeEnum.Day, ViewTypeEnum.Week, ViewTypeEnum.Month];

export function Header({
  currentDate,
  currentView,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  onSettingsClick,
}: HeaderProps) {
  const dateTitle = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    ...(currentView === ViewTypeEnum.Day ? { day: "numeric" } : {}),
  });

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 24px",
      background: "#fff",
      borderBottom: "1px solid #e0e0e0",
    }}>
      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button onClick={onPrev} style={navButtonStyle}>‹</button>
        <button onClick={onToday} style={todayButtonStyle}>Today</button>
        <button onClick={onNext} style={navButtonStyle}>›</button>
        <h2 style={{ margin: "0 16px", fontSize: "20px", color: "#1E8C86" }}>{dateTitle}</h2>
      </div>

      {/* View Switcher */}
      <div style={{ display: "flex", gap: "4px" }}>
        {VIEWS.map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            style={{
              padding: "6px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontWeight: currentView === view ? 700 : 500,
              background: currentView === view ? "#2BA8A2" : "transparent",
              color: currentView === view ? "#fff" : "#555",
              transition: "all 0.2s",
            }}
          >
            {VIEW_LABELS[view]}
          </button>
        ))}
      </div>

      {/* Actions */}
      <button onClick={onSettingsClick} style={{
        padding: "8px 20px",
        border: "2px solid #2BA8A2",
        borderRadius: "9999px",
        background: "transparent",
        color: "#2BA8A2",
        cursor: "pointer",
        fontWeight: 600,
      }}>
        Settings
      </button>
    </header>
  );
}

const navButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontSize: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const todayButtonStyle: React.CSSProperties = {
  padding: "6px 16px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontSize: "14px",
};