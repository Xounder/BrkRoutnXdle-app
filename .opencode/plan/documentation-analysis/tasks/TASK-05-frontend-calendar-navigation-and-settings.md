# Task 05 — Frontend Calendar Navigation & Settings

## Task Information

### ID

TASK-05

### Title

Frontend Calendar Navigation & Settings

### Owner

senior-frontend

### Status

Pending

---

## Description

Integrate FullCalendar as the central visual component with Day/Week/Month views and navigation controls. Implement the main application layout with collapsible sidebar, header, and the settings modal for global preferences (available hours, shuffle mode, week start day). All settings persist in localStorage.

---

## Acceptance Criteria

- [ ] FullCalendar renders events from both Primary and BrkRoutnXdle calendars (fetched via API)
- [ ] Week view is the default view on load
- [ ] User can switch to Day view and see a single day's events
- [ ] User can switch to Month view and see monthly overview
- [ ] "Next" button navigates to next time period (day/week/month)
- [ ] "Previous" button navigates to previous time period
- [ ] "Today" button jumps to the current day/week
- [ ] View switcher (Day/Week/Month) is visible and functional in the header
- [ ] Sidebar is collapsible and contains Task/Block/Settings sections (placeholder sections)
- [ ] Settings modal can be opened from header or sidebar
- [ ] Settings modal controls: available start hour, available end hour, shuffle toggle, week start day (Monday/Sunday)
- [ ] Settings are saved to localStorage and restored on page refresh
- [ ] Calendar respects the configured week start day
- [ ] Single-screen layout: header, sidebar, and calendar visible without page navigation
- [ ] Events display with correct titles, times, and color coding (Primary calendar vs BrkRoutnXdle)
- [ ] CalendarContext manages `events` state from React Query

---

## Dependencies

### Required Tasks

- TASK-04
- TASK-02

### Dependency Notes

Requires TASK-04 for auth context (authenticated state) and TASK-02 for the calendar API endpoints to fetch events.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/CalendarView.tsx`
- `apps/web/src/components/Header.tsx`
- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/components/MainLayout.tsx`
- `apps/web/src/components/SettingsModal.tsx`
- `apps/web/src/contexts/CalendarContext.tsx`
- `apps/web/src/contexts/SettingsContext.tsx`
- `apps/web/src/hooks/useCalendar.ts`
- `apps/web/src/hooks/useSettings.ts`

### Relevant Modules

- `apps/web`
- `packages/shared` (Settings type, constants)

### Relevant APIs

- `GET /api/v1/events`
- `GET /api/v1/calendars`
- `GET /api/v1/calendars/brkroutnxdle`

### Relevant Types

- `Settings`, `CalendarEvent`, `ViewType`, `CalendarState`

---

## Step-by-Step Implementation — Part 1 of 2

*Continuation file: `references/TASK-05-impl-guide-part2.md`*

---

### Step 1: Create `apps/web/src/contexts/SettingsContext.tsx`

```tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import type { Settings } from "@brkroutnxdle/shared";
import { DEFAULT_SETTINGS } from "@brkroutnxdle/shared";

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  resetSettings: () => void;
}

const STORAGE_KEY = "brkroutnxdle:settings";

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Settings;
  } catch { /* ignore corrupt data */ }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
```

Loads/saves settings from localStorage with key `brkroutnxdle:settings`. Falls back to `DEFAULT_SETTINGS` from shared constants.

### Step 2: Create `apps/web/src/contexts/CalendarContext.tsx`

```tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import type { CalendarEvent, ViewType } from "@brkroutnxdle/shared";

interface CalendarContextValue {
  events: CalendarEvent[];
  previewEvents: CalendarEvent[];
  currentView: ViewType;
  currentDate: Date;
  setEvents: (events: CalendarEvent[]) => void;
  setPreviewEvents: (events: CalendarEvent[]) => void;
  setCurrentView: (view: ViewType) => void;
  setCurrentDate: (date: Date) => void;
  refreshCalendar: () => void;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [previewEvents, setPreviewEvents] = useState<CalendarEvent[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.Week);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshCalendar = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <CalendarContext.Provider
      value={{
        events,
        previewEvents,
        currentView,
        currentDate,
        setEvents,
        setPreviewEvents,
        setCurrentView,
        setCurrentDate,
        refreshCalendar,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): CalendarContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
}
```

### Step 3: Create `apps/web/src/hooks/useCalendar.ts` — Fetches events from API

```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { useCalendar } from "../contexts/CalendarContext";
import { useEffect } from "react";

export function useCalendarEvents(timeMin?: string, timeMax?: string) {
  const { setEvents } = useCalendar();

  const query = useQuery<CalendarEvent[]>({
    queryKey: ["calendar", "events", timeMin, timeMax],
    queryFn: () =>
      api.get<CalendarEvent[]>("/events", {
        timeMin: timeMin ?? new Date().toISOString(),
        timeMax: timeMax ?? new Date(Date.now() + 7 * 86400_000).toISOString(),
      }),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setEvents(query.data);
    }
  }, [query.data, setEvents]);

  return query;
}
```

### Step 4: Create `apps/web/src/hooks/useSettings.ts`

```ts
import { useSettings as useSettingsContext } from "../contexts/SettingsContext";

export function useSettings() {
  return useSettingsContext();
}
```

### Step 5: Create `apps/web/src/components/Header.tsx`

```tsx
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
```

*See Part 2 for Sidebar, MainLayout, CalendarView, and SettingsModal.*

---

## Testing & Validation

See `references/TASK-05-impl-guide-part2.md` for testing details, DOD, and references. The implementation above covers all acceptance criteria for calendar navigation and settings.
