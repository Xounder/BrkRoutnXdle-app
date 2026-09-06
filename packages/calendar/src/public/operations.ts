import { google, calendar_v3 } from "googleapis";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { normalizeEvent, normalizeEvents } from "../internal/normalizer.js";
import { createMetadata } from "../internal/metadata.js";
import type { GoogleCalendarEvent, CreateEventPayload } from "../internal/types.js";

const BRKROUTNXDLE_CALENDAR_NAME = "BrkRoutnXdle";

/**
 * Google Calendar API v3 `events.list` only accepts `orderBy: "startTime" | "updated"`.
 * `startTime` ordering requires `singleEvents: true` and a `timeMin`/`timeMax` range,
 * both of which are set on every `events.list` call in this module.
 */
const ORDER_BY_START_TIME = "startTime" as const;

/**
 * Module-level cache for resolved BrkRoutnXdle calendar IDs, keyed by access token.
 * Cleared on token changes to ensure stale tokens don't reuse a cached ID.
 */
const calendarIdCache = new Map<string, string>();

/**
 * Clears the calendar ID cache for a given access token.
 * Call this when the user's access token changes.
 */
export function clearCalendarIdCache(accessToken: string): void {
  calendarIdCache.delete(accessToken);
}

/**
 * Creates an authenticated calendar client.
 */
function createClient(accessToken: string): calendar_v3.Calendar {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

/**
 * Discovers (or creates) the BrkRoutnXdle calendar ID with caching.
 *
 * Caches the resolved ID in a module-level map so `calendarList.list()`
 * is called at most once per access token session. If the calendar does
 * not exist, it attempts to auto-create it. If creation fails, it throws
 * a clear actionable error.
 */
async function getBrkCalendarId(accessToken: string): Promise<string> {
  // Return cached ID if available
  const cached = calendarIdCache.get(accessToken);
  if (cached) return cached;

  const client = createClient(accessToken);

  // Try to find the BrkRoutnXdle calendar in the user's calendar list
  const { data } = await client.calendarList.list();
  const brkCal = data.items?.find(
    (c: { summary?: string | null; id?: string | null }) =>
      c.summary === BRKROUTNXDLE_CALENDAR_NAME,
  );

  if (brkCal?.id) {
    calendarIdCache.set(accessToken, brkCal.id);
    return brkCal.id;
  }

  // Calendar not found — attempt auto-creation
  try {
    const { data: created } = await client.calendars.insert({
      requestBody: {
        summary: BRKROUTNXDLE_CALENDAR_NAME,
        description: "Calendar for BrkRoutnXdle scheduled events",
      },
    });

    if (!created.id) {
      throw new Error(
        `BrkRoutnXdle calendar not found and auto-creation returned no ID. ` +
        `Please create a calendar named "${BRKROUTNXDLE_CALENDAR_NAME}" in Google Calendar and try again.`,
      );
    }

    calendarIdCache.set(accessToken, created.id);
    return created.id;
  } catch (createErr: any) {
    // If auto-creation fails, provide a clear actionable error
    throw new Error(
      `BrkRoutnXdle calendar not found and could not be auto-created. ` +
      `Please ensure a calendar named "${BRKROUTNXDLE_CALENDAR_NAME}" exists in your Google Calendar ` +
      `and that the app has permission to access it. ` +
      `Original error: ${createErr?.message ?? "Unknown"}`,
    );
  }
}

/**
 * Fetches events from the BrkRoutnXdle calendar within a time range.
 */
export async function fetchEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  const brkCalId = await getBrkCalendarId(accessToken);
  const client = createClient(accessToken);
  const { data } = await client.events.list({
    calendarId: brkCalId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: ORDER_BY_START_TIME,
  });
  return normalizeEvents((data.items ?? []) as GoogleCalendarEvent[], brkCalId, true);
}

/**
 * Fetches events from a specific calendar (including the primary calendar).
 */
export async function fetchEventsFromCalendar(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  const client = createClient(accessToken);
  const { data } = await client.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: ORDER_BY_START_TIME,
  });
  return normalizeEvents(
    (data.items ?? []) as GoogleCalendarEvent[],
    calendarId,
    calendarId.includes("brkroutnxdle"), // heuristic: if ID contains "brkroutnxdle"
  );
}

/**
 * Creates a new event in the BrkRoutnXdle calendar with metadata.
 */
export async function createEvent(
  accessToken: string,
  payload: CreateEventPayload,
): Promise<CalendarEvent> {
  const brkCalId = await getBrkCalendarId(accessToken);
  const client = createClient(accessToken);
  const meta = createMetadata(payload.extendedProperties?.private?.taskId);

  const { data: created } = await client.events.insert({
    calendarId: brkCalId,
    requestBody: {
      summary: payload.summary,
      description: payload.description,
      start: payload.start,
      end: payload.end,
      extendedProperties: {
        private: {
          ...meta,
          ...payload.extendedProperties?.private,
        },
      },
    },
  });

  return normalizeEvent(created as GoogleCalendarEvent, brkCalId, true);
}

/**
 * Updates an existing event in the BrkRoutnXdle calendar.
 * Preserves existing extended properties and updates `updatedAt`.
 */
export async function updateEvent(
  accessToken: string,
  eventId: string,
  payload: Partial<CreateEventPayload>,
): Promise<CalendarEvent> {
  const brkCalId = await getBrkCalendarId(accessToken);
  const client = createClient(accessToken);

  // Fetch existing event to preserve metadata
  const { data: existing } = await client.events.get({
    calendarId: brkCalId,
    eventId,
  });

  const existingMeta = (existing as GoogleCalendarEvent).extendedProperties?.private ?? {};
  const updatedMeta = {
    ...existingMeta,
    updatedAt: new Date().toISOString(),
    ...(payload.extendedProperties?.private ?? {}),
  };

  const { data: updated } = await client.events.update({
    calendarId: brkCalId,
    eventId,
    requestBody: {
      summary: payload.summary ?? existing.summary,
      description: payload.description ?? existing.description,
      start: payload.start ?? existing.start,
      end: payload.end ?? existing.end,
      extendedProperties: {
        private: updatedMeta,
      },
    },
  });

  return normalizeEvent(updated as GoogleCalendarEvent, brkCalId, true);
}

/**
 * Deletes an event from the BrkRoutnXdle calendar.
 */
export async function deleteEvent(
  accessToken: string,
  eventId: string,
): Promise<void> {
  const brkCalId = await getBrkCalendarId(accessToken);
  const client = createClient(accessToken);
  await client.events.delete({ calendarId: brkCalId, eventId });
}

/**
 * Toggles the completion status of a BrkRoutnXdle event.
 */
export async function setCompletionStatus(
  accessToken: string,
  eventId: string,
  completed: boolean,
): Promise<CalendarEvent> {
  const brkCalId = await getBrkCalendarId(accessToken);
  const client = createClient(accessToken);

  const { data: existing } = await client.events.get({
    calendarId: brkCalId,
    eventId,
  });

  const existingMeta = (existing as GoogleCalendarEvent).extendedProperties?.private ?? {};
  const updatedMeta = {
    ...existingMeta,
    completed: String(completed),
    updatedAt: new Date().toISOString(),
  };

  const { data: updated } = await client.events.update({
    calendarId: brkCalId,
    eventId,
    requestBody: {
      extendedProperties: { private: updatedMeta },
    },
  });

  return normalizeEvent(updated as GoogleCalendarEvent, brkCalId, true);
}