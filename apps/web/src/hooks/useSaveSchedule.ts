import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../services/api";
import { computeDiff } from "../services/diffCalculator";
import { confirmRemoteEvent, reconcileCalendarEvents, isInRange } from "../services/calendarReconciliation";
import type { CalendarRange } from "../services/calendarReconciliation";
import { usePreview } from "../contexts/PreviewContext";
import { useCalendar } from "../contexts/CalendarContext";
import { useTaskContext } from "../contexts/TaskContext";
import { getWeekStart, getWeekEnd } from "../pages/dashboard/weekRange";
import { previewSavePlan, assertPreviewBaseline } from "../services/previewSavePlan";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import type { GeneratedEvent } from "@brkroutnxdle/domain";
import { useAuth } from "../contexts/AuthContext";
import { activeRemoteAccount, beginRemoteMutation, invalidateRemoteConfirmation, readRemoteCalendar,
  remoteEpoch, remoteIdentityVersion } from "../services/remoteConfirmation";
import { calendarEventsKey } from "./useCalendarRefresh";
import { verifySavedWrites } from "../services/verifySavedWrites";

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { previewEvents, isPreviewActive, replacementBaseline, result, clearPreview } = usePreview();
  const { events, setEvents, currentDate } = useCalendar();
  const { tasks } = useTaskContext();
  const [saveState, setSaveState] = useState<SaveState>(initialState);
  const locked = useRef(false);
  // A successful POST is retained even if a later write or reconciliation fails.
  const posted = useRef(new Map<string, CalendarEvent>());
  const writtenUpdates = useRef(new Map<string, { start: string; end: string }>());
  const writtenDeletes = useRef(new Set<string>());
  const journalAccount = useRef(user?.id);
  const journal = useRef<{
    snapshot: typeof replacementBaseline; key: string;
    createdIds: Set<string>; updated: Map<string, { start: string; end: string }>;
    deletedIds: Set<string>;
  } | null>(null);
  useEffect(() => {
    if (journalAccount.current === user?.id) return;
    journalAccount.current = user?.id;
    posted.current.clear();
    writtenUpdates.current.clear();
    writtenDeletes.current.clear();
    journal.current = null;
    locked.current = false;
    setSaveState(initialState);
  }, [user?.id]);

  const saveMutation = useMutation({
    mutationFn: async ({ accountId, identity }: { accountId: string | undefined; identity: number }) => {
      if (!accountId || activeRemoteAccount() !== accountId || remoteIdentityVersion() !== identity)
        throw new Error("Sign in before saving.");
      const owned = () => activeRemoteAccount() === accountId && remoteIdentityVersion() === identity;
      invalidateRemoteConfirmation();
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
      const fetchRemote = async () => {
        const response = await readRemoteCalendar(range, accountId);
        if (!response || !owned()) throw new Error("Account or calendar changed. Refresh before retrying.");
        return response;
      };
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
      const postedFor = (event: GeneratedEvent) => posted.current.get(event.id) ??
        [...posted.current.values()].find(created => created.taskId === event.taskId &&
          created.start === event.start && created.end === event.end);
      for (const event of desired) {
        const created = postedFor(event);
        if (created && !persisted.some((item) => item.id === created.id)) {
          persisted.push({ ...created, source: "google" });
        }
      }
      const translated = desired.map((event) => {
        const created = postedFor(event);
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
      if (!owned()) throw new Error("Account changed during save.");
      setSaveState({ status: "saving", progress: 0, total, completed: 0, error: null });
      const endMutation = total ? beginRemoteMutation() : () => {};
      const writeEpoch = remoteEpoch();
      const stillOwned = () => owned() && remoteEpoch() === writeEpoch;
      let attempted = false;

      const reconcile = async () => {
        const fresh = await fetchRemote();
        if (!stillOwned()) throw new Error("Account or calendar changed during save.");
        const visible = [...fresh];
        for (const [localId, created] of posted.current) {
          if (!visible.some((event) => event.id === created.id)) {
            const local = events.find((event) => event.id === localId);
            if (local) visible.push({ ...local, id: created.id, source: "brkroutnxdle" });
          }
          savedLocalIds.add(localId);
        }
        if (stillOwned()) {
          setEvents((prev) => stillOwned() ?
            reconcileCalendarEvents(prev, visible, range, baselineIds, savedLocalIds) : prev);
        }
        await queryClient.invalidateQueries({ queryKey: calendarEventsKey(range, accountId), exact: true, refetchType: "none" });
        if (!stillOwned()) throw new Error("Account or calendar changed during save.");
        return fresh;
      };
      try {
        // Index creates by occurrence, never by task ID (recurrences share task IDs).
        const unmatched = translated.filter((event) => !persisted.some((remote) =>
          remote.id === event.id || (remote.taskId === event.taskId &&
            remote.start === event.start && remote.end === event.end),
        ));
        for (const [index, payload] of diff.toCreate.entries()) {
          if (!stillOwned()) throw new Error("Account changed during save.");
          attempted = true;
          const localId = unmatched[index]?.id ?? desired.find(event =>
            event.taskId === payload.taskId && event.start === payload.start.dateTime &&
            event.end === payload.end.dateTime)?.id;
          const isManualPlacement = mode === "manual" || !!(localId && events.some((event) =>
            event.id === localId && event.source === "brkroutnxdle" && event.isGenerated));
          const created = confirmRemoteEvent(await api.post<CalendarEvent>("/events", {
            ...payload, isPinned: isManualPlacement,
          }), "post");
          if (!stillOwned()) throw new Error("Account changed during save.");
          if (mode === "preview") journal.current?.createdIds.add(created.id);
          if (localId) {
            posted.current.set(localId, { ...created, isPinned: isManualPlacement });
            savedLocalIds.add(localId);
          }
          completed++;
          setSaveState((prev) => ({ ...prev, completed, progress: Math.round(completed / total * 100) }));
        }
        for (const update of diff.toUpdate) {
          if (!stillOwned()) throw new Error("Account changed during save.");
          attempted = true;
          await api.patch(`/events/${encodeURIComponent(update.id)}`, { start: update.start, end: update.end });
          if (!stillOwned()) throw new Error("Account changed during save.");
          if (mode === "preview" && update.start && update.end) {
            journal.current?.updated.set(update.id, { start: update.start, end: update.end });
            writtenUpdates.current.set(update.id, { start: update.start, end: update.end });
          } else if (update.start && update.end) {
            writtenUpdates.current.set(update.id, { start: update.start, end: update.end });
          }
          completed++;
          setSaveState((prev) => ({ ...prev, completed, progress: Math.round(completed / total * 100) }));
        }
        for (const id of diff.toDelete) {
          if (!stillOwned()) throw new Error("Account changed during save.");
          attempted = true;
          await api.delete(`/events/${encodeURIComponent(id)}`);
          if (!stillOwned()) throw new Error("Account changed during save.");
          if (mode === "preview") journal.current?.deletedIds.add(id);
          writtenDeletes.current.add(id);
          completed++;
          setSaveState((prev) => ({ ...prev, completed, progress: Math.round(completed / total * 100) }));
        }
        endMutation();
        const fresh = await reconcile();
        if (!verifySavedWrites(fresh, posted.current.values(), writtenUpdates.current, writtenDeletes.current)) {
          throw Object.assign(new Error("Calendar write is pending remote confirmation. Retry to check the calendar without repeating successful writes."),
            { completed: Math.max(1, completed), pendingConfirmation: true });
        }
        // Reconciliation may replace a pending local ID with its remote ID.
        // Release by the original journal key only after verifying that remote
        // occurrence in the authoritative GET, regardless of the current desired IDs.
        if (!stillOwned()) throw new Error("Account or calendar changed during save.");
        for (const [localId, created] of posted.current) {
          if (fresh.some(remote => remote.id === created.id && remote.start === created.start &&
            remote.end === created.end && remote.isGenerated)) posted.current.delete(localId);
        }
        writtenUpdates.current.clear();
        writtenDeletes.current.clear();
        return { completed };
      } catch (error) {
        endMutation();
        if (attempted && stillOwned() && !(error instanceof Error && "pendingConfirmation" in error)) {
          try { await reconcile(); } catch { /* Keep successful IDs for retry; report original failure. */ }
        }
        throw Object.assign(error instanceof Error ? error : new Error(String(error)),
          { completed: Math.max(completed, (error as { completed?: number })?.completed ?? 0) });
      }
    },
    onSuccess: (_value, variables) => {
      if (activeRemoteAccount() !== variables.accountId || remoteIdentityVersion() !== variables.identity ||
        journalAccount.current !== variables.accountId) return;
      setSaveState({ ...initialState, status: "success", progress: 100 });
      if (isPreviewActive) clearPreview();
      locked.current = false;
    },
    onError: (error: Error & { completed?: number; pendingConfirmation?: boolean }, variables) => {
      if (activeRemoteAccount() !== variables.accountId || remoteIdentityVersion() !== variables.identity ||
        journalAccount.current !== variables.accountId) return;
      // A partially written calendar is not a fully reconfirmed saved week.
      if (error.completed) invalidateRemoteConfirmation();
      let message = error.message || "Failed to save schedule";
      if (error instanceof ApiError) message = `Save failed: ${error.message} (${error.status})`;
      setSaveState((prev) => ({ ...prev, status: "error", partial: !!error.completed,
        error: error.pendingConfirmation ? message : error.completed ?
          `Partially saved (${error.completed} writes). ${message} Retry to finish.` : message }));
      locked.current = false;
    },
  });

  const resetSaveState = useCallback(() => setSaveState(initialState), []);
  return {
    saveState,
    save: () => {
      if (locked.current) return;
      locked.current = true;
      saveMutation.mutate({ accountId: user?.id, identity: remoteIdentityVersion() });
    },
    isSaving: saveState.status === "saving" || locked.current,
    resetSaveState,
  };
}
