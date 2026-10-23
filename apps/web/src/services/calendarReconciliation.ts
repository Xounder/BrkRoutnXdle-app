import type { CalendarEvent } from "@brkroutnxdle/shared";

export interface CalendarRange { timeMin: string; timeMax: string }

export function isInRange(event: CalendarEvent, range: CalendarRange): boolean {
  return event.start < range.timeMax && event.end > range.timeMin;
}

/** `source` on the API is the calendar of origin, not evidence of a local draft.
 * After this trusted response boundary, "google" denotes a confirmed remote
 * occurrence in web state. Local pending placements never pass this boundary.
 */
export function confirmRemoteEvent(value: unknown, response: "get" | "post" = "get"): CalendarEvent {
  const event = value as CalendarEvent | null;
  if (!event || typeof event !== "object" || !event.id || typeof event.id !== "string" ||
    (event.source !== "google" && event.source !== "brkroutnxdle" &&
      !(response === "post" && event.source === undefined))) {
    throw new Error("Calendar API returned an invalid remote event. Refresh before retrying.");
  }
  // Older POST responses may echo the submitted wire shape rather than a
  // normalized event. Only the trusted POST endpoint may use this fallback.
  const dateTime = (value: unknown) => typeof value === "string" ? value :
    value && typeof value === "object" && "dateTime" in value ?
      (value as { dateTime: unknown }).dateTime : undefined;
  const start = dateTime(event.start);
  const end = dateTime(event.end);
  if (typeof start !== "string" || typeof end !== "string" ||
    (response === "get" && (typeof event.start !== "string" || typeof event.end !== "string"))) {
    throw new Error("Calendar API returned an invalid remote event. Refresh before retrying.");
  }
  return { ...event, start, end, source: "google" };
}

export function confirmRemoteEvents(value: unknown): CalendarEvent[] {
  if (!Array.isArray(value)) {
    throw new Error("Calendar GET returned an invalid event list. No changes were written; retry after refreshing.");
  }
  return value.map((event: unknown) => confirmRemoteEvent(event));
}

/** Remove only previously confirmed remote IDs in this range; never remove pending placements. */
export function reconcileCalendarEvents(
  current: CalendarEvent[], remote: CalendarEvent[], range: CalendarRange,
  previousRemoteIds: ReadonlySet<string> = new Set(),
  savedLocalIds: ReadonlySet<string> = new Set(),
): CalendarEvent[] {
  const fetchedIds = new Set(remote.map((event) => event.id));
  return [
    ...current.filter((event) =>
      !savedLocalIds.has(event.id) && !fetchedIds.has(event.id) &&
      !(previousRemoteIds.has(event.id) && isInRange(event, range))),
    ...remote,
  ];
}
