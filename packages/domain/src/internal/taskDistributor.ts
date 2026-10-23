import type { Task, Settings } from "@brkroutnxdle/shared";
import { SLOT_DURATION_MINUTES } from "@brkroutnxdle/shared";
import type { AvailabilityWindow, GeneratedEvent, PreviousWeekSnapshot } from "./types.js";
import { sortByPriority } from "./priorityScorer.js";
import { SeededRandom, dateSeed } from "./shuffleEngine.js";
import { localDay, localParts, localWeekday } from "./localTime.js";
import { permittedInterval } from "./timeRestrictions.js";

export interface DistributionResult {
  generatedEvents: GeneratedEvent[];
  failures: Array<{ taskId: string; taskName: string; required: number; allocated: number }>;
}

export function distributeTasks(
  tasks: Task[], windows: AvailabilityWindow[], settings: Settings,
  previousWeek?: PreviousWeekSnapshot, targetWeekStart?: string,
  excluded?: { taskId: string; occurrence: number; start: string },
  generationAttempt = 0,
): DistributionResult {
  const generatedEvents: GeneratedEvent[] = [];
  const failures: DistributionResult["failures"] = [];
  const slotMs = SLOT_DURATION_MINUTES * 60_000;
  const slots = windows.flatMap((window, windowIndex) => {
    const list: Array<{ start: number; windowIndex: number }> = [];
    for (let start = Date.parse(window.start); start + slotMs <= Date.parse(window.end); start += slotMs) {
      list.push({ start, windowIndex });
    }
    return list;
  });
  const used = new Set<number>();
  const dayCounts = new Map<string, number>();
  const rng = new SeededRandom((settings.shuffleEnabled ? Date.now() :
    dateSeed(targetWeekStart ?? new Date().toISOString())) + generationAttempt);
  const history = new Set(previousWeek?.generatedEvents.map(ev => {
    const p = localParts(ev.start, settings.timezone);
    return `${ev.taskId}:${localWeekday(ev.start, settings.timezone)}:${p.hour}:${p.minute}`;
  }) ?? []);

  for (const task of sortByPriority(tasks).filter(t => t.isActive)) {
    const required = task.frequency == null ? 1 : Math.max(1, Math.floor(task.frequency));
    const count = task.duration / SLOT_DURATION_MINUTES;
    let allocated = 0;
    const days: string[] = [];
    if (Number.isInteger(count) && count > 0) for (let occurrence = 0; occurrence < required; occurrence++) {
      const candidates = slots.map((slot, index) => {
        const start = new Date(slot.start).toISOString();
        const end = new Date(slot.start + task.duration * 60_000).toISOString();
        const day = localDay(start, settings.timezone);
        const p = localParts(start, settings.timezone);
        const key = `${task.id}:${localWeekday(start, settings.timezone)}:${p.hour}:${p.minute}`;
        return { index, start, end, day, score: 100 + rng.next() * 30 - (history.has(key) ? 50 : 0) };
      }).filter(candidate => {
        const { index, start, end, day } = candidate;
        if (excluded?.taskId === task.id && excluded.occurrence === occurrence && excluded.start === start) return false;
        if ((dayCounts.get(day) ?? 0) >= settings.maxTasksPerDay) return false;
        if (!task.allowSameDay && days.includes(day)) return false;
        if (days.some(previous => {
          if (previous === day && task.allowSameDay) return false;
          return Math.abs((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${previous}T00:00:00Z`)) / 86400_000) <= (task.gapDays ?? 1);
        })) return false;
        if (!permittedInterval(start, end, task, settings)) return false;
        for (let i = 0; i < count; i++) {
          if (!slots[index + i] || used.has(index + i) ||
              slots[index + i].windowIndex !== slots[index].windowIndex ||
              slots[index + i].start !== slots[index].start + i * slotMs) return false;
        }
        return true;
      }).sort((a, b) => b.score - a.score || a.index - b.index);
      const best = candidates[0];
      if (!best) break;
      for (let i = 0; i < count; i++) used.add(best.index + i);
      days.push(best.day);
      dayCounts.set(best.day, (dayCounts.get(best.day) ?? 0) + 1);
      const now = new Date().toISOString();
      generatedEvents.push({ id: crypto.randomUUID(), taskId: task.id, start: best.start,
        end: best.end, completed: false, createdAt: now, updatedAt: now });
      allocated++;
    }
    if (allocated < required) failures.push({ taskId: task.id, taskName: task.title, required, allocated });
  }
  return { generatedEvents, failures };
}
