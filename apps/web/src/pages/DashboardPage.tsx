import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { useTaskContext } from "../contexts/TaskContext";
import { useCalendar, useCalendarEvents } from "../hooks/useCalendar";
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
import { SaveButton } from "../features/preview/SaveButton";
import { Priority as PriorityEnum, BlockType as BlockTypeEnum } from "@brkroutnxdle/shared";
import type { ViewType, CalendarEvent, Task, BlockedSlot } from "@brkroutnxdle/shared";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { tasks, createTask } = useTaskContext();
  const { blocks, createBlock } = useBlockContext();
  const { generateWeek, generateAgain, discard, isGenerating } = useScheduleGeneration();
  const { isPreviewActive, previewEvents, allocationFailures, clearPreview } = usePreview();
  const { events, setEvents } = useCalendar();
  const handleExternalEventChange = useCallback(
    (id: string, startStr: string, endStr: string) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, start: startStr, end: endStr } : e)),
      );
      setHasUnsavedChanges(true);
    },
    [],
  );
  const editing = useScheduleEditing(handleExternalEventChange);
  const { saveState, save, resetSaveState } = useSaveSchedule();
  const [currentView, setCurrentView] = useState<ViewType>("week" as ViewType);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [failurePanelOpen, setFailurePanelOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [conflictState, setConflictState] = useState<{
    hasConflicts: boolean;
    changedEvents: string[];
  }>({ hasConflicts: false, changedEvents: [] });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (saveState.status === "success") {
      setHasUnsavedChanges(false);
    }
  }, [saveState.status]);

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
    startTime: string;
    endTime: string;
  } | null>(null);



  const { toggleCompletion } = useCompletion();
  const calendarRefresh = useCalendarRefresh();
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
      // Extract date and time portions from ISO strings
      const startDate = start.substring(0, 10);
      const endDate = end.substring(0, 10);
      const startTime = start.slice(11, 16);
      const endTime = end.slice(11, 16);
      setCreatingBlockPrefill({ startDate, endDate, startTime, endTime });
    },
    [],
  );

  // CreateActionModal: inline task creation from slot
  const handleCreateTaskInline = useCallback(
    (name: string, duration: number, start: string, end: string) => {
      const task = createTask({
        title: name,
        duration,
        priority: PriorityEnum.Medium,
        frequency: 1,
        gapDays: 1,
        allowSameDay: false,
        description: undefined,
        isActive: true,
        restrictions: [],
      });

      setEvents((prev) => [
        ...prev,
        {
          id: task.id,
          title: task.title,
          start,
          end,  // Use actual end from user selection, NOT start + duration
          isAllDay: false,
          isGenerated: true,
          taskId: task.id,
          isCompleted: false,
          source: "brkroutnxdle",
        },
      ]);
      setHasUnsavedChanges(true);
      setSelectedSlot(null);
    },
    [createTask],
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
  useCalendarEvents(timeMin, timeMax);

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

  const handleExternalDrop = useCallback(
    (info: { dateStr: string; allDay: boolean; dragData: any }) => {
      const { dateStr, allDay, dragData } = info;
      const workStartHour = settings.workStartHour;
      const start = allDay || !dateStr.includes("T")
        ? `${dateStr.slice(0, 10)}T${String(workStartHour).padStart(2, "0")}:00:00`
        : dateStr;
      const startDate = new Date(start);
      let end: string;

      if (dragData.type === "task") {
        const duration = dragData.duration || 30;
        const endDate = new Date(startDate.getTime() + duration * 60000);
        end = endDate.toISOString().slice(0, 19);
      } else if (dragData.type === "block") {
        const endDate = new Date(startDate.getTime() + 60 * 60000);
        end = endDate.toISOString().slice(0, 19);
      } else {
        return;
      }

      if (!editing.canDropAt(start, end)) return;

      if (dragData.type === "task") {
        setEvents((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            title: dragData.title,
            start,
            end,
            isAllDay: false,
            isGenerated: true,
            taskId: dragData.taskId,
            isCompleted: false,
            source: "brkroutnxdle",
          },
        ]);
        setHasUnsavedChanges(true);
      } else if (dragData.type === "block") {
        createBlock({
          title: dragData.title || "Blocked",
          blockType: BlockTypeEnum.SingleDay,
          startDate: start,
          endDate: end,
        });
        setHasUnsavedChanges(true);
      }
    },
    [editing.canDropAt, setEvents, createBlock, settings],
  );

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
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ padding: "12px 16px 0", display: "flex", gap: "12px", alignItems: "center" }}>
            {!isPreviewActive ? (
              <>
                <CalculateWeekButton
                  onClick={generateWeek}
                  disabled={false}
                  isLoading={isGenerating}
                />
                <SaveButton
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                  isSaving={saveState.status === "saving"}
                  progress={saveState.progress}
                />
              </>
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
              <span>Error: {saveState.error ?? "An unknown error occurred"}</span>
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

          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            <CalendarView
              events={events}
              previewEvents={mappedPreviewEvents}
              blocks={blocks}
              use12h={settings.use12h}
              currentView={currentView}
              currentDate={currentDate}
              onViewChange={setCurrentView}
              onDateChange={setCurrentDate}
              onEventDrop={editing.handleEventDrop}
              onEventResize={editing.handleEventResize}
              onDeleteRequest={editing.requestDelete}
              onEventClick={handleEventClick}
              onSelect={handleSelect}
              onExternalDrop={handleExternalDrop}
              onEventDragStart={editing.handleEventDragStart}
              onEventDragStop={editing.handleEventDragStop}
              validateDrop={(startStr, endStr) =>
                editing.canDropAt(startStr, endStr)
              }
              scrollTime={`${String(settings.workStartHour).padStart(2, "0")}:00:00`}
              slotMinTime={`${String(settings.workStartHour).padStart(2, "0")}:00:00`}
              slotMaxTime={`${String(Math.min(settings.workEndHour + 1, 24)).padStart(2, "0")}:00:00`}
            />
          </div>
        </div>
      </MainLayout>

      {/* CreateActionModal: appears when an empty calendar slot is selected */}
      {selectedSlot && (
        <CreateActionModal
          start={selectedSlot.start}
          end={selectedSlot.end}
          onCreateBlock={handleCreateBlockFromSlot}
          onCreateTaskInline={handleCreateTaskInline}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      {/* BlockModal: creating a block from a slot click */}
      {creatingBlockPrefill !== null && (
        <BlockModal
          block={null}
          defaultStartDate={creatingBlockPrefill.startDate}
          defaultEndDate={creatingBlockPrefill.endDate}
          defaultStartTime={creatingBlockPrefill.startTime}
          defaultEndTime={creatingBlockPrefill.endTime}
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
