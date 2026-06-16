# Task 03 — Backend Events API

## Task Information

### ID

TASK-03

### Title

Backend Events API

### Owner

senior-backend

### Status

Pending

---

## Description

Implement all event-related backend endpoints for the BrkRoutnXdle calendar. This includes reading, creating, updating, deleting events, and managing completion status. The `packages/calendar` package will be implemented as a Google Calendar abstraction layer for event normalization and metadata handling.

---

## Acceptance Criteria

- [ ] `GET /api/v1/events` returns events from the BrkRoutnXdle calendar with optional time range filtering
- [ ] `GET /api/v1/events/week` returns events for a given week (Mon-Sun or Sun-Sat based on settings)
- [ ] `GET /api/v1/events/generated` returns only BrkRoutnXdle-generated events (filtered by extended properties)
- [ ] `POST /api/v1/events` creates a new event with proper extended properties (`app`, `generated`, `completed`, `taskId`, `created`, `updated`)
- [ ] `PATCH /api/v1/events/:id` updates an existing event (title, start, end, description)
- [ ] `DELETE /api/v1/events/:id` deletes an event
- [ ] `PATCH /api/v1/events/:id/complete` marks an event as completed (updates extended properties)
- [ ] `PATCH /api/v1/events/:id/incomplete` marks an event as not completed
- [ ] `packages/calendar` exports: `fetchEvents()`, `createEvent()`, `updateEvent()`, `deleteEvent()`, `normalizeEvents()`
- [ ] Event normalization converts Google Calendar events to internal `CalendarEvent` type
- [ ] Extended properties are preserved and readable on all event operations
- [ ] Primary calendar events are returned as read-only (no create/update/delete)
- [ ] All endpoints enforce authentication middleware (require valid session)
- [ ] Error responses use the standard `ApiError` format

---

## Dependencies

### Required Tasks

- TASK-02

### Dependency Notes

Builds on the auth infrastructure from TASK-02. Requires authenticated Google API client to interact with the BrkRoutnXdle calendar.

---

## Technical Context

### Relevant Components

- `apps/api/src/routes/events.ts`
- `apps/api/src/services/calendar-client.ts`
- `apps/api/src/middleware/auth.ts`
- `packages/calendar/src/public/` (calendar abstraction layer)
- `packages/calendar/src/internal/` (Google API mapping)

### Relevant Modules

- `apps/api`
- `packages/calendar`

### Relevant APIs

- `GET /api/v1/events`
- `GET /api/v1/events/week`
- `GET /api/v1/events/generated`
- `POST /api/v1/events`
- `PATCH /api/v1/events/:id`
- `DELETE /api/v1/events/:id`
- `PATCH /api/v1/events/:id/complete`
- `PATCH /api/v1/events/:id/incomplete`

### Relevant Types

- `CalendarEvent`, `CreateEventPayload`, `UpdateEventPayload`, `CompletionStatus`
- Google Calendar API Event types

---

## Implementation Guidance — Part 1 of 3

*See continuation files in `tasks/references/` for Parts 2 and 3.*

---

### Step 1: Create `packages/calendar/src/internal/types.ts` — Internal calendar types

```ts
import type { CalendarEvent } from "@brkroutnxdle/shared";

/** Raw Google Calendar API event shape (relevant fields only). */
export interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  description?: string | null;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
  status?: string;
  transparency?: string;
  visibility?: string;
}

/** Extended properties metadata for BrkRoutnXdle events. */
export interface BrkRoutnXdleMetadata {
  app: string;
  generated: string;
  completed: string;
  taskId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a new event in Google Calendar. */
export interface CreateEventPayload {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  extendedProperties?: {
    private: Record<string, string>;
  };
}

/** Payload for updating an existing event. */
export interface UpdateEventPayload {
  summary?: string;
  description?: string;
  start?: { dateTime: string; timeZone?: string };
  end?: { dateTime: string; timeZone?: string };
  extendedProperties?: {
    private: Record<string, string>;
  };
}
```

### Step 2: Create `packages/calendar/src/internal/metadata.ts` — Extended properties helpers

```ts
import type { BrkRoutnXdleMetadata, GoogleCalendarEvent } from "./types.js";

const APP_NAME = "BrkRoutnXdle";

/** Creates the standard BrkRoutnXdle metadata for a new event. */
export function createMetadata(taskId?: string): BrkRoutnXdleMetadata {
  const now = new Date().toISOString();
  return {
    app: APP_NAME,
    generated: "true",
    completed: "false",
    ...(taskId ? { taskId } : {}),
    createdAt: now,
    updatedAt: now,
  };
}

/** Updates the `updatedAt` timestamp in existing metadata. */
export function touchMetadata(meta: BrkRoutnXdleMetadata): BrkRoutnXdleMetadata {
  return { ...meta, updatedAt: new Date().toISOString() };
}

/** Checks if a Google Calendar event belongs to BrkRoutnXdle. */
export function isBrkRoutnXdleEvent(event: GoogleCalendarEvent): boolean {
  return event.extendedProperties?.private?.app === APP_NAME;
}

/** Extracts metadata from a Google Calendar event, or null if not a BrkRoutnXdle event. */
export function extractMetadata(event: GoogleCalendarEvent): BrkRoutnXdleMetadata | null {
  const priv = event.extendedProperties?.private;
  if (!priv || priv.app !== APP_NAME) return null;
  return {
    app: priv.app,
    generated: priv.generated ?? "false",
    completed: priv.completed ?? "false",
    taskId: priv.taskId,
    createdAt: priv.createdAt ?? new Date().toISOString(),
    updatedAt: priv.updatedAt ?? new Date().toISOString(),
  };
}
```

### Step 3: Create `packages/calendar/src/internal/normalizer.ts` — Event normalization

```ts
import type { CalendarEvent } from "@brkroutnxdle/shared";
import type { GoogleCalendarEvent } from "./types.js";
import { extractMetadata } from "./metadata.js";

const PRIMARY_CALENDAR_SOURCE = "google";
const BRKROUTNXDL_E_CALENDAR_SOURCE = "brkroutnxdle";

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
    source: isBrkCalendar ? BRKROUTNXDL_E_CALENDAR_SOURCE : PRIMARY_CALENDAR_SOURCE,
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
```

### Step 4: Create `packages/calendar/src/public/index.ts` — Public API

```ts
export { fetchEvents, createEvent, updateEvent, deleteEvent } from "./operations.js";
```

### Step 5: Create `packages/calendar/src/public/operations.ts` — Calendar operations

```ts
import { google, calendar_v3 } from "googleapis";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { normalizeEvents } from "../internal/normalizer.js";
import { createMetadata } from "../internal/metadata.js";
import type { GoogleCalendarEvent, CreateEventPayload } from "../internal/types.js";

const BRKROUTNXDL_E_CALENDAR_NAME = "BrkRoutnXdle";

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
  const brkCal = data.items?.find((c) => c.summary === BRKROUTNXDL_E_CALENDAR_NAME);
  if (!brkCal.id) throw new Error("BrkRoutnXdle calendar not found");
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
```

*See Part 2 for `updateEvent`, `deleteEvent`, and the event routes.*---

## Testing & Validation

See `references/TASK-03-impl-guide-part3.md` for the Testing section, Definition of Done, and References. The event routes in that file include validation using Zod schemas for all request bodies.
