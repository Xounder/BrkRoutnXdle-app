import type { Task, Settings, RestrictedRange } from "@brkroutnxdle/shared";
import { SLOT_DURATION_MINUTES, TIME_GROUP_PRESETS } from "@brkroutnxdle/shared";
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

  // Build availability slot list from windows, tracking which window each slot
  // belongs to so consecutive-slot allocations never span an occupied gap
  // between two distinct availability windows.
  const slotMs = SLOT_DURATION_MINUTES * 60 * 1000;
  let allSlots: Array<{ start: string; end: string; windowIndex: number }> = [];

  for (let wi = 0; wi < availableWindows.length; wi++) {
    const window = availableWindows[wi];
    let cursor = new Date(window.start).getTime();
    const endMs = new Date(window.end).getTime();
    while (cursor + slotMs <= endMs) {
      allSlots.push({
        start: new Date(cursor).toISOString(),
        end: new Date(cursor + slotMs).toISOString(),
        windowIndex: wi,
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
    const occurrencesPerWeek = task.frequency != null
      ? Math.max(1, task.frequency)
      : task.restrictions.length > 0
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

    // Track allocated day keys for gap and same-day enforcement
    const allocatedDayKeys: string[] = [];
    const usedDayKeys = new Set<string>();

    // Try to allocate occurrences
    for (let occ = 0; occ < occurrencesPerWeek; occ++) {
      // Find the best slot that satisfies gap/same-day constraints
      let bestSlotIndex = -1;

      for (let vi = 0; vi < validSlots.length; vi++) {
        const candidate = validSlots[vi];
        const dayKey = getDayKey(candidate.slot.start);

        // Check allowSameDay
        const allowSameDay = task.allowSameDay ?? false;
        if (!allowSameDay && usedDayKeys.has(dayKey)) {
          continue;
        }

        // Check gapDays
        const gapDays = task.gapDays ?? 1;
        if (allocatedDayKeys.length > 0 && gapDays > 0) {
          const lastDayKey = allocatedDayKeys[allocatedDayKeys.length - 1];
          if (!isGapSatisfied(lastDayKey, dayKey, gapDays)) {
            continue;
          }
        }

        // Check if we have enough consecutive slots
        const consecutiveStart = candidate.index;
        const consecutiveEnd = consecutiveStart + taskSlotsNeeded - 1;

        if (consecutiveEnd >= allSlots.length) {
          validSlots.splice(vi, 1);
          vi--;
          continue;
        }

        // Verify all consecutive slots exist and belong to the same real
        // availability window. Spanning across a window boundary would cross an
        // occupied gap between two distinct windows, so such a candidate is
        // rejected rather than allowed to span.
        const candidateWindow = allSlots[consecutiveStart].windowIndex;
        let canAllocate = true;
        for (let i = consecutiveStart; i <= consecutiveEnd; i++) {
          if (!allSlots[i] || allSlots[i].windowIndex !== candidateWindow) {
            canAllocate = false;
            break;
          }
        }

        if (!canAllocate) {
          validSlots.splice(vi, 1);
          vi--;
          continue;
        }

        // This slot satisfies all constraints
        bestSlotIndex = vi;
        break;
      }

      if (bestSlotIndex === -1) break;

      const best = validSlots[bestSlotIndex];
      validSlots.splice(bestSlotIndex, 1);

      // Track the allocated day
      const bestDayKey = getDayKey(best.slot.start);
      allocatedDayKeys.push(bestDayKey);
      usedDayKeys.add(bestDayKey);

      // Allocate
      const consecutiveStart = best.index;
      const consecutiveEnd = consecutiveStart + taskSlotsNeeded - 1;

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
    if (restriction.type === "restricted-range" && restriction.ranges) {
      const hour = slotDate.getUTCHours();
      const isInRange = restriction.ranges.some(range => isInRestrictedRange(hour, range));
      if (!isInRange) return 0;
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

/**
 * Checks if a given hour falls within a restricted time range.
 */
function isInRestrictedRange(hour: number, range: RestrictedRange): boolean {
  const { startHour, endHour } = "preset" in range
    ? TIME_GROUP_PRESETS[range.preset]
    : range.custom;

  if (endHour <= startHour) {
    // Wraps around midnight (e.g., 18-0, 22-2)
    return hour >= startHour || hour < endHour;
  }
  return hour >= startHour && hour < endHour;
}

/**
 * Returns a day key (YYYY-MM-DD) from an ISO date string.
 */
function getDayKey(dateStr: string): string {
  return dateStr.split("T")[0];
}

/**
 * Checks if the gap between two day keys satisfies the minimum gapDays requirement.
 * At least gapDays + 1 calendar days must separate the two dates.
 */
function isGapSatisfied(lastDayKey: string, currentDayKey: string, gapDays: number): boolean {
  const last = new Date(lastDayKey);
  const current = new Date(currentDayKey);
  const diffMs = current.getTime() - last.getTime();
  const diffDays = Math.abs(diffMs) / (1000 * 60 * 60 * 24);
  return diffDays >= gapDays + 1;
}