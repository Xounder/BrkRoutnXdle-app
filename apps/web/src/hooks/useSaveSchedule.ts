import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, ApiError } from "../services/api";
import { computeDiff } from "../services/diffCalculator";
import { usePreview } from "../contexts/PreviewContext";
import { useCalendar } from "../contexts/CalendarContext";
import { useTaskContext } from "../contexts/TaskContext";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import type { GeneratedEvent } from "@brkroutnxdle/domain";

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
  const { tasks } = useTaskContext();
  const [saveState, setSaveState] = useState<SaveState>({
    status: "idle",
    progress: 0,
    total: 0,
    completed: 0,
    error: null,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const isManualSave = previewEvents.length === 0;

      let diff: ReturnType<typeof computeDiff>;

      if (isManualSave) {
        // Manual save: persist manually created events (from "Create in this slot" or external drops)
        // Fetch current persisted events from backend to compute what needs creating/updating
        const persisted: CalendarEvent[] = await api
          .get<CalendarEvent[]>("/events")
          .catch(() => [] as CalendarEvent[]);

        // Convert context events to GeneratedEvent[] for the diff
        const desired: GeneratedEvent[] = events.map((e) => ({
          id: e.id,
          taskId: e.taskId ?? "",
          start: e.start,
          end: e.end,
          completed: e.isCompleted,
          createdAt: "",
          updatedAt: "",
        }));

        diff = computeDiff(desired, persisted, tasks, { noDelete: true });
      } else {
        // Preview save: only consider preview-related events for deletion
        const previewTaskIds = new Set(previewEvents.map((e) => e.taskId));
        const previewRelatedPersisted = events.filter(
          (e) => e.taskId && previewTaskIds.has(e.taskId),
        );
        diff = computeDiff(previewEvents, previewRelatedPersisted, tasks);
      }

      const totalOps = diff.toCreate.length + diff.toUpdate.length + diff.toDelete.length;
      setSaveState((prev) => ({ ...prev, status: "saving", total: totalOps, completed: 0 }));

      let completed = 0;
      // Keep track of new events created so we can update local state with their real IDs
      const newEventMap = new Map<string, CalendarEvent>();

      // 1. Create new events — capture the real Google Calendar event ID from the response
      for (const event of diff.toCreate) {
        const created = await api.post<CalendarEvent>("/events", event);
        // Store by taskId so we can map it back to the preview event
        if (event.taskId) {
          newEventMap.set(event.taskId, created);
        }
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

      // 4. Update local events state with the real Google Calendar event IDs from created events.
      //    Merge newly created events (with real Google Calendar IDs) into the existing events array,
      //    replacing any stale entries that had the same taskId.
      if (newEventMap.size > 0) {
        const updatedEvents = events.map((evt) => {
          const created = evt.taskId ? newEventMap.get(evt.taskId) : undefined;
          return created ?? evt;
        });
        // Append any new events that weren't in the original array
        for (const [, created] of newEventMap) {
          if (!updatedEvents.some((e) => e.id === created.id)) {
            updatedEvents.push(created);
          }
        }
        setEvents(updatedEvents);
      }

      return diff;
    },
    onSuccess: () => {
      setSaveState({ status: "success", progress: 100, total: 0, completed: 0, error: null });
      clearPreview();
    },
    onError: (err: Error) => {
      let message = "Failed to save schedule";
      if (err instanceof ApiError) {
        message = `Save failed: ${err.message} (${err.status})`;
        if (err.details?.fieldErrors) {
          const fields = Object.keys(err.details.fieldErrors as Record<string, unknown>).join(", ");
          message += ` — Invalid fields: ${fields}`;
        }
      } else if (err.message) {
        message = err.message;
      }
      setSaveState((prev) => ({
        ...prev,
        status: "error",
        error: message,
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
