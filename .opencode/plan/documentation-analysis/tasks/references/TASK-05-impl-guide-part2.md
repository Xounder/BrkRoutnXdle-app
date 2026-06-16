# TASK-05 Implementation Guide — Part 2

Sidebar, MainLayout, CalendarView, and SettingsModal.

---

### Step 6: Create `apps/web/src/components/Sidebar.tsx`

```tsx
import React, { useState } from "react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const sections = [
    { id: "tasks", label: "Tasks", content: "Task management (TASK-06)" },
    { id: "blocks", label: "Blocked Slots", content: "Block management (TASK-06)" },
    { id: "settings", label: "Settings", content: "Settings panel" },
  ];

  return (
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
      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          padding: "12px",
          border: "none",
          background: "none",
          cursor: "pointer",
          fontSize: "18px",
          color: "#555",
          textAlign: "right",
        }}
      >
        {isCollapsed ? "☰" : "✕"}
      </button>

      {/* Sections */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {sections.map((section) => (
          <div key={section.id} style={{ marginBottom: "8px" }}>
            <button
              onClick={() =>
                setOpenSection(openSection === section.id ? null : section.id)
              }
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
              <div style={{ padding: "12px 16px", color: "#666", fontSize: "14px" }}>
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
```

### Step 7: Create `apps/web/src/components/MainLayout.tsx`

```tsx
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
```

### Step 8: Create `apps/web/src/components/SettingsModal.tsx`

```tsx
import React from "react";
import { useSettings } from "../contexts/SettingsContext";
import { DEFAULT_SETTINGS } from "@brkroutnxdle/shared";
import type { Settings } from "@brkroutnxdle/shared";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useSettings();

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "24px",
    padding: "32px",
    width: "440px",
    maxWidth: "90vw",
    boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, color: "#1E8C86" }}>Settings</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px" }}>
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Work Start Hour */}
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>Available Start Hour</span>
            <input
              type="number"
              min={0}
              max={23}
              value={settings.workStartHour}
              onChange={(e) => updateSettings({ workStartHour: parseInt(e.target.value, 10) })}
              style={inputStyle}
            />
          </label>

          {/* Work End Hour */}
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>Available End Hour</span>
            <input
              type="number"
              min={0}
              max={23}
              value={settings.workEndHour}
              onChange={(e) => updateSettings({ workEndHour: parseInt(e.target.value, 10) })}
              style={inputStyle}
            />
          </label>

          {/* Max Tasks Per Day */}
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>Max Tasks Per Day</span>
            <input
              type="number"
              min={1}
              max={20}
              value={settings.maxTasksPerDay}
              onChange={(e) => updateSettings({ maxTasksPerDay: parseInt(e.target.value, 10) })}
              style={inputStyle}
            />
          </label>

          {/* Default Task Duration */}
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>Default Task Duration (min)</span>
            <select
              value={settings.defaultTaskDuration}
              onChange={(e) => updateSettings({ defaultTaskDuration: parseInt(e.target.value, 10) })}
              style={inputStyle}
            >
              {[30, 60, 90, 120, 150, 180].map((d) => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </select>
          </label>

          {/* Work Days */}
          <fieldset style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px" }}>
            <legend style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>Work Days</legend>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                <label key={day} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                  <input
                    type="checkbox"
                    checked={settings.workDays.includes(i)}
                    onChange={() => {
                      const next = settings.workDays.includes(i)
                        ? settings.workDays.filter((d) => d !== i)
                        : [...settings.workDays, i].sort();
                      updateSettings({ workDays: next });
                    }}
                  />
                  {day}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Timezone */}
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>Timezone</span>
            <input
              type="text"
              value={settings.timezone}
              onChange={(e) => updateSettings({ timezone: e.target.value })}
              style={inputStyle}
              placeholder="UTC"
            />
          </label>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
            <button onClick={resetSettings} style={secondaryButtonStyle}>
              Reset to Defaults
            </button>
            <button onClick={onClose} style={primaryButtonStyle}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "2px solid #ddd",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 32px",
  background: "linear-gradient(135deg, #FFD23F, #E6B800)",
  border: "none",
  borderRadius: "9999px",
  fontWeight: 700,
  cursor: "pointer",
  color: "#1E8C86",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 24px",
  border: "2px solid #2BA8A2",
  borderRadius: "9999px",
  background: "transparent",
  color: "#2BA8A2",
  cursor: "pointer",
  fontWeight: 600,
};
```

### Step 9: Create `apps/web/src/components/CalendarView.tsx`

```tsx
import React, { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { ViewType, CalendarEvent } from "@brkroutnxdle/shared";
import type { CalendarOptions, DatesSetArg } from "@fullcalendar/core";

interface CalendarViewProps {
  events: CalendarEvent[];
  previewEvents: CalendarEvent[];
  currentView: ViewType;
  currentDate: Date;
  onViewChange: (view: ViewType) => void;
  onDateChange: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const VIEW_MAP: Record<ViewType, string> = {
  day: "timeGridDay",
  week: "timeGridWeek",
  month: "dayGridMonth",
};

export function CalendarView({
  events,
  previewEvents,
  currentView,
  onEventClick,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Map CalendarEvent[] to FullCalendar event format
  const fcEvents = [
    ...events.map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      classNames: e.isGenerated ? ["brk-generated"] : ["brk-external"],
      backgroundColor: e.isGenerated ? "#2BA8A2" : "#5DADE2",
      borderColor: e.isGenerated ? "#1E8C86" : "#3498DB",
      textColor: "#fff",
      extendedProps: { isGenerated: e.isGenerated, isCompleted: e.isCompleted },
    })),
    ...previewEvents.map((e) => ({
      id: `preview-${e.id}`,
      title: e.title,
      start: e.start,
      end: e.end,
      classNames: ["brk-preview"],
      backgroundColor: "#14b8a6",
      borderColor: "#0d9488",
      textColor: "#fff",
      display: "auto" as const,
    })),
  ];

  const handleEventClick = (info: any) => {
    if (onEventClick) {
      const props = info.event.extendedProps;
      onEventClick({
        id: info.event.id,
        title: info.event.title,
        start: info.event.startStr,
        end: info.event.endStr,
        isAllDay: info.event.allDay,
        isGenerated: props.isGenerated ?? false,
        isCompleted: props.isCompleted ?? false,
        source: props.isGenerated ? "brkroutnxdle" : "google",
      });
    }
  };

  return (
    <div style={{ padding: "16px", height: "100%" }}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={VIEW_MAP[currentView] ?? "timeGridWeek"}
        events={fcEvents}
        headerToolbar={false}
        height="100%"
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        allDaySlot={false}
        nowIndicator={true}
        editable={false}
        selectable={false}
        eventClick={handleEventClick}
      />
    </div>
  );
}
```

### Step 10: Update `apps/web/src/pages/DashboardPage.tsx` — Wire layout and calendar

Replace the existing placeholder with:

```tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { useCalendarEvents } from "../hooks/useCalendar";
import { MainLayout } from "../components/MainLayout";
import { CalendarView } from "../components/CalendarView";
import { SettingsModal } from "../components/SettingsModal";
import type { ViewType } from "@brkroutnxdle/shared";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [currentView, setCurrentView] = useState<ViewType>("week" as ViewType);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Fetch events (will run on mount and when date changes)
  const timeMin = new Date(currentDate.getTime() - 3 * 86400_000).toISOString();
  const timeMax = new Date(currentDate.getTime() + 10 * 86400_000).toISOString();
  // useCalendarEvents(timeMin, timeMax); // Will be wired when backend is ready

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (currentView === "day") d.setDate(d.getDate() - 1);
    else if (currentView === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (currentView === "day") d.setDate(d.getDate() + 1);
    else if (currentView === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => setCurrentDate(new Date());

  return (
    <>
      <MainLayout
        currentDate={currentDate}
        currentView={currentView}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onViewChange={setCurrentView}
        onSettingsClick={() => setSettingsOpen(true)}
      >
        <CalendarView
          events={events}
          previewEvents={[]}
          currentView={currentView}
          currentDate={currentDate}
          onViewChange={setCurrentView}
          onDateChange={setCurrentDate}
        />
      </MainLayout>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
```

### Step 11: Update `apps/web/src/main.tsx` — Add providers

Update the provider tree:

```tsx
import { SettingsProvider } from "./contexts/SettingsContext";
import { CalendarProvider } from "./contexts/CalendarContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <CalendarProvider>
            <App />
          </CalendarProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
```
