import { useState, useCallback } from "react";
import { usePreview } from "../contexts/PreviewContext";
import { useCalendar } from "../contexts/CalendarContext";
import { useSettings } from "../contexts/SettingsContext";
import { useBlockContext } from "../contexts/BlockContext";
import { BlockType as BlockTypeEnum } from "@brkroutnxdle/shared";

interface FcEventInfo {
  event: {
    id: string;
    startStr: string;
    endStr: string;
    extendedProps?: Record<string, unknown>;
  };
  revert?: () => void;
}

interface EditingState {
  isDragging: boolean;
  isResizing: boolean;
  deleteTarget: { id: string; title: string } | null;
}

/** Extract "HH:mm" from an ISO-8601 string. */
function extractTime(isoStr: string): string {
  return isoStr.slice(11, 16);
}

/** Convert "HH:mm" to total minutes. */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

export function useScheduleEditing(
  onExternalEventChange?: (id: string, startStr: string, endStr: string) => void,
) {
  const { previewEvents, allocationFailures, setPreview } = usePreview();
  const { events } = useCalendar();
  const { settings } = useSettings();
  const { blocks, updateBlock, deleteBlock, getBlock } = useBlockContext();
  const [editing, setEditing] = useState<EditingState>({
    isDragging: false,
    isResizing: false,
    deleteTarget: null,
  });

  /** Validate drop position. */
  const canDropAt = useCallback(
    (startStr: string, endStr: string, excludeEventId?: string): boolean => {
      const startHour = new Date(startStr).getUTCHours();
      const endHour = new Date(endStr).getUTCHours();

      // Must be within available hours
      if (startHour < settings.workStartHour || endHour > settings.workEndHour + 1) {
        return false;
      }

      const newStart = new Date(startStr).getTime();
      const newEnd = new Date(endStr).getTime();

      // Must not overlap existing events
      for (const ev of events) {
        const evStart = new Date(ev.start).getTime();
        const evEnd = new Date(ev.end).getTime();
        if (newStart < evEnd && newEnd > evStart) {
          return false;
        }
      }

      // Must not overlap existing blocks (exclude the one being dragged)
      const excludeBlockId =
        excludeEventId?.startsWith("block-")
          ? excludeEventId.slice(6)
          : undefined;

      for (const block of blocks) {
        if (excludeBlockId && block.id === excludeBlockId) continue;

        const dropDate = new Date(startStr);
        const dropDayOfWeek = dropDate.getDay();

        if (block.blockType === BlockTypeEnum.SingleDay) {
          const bStart = new Date(block.startDate).getTime();
          const bEnd = block.endDate
            ? new Date(block.endDate).getTime()
            : bStart + 3_600_000;
          if (newStart < bEnd && newEnd > bStart) return false;
        } else if (
          block.blockType === BlockTypeEnum.RecurringWeekday ||
          block.blockType === BlockTypeEnum.RecurringPeriod
        ) {
          if (!block.daysOfWeek?.includes(dropDayOfWeek)) continue;

          const blockStartMin = timeToMinutes(block.startTime ?? "00:00");
          const blockEndMin = timeToMinutes(block.endTime ?? "23:59");
          const dropStartMin =
            dropDate.getUTCHours() * 60 + dropDate.getUTCMinutes();
          const dropEndMin =
            new Date(endStr).getUTCHours() * 60 +
            new Date(endStr).getUTCMinutes();

          if (dropStartMin < blockEndMin && dropEndMin > blockStartMin) return false;
        }
      }

      return true;
    },
    [events, settings, blocks],
  );

  /** Handle event drop (drag-and-drop). */
  const handleEventDrop = useCallback(
    (info: FcEventInfo) => {
      const extProps = info.event.extendedProps ?? {};

      // Validate drop position
      if (!canDropAt(info.event.startStr, info.event.endStr, info.event.id)) {
        info.revert?.();
        return;
      }

      // --- Block event ---
      if (extProps.isBlock) {
        const blockId = (extProps.blockId as string) ?? info.event.id.replace("block-", "");
        const block = getBlock(blockId);
        if (!block) return;

        if (block.blockType === BlockTypeEnum.SingleDay) {
          updateBlock(blockId, {
            startDate: info.event.startStr,
            endDate: info.event.endStr,
          });
        } else {
          // RecurringWeekday or RecurringPeriod — shift the time
          updateBlock(blockId, {
            startTime: extractTime(info.event.startStr),
            endTime: extractTime(info.event.endStr),
          });
        }
        return;
      }

      // --- Preview event ---
      if (extProps.isPreview) {
        const updatedEvents = previewEvents.map((e) => {
          if (e.id === info.event.id) {
            return {
              ...e,
              start: info.event.startStr,
              end: info.event.endStr,
              updatedAt: new Date().toISOString(),
            };
          }
          return e;
        });
        setPreview(updatedEvents, allocationFailures);
        return;
      }

      // --- External task event ---
      onExternalEventChange?.(info.event.id, info.event.startStr, info.event.endStr);
    },
    [previewEvents, allocationFailures, setPreview, blocks, updateBlock, getBlock, onExternalEventChange, canDropAt],
  );

  /** Handle event resize. */
  const handleEventResize = useCallback(
    (info: FcEventInfo) => {
      const extProps = info.event.extendedProps ?? {};

      const newDuration =
        (new Date(info.event.endStr).getTime() - new Date(info.event.startStr).getTime()) /
        60000;

      // Validate 30-min snap
      if (newDuration % 30 !== 0 || newDuration < 30) {
        info.revert?.();
        return;
      }

      // Validate drop position
      if (!canDropAt(info.event.startStr, info.event.endStr, info.event.id)) {
        info.revert?.();
        return;
      }

      // --- Block event ---
      if (extProps.isBlock) {
        const blockId = (extProps.blockId as string) ?? info.event.id.replace("block-", "");
        const block = getBlock(blockId);
        if (!block) return;

        if (block.blockType === BlockTypeEnum.SingleDay) {
          updateBlock(blockId, { endDate: info.event.endStr });
        } else {
          updateBlock(blockId, { endTime: extractTime(info.event.endStr) });
        }
        return;
      }

      // --- Preview event ---
      if (extProps.isPreview) {
        const updatedEvents = previewEvents.map((e) => {
          if (e.id === info.event.id) {
            return {
              ...e,
              start: info.event.startStr,
              end: info.event.endStr,
              updatedAt: new Date().toISOString(),
            };
          }
          return e;
        });
        setPreview(updatedEvents, allocationFailures);
        return;
      }

      // --- External task event ---
      onExternalEventChange?.(info.event.id, info.event.startStr, info.event.endStr);
    },
    [previewEvents, allocationFailures, setPreview, blocks, updateBlock, getBlock, onExternalEventChange, canDropAt],
  );

  /** Handle event delete. */
  const requestDelete = useCallback((id: string, title: string) => {
    setEditing((prev) => ({ ...prev, deleteTarget: { id, title } }));
  }, []);

  const confirmDelete = useCallback(() => {
    if (!editing.deleteTarget) return;
    const { id } = editing.deleteTarget;
    if (id.startsWith("block-")) {
      const blockId = id.slice(6);
      deleteBlock(blockId);
    } else {
      const updatedEvents = previewEvents.filter((e) => e.id !== id);
      setPreview(updatedEvents, allocationFailures);
    }
    setEditing((prev) => ({ ...prev, deleteTarget: null }));
  }, [editing.deleteTarget, previewEvents, allocationFailures, setPreview, deleteBlock]);

  const cancelDelete = useCallback(() => {
    setEditing((prev) => ({ ...prev, deleteTarget: null }));
  }, []);

  const handleEventDragStart = useCallback(() => {
    setEditing((prev) => ({ ...prev, isDragging: true }));
  }, []);

  const handleEventDragStop = useCallback(() => {
    setEditing((prev) => ({ ...prev, isDragging: false }));
  }, []);

  return {
    ...editing,
    handleEventDrop,
    handleEventResize,
    requestDelete,
    confirmDelete,
    cancelDelete,
    canDropAt,
    handleEventDragStart,
    handleEventDragStop,
  };
}
