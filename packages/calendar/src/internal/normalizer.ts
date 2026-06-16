import type { CalendarEvent } from "@brkroutnxdle/shared";
import type { GoogleCalendarEvent } from "./types.js";
import { extractMetadata } from "./metadata.js";

const PRIMARY_CALENDAR_SOURCE = "google";
const BRKROUTNXDLE_CALENDAR_SOURCE = "brkroutnxdle";

/**
 * Normalizes a raw Google Calendar API event into the internal CalendarEvent shape.
 * @param raw - Raw event from Google Calendar API
 * @param calendarId - The Google Calendar ID this event belongs to
 * @param isBrkCalendar - Whether this event comes from the BrkRoutnXdle calendar
 */
export function normalizeEvent(
  raw: GoogleCalendarEvent,
  calendarId: string,
  isBrkCalendar: boolean,
): CalendarEvent {
  const meta = extractMetadata(raw);
  const isGenerated = meta !== null && meta.generated === "true";

  return {
    id: raw.id ?? "",
    title: raw.summary ?? "(untitled)",
    start: raw.start?.dateTime ?? raw.start?.date ?? "",
    end: raw.end?.dateTime ?? raw.end?.date ?? "",
    isAllDay: !raw.start?.dateTime,
    isGenerated,
    taskId: meta?.taskId,
    isCompleted: meta?.completed === "true",
    source: isBrkCalendar ? BRKROUTNXDLE_CALENDAR_SOURCE : PRIMARY_CALENDAR_SOURCE,
  };
}

/**
 * Normalizes an array of raw Google Calendar events.
 */
export function normalizeEvents(
  rawEvents: GoogleCalendarEvent[],
  calendarId: string,
  isBrkCalendar: boolean,
): CalendarEvent[] {
  return rawEvents.map((e) => normalizeEvent(e, calendarId, isBrkCalendar));
}