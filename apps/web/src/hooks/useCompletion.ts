import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { useCalendar } from "../contexts/CalendarContext";
import type { CalendarEvent } from "@brkroutnxdle/shared";

export function useCompletion() {
  const queryClient = useQueryClient();
  const { events, setEvents } = useCalendar();

  const completeMutation = useMutation({
    mutationFn: async ({
      eventId,
      completed,
    }: {
      eventId: string;
      completed: boolean;
    }) => {
      const endpoint = completed
        ? `/events/${eventId}/complete`
        : `/events/${eventId}/incomplete`;
      return api.patch<CalendarEvent>(endpoint);
    },
    onSuccess: (_updatedEvent, variables) => {
      // Update local state immediately
      const updated = events.map((e) =>
        e.id === variables.eventId
          ? { ...e, isCompleted: variables.completed }
          : e,
      );
      setEvents(updated);
      // Invalidate queries to refetch from backend
      queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
    },
  });

  const toggleCompletion = (eventId: string, currentCompleted: boolean) => {
    completeMutation.mutate({ eventId, completed: !currentCompleted });
  };

  return {
    toggleCompletion,
    isToggling: completeMutation.isPending,
  };
}
