import type { GeneratedEvent } from "@brkroutnxdle/domain";
import type { CalendarEvent, Task } from "@brkroutnxdle/shared";

export interface DiffResult {
  toCreate: Array<{
    summary: string;
    start: { dateTime: string };
    end: { dateTime: string };
    taskId?: string;
  }>;
  toUpdate: Array<{
    id: string;
    title?: string;
    start?: string;
    end?: string;
  }>;
  toDelete: string[]; // event IDs
}

/**
 * Builds a map from persisted events with two key strategies:
 * 1. By Google Calendar event ID (primary — used for freshly created events)
 * 2. By taskId (fallback — used for events created before we stored the real Google ID)
 * 
 * Pending events (source: "brkroutnxdle") are excluded from the byTaskId map
 * because they don't exist on Google Calendar yet and should not be PATCHed.
 * They remain in byId for potential ID-based matching, but the fallback to
 * taskId matching will not find them, causing them to be treated as CREATEs.
 */
function buildPersistedLookup(persistedEvents: CalendarEvent[]): {
  byId: Map<string, CalendarEvent>;
  byTaskId: Map<string, CalendarEvent>;
} {
  const byId = new Map<string, CalendarEvent>();
  const byTaskId = new Map<string, CalendarEvent>();

  for (const event of persistedEvents) {
    byId.set(event.id, event);
    // Only add to byTaskId if the event is synced to Google Calendar (source: "google").
    // Pending events (source: "brkroutnxdle") have local UUIDs and don't exist remotely yet.
    if (event.taskId && event.source === "google") {
      byTaskId.set(event.taskId, event);
    }
  }

  return { byId, byTaskId };
}

/**
 * Finds a persisted event matching a preview event.
 * First tries to match by ID (Google Calendar event ID),
 * then falls back to taskId for backwards compatibility.
 */
function findPersistedMatch(
  preview: GeneratedEvent,
  persistedById: Map<string, CalendarEvent>,
  persistedByTaskId: Map<string, CalendarEvent>,
): CalendarEvent | undefined {
  // Primary: match by Google Calendar event ID
  const byId = persistedById.get(preview.id);
  if (byId) return byId;

  // Fallback: match by taskId (for events saved before we stored the real Google ID)
  if (preview.taskId) {
    return persistedByTaskId.get(preview.taskId);
  }

  return undefined;
}

export function getTaskTitle(taskId: string, tasks: Task[]): string {
  const task = tasks.find((t) => t.id === taskId);
  return task?.title ?? taskId;
}

/**
 * Computes the diff between a preview state and the persisted calendar state.
 * Determines minimal set of create/update/delete operations needed.
 *
 * Matching strategy:
 * - Preview events are first matched to persisted events by their event ID
 *   (the real Google Calendar ID, stored after creation).
 * - As a fallback, events are matched by `taskId` to support events that
 *   were saved before the Google Calendar event ID was stored.
 */
export function computeDiff(
  previewEvents: GeneratedEvent[],
  persistedEvents: CalendarEvent[],
  tasks: Task[] = [],
  options?: { noDelete?: boolean },
): DiffResult {
  const previewMap = new Map(previewEvents.map((e) => [e.id, e]));
  const { byId: persistedById, byTaskId: persistedByTaskId } =
    buildPersistedLookup(persistedEvents);

  const result: DiffResult = {
    toCreate: [],
    toUpdate: [],
    toDelete: [],
  };

  // Track which persisted events have been matched (to avoid false deletes)
  const matchedPersistedIds = new Set<string>();

  // Find creates and updates
  for (const [id, preview] of previewMap) {
    const persisted = findPersistedMatch(preview, persistedById, persistedByTaskId);

    if (!persisted) {
      // New event — create
      result.toCreate.push({
        summary: getTaskTitle(preview.taskId, tasks),
        start: { dateTime: preview.start },
        end: { dateTime: preview.end },
        taskId: preview.taskId,
      });
    } else {
      // Mark as matched — do not delete
      matchedPersistedIds.add(persisted.id);

      if (
        persisted.start !== preview.start ||
        persisted.end !== preview.end
      ) {
        // Existing event with changes — update using the real Google Calendar ID
        result.toUpdate.push({
          id: persisted.id,
          start: preview.start,
          end: preview.end,
        });
      }
    }
    // Else: unchanged — skip
  }

  // Find deletes: events in persisted but not in preview (and not matched by taskId)
  if (!options?.noDelete) {
    for (const [, persisted] of persistedById) {
      if (!matchedPersistedIds.has(persisted.id)) {
        // Skip pending events (source: "brkroutnxdle") — they don't exist on Google Calendar
        // and must never be remote-DELETEd. They are removed locally by user actions only.
        if (persisted.source === "brkroutnxdle") {
          continue;
        }
        result.toDelete.push(persisted.id);
      }
    }
  }

  return result;
}
