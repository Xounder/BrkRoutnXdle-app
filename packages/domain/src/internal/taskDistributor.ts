import type { Task, Settings } from "@brkroutnxdle/shared";
import { SLOT_DURATION_MINUTES } from "@brkroutnxdle/shared";
import type {
  AvailabilityWindow,
  GeneratedEvent,
  PreviousWeekSnapshot,
} from "./types.js";
import { sortByPriority } from "./priorityScorer.js";
import { SeededRandom, dateSeed } from "./shuffleEngine.js";

interface DistributionResult {
  generatedEvents: GeneratedEvent[];
  failures: Array<{ taskId: string; taskName: string; required: number; allocated: number; }>;
}

/**
 * Distributes tasks across available time slots by priority.
 */
export function distributeTasks(
  tasks: Task[],
  availableWindows: AvailabilityWindow[],
  settings: Settings,
  previousWeek?: PreviousWeekSnapshot,
  targetWeekStart?: string,
): DistributionResult {
  const sortedTasks = sortByPriority(tasks);
  const generatedEvents: GeneratedEvent[] = [];
  const failures: DistributionResult["failures"] = [];

  // Build availability slot list from windows
  const slotMs = SLOT_DURATION_MINUTES * 60 * 1000;
  let allSlots: Array<{ start: string; end: string }> = [];

  for (const window of availableWindows) {
    let cursor = new Date(window.start).getTime();
    const endMs = new Date(window.end).getTime();
    while (cursor + slotMs <= endMs) {
      allSlots.push({
        start: new Date(cursor).toISOString(),
        end: new Date(cursor + slotMs).toISOString(),
      });
      cursor += slotMs;
    }
  }

  // Setup random for shuffle mode
  const seed = settings.shuffleEnabled
    ? Date.now()
    : dateSeed(targetWeekStart ?? new Date().toISOString());
  const rng = new SeededRandom(seed);

  // Build previous week set for penalty calculation
  const prevWeekSet = new Set<string>();
  if (previousWeek) {
    for (const ev of previousWeek.generatedEvents) {
      const day = new Date(ev.start).getUTCDay();
      const time = ev.start.split("T")[1]?.substring(0, 5);
      prevWeekSet.add(`${ev.taskId}:${day}:${time}`);
    }
  }

  for (const task of sortedTasks) {
    const occurrencesPerWeek = task.restrictions.length > 0
      ? Math.max(1, Math.floor(task.duration / SLOT_DURATION_MINUTES))
      : 1;

    const taskSlotsNeeded = task.duration / SLOT_DURATION_MINUTES;
    let allocated = 0;

    // Filter and score available slots for this task
    const validSlots = allSlots
      .map((slot, index) => ({
        slot,
        index,
        score: scoreSlot(slot, task, prevWeekSet, rng),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    // Try to allocate occurrences
    for (let occ = 0; occ < occurrencesPerWeek; occ++) {
      const best = validSlots.shift();
      if (!best) break;

      // Check if we have enough consecutive slots
      const consecutiveStart = best.index;
      const consecutiveEnd = consecutiveStart + taskSlotsNeeded - 1;

      if (consecutiveEnd >= allSlots.length) break;

      // Verify all consecutive slots are available
      let canAllocate = true;
      for (let i = consecutiveStart; i <= consecutiveEnd; i++) {
        if (!allSlots[i]) { canAllocate = false; break; }
      }

      if (!canAllocate) continue;

      // Allocate
      const startTime = allSlots[consecutiveStart].start;
      const endTime = allSlots[consecutiveEnd].end;

      // Remove used slots
      allSlots.splice(consecutiveStart, taskSlotsNeeded);
      // Also remove from validSlots by re-indexing
      for (const vs of validSlots) {
        if (vs.index > consecutiveEnd) {
          vs.index -= taskSlotsNeeded;
        }
      }

      const now = new Date().toISOString();
      generatedEvents.push({
        id: crypto.randomUUID(),
        taskId: task.id,
        start: startTime,
        end: endTime,
        completed: false,
        createdAt: now,
        updatedAt: now,
      });

      allocated++;
    }

    if (allocated < occurrencesPerWeek) {
      failures.push({
        taskId: task.id,
        taskName: task.title,
        required: occurrencesPerWeek,
        allocated,
      });
    }
  }

  return { generatedEvents, failures };
}

/**
 * Scores a slot for a given task.
 * Returns 0 if the slot is invalid for the task.
 * Higher score = better placement.
 */
function scoreSlot(
  slot: { start: string; end: string },
  task: Task,
  prevWeekSet: Set<string>,
  rng: SeededRandom,
): number {
  const slotDate = new Date(slot.start);
  const dayOfWeek = slotDate.getUTCDay();
  const timeStr = slot.start.split("T")[1]?.substring(0, 5) ?? "";

  // Check task restrictions
  for (const restriction of task.restrictions) {
    if (restriction.type === "no-weekends" && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return 0;
    }
    if (restriction.type === "weekdays-only") {
      if (dayOfWeek === 0 || dayOfWeek === 6) return 0;
    }
    if (restriction.type === "morning-only") {
      const hour = new Date(slot.start).getUTCHours();
      if (hour >= 12) return 0;
    }
    if (restriction.type === "afternoon-only") {
      const hour = new Date(slot.start).getUTCHours();
      if (hour < 12) return 0;
    }
    if (restriction.type === "specific-days" && restriction.days) {
      if (!restriction.days.includes(dayOfWeek)) return 0;
    }
  }

  // Previous week penalty
  const prevKey = `${task.id}:${dayOfWeek}:${timeStr}`;
  const previousWeekPenalty = prevWeekSet.has(prevKey) ? 50 : 0;

  // Random bonus for shuffle variety
  const randomnessBonus = rng.next() * 30;

  // Base score
  const baseScore = 100 - previousWeekPenalty + randomnessBonus;

  return Math.max(0, baseScore);
}