import {
  fetchEvents as calFetchEvents,
  fetchEventsFromCalendar,
  createEvent as calCreateEvent,
  updateEvent as calUpdateEvent,
  deleteEvent as calDeleteEvent,
  setCompletionStatus,
  normalizeEvents,
} from "@brkroutnxdle/calendar";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import type { CreateEventPayload } from "@brkroutnxdle/calendar";
import { AppError } from "../middleware/errorHandler.js";

/** Wraps calendar operations with error normalization. */
async function withErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (err: any) {
    if (err?.response?.status === 401) {
      throw new AppError(401, "AUTH_EXPIRED", "Google token expired. Please re-authenticate.");
    }
    if (err?.response?.status === 403) {
      throw new AppError(403, "CALENDAR_ACCESS_DENIED", "Calendar access denied.");
    }
    if (err?.response?.status === 404) {
      throw new AppError(404, "EVENT_NOT_FOUND", "Event not found in calendar.");
    }
    if (err?.response?.status === 429) {
      throw new AppError(429, "GOOGLE_RATE_LIMIT", "Google API rate limit exceeded. Try again later.");
    }
    throw new AppError(502, "GOOGLE_API_ERROR", `Google API error: ${err?.message ?? "Unknown"}`);
  }
}

export async function fetchEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  return withErrorHandling(() => calFetchEvents(accessToken, timeMin, timeMax));
}

export async function fetchAllCalendarsEvents(
  accessToken: string,
  primaryCalId: string,
  brkCalId: string,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  return withErrorHandling(async () => {
    const [primaryEvents, brkEvents] = await Promise.all([
      fetchEventsFromCalendar(accessToken, primaryCalId, timeMin, timeMax),
      fetchEventsFromCalendar(accessToken, brkCalId, timeMin, timeMax),
    ]);
    return [...primaryEvents, ...brkEvents];
  });
}

export async function createEvent(
  accessToken: string,
  payload: CreateEventPayload,
): Promise<CalendarEvent> {
  return withErrorHandling(() => calCreateEvent(accessToken, payload));
}

export async function updateEvent(
  accessToken: string,
  eventId: string,
  payload: Partial<CreateEventPayload>,
): Promise<CalendarEvent> {
  return withErrorHandling(() => calUpdateEvent(accessToken, eventId, payload));
}

export async function deleteEvent(
  accessToken: string,
  eventId: string,
): Promise<void> {
  return withErrorHandling(() => calDeleteEvent(accessToken, eventId));
}

export async function completeEvent(
  accessToken: string,
  eventId: string,
  completed: boolean,
): Promise<CalendarEvent> {
  return withErrorHandling(() => setCompletionStatus(accessToken, eventId, completed));
}