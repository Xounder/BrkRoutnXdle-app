import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { useCalendar } from "../contexts/CalendarContext";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { useAuth } from "../contexts/AuthContext";
import { getWeekStart, getWeekEnd } from "../pages/dashboard/weekRange";
import { activeRemoteAccount, beginRemoteMutation, invalidateRemoteConfirmation, readRemoteCalendar, remoteEpoch } from "../services/remoteConfirmation";
import type { CalendarRange } from "../services/calendarReconciliation";
import { calendarEventsKey } from "./useCalendarRefresh";
import { reconcileCalendarEvents } from "../services/calendarReconciliation";

export function useCompletion(week?: CalendarRange) {
  const queryClient = useQueryClient();
  const { currentDate, setEvents } = useCalendar();
  const { user } = useAuth();

  const completeMutation = useMutation({
    mutationFn: async ({
      eventId,
      completed,
    }: {
      eventId: string;
      completed: boolean;
    }) => {
      const accountId = user?.id;
      if (!accountId || activeRemoteAccount() !== accountId) throw new Error("Sign in before updating completion.");
      const range = week ?? { timeMin: getWeekStart(currentDate).toISOString(),
        timeMax: new Date(getWeekEnd(currentDate).getTime() + 1).toISOString() };
      const endMutation = beginRemoteMutation();
      const version = remoteEpoch();
      const endpoint = completed
        ? `/events/${eventId}/complete`
        : `/events/${eventId}/incomplete`;
      let writeError: unknown;
      try { await api.patch<CalendarEvent>(endpoint); } catch (error) { writeError = error; }
      finally { endMutation(); }
      try {
        if (activeRemoteAccount() === accountId) {
          const fresh = await readRemoteCalendar(range, accountId);
          if (!fresh) throw new Error("Calendar changed during completion. Refresh before retrying.");
          if (fresh && remoteEpoch() === version) {
            setEvents(previous => activeRemoteAccount() === accountId && remoteEpoch() === version ?
              reconcileCalendarEvents(previous, fresh, range,
                new Set(previous.filter(event => event.source === "google").map(event => event.id))) : previous);
          }
        } else throw new Error("Account changed during completion.");
      } catch (error) { if (!writeError) writeError = error; }
      await queryClient.invalidateQueries({ queryKey: calendarEventsKey(range, accountId), exact: true, refetchType: "none" });
      if (writeError) {
        invalidateRemoteConfirmation();
        throw writeError;
      }
    },
  });

  const toggleCompletion = (eventId: string, currentCompleted: boolean) => {
    completeMutation.mutate({ eventId, completed: !currentCompleted });
  };

  return {
    toggleCompletion,
    isToggling: completeMutation.isPending,
    error: completeMutation.error,
  };
}
