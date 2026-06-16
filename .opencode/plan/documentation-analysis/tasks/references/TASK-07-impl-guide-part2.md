# TASK-07 Implementation Guide — Part 2

Slot builder, availability calculator, and internal modules.

---

### Step 3: Create `packages/domain/src/internal/slotBuilder.ts`

```ts
import type { Settings } from "@brkroutnxdle/shared";
import { SLOT_DURATION_MINUTES } from "@brkroutnxdle/shared";
import type { WeekSlot } from "./types.js";

/**
 * Generates all 30-minute time slots for the target week,
 * constrained by the user's available hours from settings.
 */
export function buildWeekSlots(
  weekStart: string,
  weekEnd: string,
  settings: Settings,
): WeekSlot[] {
  const slots: WeekSlot[] = [];
  const startMs = new Date(weekStart).getTime();
  const endMs = new Date(weekEnd).getTime();
  const slotMs = SLOT_DURATION_MINUTES * 60 * 1000;

  let current = startMs;
  while (current + slotMs <= endMs) {
    const date = new Date(current);
    const hour = date.getUTCHours();

    // Only generate slots within available hours
    if (hour >= settings.workStartHour && hour < settings.workEndHour) {
      // Only generate slots on work days
      if (settings.workDays.includes(date.getUTCDay())) {
        slots.push({
          start: date.toISOString(),
          end: new Date(current + slotMs).toISOString(),
          dayOfWeek: date.getUTCDay(),
          occupied: false,
          blocked: false,
          frozen: false,
        });
      }
    }

    current += slotMs;
  }

  return slots;
}

/**
 * Generates week slots for a specific weekday range (for testing).
 */
export function buildSlotsForRange(
  startDate: string,
  endDate: string,
  workStartHour: number,
  workEndHour: number,
  workDays: number[],
): WeekSlot[] {
  return buildWeekSlots(startDate, endDate, {
    workStartHour,
    workEndHour,
    workDays,
    maxTasksPerDay: 10,
    defaultTaskDuration: 60,
    timezone: "UTC",
  });
}
```

### Step 4: Create `packages/domain/src/internal/availabilityCalculator.ts`

```ts
import type { WeekSlot, AvailabilityWindow } from "./types.js";
import { SLOT_DURATION_MINUTES } from "@brkroutnxdle/shared";

/**
 * Filters out occupied, blocked, or frozen slots and returns
 * only the available slots as continuous windows.
 */
export function calculateAvailability(slots: WeekSlot[]): AvailabilityWindow[] {
  const windows: AvailabilityWindow[] = [];
  let currentWindowStart: string | null = null;
  const slotMs = SLOT_DURATION_MINUTES * 60 * 1000;

  for (const slot of slots) {
    if (!slot.occupied && !slot.blocked && !slot.frozen) {
      if (currentWindowStart === null) {
        currentWindowStart = slot.start;
      }
    } else {
      if (currentWindowStart !== null) {
        // Close the window (end is the slot before this occupied one)
        const prevEnd = new Date(new Date(slot.start).getTime() - slotMs).toISOString();
        windows.push({ start: currentWindowStart, end: prevEnd });
        currentWindowStart = null;
      }
    }
  }

  // Close the last window if still open
  if (currentWindowStart !== null && slots.length > 0) {
    windows.push({ start: currentWindowStart, end: slots[slots.length - 1].end });
  }

  return windows;
}

/**
 * Returns slots that are available (not occupied, blocked, or frozen).
 */
export function getAvailableSlots(slots: WeekSlot[]): WeekSlot[] {
  return slots.filter((s) => !s.occupied && !s.blocked && !s.frozen);
}

/**
 * Returns the count of available 30-min slots in the week.
 */
export function countAvailableSlots(slots: WeekSlot[]): number {
  return slots.filter((s) => !s.occupied && !s.blocked && !s.frozen).length;
}
```

### Step 5: Create `packages/domain/src/internal/priorityScorer.ts`

```ts
import type { Task, Priority } from "@brkroutnxdle/shared";
import { Priority as PriorityEnum } from "@brkroutnxdle/shared";

/**
 * Priority weight mapping used for task ordering.
 * Higher weight = higher priority.
 */
const PRIORITY_WEIGHTS: Record<Priority, number> = {
  [PriorityEnum.Critical]: 100,
  [PriorityEnum.High]: 75,
  [PriorityEnum.Medium]: 50,
  [PriorityEnum.Low]: 25,
};

/**
 * Returns the numeric weight for a given priority level.
 */
export function getPriorityWeight(priority: Priority): number {
  return PRIORITY_WEIGHTS[priority] ?? PRIORITY_WEIGHTS[PriorityEnum.Medium];
}

/**
 * Compares two tasks by priority (descending).
 * Returns negative if a should come before b.
 */
export function comparePriority(a: Task, b: Task): number {
  return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
}

/**
 * Sorts tasks by priority (critical → high → medium → low).
 */
export function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort(comparePriority);
}
```

### Step 6: Create `packages/domain/src/internal/shuffleEngine.ts`

```ts
/**
 * Seeded pseudo-random number generator (mulberry32).
 * Deterministic when the same seed is used.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] inclusive. */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Fisher-Yates shuffle of an array (in-place). */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/**
 * Generates a seed from a date string for deterministic mode.
 */
export function dateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
```

### Step 7: Create `packages/domain/src/internal/taskDistributor.ts`

```ts
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
    if (restriction.type === "weekdays-only" && dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Weekdays-only means MON-FRI, already handled by settings.workDays
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
```

*See Part 3 for validator and allocationReporter.*
