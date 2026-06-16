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