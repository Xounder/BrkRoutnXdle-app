import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { BlockType as BlockTypeEnum } from "@brkroutnxdle/shared";
import type { BlockedSlot, CalendarEvent, Settings } from "@brkroutnxdle/shared";
import type { DashboardExternalDropHandler } from "./dashboardTypes";
import { dropInterval } from "../../utils/placementInterval";
import { useTasks } from "../../hooks/useTasks";

/** Minimal editing surface `handleExternalDrop` depends on. */
interface EditingDropGuard {
  canDropAt: (startStr: string, endStr: string, draggedEventId?: string) => boolean;
}

interface UseExternalDropArgs {
  settings: Settings;
  editing: EditingDropGuard;
  setEvents: Dispatch<SetStateAction<CalendarEvent[]>>;
  createBlock: (partial: Omit<BlockedSlot, "id" | "isRecurring">) => BlockedSlot;
  setHasUnsavedChanges: (value: boolean) => void;
}

/**
 * Builds the calendar external-drop handler.
 *
 * Both endpoints use the same UTC instant policy before overlap checks or storage.
 */
export function useExternalDrop({
  settings,
  editing,
  setEvents,
  createBlock,
  setHasUnsavedChanges,
}: UseExternalDropArgs): DashboardExternalDropHandler {
  const { tasks } = useTasks();
  return useCallback(
    (info) => {
      const { dateStr, allDay, dragData } = info;
      if (dragData.type !== "task" && dragData.type !== "block") return "This item cannot be placed on the calendar.";
      if (dragData.type === "task" && (!dragData.title?.trim() || !dragData.taskId ||
        !tasks.some(task => task.id === dragData.taskId && task.title === dragData.title && task.duration === dragData.duration)))
        return "This task has changed. Reopen Tasks and drag its current card.";
      let interval: { start: string; end: string };
      try {
        interval = dropInterval(dateStr, allDay, settings.workStartHour,
          dragData.type === "task" ? dragData.duration as number : 60);
      } catch {
        return "Invalid task duration or calendar date.";
      }
      const { start, end } = interval;

      if (!editing.canDropAt(start, end)) return "This time is unavailable. Choose a future, free working-hours slot.";

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
            isPinned: true,
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
      return null;
    },
    [editing.canDropAt, setEvents, createBlock, settings, setHasUnsavedChanges, tasks],
  );
}
