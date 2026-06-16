import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCalendar } from "../contexts/CalendarContext";
import { usePreview } from "../contexts/PreviewContext";
import { getCalendarCache, setCalendarCache, clearCalendarCache } from "../services/calendarCache";
import { api } from "../services/api";
import type { CalendarEvent } from "@brkroutnxdle/shared";

export function useCalendarRefresh() {
  const queryClient = useQueryClient();
  const { events, setEvents } = useCalendar();
  const { isPreviewActive } = usePreview();

  /** Fetches fresh data from the API and updates cache + context. */
  const refreshFromApi = useCallback(async () => {
    const timeMin = new Date(Date.now() - 7 * 86400_000).toISOString();
    const timeMax = new Date(Date.now() + 14 * 86400_000).toISOString();

    const freshEvents = await api.get<CalendarEvent[]>("/events", {
      timeMin,
      timeMax,
    });

    setCalendarCache(freshEvents);
    setEvents(freshEvents);
    return freshEvents;
  }, [setEvents]);

  /** Detects conflicts between preview state and latest API data. */
  const detectConflicts = useCallback(
    async (): Promise<{ hasConflicts: boolean; changedEvents: string[] }> => {
      if (!isPreviewActive) return { hasConflicts: false, changedEvents: [] };

      const freshEvents = await refreshFromApi();
      const changedEvents: string[] = [];

      for (const fresh of freshEvents) {
        const local = events.find((e) => e.id === fresh.id);
        if (local && (local.start !== fresh.start || local.end !== fresh.end)) {
          changedEvents.push(fresh.id);
        }
      }

      return {
        hasConflicts: changedEvents.length > 0,
        changedEvents,
      };
    },
    [events, isPreviewActive, refreshFromApi],
  );

  /** Loads from cache first, then fetches fresh data in background. */
  const loadWithCache = useCallback(() => {
    const cached = getCalendarCache();
    if (cached) {
      setEvents(cached);
    }
    // Always fetch fresh data in background
    refreshFromApi().catch(console.error);
  }, [setEvents, refreshFromApi]);

  return {
    refreshFromApi,
    detectConflicts,
    loadWithCache,
    clearCache: clearCalendarCache,
  };
}
