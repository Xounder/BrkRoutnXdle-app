import { google, calendar_v3 } from "googleapis";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { normalizeEvent, normalizeEvents } from "../internal/normalizer.js";
import { createMetadata } from "../internal/metadata.js";
import type { GoogleCalendarEvent, CreateEventPayload } from "../internal/types.js";

const BRKROUTNXDLE_CALENDAR_NAME = "BrkRoutnXdle";

/**
 * Creates an authenticated calendar client.
 */
function createClient(accessToken: string): calendar_v3.Calendar {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

/**
 * Discovers the BrkRoutnXdle calendar ID.
 */
async function getBrkCalendarId(accessToken: string): Promise<string> {
  const client = createClient(accessToken);
  const { data } = await client.calendarList.list();
  const brkCal = data.items?.find((c: { summary?: string | null; id?: string | null }) => c.summary === BRKROUTNXDLE_CALENDAR_NAME);
  if (!brkCal?.id) throw new Error("BrkRoutnXdle calendar not found");
  return brkCal.id;
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
    orderBy: "start",
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
    orderBy: "start",
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