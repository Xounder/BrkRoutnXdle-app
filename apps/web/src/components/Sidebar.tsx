import React, { useState } from "react";
import { TaskPanel } from "../features/tasks/TaskPanel";
import { BlockPanel } from "../features/blocks/BlockPanel";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onSettingsClick: () => void;
}

export function Sidebar({ isCollapsed, onToggle, onSettingsClick }: SidebarProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const sections = [
    {
      id: "tasks",
      label: "Tasks",
      content: <TaskPanel />,
    },
    {
      id: "blocks",
      label: "Blocked Slots",
      content: <BlockPanel />,
    },
    {
      id: "settings",
      label: "Settings",
      content: null,
    },
  ];

  return (
    <div style={{ position: "relative" }}>
      <aside
        style={{
          width: isCollapsed ? "0px" : "280px",
          minWidth: isCollapsed ? "0px" : "280px",
          overflow: "hidden",
          transition: "width 0.3s ease, min-width 0.3s ease",
          background: "#fff",
          borderRight: "1px solid #e0e0e0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sections */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {sections.map((section) => (
            <div key={section.id} style={{ marginBottom: "8px" }}>
              <button
                onClick={() => {
                  if (section.id === "settings") {
                    onSettingsClick();
                  } else {
                    setOpenSection(openSection === section.id ? null : section.id);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  border: "none",
                  background: openSection === section.id ? "#E8F6F5" : "transparent",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "#1E8C86",
                  fontSize: "14px",
                }}
              >
                {section.label}
              </button>
              {openSection === section.id && (
                <div style={{ padding: "12px 16px" }}>
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>
      <button
        onClick={onToggle}
        style={{
          position: "absolute",
          top: "12px",
          right: isCollapsed ? "0px" : "280px",
          width: "24px",
          height: "48px",
          border: "1px solid #e0e0e0",
          borderLeft: isCollapsed ? "1px solid #e0e0e0" : "none",
          background: "#fff",
          cursor: "pointer",
          fontSize: "14px",
          color: "#555",
          zIndex: 10,
          borderRadius: isCollapsed ? "0 8px 8px 0" : "8px 0 0 8px",
          transition: "right 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        {isCollapsed ? "▶" : "◀"}
      </button>
    </div>
  );
}