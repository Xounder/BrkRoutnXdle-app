import React, { useState } from "react";
import { Accordion, AccordionItem, AccordionControl, AccordionPanel, ActionIcon } from "@mantine/core";
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
    <>
      {/* M7: Exactly one <aside> element in the document */}
      <aside
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--brk-bg-raised)",
          borderRight: "1px solid var(--brk-border-default)",
          overflow: "hidden",
        }}
      >
        {/* Accordion: single open section, panels unmount when closed (D-07) */}
        <Accordion
          multiple={false}
          value={openSection}
          onChange={setOpenSection}
          style={{ flex: 1, overflowY: "auto", padding: "var(--space-xs)" }}
        >
          {sections.map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionControl
                style={{
                  padding: "var(--space-xs) var(--space-sm)",
                  borderRadius: "var(--brk-radius-sm)",
                  fontWeight: 600,
                  fontSize: "var(--font-sm)",
                  color: "var(--brk-text-brand)",
                  background: openSection === section.id ? "var(--brk-bg-sunken)" : "transparent",
                }}
              >
                {section.label}
              </AccordionControl>
              <AccordionPanel>
                {section.id === "settings" ? (
                  <button
                    onClick={onSettingsClick}
                    style={{
                      width: "100%",
                      padding: "var(--space-xs) var(--space-sm)",
                      border: "none",
                      background: "transparent",
                      borderRadius: "var(--brk-radius-sm)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--brk-text-brand)",
                      fontSize: "var(--font-sm)",
                    }}
                  >
                    Settings
                  </button>
                ) : (
                  <div style={{ padding: "var(--space-xs) var(--space-sm)" }}>
                    {section.content}
                  </div>
                )}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </aside>

      {/* Collapse toggle moved to ActionIcon with proper accessibility */}
      <ActionIcon
        onClick={onToggle}
        aria-label="Toggle sidebar"
        aria-expanded={!isCollapsed}
        size="lg"
        variant="subtle"
        style={{
          position: "absolute",
          top: "var(--space-md)",
          right: "calc(var(--space-xs) * -1)",
          zIndex: "var(--z-sticky)",
          borderRadius: "var(--brk-radius-round)",
          boxShadow: "var(--brk-shadow-md)",
          background: "var(--brk-bg-raised)",
          border: "1px solid var(--brk-border-default)",
        }}
      >
        {isCollapsed ? "▶" : "◀"}
      </ActionIcon>
    </>
  );
}