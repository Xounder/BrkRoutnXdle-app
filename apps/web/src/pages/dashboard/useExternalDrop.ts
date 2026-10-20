import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { BlockType as BlockTypeEnum } from "@brkroutnxdle/shared";
import type { BlockedSlot, CalendarEvent, Settings } from "@brkroutnxdle/shared";
import type { DashboardExternalDropHandler } from "./dashboardTypes";

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
 * Moved verbatim from `DashboardPage`, including the manual local
 * `YYYY-MM-DDTHH:mm:00` string building and the `editing.canDropAt` guard. The
 * `crypto.randomUUID()` on dropped task events is preserved because the save
 * flow filters pending events by local UUID.
 */
export function useExternalDrop({
  settings,
  editing,
  setEvents,
  createBlock,
  setHasUnsavedChanges,
}: UseExternalDropArgs): DashboardExternalDropHandler {
  return useCallback(
    (info) => {
      const { dateStr, allDay, dragData } = info;
      const workStartHour = settings.workStartHour;
      const start =
        allDay || !dateStr.includes("T")
          ? `${dateStr.slice(0, 10)}T${String(workStartHour).padStart(2, "0")}:00:00`
          : dateStr;
      const startDate = new Date(start);
      let end: string;

      if (dragData.type === "task") {
        const duration = dragData.duration || 30;
        const endDate = new Date(startDate.getTime() + duration * 60000);
        const endYear = endDate.getFullYear();
        const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
        const endDay = String(endDate.getDate()).padStart(2, "0");
        const endHours = String(endDate.getHours()).padStart(2, "0");
        const endMinutes = String(endDate.getMinutes()).padStart(2, "0");
        end = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}:00`;
      } else if (dragData.type === "block") {
        const endDate = new Date(startDate.getTime() + 60 * 60000);
        const endYear = endDate.getFullYear();
        const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
        const endDay = String(endDate.getDate()).padStart(2, "0");
        const endHours = String(endDate.getHours()).padStart(2, "0");
        const endMinutes = String(endDate.getMinutes()).padStart(2, "0");
        end = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}:00`;
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
    [editing.canDropAt, setEvents, createBlock, settings, setHasUnsavedChanges],
  );
}
