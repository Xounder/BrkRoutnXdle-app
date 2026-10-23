import { useState, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, ApiError } from "../services/api";
import { computeDiff } from "../services/diffCalculator";
import { confirmRemoteEvent, confirmRemoteEvents, reconcileCalendarEvents, isInRange } from "../services/calendarReconciliation";
import type { CalendarRange } from "../services/calendarReconciliation";
import { usePreview } from "../contexts/PreviewContext";
import { useCalendar } from "../contexts/CalendarContext";
import { useTaskContext } from "../contexts/TaskContext";
import { getWeekStart, getWeekEnd } from "../pages/dashboard/weekRange";
import { previewSavePlan, assertPreviewBaseline } from "../services/previewSavePlan";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import type { GeneratedEvent } from "@brkroutnxdle/domain";

interface SaveState {
  status: "idle" | "saving" | "success" | "error";
  partial?: boolean;
  progress: number;
  total: number;
  completed: number;
  error: string | null;
}

const initialState: SaveState = { status: "idle", progress: 0, total: 0, completed: 0, error: null };

/** Optional target interval for preview replacement; defaults to the displayed week. */
export function useSaveSchedule(options?: { range?: CalendarRange }) {
  const { previewEvents, isPreviewActive, replacementBaseline, result, clearPreview } = usePreview();
  const { events, setEvents, currentDate } = useCalendar();
  const { tasks } = useTaskContext();
  const [saveState, setSaveState] = useState<SaveState>(initialState);
  const locked = useRef(false);
  // A successful POST is retained even if a later write or reconciliation fails.
  const posted = useRef(new Map<string, CalendarEvent>());
  const journal = useRef<{
    snapshot: typeof replacementBaseline; key: string;
    createdIds: Set<string>; updated: Map<string, { start: string; end: string }>;
    deletedIds: Set<string>;
  } | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const range = options?.range ?? {
        timeMin: getWeekStart(currentDate).toISOString(),
        timeMax: new Date(getWeekEnd(currentDate).getTime() + 1).toISOString(),
      };
      const mode = isPreviewActive ? "preview" : "manual";
      const key = `${range.timeMin}/${range.timeMax}`;
      if (mode === "preview" &&
        (result?.weekStart !== range.timeMin || result.weekEnd !== range.timeMax)) {
        throw new Error("Preview belongs to another week. Calculate again before saving.");
      }
      // api.ts unwraps { data }; validate the actual envelope payload before any write.
      const fetchRemote = async () => confirmRemoteEvents(await api.get<CalendarEvent[]>("/events", {
        timeMin: range.timeMin, timeMax: range.timeMax,
      }));
      const baseline = await fetchRemote();
      if (mode === "preview") {
        if (!journal.current || journal.current.snapshot !== replacementBaseline || journal.current.key !== key) {
          journal.current = { snapshot: replacementBaseline, key,
            createdIds: new Set(), updated: new Map(), deletedIds: new Set() };
        }
        assertPreviewBaseline(replacementBaseline, baseline, range, journal.current, Date.now());
      }
      const baselineIds = new Set(baseline.map((event) => event.id));
      const plan = mode === "preview"
        ? previewSavePlan(previewEvents, events, baseline, range, Date.now(),
          new Set(replacementBaseline.map((event) => event.id))) : null;
      const savedLocalIds = new Set(plan?.savedLocalIds);
      let completed = 0;

      const desired: GeneratedEvent[] = plan ? plan.desired : events
        .filter((event) => event.source === "brkroutnxdle" || baselineIds.has(event.id))
        .filter((event) => isInRange(event, range))
        .map((event) => ({
          id: event.id, taskId: event.taskId ?? "", start: event.start, end: event.end,
          completed: event.isCompleted, createdAt: "", updatedAt: "",
        }));

      const candidates = plan ? plan.candidates : baseline;
      // GET membership, not the source label, establishes persistence.
      const persisted = candidates.map((event) => ({ ...event, source: "google" as const }));
      for (const event of desired) {
        const created = posted.current.get(event.id);
        if (created && !persisted.some((item) => item.id === created.id)) {
          persisted.push({ ...created, source: "google" });
        }
      }
      const translated = desired.map((event) => {
        const created = posted.current.get(event.id);
        return created ? { ...event, id: created.id } : event;
      });
      const diff = computeDiff(translated, persisted, tasks, {
        noDelete: mode === "manual", replaceableIds: plan?.replaceableIds,
        matchableIds: plan?.matchableIds,
      });
      // An exact-ID collision must not turn a protected pinned occurrence into
      // a PATCH target. Only the preview snapshot and our own POSTs authorize it.
      if (plan && diff.toUpdate.some((update) =>
        !plan.replaceableIds.has(update.id) && !journal.current?.createdIds.has(update.id))) {
        throw new Error("Calendar changed since preview. Refresh and calculate again before saving.");
      }
      const total = diff.toCreate.length + diff.toUpdate.length + diff.toDelete.length;
      setSaveState({ status: "saving", progress: 0, total, completed: 0, error: null });

      const reconcile = async () => {
        const fresh = await fetchRemote();
        const visible = [...fresh];
        for (const [localId, created] of posted.current) {
          if (!visible.some((event) => event.id === created.id)) {
            const local = events.find((event) => event.id === localId);
            if (local) visible.push({ ...local, id: created.id, source: "google" });
          }
          savedLocalIds.add(localId);
        }
        setEvents((prev) => reconcileCalendarEvents(
          prev, visible, range, baselineIds, savedLocalIds,
        ));
      };
      try {
        // Index creates by occurrence, never by task ID (recurrences share task IDs).
        const unmatched = translated.filter((event) => !persisted.some((remote) =>
          remote.id === event.id || (remote.taskId === event.taskId &&
            remote.start === event.start && remote.end === event.end),
        ));
        for (const [index, payload] of diff.toCreate.entries()) {
          const localId = unmatched[index]?.id;
          const isManualPlacement = mode === "manual" || !!(localId && events.some((event) =>
            event.id === localId && event.source === "brkroutnxdle" && event.isGenerated));
          const created = confirmRemoteEvent(await api.post<CalendarEvent>("/events", {
            ...payload, isPinned: isManualPlacement,
          }), "post");
          if (mode === "preview") journal.current?.createdIds.add(created.id);
          if (localId) {
            posted.current.set(localId, { ...created, isPinned: isManualPlacement });
            savedLocalIds.add(localId);
          }
          completed++;
          setSaveState((prev) => ({ ...prev, completed, progress: Math.round(completed / total * 100) }));
        }
        for (const update of diff.toUpdate) {
          await api.patch(`/events/${encodeURIComponent(update.id)}`, { start: update.start, end: update.end });
          if (mode === "preview" && update.start && update.end) {
            journal.current?.updated.set(update.id, { start: update.start, end: update.end });
          }
          completed++;
          setSaveState((prev) => ({ ...prev, completed, progress: Math.round(completed / total * 100) }));
        }
        for (const id of diff.toDelete) {
          await api.delete(`/events/${encodeURIComponent(id)}`);
          if (mode === "preview") journal.current?.deletedIds.add(id);
          completed++;
          setSaveState((prev) => ({ ...prev, completed, progress: Math.round(completed / total * 100) }));
        }
        await reconcile();
        for (const event of desired) {
          if (posted.current.has(event.id) &&
            // Keep the ID until the server confirms this occurrence on a future GET.
            baseline.some((remote) => remote.id === posted.current.get(event.id)?.id)) {
            posted.current.delete(event.id);
          }
        }
        return { completed };
      } catch (error) {
        if (completed) {
          try { await reconcile(); } catch { /* Keep successful IDs for retry; report original failure. */ }
        }
        throw Object.assign(error instanceof Error ? error : new Error(String(error)), { completed });
      }
    },
    onSuccess: () => {
      setSaveState({ ...initialState, status: "success", progress: 100 });
      if (isPreviewActive) clearPreview();
      locked.current = false;
    },
    onError: (error: Error & { completed?: number }) => {
      let message = error.message || "Failed to save schedule";
      if (error instanceof ApiError) message = `Save failed: ${error.message} (${error.status})`;
      setSaveState((prev) => ({ ...prev, status: "error", partial: !!error.completed,
        error: error.completed ? `Partially saved (${error.completed} writes). ${message} Retry to finish.` : message }));
      locked.current = false;
    },
  });

  const resetSaveState = useCallback(() => setSaveState(initialState), []);
  return {
    saveState,
    save: () => {
      if (locked.current) return;
      locked.current = true;
      saveMutation.mutate();
    },
    isSaving: saveState.status === "saving" || locked.current,
    resetSaveState,
  };
}
