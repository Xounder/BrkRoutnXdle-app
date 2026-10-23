import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCalendar } from "../contexts/CalendarContext";
import { api } from "../services/api";
import { clearCalendarCache } from "../services/calendarCache";
import { confirmRemoteEvents, reconcileCalendarEvents } from "../services/calendarReconciliation";
import type { CalendarRange } from "../services/calendarReconciliation";
import type { CalendarEvent } from "@brkroutnxdle/shared";

export function calendarEventsKey(range: CalendarRange) {
  return ["calendar", "events", range.timeMin, range.timeMax] as const;
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
  const queryClient = useQueryClient();
  const { setEvents } = useCalendar();
  const inFlight = useRef(new Set<string>());

  const refresh = useCallback(async (range: CalendarRange, previewActive: boolean,
    isCurrent: () => boolean = () => true) => {
    const requestKey = `${range.timeMin}/${range.timeMax}`;
    if (inFlight.current.has(requestKey)) return null;
    inFlight.current.add(requestKey);
    const key = calendarEventsKey(range);
    const baseline = queryClient.getQueryData<CalendarEvent[]>(key);
    try {
      await queryClient.invalidateQueries({ queryKey: key, exact: true, refetchType: "none" });
      const fresh = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: async () => confirmRemoteEvents(await api.get<CalendarEvent[]>("/events", {
          timeMin: range.timeMin, timeMax: range.timeMax,
        })),
        staleTime: 0,
        retry: false,
      });
      if (!isCurrent()) return null;
      const changedEvents = baseline ? remoteChanges(baseline, fresh) : [];
      setEvents(current => isCurrent() ? reconcileCalendarEvents(current, fresh, range,
        new Set(baseline?.map(event => event.id) ?? [])) : current);
      clearCalendarCache();
      return { hasConflicts: previewActive && changedEvents.length > 0, changedEvents,
        baselineKnown: baseline !== undefined };
    } finally {
      inFlight.current.delete(requestKey);
    }
  }, [queryClient, setEvents]);

  return { refresh };
}
