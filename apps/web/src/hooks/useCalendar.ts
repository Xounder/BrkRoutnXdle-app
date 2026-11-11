import { useQuery } from "@tanstack/react-query";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { useCalendar } from "../contexts/CalendarContext";
import { useEffect, useRef } from "react";
import { reconcileCalendarEvents } from "../services/calendarReconciliation";
import { calendarEventsKey } from "./useCalendarRefresh";
import { useAuth } from "../contexts/AuthContext";
import { activeRemoteAccount, getRemoteConfirmation, readRemoteCalendar } from "../services/remoteConfirmation";
import { overlayManualEdits } from "../services/manualEditJournal";

export { confirmRemoteEvents, reconcileCalendarEvents } from "../services/calendarReconciliation";
export type { CalendarRange } from "../services/calendarReconciliation";

export { useCalendar };

export function useCalendarEvents(timeMin?: string, timeMax?: string) {
  const { user, loading } = useAuth();
  const accountId = !loading ? user?.id : undefined;
  const { setEvents } = useCalendar();
  const previous = useRef<{ key: string; ids: Set<string> } | null>(null);
  const defaults = useRef({
    min: new Date().toISOString(),
    max: new Date(Date.now() + 7 * 86400_000).toISOString(),
  });
  const min = timeMin ?? defaults.current.min;
  const max = timeMax ?? defaults.current.max;
  const key = `${accountId}/${min}/${max}`;

  const query = useQuery<CalendarEvent[] | null>({
    queryKey: calendarEventsKey({ timeMin: min, timeMax: max }, accountId ?? "anonymous"),
    enabled: !!accountId,
    queryFn: async () => readRemoteCalendar({ timeMin: min, timeMax: max }, accountId!),
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (accountId && activeRemoteAccount() === accountId && query.data &&
      getRemoteConfirmation({ timeMin: min, timeMax: max }).status === "confirmed" &&
      getRemoteConfirmation({ timeMin: min, timeMax: max }).events === query.data) {
      const remote = query.data;
      const previousIds = previous.current?.key === key ? previous.current.ids : new Set<string>();
      setEvents((prev) => activeRemoteAccount() === accountId &&
        getRemoteConfirmation({ timeMin: min, timeMax: max }).events === remote ?
        reconcileCalendarEvents(prev, overlayManualEdits(accountId, prev, remote, { timeMin: min, timeMax: max }),
          { timeMin: min, timeMax: max }, previousIds) : prev);
      previous.current = { key, ids: new Set(remote.map((event) => event.id)) };
    }
  }, [query.data, setEvents, key, min, max, accountId]);

  return query;
}
