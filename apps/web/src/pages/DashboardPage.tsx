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
import { useDashboardInsights } from "./dashboard/useDashboardInsights";
import { WeeklyReview } from "./dashboard/WeeklyReview";
import { FirstUseGuide } from "./dashboard/FirstUseGuide";
import { ProposedPlan } from "./dashboard/ProposedPlan";
import { useManualCalendarEdits } from "./dashboard/useManualCalendarEdits";
import { ElapsedWeekNotice } from "./dashboard/ElapsedWeekNotice";

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
  const { generateWeek, generateAgain, discard, isGenerating, inputKey } = useScheduleGeneration(previewRange);
  const { isPreviewActive: active, previewEvents, allocationFailures, result, message, replacementBaseline, inputKey: generatedKey } = usePreview();
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
  const { saveState, save, resetSaveState } = useSaveSchedule({ range: previewRange });
  const { hasUnsavedChanges, setHasUnsavedChanges, manualError, setManualError,
    handleExternalEventChange, retryManualStorage } = useManualCalendarEdits(events, setEvents, saveState.status);

  const modals = useDashboardModals();
  const {
    setSelectedSlot,
    setEditingTask,
    setReviewOccurrence,
    setEditingBlock,
    setCreatingBlockPrefill,
    setTokenModalOpen,
    openSettings,
  } = modals;

  const editing = useScheduleEditing(handleExternalEventChange, () => setHasUnsavedChanges(true), setManualError);
  // A partial write retains the original proposal and journal for explicit retry.
  const isPreviewActive = active && result?.weekStart === previewRange.timeMin &&
    result?.weekEnd === previewRange.timeMax && (generatedKey === inputKey || !!saveState.partial);
  const insights = useDashboardInsights(previewRange, tasks, isPreviewActive, previewEvents.length,
    saveState.status === "saving" || saveState.partial === true);
  const calendarRefresh = useCalendarRefresh();
  useUnsavedChanges(isPreviewActive);


  const handleSelect = useCallback(
    (info: { start: string; end: string }) => {
      setSelectedSlot(info);
    },
    [setSelectedSlot],
  );

  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      if (event.isBlock) {
        const blockId = event.id.replace(/^block-/, "");
        const block = blocks.find((b) => b.id === blockId);
        if (block) {
          setEditingBlock(block);
        }
      } else if (event.isGenerated) {
        if (insights.summary?.occurrences.some(occurrence => occurrence.id === event.id)) {
          setReviewOccurrence(event);
          return;
        }
        const task = tasks.find((t) => t.id === event.taskId);
        if (task) {
          setEditingTask(task);
        }
      }
    },
    [blocks, tasks, insights.summary, setEditingBlock, setEditingTask, setReviewOccurrence],
  );

  const handleCreateBlockFromSlot = useCallback(
    (start: string, end: string) => {
      setSelectedSlot(null);
      const startDate = start.substring(0, 10);
      const endDate = end.substring(0, 10);
      const startTime = start.slice(11, 16);
      const endTime = end.slice(11, 16);
      setCreatingBlockPrefill({ startDate, endDate, startTime, endTime });
    },
    [setSelectedSlot, setCreatingBlockPrefill],
  );

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
  const availableTaskIds = useMemo(() => new Set(tasks.map(task => task.id)), [tasks]);
  const reviewBlocks = () => modals.setReviewingBlocks(true);

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
                  disabled={!hasUnsavedChanges || !!manualError}
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
          <ElapsedWeekNotice range={previewRange} settings={settings} onNext={nav.onNext} onSettings={openSettings} />
          {manualError && <div role="alert">{manualError} <button type="button" onClick={retryManualStorage}>Retry storage</button></div>}

          <FirstUseGuide step={insights.step} dismissed={insights.dismissed} onDismiss={insights.dismiss}
            onCreate={() => modals.setCreatingTask(true)} onCalculate={generateWeek}
            onPreview={() => document.getElementById("proposed-plan")?.scrollIntoView()} />
          <WeeklyReview range={previewRange} timezone={settings.timezone} snapshot={insights.snapshot} summary={insights.summary} />
          {isPreviewActive && <ProposedPlan proposals={previewEvents.length} failures={allocationFailures}
            reviewBlocks={reviewBlocks} />}

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
            editTask={id => { const task = tasks.find(item => item.id === id); if (task) setEditingTask(task); }}
            reviewBlocks={reviewBlocks} settings={openSettings} regenerate={generateAgain}
            availableTaskIds={availableTaskIds}
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
              previewActive={active}
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
        onDiscardPreview={handleReload}
        range={previewRange}
        confirmedOccurrence={insights.summary?.occurrences.find(event => event.id === modals.reviewOccurrence?.id) ?? null}
      />
    </>
  );
}
