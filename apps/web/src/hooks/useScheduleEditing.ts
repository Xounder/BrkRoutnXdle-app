import { useState, useCallback } from "react";
import { usePreview } from "../contexts/PreviewContext";
import { useCalendar } from "../contexts/CalendarContext";
import { useSettings } from "../contexts/SettingsContext";
import type { CalendarEvent } from "@brkroutnxdle/shared";

interface FcEventInfo {
  event: {
    id: string;
    startStr: string;
    endStr: string;
    revert?: () => void;
  };
}

interface EditingState {
  isDragging: boolean;
  isResizing: boolean;
  deleteTarget: { id: string; title: string } | null;
}

export function useScheduleEditing() {
  const { previewEvents, allocationFailures, setPreview } = usePreview();
  const { events } = useCalendar();
  const { settings } = useSettings();
  const [editing, setEditing] = useState<EditingState>({
    isDragging: false,
    isResizing: false,
    deleteTarget: null,
  });

  /** Handle event drop (drag-and-drop). */
  const handleEventDrop = useCallback(
    (info: FcEventInfo) => {
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
    },
    [previewEvents, allocationFailures, setPreview],
  );

  /** Handle event resize. */
  const handleEventResize = useCallback(
    (info: FcEventInfo) => {
      const newDuration =
        (new Date(info.event.endStr).getTime() - new Date(info.event.startStr).getTime()) /
        60000;

      // Validate 30-min snap
      if (newDuration % 30 !== 0 || newDuration < 30) {
        info.event.revert?.(); // Revert to previous state
        return;
      }

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
    },
    [previewEvents, allocationFailures, setPreview],
  );

  /** Handle event delete. */
  const requestDelete = useCallback((id: string, title: string) => {
    setEditing((prev) => ({ ...prev, deleteTarget: { id, title } }));
  }, []);

  const confirmDelete = useCallback(() => {
    if (!editing.deleteTarget) return;
    const updatedEvents = previewEvents.filter(
      (e) => e.id !== editing.deleteTarget!.id,
    );
    setPreview(updatedEvents, allocationFailures);
    setEditing((prev) => ({ ...prev, deleteTarget: null }));
  }, [editing.deleteTarget, previewEvents, allocationFailures, setPreview]);

  const cancelDelete = useCallback(() => {
    setEditing((prev) => ({ ...prev, deleteTarget: null }));
  }, []);

  /** Validate drop position. */
  const canDropAt = useCallback(
    (startStr: string, endStr: string): boolean => {
      const startHour = new Date(startStr).getUTCHours();
      const endHour = new Date(endStr).getUTCHours();

      // Must be within available hours
      if (startHour < settings.workStartHour || endHour > settings.workEndHour) {
        return false;
      }

      // Must not overlap existing events
      const newStart = new Date(startStr).getTime();
      const newEnd = new Date(endStr).getTime();
      for (const ev of events) {
        const evStart = new Date(ev.start).getTime();
        const evEnd = new Date(ev.end).getTime();
        if (newStart < evEnd && newEnd > evStart) {
          return false;
        }
      }

      return true;
    },
    [events, settings],
  );

  return {
    ...editing,
    handleEventDrop,
    handleEventResize,
    requestDelete,
    confirmDelete,
    cancelDelete,
    canDropAt,
  };
}
