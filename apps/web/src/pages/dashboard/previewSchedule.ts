import type { CalendarEvent, Task } from "@brkroutnxdle/shared";
import type { GeneratedEvent } from "@brkroutnxdle/domain";

export interface PreviewRange { timeMin: string; timeMax: string }

/** Calendar navigation is a civil date; interpret that date in the selected settings timezone. */
export function viewedWeek(date: Date, timezone: string, weekStartDay: number): PreviewRange {
  const day = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() - weekStartDay + 7) % 7);
  const midnight = (civil: Date) => {
    const desired = civil.getTime();
    let instant = desired;
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    });
    for (let i = 0; i < 4; i++) {
      const parts = Object.fromEntries(formatter.formatToParts(instant)
        .map(part => [part.type, Number(part.value)]));
      const observed = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
      if (observed === desired) break;
      instant += desired - observed;
    }
    return new Date(instant).toISOString();
  };
  const start = midnight(day);
  day.setUTCDate(day.getUTCDate() + 7);
  return { timeMin: start, timeMax: midnight(day) };
}

const overlaps = (event: { start: string; end: string }, range: PreviewRange) =>
  Date.parse(event.start) < Date.parse(range.timeMax) &&
  Date.parse(event.end) > Date.parse(range.timeMin);

/** Confirmed, unfinished future occurrences are the only replaceable base. */
export function isReplaceable(event: CalendarEvent, range: PreviewRange, now: number): boolean {
  return event.source === "google" && event.isGenerated && !event.isPinned && !event.isCompleted &&
    !!event.taskId && Date.parse(event.end) > now && overlaps(event, range);
}

/** Full occurrence snapshots, not IDs: regeneration must not silently adopt changed remote events. */
export function replacementCandidates(events: CalendarEvent[], range: PreviewRange, now: number): CalendarEvent[] {
  return events.filter(event => isReplaceable(event, range, now)).map(event => ({ ...event }));
}

export function sameReplacementBaseline(
  baseline: ReadonlyArray<Readonly<CalendarEvent>>, current: ReadonlyArray<Readonly<CalendarEvent>>,
): boolean {
  const identity = (event: Readonly<CalendarEvent>) => JSON.stringify([
    event.id, event.taskId, event.start, event.end, event.isPinned, event.isCompleted,
    event.isGenerated, event.source,
  ]);
  const original = baseline.map(identity).sort();
  const latest = current.map(identity).sort();
  return original.length === latest.length && original.every((entry, index) => entry === latest[index]);
}

export function generationInputs(tasks: Task[], events: CalendarEvent[], range: PreviewRange, now: number) {
  const base = events.filter(event => !isReplaceable(event, range, now));
  const pinned = new Map<string, number>();
  for (const event of base) {
    if (!event.isGenerated || !event.taskId || !overlaps(event, range)) continue;
    pinned.set(event.taskId, (pinned.get(event.taskId) ?? 0) + 1);
  }
  return {
    base,
    tasks: tasks.filter(task => (pinned.get(task.id) ?? 0) < (task.frequency ?? 1))
      .map(task => ({ ...task, frequency: (task.frequency ?? 1) - (pinned.get(task.id) ?? 0) })),
  };
}

/** Hide displaced remote occurrences and deduplicate equivalent proposals by occurrence. */
export function previewOverlay(base: CalendarEvent[], proposals: GeneratedEvent[], range: PreviewRange, now: number,
  replacementBaseline?: ReadonlyArray<Readonly<CalendarEvent>>) {
  const visibleBase = base.filter(event => {
    if (!isReplaceable(event, range, now)) return true;
    if (!replacementBaseline) return false;
    return !replacementBaseline.some(original => original.id === event.id &&
      sameReplacementBaseline([original], [event]));
  });
  const ids = new Set(visibleBase.map(event => event.id));
  const slots = new Set(visibleBase.filter(event => event.taskId)
    .map(event => `${event.taskId}:${Date.parse(event.start)}:${Date.parse(event.end)}`));
  const visibleProposals = proposals.filter(event => {
    const key = `${event.taskId}:${Date.parse(event.start)}:${Date.parse(event.end)}`;
    if (ids.has(event.id) || slots.has(key)) return false;
    ids.add(event.id);
    slots.add(key);
    return true;
  });
  return { base: visibleBase, proposals: visibleProposals };
}
