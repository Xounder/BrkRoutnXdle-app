import { useState, useMemo, useCallback, useEffect } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { useTaskContext } from "../contexts/TaskContext";
import { useBlockContext } from "../contexts/BlockContext";
import { useCalendar, useCalendarEvents } from "../hooks/useCalendar";
import { useScheduleGeneration } from "../hooks/useScheduleGeneration";
import { useScheduleEditing } from "../hooks/useScheduleEditing";
import { useSaveSchedule } from "../hooks/useSaveSchedule";
import { usePreview } from "../contexts/PreviewContext";
import { useCalendarRefresh } from "../hooks/useCalendarRefresh";
import { MainLayout } from "../components/MainLayout";
import { StatusBar } from "../components/StatusBar";
import { CalendarToolbar } from "../components/calendar/CalendarToolbar";
import { CalendarView } from "../components/CalendarView";
import { CalculateWeekButton } from "../features/preview/CalculateWeekButton";
import { PreviewToolbar } from "../features/preview/PreviewToolbar";
import { SaveButton } from "../features/preview/SaveButton";
import { RefreshButton } from "../features/completion/RefreshButton";
import { isAuthTokenExpiredError } from "../services/api";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { appendCalendarEventForTask } from "../utils/createCalendarEventFromTask";
import { Priority as PriorityEnum } from "@brkroutnxdle/shared";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { DashboardModals } from "./dashboard/DashboardModals";
import { useCalendarNavigation } from "./dashboard/useCalendarNavigation";
import { useDashboardModals } from "./dashboard/useDashboardModals";
import { useExternalDrop } from "./dashboard/useExternalDrop";
import { getWeekEnd, getWeekStart } from "./dashboard/weekRange";
import type { DashboardConflictState } from "./dashboard/dashboardTypes";

/**
 * DashboardPage — the ONE and ONLY owner of this file for the entire delivery (`M9`, `P-8`).
 *
 * Later phases and TASK-07 MUST extend `pages/dashboard/dashboardTypes.ts` and the
 * extracted hooks (`useCalendarNavigation`, `useDashboardModals`, `useExternalDrop`,
 * `DashboardModals`) instead of re-inlining logic here. Keep this file a pure
 * orchestrator: context/hook wiring -> MainLayout -> action row -> StatusBar ->
 * CalendarToolbar -> calendar scroll container + CalendarView -> DashboardModals.
 */

export function DashboardPage() {
  const { settings } = useSettings();
  const { tasks, createTask } = useTaskContext();
  const { blocks, createBlock } = useBlockContext();
  const { generateWeek, generateAgain, discard, isGenerating } = useScheduleGeneration();
  const { isPreviewActive, previewEvents, allocationFailures, clearPreview } = usePreview();
  const { events, setEvents } = useCalendar();

  const [failurePanelOpen, setFailurePanelOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [conflictState, setConflictState] = useState<DashboardConflictState>({
    hasConflicts: false,
    changedEvents: [],
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const nav = useCalendarNavigation();
  const modals = useDashboardModals();
  const {
    setSelectedSlot,
    setEditingTask,
    setEditingBlock,
    setCreatingBlockPrefill,
    setTokenModalOpen,
    openSettings,
  } = modals;

  const handleExternalEventChange = useCallback(
    (id: string, startStr: string, endStr: string) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, start: startStr, end: endStr } : e)),
      );
      setHasUnsavedChanges(true);
    },
    [setEvents],
  );

  const editing = useScheduleEditing(handleExternalEventChange);
  const { saveState, save, resetSaveState } = useSaveSchedule();
  const calendarRefresh = useCalendarRefresh();
  useUnsavedChanges(isPreviewActive);

  useEffect(() => {
    if (saveState.status === "success") {
      setHasUnsavedChanges(false);
    }
  }, [saveState.status]);

  // Handle empty slot selection — show CreateActionModal
  const handleSelect = useCallback(
    (info: { start: string; end: string }) => {
      setSelectedSlot(info);
    },
    [setSelectedSlot],
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
    [blocks, tasks, setEditingBlock, setEditingTask],
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
    [setSelectedSlot, setCreatingBlockPrefill],
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

      setEvents((prev) =>
        appendCalendarEventForTask(prev, task, {
          start,
          end,
          settings,
        })
      );
      setHasUnsavedChanges(true);
      setSelectedSlot(null);
    },
    [createTask, setEvents, settings, setSelectedSlot],
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
  const prevWeekStart = getWeekStart(new Date(nav.currentDate.getTime() - 7 * 86400_000));
  const nextWeekEnd = getWeekEnd(new Date(nav.currentDate.getTime() + 7 * 86400_000));
  const calendarQuery = useCalendarEvents(
    prevWeekStart.toISOString(),
    nextWeekEnd.toISOString(),
  );

  const handleCalendarRetry = useCallback(() => {
    if (calendarQuery.isFetching) return;
    calendarQuery.refetch().catch(() => undefined);
  }, [calendarQuery]);

  useEffect(() => {
    if (calendarQuery.isError && isAuthTokenExpiredError(calendarQuery.error)) {
      setTokenModalOpen(true);
    } else if (!calendarQuery.isError) {
      setTokenModalOpen(false);
    }
  }, [calendarQuery.isError, calendarQuery.error, setTokenModalOpen]);

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

  const handleExternalDrop = useExternalDrop({
    settings,
    editing,
    setEvents,
    createBlock,
    setHasUnsavedChanges,
  });

  const handleSave = () => {
    if (saveState.status === "error") {
      resetSaveState();
    }
    save();
  };

  return (
    <>
      <MainLayout
        currentDate={nav.currentDate}
        currentView={nav.currentView}
        onPrev={nav.onPrev}
        onNext={nav.onNext}
        onToday={nav.onToday}
        onViewChange={nav.setCurrentView}
        onSettingsClick={openSettings}
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

          <StatusBar
            saveStatus={saveState.status}
            saveError={saveState.error}
            calendarIsError={calendarQuery.isError}
            calendarError={calendarQuery.error ?? null}
            calendarIsLoading={calendarQuery.isLoading}
            calendarIsFetching={calendarQuery.isFetching}
            isPreviewActive={isPreviewActive}
            failurePanelOpen={failurePanelOpen}
            allocationFailures={allocationFailures}
            onSaveRetry={handleSave}
            onCalendarRetry={
              isAuthTokenExpiredError(calendarQuery.error)
                ? () => setTokenModalOpen(true)
                : handleCalendarRetry
            }
            onDismissFailures={() => setFailurePanelOpen(false)}
          />

          <CalendarToolbar
            currentDate={nav.currentDate}
            currentView={nav.currentView}
            onPrev={nav.onPrev}
            onNext={nav.onNext}
            onToday={nav.onToday}
            onViewChange={nav.setCurrentView}
            hasUnsavedChanges={hasUnsavedChanges}
            settings={settings}
          />

          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            <CalendarView
              events={events}
              previewEvents={mappedPreviewEvents}
              blocks={blocks}
              use12h={settings.use12h}
              currentView={nav.currentView}
              currentDate={nav.currentDate}
              onViewChange={nav.setCurrentView}
              onDateChange={nav.setCurrentDate}
              onEventDrop={editing.handleEventDrop}
              onEventResize={editing.handleEventResize}
              onDeleteRequest={editing.requestDelete}
              onEventClick={handleEventClick}
              onSelect={handleSelect}
              onExternalDrop={handleExternalDrop}
              onEventDragStart={editing.handleEventDragStart}
              onEventDragStop={editing.handleEventDragStop}
              validateDrop={(startStr, endStr, draggedEventId) =>
                editing.canDropAt(startStr, endStr, draggedEventId)
              }
              scrollTime={`${String(settings.workStartHour).padStart(2, "0")}:00:00`}
              slotMinTime={`${String(settings.workStartHour).padStart(2, "0")}:00:00`}
              slotMaxTime={`${String(Math.min(settings.workEndHour + 1, 24)).padStart(2, "0")}:00:00`}
            />
          </div>
        </div>
      </MainLayout>

      <DashboardModals
        modals={modals}
        editing={editing}
        conflictState={conflictState}
        onCreateBlockFromSlot={handleCreateBlockFromSlot}
        onCreateTaskInline={handleCreateTaskInline}
        onCalendarRetry={handleCalendarRetry}
        onReload={handleReload}
        onDiscardPreview={handleDiscardPreview}
      />
    </>
  );
}
