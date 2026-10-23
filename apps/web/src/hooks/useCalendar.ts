import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { useCalendar } from "../contexts/CalendarContext";
import { useEffect, useRef } from "react";
import { confirmRemoteEvents, reconcileCalendarEvents } from "../services/calendarReconciliation";
import { calendarEventsKey } from "./useCalendarRefresh";

export { confirmRemoteEvents, reconcileCalendarEvents } from "../services/calendarReconciliation";
export type { CalendarRange } from "../services/calendarReconciliation";

export { useCalendar };

export function useCalendarEvents(timeMin?: string, timeMax?: string) {
  const { setEvents } = useCalendar();
  const previous = useRef<{ key: string; ids: Set<string> } | null>(null);
  const defaults = useRef({
    min: new Date().toISOString(),
    max: new Date(Date.now() + 7 * 86400_000).toISOString(),
  });
  const min = timeMin ?? defaults.current.min;
  const max = timeMax ?? defaults.current.max;
  const key = `${min}/${max}`;

  const query = useQuery<CalendarEvent[]>({
    queryKey: calendarEventsKey({ timeMin: min, timeMax: max }),
    queryFn: async () => confirmRemoteEvents(await api.get<CalendarEvent[]>("/events", {
      timeMin: min, timeMax: max,
    })),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      const remote = query.data;
      const previousIds = previous.current?.key === key ? previous.current.ids : new Set<string>();
      setEvents((prev) => reconcileCalendarEvents(prev, remote, { timeMin: min, timeMax: max }, previousIds));
      previous.current = { key, ids: new Set(remote.map((event) => event.id)) };
    }
  }, [query.data, setEvents, key, min, max]);

  return query;
}
