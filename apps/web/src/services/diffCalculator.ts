import type { GeneratedEvent } from "@brkroutnxdle/domain";
import type { CalendarEvent, Task } from "@brkroutnxdle/shared";

export interface DiffResult {
  toCreate: Array<{ summary: string; start: { dateTime: string }; end: { dateTime: string }; taskId?: string }>;
  toUpdate: Array<{ id: string; title?: string; start?: string; end?: string }>;
  toDelete: string[];
}

export interface DiffOptions {
  noDelete?: boolean;
  /** Explicit set of remote occurrence IDs eligible for replacement. */
  replaceableIds?: ReadonlySet<string>;
  /** Confirmed remote slots eligible for exact occurrence matching, even if not replaceable. */
  matchableIds?: ReadonlySet<string>;
}

export function getTaskTitle(taskId: string, tasks: Task[]): string {
  return tasks.find((task) => task.id === taskId)?.title ?? taskId;
}

/** Only the confirmed GET response is a remote identity authority. */
export function computeDiff(
  previewEvents: GeneratedEvent[],
  persistedEvents: CalendarEvent[],
  tasks: Task[] = [],
  options?: DiffOptions,
): DiffResult {
  const result: DiffResult = { toCreate: [], toUpdate: [], toDelete: [] };
  const remote = persistedEvents.filter((event) => event.source !== "brkroutnxdle");
  const matched = new Set<string>();

  for (const preview of previewEvents) {
    // Exact ID wins. An unchanged occurrence may also be recognised by task +
    // slot (e.g. a POST response was lost); task ID alone is never sufficient.
    const existing = remote.find((event) =>
      !matched.has(event.id) && event.id === preview.id,
    ) ?? remote.find((event) =>
      !matched.has(event.id) && event.taskId === preview.taskId &&
      event.start === preview.start && event.end === preview.end &&
      (!options?.replaceableIds || options.replaceableIds.has(event.id) ||
        options.matchableIds?.has(event.id)),
    );
    if (existing) {
      matched.add(existing.id);
      if (existing.start !== preview.start || existing.end !== preview.end) {
        result.toUpdate.push({ id: existing.id, start: preview.start, end: preview.end });
      }
    } else {
      result.toCreate.push({
        summary: getTaskTitle(preview.taskId, tasks),
        start: { dateTime: preview.start },
        end: { dateTime: preview.end },
        taskId: preview.taskId,
      });
    }
  }

  if (!options?.noDelete) {
    for (const event of remote) {
      if (!matched.has(event.id) && (!options?.replaceableIds || options.replaceableIds.has(event.id))) {
        result.toDelete.push(event.id);
      }
    }
  }
  return result;
}
