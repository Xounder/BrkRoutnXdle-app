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
import { useBlockContext } from "../contexts/BlockContext";
import { CreateActionModal } from "../features/shared/CreateActionModal";
import { TaskModal } from "../features/tasks/TaskModal";
import { BlockModal } from "../features/blocks/BlockModal";
import type { ViewType, CalendarEvent, Task, BlockedSlot } from "@brkroutnxdle/shared";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { tasks } = useTaskContext();
  const { blocks } = useBlockContext();
  const { generateWeek, generateAgain, discard, isGenerating } = useScheduleGeneration();
  const { isPreviewActive, previewEvents, allocationFailures } = usePreview();
  const handleExternalEventChange = useCallback(
    (id: string, startStr: string, endStr: string) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, start: startStr, end: endStr } : e)),
      );
    },
    [],
  );

  const editing = useScheduleEditing(handleExternalEventChange);
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

  // Modal state for empty-slot creation
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);

  // Modal state for editing existing items
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingBlock, setEditingBlock] = useState<BlockedSlot | null>(null);

  // State for creating a block from a slot click (pre-filled values)
  const [creatingBlockPrefill, setCreatingBlockPrefill] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);

  // State for creating a task from a slot click (pre-filled duration)
  const [creatingTaskDuration, setCreatingTaskDuration] = useState<number | null>(null);

  const { toggleCompletion } = useCompletion();
  const calendarRefresh = useCalendarRefresh();
  const { clearPreview } = usePreview();

  useUnsavedChanges(isPreviewActive);

  // Handle empty slot selection — show CreateActionModal
  const handleSelect = useCallback(
    (info: { start: string; end: string }) => {
      setSelectedSlot(info);
    },
    [],
  );

  // Handle click on existing event — open edit modal
  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      if (event.isBlock) {
        // Block event: extract block id from "block-{id}" prefix
        const blockId = event.id.replace(/^block-/, "");
        const block = blocks.find((b) => b.id === blockId);
        if (block) {
          setEditingBlock(block);
        }
      } else if (event.isGenerated) {
        // Task event: find task by id
        const task = tasks.find((t) => t.id === event.id);
        if (task) {
          setEditingTask(task);
        }
      }
    },
    [blocks, tasks],
  );

  // CreateActionModal: user chose to create a Block
  const handleCreateBlockFromSlot = useCallback(
    (start: string, end: string) => {
      setSelectedSlot(null);
      // Extract date portion (YYYY-MM-DD) from ISO strings
      const startDate = start.substring(0, 10);
      const endDate = end.substring(0, 10);
      setCreatingBlockPrefill({ startDate, endDate });
    },
    [],
  );

  // CreateActionModal: user chose to create a Task
  const handleCreateTaskFromSlot = useCallback(
    (start: string, end: string) => {
      setSelectedSlot(null);
      const durationMin = Math.round(
        (new Date(end).getTime() - new Date(start).getTime()) / 60000,
      );
      setCreatingTaskDuration(durationMin);
    },
    [],
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
          blocks={blocks}
          currentView={currentView}
          currentDate={currentDate}
          onViewChange={setCurrentView}
          onDateChange={setCurrentDate}
          onEventDrop={editing.handleEventDrop}
          onEventResize={editing.handleEventResize}
          onDeleteRequest={editing.requestDelete}
          onEventClick={handleEventClick}
          onSelect={handleSelect}
          onEventDragStart={editing.handleEventDragStart}
          onEventDragStop={editing.handleEventDragStop}
          validateDrop={(startStr, endStr) =>
            editing.canDropAt(startStr, endStr)
          }
          scrollTime={`${String(settings.workStartHour).padStart(2, "0")}:00:00`}
          slotMinTime={`${String(settings.workStartHour).padStart(2, "0")}:00:00`}
          slotMaxTime={`${String(Math.min(settings.workEndHour + 1, 24)).padStart(2, "0")}:00:00`}
        />
      </MainLayout>

      {/* CreateActionModal: appears when an empty calendar slot is selected */}
      {selectedSlot && (
        <CreateActionModal
          start={selectedSlot.start}
          end={selectedSlot.end}
          onCreateBlock={handleCreateBlockFromSlot}
          onCreateTask={handleCreateTaskFromSlot}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      {/* TaskModal: creating a task from a slot click */}
      {creatingTaskDuration !== null && (
        <TaskModal
          task={null}
          defaultDuration={creatingTaskDuration}
          onClose={() => setCreatingTaskDuration(null)}
        />
      )}

      {/* BlockModal: creating a block from a slot click */}
      {creatingBlockPrefill !== null && (
        <BlockModal
          block={null}
          defaultStartDate={creatingBlockPrefill.startDate}
          defaultEndDate={creatingBlockPrefill.endDate}
          onClose={() => setCreatingBlockPrefill(null)}
        />
      )}

      {/* TaskModal: editing an existing task */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* BlockModal: editing an existing block */}
      {editingBlock && (
        <BlockModal
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
        />
      )}

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
