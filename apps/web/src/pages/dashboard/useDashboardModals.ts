import { useCallback, useState } from "react";
import type { Task, BlockedSlot, CalendarEvent } from "@brkroutnxdle/shared";
import type {
  DashboardBlockPrefill,
  DashboardModalState,
  DashboardSlotSelection,
} from "./dashboardTypes";

/**
 * The single modal-state owner for the dashboard.
 *
 * Holds no JSX and no behaviour beyond opening/closing the modals — all modal
 * rendering lives in `DashboardModals.tsx`.
 */
export function useDashboardModals(): DashboardModalState {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<DashboardSlotSelection | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [reviewOccurrence, setReviewOccurrence] = useState<CalendarEvent | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [reviewingBlocks, setReviewingBlocks] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockedSlot | null>(null);
  const [creatingBlockPrefill, setCreatingBlockPrefill] =
    useState<DashboardBlockPrefill | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  return {
    settingsOpen,
    setSettingsOpen,
    selectedSlot,
    setSelectedSlot,
    editingTask,
    setEditingTask,
    reviewOccurrence,
    setReviewOccurrence,
    creatingTask,
    setCreatingTask,
    reviewingBlocks,
    setReviewingBlocks,
    editingBlock,
    setEditingBlock,
    creatingBlockPrefill,
    setCreatingBlockPrefill,
    tokenModalOpen,
    setTokenModalOpen,
    openSettings,
    closeSettings,
  };
}
