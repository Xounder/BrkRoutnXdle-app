# TASK-03 Implementation Guide — Part 2

Continuing with `updateEvent`, `deleteEvent`, and the event routes.

---

### Step 5a: Append to `packages/calendar/src/public/operations.ts` — Update and delete

Add the following functions at the end of the file:

```ts
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
```

### Step 6: Create `packages/calendar/src/index.ts` — Package entry point

```ts
export {
  fetchEvents,
  fetchEventsFromCalendar,
  createEvent,
  updateEvent,
  deleteEvent,
  setCompletionStatus,
} from "./public/operations.js";
export { normalizeEvents } from "./internal/normalizer.js";
```

### Step 7: Create `apps/api/src/services/calendar-client.ts` — API calendar service

```ts
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
import type { CreateEventPayload } from "@brkroutnxdle/calendar/internal/types";
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
```

### Step 8: Create `apps/api/src/routes/events.ts` — Event routes

```ts
import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import * as calendarClient from "../services/calendar-client.js";

export const eventsRouter = Router();

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

const createEventSchema = z.object({
  summary: z.string().min(1).max(200),
  description: z.string().optional(),
  start: z.object({
    dateTime: z.string().regex(ISO_DATE_REGEX, "Must be ISO 8601"),
    timeZone: z.string().optional(),
  }),
  end: z.object({
    dateTime: z.string().regex(ISO_DATE_REGEX, "Must be ISO 8601"),
    timeZone: z.string().optional(),
  }),
  taskId: z.string().optional(),
});

const updateEventSchema = z.object({
  summary: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  start: z
    .object({
      dateTime: z.string().regex(ISO_DATE_REGEX),
      timeZone: z.string().optional(),
    })
    .optional(),
  end: z
    .object({
      dateTime: z.string().regex(ISO_DATE_REGEX),
      timeZone: z.string().optional(),
    })
    .optional(),
});

/** GET /events — Fetch events in a time range. */
eventsRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const timeMin = (req.query.timeMin as string) ?? new Date().toISOString();
  const timeMax = (req.query.timeMax as string) ?? new Date(Date.now() + 7 * 86400_000).toISOString();

  const events = await calendarClient.fetchEvents(req.accessToken!, timeMin, timeMax);
  res.json({ success: true, data: events });
});
```

*See Part 3 for the remaining event routes.*
