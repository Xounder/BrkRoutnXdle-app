import type { GeneratedEvent } from "@brkroutnxdle/domain";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import type { CalendarRange } from "./calendarReconciliation";
import { isInRange } from "./calendarReconciliation";
import { replacementCandidates, sameReplacementBaseline } from "../pages/dashboard/previewSchedule";

export interface PreviewWriteJournal {
  createdIds: ReadonlySet<string>;
  updated: ReadonlyMap<string, { start: string; end: string }>;
  deletedIds: ReadonlySet<string>;
}

/** A fresh GET must agree with the preview snapshot, except for our own confirmed writes. */
export function assertPreviewBaseline(
  snapshot: ReadonlyArray<Readonly<CalendarEvent>>, fresh: CalendarEvent[], range: CalendarRange,
  journal: PreviewWriteJournal, now: number,
): void {
  const originalIds = new Set(snapshot.map((event) => event.id));
  const conflict = () => new Error("Calendar changed since preview. Refresh and calculate again before saving.");
  for (const original of snapshot) {
    const current = fresh.find((event) => event.id === original.id);
    if (journal.deletedIds.has(original.id)) {
      if (current) throw conflict();
      continue;
    }
    if (!current) throw conflict();
    const updated = journal.updated.get(original.id);
    const expected = updated ? { ...original, ...updated } : original;
    if (!sameReplacementBaseline([expected], [current])) throw conflict();
  }
  const additions = replacementCandidates(fresh, range, now).some((event) =>
    !originalIds.has(event.id) && !journal.createdIds.has(event.id));
  if (additions) throw conflict();
}

/** Combine generated proposals with pinned unsaved placements, never replacing pinned slots. */
export function previewSavePlan(
  proposals: GeneratedEvent[], local: CalendarEvent[], baseline: CalendarEvent[], range: CalendarRange,
  now: number, approvedIds?: ReadonlySet<string>,
) {
  const confirmedIds = new Set(baseline.map((event) => event.id));
  const pinned = local.filter((event) => event.source === "brkroutnxdle" &&
    event.isGenerated && !!event.taskId && !confirmedIds.has(event.id) && isInRange(event, range));
  const desired: GeneratedEvent[] = [];
  const ids = new Set<string>();
  const slots = new Set<string>();
  const add = (event: GeneratedEvent) => {
    const slot = `${event.taskId}:${Date.parse(event.start)}:${Date.parse(event.end)}`;
    if (ids.has(event.id) || slots.has(slot)) return;
    ids.add(event.id);
    slots.add(slot);
    desired.push(event);
  };
  // Pending manual placement owns its slot if a generated proposal overlaps it.
  for (const event of pinned) add({
    id: event.id, taskId: event.taskId!, start: event.start, end: event.end,
    completed: event.isCompleted, createdAt: "", updatedAt: "",
  });
  for (const event of proposals) {
    if (event.start < range.timeMax && event.end > range.timeMin) add(event);
  }

  const proposedTaskIds = new Set(proposals.map((event) => event.taskId));
  const replaceable = baseline.filter((event) => event.isGenerated && !!event.taskId &&
    !event.isPinned && !event.isCompleted && Date.parse(event.end) > now && isInRange(event, range) &&
    (!approvedIds || approvedIds.has(event.id)) &&
    (proposals.length === 0 || proposedTaskIds.has(event.taskId)));
  const replaceableIds = new Set(replaceable.map((event) => event.id));
  const matchable = baseline.filter((remote) => pinned.some((event) =>
    event.taskId === remote.taskId && event.start === remote.start && event.end === remote.end));
  const matchableIds = new Set(matchable.map((event) => event.id));
  const savedLocalIds = new Set(pinned.filter((event) => matchableIds.size > 0 && matchable.some((remote) =>
    remote.taskId === event.taskId && remote.start === event.start && remote.end === event.end))
    .map((event) => event.id));
  return { desired, candidates: [...replaceable, ...matchable.filter((event) => !replaceableIds.has(event.id))],
    replaceableIds, matchableIds, savedLocalIds };
}
