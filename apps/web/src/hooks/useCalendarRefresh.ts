import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCalendar } from "../contexts/CalendarContext";
import { clearCalendarCache } from "../services/calendarCache";
import { isInRange, reconcileCalendarEvents } from "../services/calendarReconciliation";
import type { CalendarRange } from "../services/calendarReconciliation";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { useAuth } from "../contexts/AuthContext";
import { activeRemoteAccount, getRemoteConfirmation, InvalidRemoteIntervals, readRemoteCalendar, remoteEpoch } from "../services/remoteConfirmation";
import { overlayManualEdits } from "../services/manualEditJournal";

export function calendarEventsKey(range: CalendarRange, accountId: string) {
  return ["calendar", "events", accountId, range.timeMin, range.timeMax] as const;
}

/** Compare the confirmed remote snapshot, not the preview overlay or pending local placements. */
export function remoteChanges(before: CalendarEvent[], after: CalendarEvent[]): string[] {
  const old = new Map(before.map(event => [event.id, event]));
  const next = new Map(after.map(event => [event.id, event]));
  return [...new Set([
    ...before.filter(event => !next.has(event.id)).map(event => event.id),
    ...after.filter(event => {
      const previous = old.get(event.id);
      return !previous || previous.start !== event.start || previous.end !== event.end ||
        previous.title !== event.title || previous.isCompleted !== event.isCompleted;
    }).map(event => event.id),
  ])];
}

export function useCalendarRefresh() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { setEvents } = useCalendar();
  const inFlight = useRef(new Set<string>());

  const refresh = useCallback(async (range: CalendarRange, previewActive: boolean,
    isCurrent: () => boolean = () => true) => {
    const accountId = !loading ? user?.id : undefined;
    if (!accountId || activeRemoteAccount() !== accountId) return null;
    const requestKey = `${accountId}/${range.timeMin}/${range.timeMax}`;
    if (inFlight.current.has(requestKey)) return null;
    inFlight.current.add(requestKey);
    const key = calendarEventsKey(range, accountId);
    const baseline = queryClient.getQueryData<CalendarEvent[]>(key);
    const version = remoteEpoch();
    try {
      await queryClient.invalidateQueries({ queryKey: key, exact: true, refetchType: "none" });
      // A direct GET must not deduplicate against an older in-flight query.
      const fresh = await readRemoteCalendar(range, accountId);
      if (!fresh || !isCurrent() || activeRemoteAccount() !== accountId ||
        remoteEpoch() !== version || getRemoteConfirmation(range).status !== "confirmed") return null;
      queryClient.setQueryData(key, fresh);
      const changedEvents = baseline ? remoteChanges(baseline, fresh) : [];
      setEvents(current => {
        if (!isCurrent() || activeRemoteAccount() !== accountId || remoteEpoch() !== version) return current;
        // A cold query has no previous IDs, but persisted remote events may be stale.
        // Only remove in-range confirmed-source entries; overlayManualEdits restores
        // unsaved moves, and pending local placements have a different source.
        const remoteIds = new Set([...(baseline?.map(event => event.id) ?? []),
          ...current.filter(event => event.source === "google" && isInRange(event, range))
            .map(event => event.id)]);
        return reconcileCalendarEvents(current, overlayManualEdits(accountId, current, fresh, range), range, remoteIds);
      });
      clearCalendarCache();
      return { hasConflicts: previewActive && changedEvents.length > 0, changedEvents,
        baselineKnown: baseline !== undefined };
    } catch (error) {
      // Preserve the conflict warning even if malformed intervals make this GET
      // ineligible for confirmation. Neither query data nor display is promoted.
      if (error instanceof InvalidRemoteIntervals && previewActive && baseline &&
        isCurrent() && activeRemoteAccount() === accountId && remoteEpoch() === version) {
        const changedEvents = remoteChanges(baseline, error.events);
        if (changedEvents.length) return { hasConflicts: true, changedEvents, baselineKnown: true };
      }
      throw error;
    } finally {
      inFlight.current.delete(requestKey);
    }
  }, [queryClient, setEvents, user?.id, loading]);

  return { refresh };
}
