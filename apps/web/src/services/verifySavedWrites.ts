import type { CalendarEvent } from "@brkroutnxdle/shared";

/** A write response is not proof that the dedicated calendar now contains the intended state. */
export function verifySavedWrites(fresh: readonly CalendarEvent[], created: Iterable<CalendarEvent>,
  updated: ReadonlyMap<string, { start: string; end: string }>, deleted: ReadonlySet<string>): boolean {
  const byId = new Map(fresh.map(event => [event.id, event]));
  for (const event of created) {
    const confirmed = byId.get(event.id);
    if (!confirmed || confirmed.start !== event.start || confirmed.end !== event.end ||
      !confirmed.isGenerated) return false;
  }
  for (const [id, expected] of updated) {
    const confirmed = byId.get(id);
    if (!confirmed || confirmed.start !== expected.start || confirmed.end !== expected.end) return false;
  }
  for (const id of deleted) if (byId.has(id)) return false;
  return true;
}
