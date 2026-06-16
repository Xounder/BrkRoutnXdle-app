import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { useCalendar } from "../contexts/CalendarContext";
import { useEffect } from "react";

export function useCalendarEvents(timeMin?: string, timeMax?: string) {
  const { setEvents } = useCalendar();

  const query = useQuery<CalendarEvent[]>({
    queryKey: ["calendar", "events", timeMin, timeMax],
    queryFn: () =>
      api.get<CalendarEvent[]>("/events", {
        timeMin: timeMin ?? new Date().toISOString(),
        timeMax: timeMax ?? new Date(Date.now() + 7 * 86400_000).toISOString(),
      }),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setEvents(query.data);
    }
  }, [query.data, setEvents]);

  return query;
}