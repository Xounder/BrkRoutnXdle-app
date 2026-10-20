import React from "react";
import { ActionIcon, Button, Group, useMantineColorScheme } from "@mantine/core";
import type { ViewType } from "@brkroutnxdle/shared";

/**
 * AppShell header — app-level actions only (`M15`).
 *
 * Calendar control ownership moved to `components/calendar/CalendarToolbar`:
 * the `‹`/`›` date step, the single `Today` button and the `Day`/`Week`/`Month`
 * view switcher all live there now (exactly one owner per control).
 *
 * The prop surface is kept identical to what `MainLayout` passes
 * (`MainLayoutProps` is TASK-05's contract and must not change); the calendar
 * navigation props are intentionally declared but unused here.
 */
interface HeaderProps {
  currentDate: Date;
  currentView: ViewType;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: ViewType) => void;
  onSettingsClick: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  const { toggleColorScheme } = useMantineColorScheme();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "var(--space-xs) var(--space-md)",
        height: "100%",
        background: "var(--brk-bg-raised)",
        borderBottom: "1px solid var(--brk-border-default)",
      }}
    >
      {/* Actions */}
      <Group gap="var(--space-xs)">
        <Button onClick={onSettingsClick} variant="outline" size="sm" radius="xl">
          Settings
        </Button>
        <ActionIcon
          onClick={toggleColorScheme}
          aria-label="Toggle color scheme"
          variant="subtle"
          size="sm"
        >
          🌓
        </ActionIcon>
      </Group>
    </header>
  );
}
