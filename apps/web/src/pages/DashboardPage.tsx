import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { useTaskContext } from "../contexts/TaskContext";
import { useCalendarEvents } from "../hooks/useCalendar";
import { useScheduleGeneration } from "../hooks/useScheduleGeneration";
import { useScheduleEditing } from "../hooks/useScheduleEditing";
import { useSaveSchedule } from "../hooks/useSaveSchedule";
import { usePreview } from "../contexts/PreviewContext";
import { useCompletion } from "../hooks/useCompletion";
import { useCalendarRefresh } from "../hooks/useCalendarRefresh";
import { MainLayout } from "../components/MainLayout";
import { CalendarView } from "../components/CalendarView";
import { SettingsModal } from "../components/SettingsModal";
import { CalculateWeekButton } from "../features/preview/CalculateWeekButton";
import { PreviewToolbar } from "../features/preview/PreviewToolbar";
import { AllocationFailurePanel } from "../features/preview/AllocationFailurePanel";
import { DeleteEventDialog } from "../features/preview/DeleteEventDialog";
import { RefreshButton } from "../features/completion/RefreshButton";
import { ConflictDialog } from "../features/completion/ConflictDialog";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import type { ViewType, CalendarEvent } from "@brkroutnxdle/shared";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { tasks } = useTaskContext();
  const { generateWeek, generateAgain, discard, isGenerating } = useScheduleGeneration();
  const { isPreviewActive, previewEvents, allocationFailures } = usePreview();
  const editing = useScheduleEditing();
  const { saveState, save, resetSaveState } = useSaveSchedule();
  const [currentView, setCurrentView] = useState<ViewType>("week" as ViewType);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [failurePanelOpen, setFailurePanelOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [conflictState, setConflictState] = useState<{
    hasConflicts: boolean;
    changedEvents: string[];
  }>({ hasConflicts: false, changedEvents: [] });

  const { toggleCompletion } = useCompletion();
  const calendarRefresh = useCalendarRefresh();
  const { clearPreview } = usePreview();

  useUnsavedChanges(isPreviewActive);

  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      if (event.isGenerated) toggleCompletion(event.id, event.isCompleted);
    },
    [toggleCompletion],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const conflicts = await calendarRefresh.detectConflicts();
      setConflictState(conflicts);
    } finally {
      setIsRefreshing(false);
    }
  }, [calendarRefresh]);

  const handleReload = useCallback(() => {
    calendarRefresh.refreshFromApi();
    setConflictState({ hasConflicts: false, changedEvents: [] });
  }, [calendarRefresh]);

  const handleDiscardPreview = useCallback(() => {
    clearPreview();
    setConflictState({ hasConflicts: false, changedEvents: [] });
  }, [clearPreview]);

  // Fetch events (will run on mount and when date changes)
  const timeMin = new Date(currentDate.getTime() - 3 * 86400_000).toISOString();
  const timeMax = new Date(currentDate.getTime() + 10 * 86400_000).toISOString();
  // useCalendarEvents(timeMin, timeMax); // Will be wired when backend is ready

  // Map GeneratedEvent[] to CalendarEvent[] for the CalendarView
  const mappedPreviewEvents: CalendarEvent[] = useMemo(() => {
    return previewEvents.map((ge) => {
      const task = tasks.find((t) => t.id === ge.taskId);
      return {
        id: ge.id,
        title: task?.title ?? ge.taskId,
        start: ge.start,
        end: ge.end,
        isAllDay: false,
        isGenerated: true,
        taskId: ge.taskId,
        isCompleted: ge.completed,
        source: "brkroutnxdle" as const,
      };
    });
  }, [previewEvents, tasks]);

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

  const handleSave = () => {
    if (saveState.status === "error") {
      resetSaveState();
    }
    save();
  };

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
        <div style={{ padding: "12px 16px 0", display: "flex", gap: "12px", alignItems: "center" }}>
          {!isPreviewActive ? (
            <CalculateWeekButton
              onClick={generateWeek}
              disabled={false}
              isLoading={isGenerating}
            />
          ) : (
            <PreviewToolbar
              onGenerateAgain={generateAgain}
              onDiscard={discard}
              isLoading={isGenerating}
              eventCount={previewEvents.length}
              onSave={handleSave}
              saveState={saveState}
            />
          )}
          <RefreshButton onClick={handleRefresh} isLoading={isRefreshing} />
        </div>

        {saveState.status === "success" && (
          <div
            style={{
              margin: "8px 16px 0",
              padding: "10px 16px",
              background: "#d4edda",
              borderRadius: "8px",
              color: "#155724",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            Schedule saved successfully!
          </div>
        )}

        {saveState.status === "error" && (
          <div
            style={{
              margin: "8px 16px 0",
              padding: "10px 16px",
              background: "#f8d7da",
              borderRadius: "8px",
              color: "#721c24",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Error: {saveState.error}</span>
            <button
              onClick={handleSave}
              style={{
                padding: "4px 16px",
                border: "2px solid #721c24",
                borderRadius: "9999px",
                background: "transparent",
                color: "#721c24",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "12px",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {isPreviewActive && failurePanelOpen && (
          <div style={{ padding: "0 16px" }}>
            <AllocationFailurePanel
              failures={allocationFailures}
              onDismiss={() => setFailurePanelOpen(false)}
            />
          </div>
        )}

        <CalendarView
          events={events}
          previewEvents={mappedPreviewEvents}
          currentView={currentView}
          currentDate={currentDate}
          onViewChange={setCurrentView}
          onDateChange={setCurrentDate}
          editable={isPreviewActive}
          onEventDrop={editing.handleEventDrop}
          onEventResize={editing.handleEventResize}
          onDeleteRequest={editing.requestDelete}
          onEventClick={handleEventClick}
        />
      </MainLayout>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <DeleteEventDialog
        isOpen={editing.deleteTarget !== null}
        eventTitle={editing.deleteTarget?.title ?? ""}
        onConfirm={editing.confirmDelete}
        onCancel={editing.cancelDelete}
      />

      <ConflictDialog
        isOpen={conflictState.hasConflicts}
        changedEventCount={conflictState.changedEvents.length}
        onReload={handleReload}
        onDiscardPreview={handleDiscardPreview}
      />
    </>
  );
}
