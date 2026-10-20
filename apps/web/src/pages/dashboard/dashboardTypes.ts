import type { Task, BlockedSlot, ViewType, CalendarEvent } from "@brkroutnxdle/shared";
import type { AllocationFailure } from "@brkroutnxdle/domain";

/**
 * Shared prop/state contracts for the Dashboard decomposition.
 *
 * These are the STABLE interfaces that TASK-07 and the Phase 6 lanes consume
 * instead of editing `DashboardPage.tsx` directly (`M9`, `P-8`).
 */

/** A calendar slot selection (ISO start/end strings). */
export interface DashboardSlotSelection {
  start: string;
  end: string;
}

/** Pre-filled values for creating a block from a slot click. */
export interface DashboardBlockPrefill {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

/** Calendar-refresh conflict state. */
export interface DashboardConflictState {
  hasConflicts: boolean;
  changedEvents: string[];
}

/** Save lifecycle status (mirrors `useSaveSchedule`). */
export type DashboardSaveStatus = "idle" | "saving" | "success" | "error";

/** Contract returned by `useCalendarNavigation()`. */
export interface DashboardCalendarNav {
  currentView: ViewType;
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  setCurrentView: (view: ViewType) => void;
  setCurrentDate: (date: Date) => void;
}

/** Contract returned by `useDashboardModals()` — the single modal-state owner. */
export interface DashboardModalState {
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  selectedSlot: DashboardSlotSelection | null;
  setSelectedSlot: (slot: DashboardSlotSelection | null) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  editingBlock: BlockedSlot | null;
  setEditingBlock: (block: BlockedSlot | null) => void;
  creatingBlockPrefill: DashboardBlockPrefill | null;
  setCreatingBlockPrefill: (prefill: DashboardBlockPrefill | null) => void;
  tokenModalOpen: boolean;
  setTokenModalOpen: (open: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

/** Subset of `useScheduleEditing()` that `DashboardModals` renders against. */
export interface DashboardEditingControls {
  deleteTarget: { id: string; title: string } | null;
  confirmDelete: () => void;
  cancelDelete: () => void;
}

/** Props for `<DashboardModals />` — pure rendering, no state, no new copy. */
export interface DashboardModalsProps {
  modals: DashboardModalState;
  editing: DashboardEditingControls;
  conflictState: DashboardConflictState;
  onCreateBlockFromSlot: (start: string, end: string) => void;
  onCreateTaskInline: (name: string, duration: number, start: string, end: string) => void;
  onCalendarRetry: () => void;
  onReload: () => void;
  onDiscardPreview: () => void;
}

/** Raw status inputs consumed by `StatusBar`. */
export interface DashboardStatusState {
  saveStatus: DashboardSaveStatus;
  saveError: string | null;
  calendarIsError: boolean;
  calendarError: Error | null;
  calendarIsLoading: boolean;
  calendarIsFetching: boolean;
  isPreviewActive: boolean;
  failurePanelOpen: boolean;
  allocationFailures: AllocationFailure[];
}

/** Props for `<StatusBar />` — one mutually-exclusive region above the calendar. */
export interface DashboardStatusBarProps extends DashboardStatusState {
  onSaveRetry: () => void;
  onCalendarRetry: () => void;
  onDismissFailures: () => void;
}

/** Drag payload dropped from the task/block panels onto the calendar. */
export interface DashboardExternalDragData {
  type?: string;
  title: string;
  taskId?: string;
  duration?: number;
}

/** Info payload delivered to `useExternalDrop()`'s handler. */
export interface DashboardExternalDropInfo {
  dateStr: string;
  allDay: boolean;
  dragData: DashboardExternalDragData;
}

/** Contract returned by `useExternalDrop()`. */
export type DashboardExternalDropHandler = (info: DashboardExternalDropInfo) => void;

/** Props accepted by the `CalendarView` event list (kept for consumers). */
export type DashboardCalendarEvent = CalendarEvent;
