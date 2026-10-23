import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
import { calendarErrorMessage, isAuthTokenExpiredError } from "../services/api";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { appendCalendarEventForTask } from "../utils/createCalendarEventFromTask";
import { Priority as PriorityEnum } from "@brkroutnxdle/shared";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { DashboardModals } from "./dashboard/DashboardModals";
import { useCalendarNavigation } from "./dashboard/useCalendarNavigation";
import { useDashboardModals } from "./dashboard/useDashboardModals";
import { useExternalDrop } from "./dashboard/useExternalDrop";
import { previewOverlay, viewedWeek } from "./dashboard/previewSchedule";
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
  const nav = useCalendarNavigation();
  const previewRange = useMemo(() => viewedWeek(nav.currentDate, settings.timezone, settings.weekStartDay),
    [nav.currentDate, settings.timezone, settings.weekStartDay]);
  const calendarRange = useMemo(() => {
    if (nav.currentView !== "month") return previewRange;
    const first = viewedWeek(new Date(nav.currentDate.getFullYear(), nav.currentDate.getMonth(), 1),
      settings.timezone, settings.weekStartDay);
    const last = viewedWeek(new Date(nav.currentDate.getFullYear(), nav.currentDate.getMonth() + 1, 0),
      settings.timezone, settings.weekStartDay);
    return { timeMin: first.timeMin, timeMax: last.timeMax };
  }, [nav.currentView, nav.currentDate, previewRange, settings.timezone, settings.weekStartDay]);
  const { generateWeek, generateAgain, discard, isGenerating } = useScheduleGeneration(previewRange);
  const { isPreviewActive: active, previewEvents, allocationFailures, result, message, replacementBaseline } = usePreview();
  const isPreviewActive = active && result?.weekStart === previewRange.timeMin && result?.weekEnd === previewRange.timeMax;
  const { events, setEvents } = useCalendar();

  const [failurePanelOpen, setFailurePanelOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<{ kind: "loading" | "success" | "partial" | "conflict" | "error"; message: string } | null>(null);
  const refreshRequest = useRef(0);
  const refreshing = useRef(false);
  const currentRefreshRange = useRef("");
  currentRefreshRange.current = `${calendarRange.timeMin}/${calendarRange.timeMax}/${nav.currentView}/${nav.currentDate.getTime()}`;
  const [conflictState, setConflictState] = useState<DashboardConflictState>({
    hasConflicts: false,
    changedEvents: [],
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
  const { saveState, save, resetSaveState } = useSaveSchedule({ range: previewRange });
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
        const task = tasks.find((t) => t.id === event.taskId);
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
    if (refreshing.current) return;
    refreshing.current = true;
    const request = ++refreshRequest.current;
    const requestedRange = currentRefreshRange.current;
    setIsRefreshing(true);
    setRefreshStatus({ kind: "loading", message: "Refreshing viewed calendar range..." });
    try {
      const conflicts = await calendarRefresh.refresh(calendarRange, isPreviewActive,
        () => refreshRequest.current === request && currentRefreshRange.current === requestedRange);
      if (request !== refreshRequest.current || !conflicts) return;
      setConflictState(conflicts);
      setRefreshStatus(conflicts.hasConflicts
        ? { kind: "conflict", message: `${conflicts.changedEvents.length} remote calendar change(s) conflict with this preview. Reload or discard the preview; manual placements are preserved.` }
        : !conflicts.baselineKnown && isPreviewActive
          ? { kind: "partial", message: "Calendar refreshed, but no prior remote snapshot was available to compare this preview. Regenerate the preview before saving." }
        : { kind: "success", message: "Viewed calendar range refreshed successfully. Pending placements were preserved." });
    } catch (error) {
      if (request === refreshRequest.current) setRefreshStatus({ kind: "error", message: calendarErrorMessage(error) });
    } finally {
      if (request === refreshRequest.current) {
        refreshing.current = false;
        setIsRefreshing(false);
      }
    }
  }, [calendarRefresh, calendarRange, isPreviewActive]);

  const handleReload = useCallback(() => {
    discard();
    setConflictState({ hasConflicts: false, changedEvents: [] });
  }, [discard]);

  const handleDiscardPreview = useCallback(() => {
    discard();
    setConflictState({ hasConflicts: false, changedEvents: [] });
  }, [discard]);

  // Fetch events (will run on mount and when date changes)
  const calendarQuery = useCalendarEvents(calendarRange.timeMin, calendarRange.timeMax);

  useEffect(() => {
    refreshRequest.current++;
    refreshing.current = false;
    setIsRefreshing(false);
    setRefreshStatus(null);
    setConflictState({ hasConflicts: false, changedEvents: [] });
  }, [calendarRange.timeMin, calendarRange.timeMax, nav.currentView, nav.currentDate]);

  const handleCalendarRetry = useCallback(() => {
    if (calendarQuery.isFetching) return;
    calendarQuery.refetch().catch(() => undefined);
  }, [calendarQuery]);

  useEffect(() => {
    if (calendarQuery.isError && isAuthTokenExpiredError(calendarQuery.error) && !refreshStatus) {
      setTokenModalOpen(true);
    } else {
      setTokenModalOpen(false);
    }
  }, [calendarQuery.isError, calendarQuery.error, refreshStatus, setTokenModalOpen]);

  // Map GeneratedEvent[] to CalendarEvent[] for the CalendarView
  const overlay = useMemo(() => isPreviewActive
    ? previewOverlay(events, previewEvents, previewRange, Date.now(), replacementBaseline)
    : { base: events, proposals: [] }, [events, previewEvents, previewRange, isPreviewActive, replacementBaseline]);
  const mappedPreviewEvents: CalendarEvent[] = useMemo(() => {
    return overlay.proposals.map((ge) => {
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
  }, [overlay.proposals, tasks]);

  const handleExternalDrop = useExternalDrop({
    settings,
    editing,
    setEvents,
    createBlock,
    setHasUnsavedChanges,
  });

  const handleSave = () => {
    if (active && !isPreviewActive) return;
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
                  disabled={isGenerating}
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

          {message && <div role="alert" style={{ margin: "8px 16px 0" }}>{message}</div>}

          <StatusBar
            saveStatus={saveState.status}
            saveError={saveState.error}
            calendarIsError={calendarQuery.isError}
            calendarError={calendarQuery.error ?? null}
            calendarIsLoading={calendarQuery.isLoading}
            calendarIsFetching={calendarQuery.isFetching}
            refreshStatus={refreshStatus}
            onRefreshRetry={handleRefresh}
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
              events={overlay.base}
              previewEvents={mappedPreviewEvents}
              blocks={blocks}
              use12h={settings.use12h}
              currentView={nav.currentView}
              currentDate={nav.currentDate}
              weekStartDay={settings.weekStartDay}
              onViewChange={nav.setCurrentView}
              onDateChange={nav.setCurrentDate}
              onEventDrop={editing.handleEventDrop}
              onEventResize={editing.handleEventResize}
              onDeleteRequest={editing.requestDelete}
              onEventClick={handleEventClick}
              onSelect={isPreviewActive ? undefined : handleSelect}
              onExternalDrop={isPreviewActive ? undefined : handleExternalDrop}
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
