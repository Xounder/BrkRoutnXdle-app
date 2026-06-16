import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../services/api";
import { computeDiff } from "../services/diffCalculator";
import { usePreview } from "../contexts/PreviewContext";
import { useCalendar } from "../contexts/CalendarContext";
import type { CalendarEvent } from "@brkroutnxdle/shared";

interface SaveState {
  status: "idle" | "saving" | "success" | "error";
  progress: number; // 0-100
  total: number;
  completed: number;
  error: string | null;
}

export function useSaveSchedule() {
  const { previewEvents, allocationFailures, clearPreview } = usePreview();
  const { events, setEvents } = useCalendar();
  const [saveState, setSaveState] = useState<SaveState>({
    status: "idle",
    progress: 0,
    total: 0,
    completed: 0,
    error: null,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const diff = computeDiff(previewEvents, events);
      const totalOps = diff.toCreate.length + diff.toUpdate.length + diff.toDelete.length;
      setSaveState((prev) => ({ ...prev, status: "saving", total: totalOps, completed: 0 }));

      let completed = 0;

      // 1. Create new events
      for (const event of diff.toCreate) {
        await api.post<CalendarEvent>("/events", event);
        completed++;
        setSaveState((prev) => ({
          ...prev,
          completed,
          progress: Math.round((completed / totalOps) * 100),
        }));
      }

      // 2. Update changed events
      for (const event of diff.toUpdate) {
        await api.patch<CalendarEvent>(`/events/${event.id}`, {
          start: event.start,
          end: event.end,
        });
        completed++;
        setSaveState((prev) => ({
          ...prev,
          completed,
          progress: Math.round((completed / totalOps) * 100),
        }));
      }

      // 3. Delete removed events
      for (const id of diff.toDelete) {
        await api.delete(`/events/${id}`);
        completed++;
        setSaveState((prev) => ({
          ...prev,
          completed,
          progress: Math.round((completed / totalOps) * 100),
        }));
      }

      return diff;
    },
    onSuccess: () => {
      setSaveState({ status: "success", progress: 100, total: 0, completed: 0, error: null });
      clearPreview();
    },
    onError: (err: Error) => {
      setSaveState((prev) => ({
        ...prev,
        status: "error",
        error: err.message ?? "Failed to save schedule",
      }));
    },
  });

  const resetSaveState = useCallback(() => {
    setSaveState({ status: "idle", progress: 0, total: 0, completed: 0, error: null });
  }, []);

  return {
    saveState,
    save: () => saveMutation.mutate(),
    isSaving: saveState.status === "saving",
    resetSaveState,
  };
}
