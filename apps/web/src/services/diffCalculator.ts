import type { GeneratedEvent } from "@brkroutnxdle/domain";
import type { CalendarEvent } from "@brkroutnxdle/shared";

export interface DiffResult {
  toCreate: Array<{
    title: string;
    start: string;
    end: string;
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
 * Computes the diff between a preview state and the persisted calendar state.
 * Determines minimal set of create/update/delete operations needed.
 */
export function computeDiff(
  previewEvents: GeneratedEvent[],
  persistedEvents: CalendarEvent[],
): DiffResult {
  const previewMap = new Map(previewEvents.map((e) => [e.id, e]));
  const persistedMap = new Map(persistedEvents.map((e) => [e.id, e]));

  const result: DiffResult = {
    toCreate: [],
    toUpdate: [],
    toDelete: [],
  };

  // Find creates and updates
  for (const [id, preview] of previewMap) {
    const persisted = persistedMap.get(id);

    if (!persisted) {
      // New event — create
      result.toCreate.push({
        title: `Task ${preview.taskId}`,
        start: preview.start,
        end: preview.end,
        taskId: preview.taskId,
      });
    } else if (
      persisted.start !== preview.start ||
      persisted.end !== preview.end
    ) {
      // Existing event with changes — update
      result.toUpdate.push({
        id,
        start: preview.start,
        end: preview.end,
      });
    }
    // Else: unchanged — skip
  }

  // Find deletes: events in persisted but not in preview
  for (const [id] of persistedMap) {
    if (!previewMap.has(id)) {
      result.toDelete.push(id);
    }
  }

  return result;
}
