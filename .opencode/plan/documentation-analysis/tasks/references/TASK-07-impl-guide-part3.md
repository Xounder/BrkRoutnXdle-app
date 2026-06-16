# TASK-07 Implementation Guide — Part 3

Validator, allocation reporter, and public index.

---

### Step 8: Create `packages/domain/src/internal/validator.ts`

```ts
import type { Task, BlockedSlot, CalendarEvent, Settings } from "@brkroutnxdle/shared";
import type { GeneratedEvent } from "./types.js";

export interface ValidationError {
  code: string;
  message: string;
  eventId?: string;
}

/**
 * Validates a generated schedule against all constraints.
 * Returns a list of validation errors (empty = valid).
 */
export function validateSchedule(
  generatedEvents: GeneratedEvent[],
  tasks: Task[],
  blocks: BlockedSlot[],
  events: CalendarEvent[],
  settings: Settings,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Check 1: No overlapping events
  for (let i = 0; i < generatedEvents.length; i++) {
    for (let j = i + 1; j < generatedEvents.length; j++) {
      if (eventsOverlap(generatedEvents[i], generatedEvents[j])) {
        errors.push({
          code: "EVENT_OVERLAP",
          message: `Events overlap: ${generatedEvents[i].id} and ${generatedEvents[j].id}`,
          eventId: generatedEvents[i].id,
        });
      }
    }
  }

  // Check 2: Events within available hours
  for (const ev of generatedEvents) {
    const startHour = new Date(ev.start).getUTCHours();
    const endHour = new Date(ev.end).getUTCHours();
    if (startHour < settings.workStartHour || endHour > settings.workEndHour) {
      errors.push({
        code: "OUTSIDE_AVAILABLE_HOURS",
        message: `Event ${ev.id} falls outside available hours (${settings.workStartHour}:00-${settings.workEndHour}:00)`,
        eventId: ev.id,
      });
    }
  }

  // Check 3: No events on non-work days
  for (const ev of generatedEvents) {
    const dayOfWeek = new Date(ev.start).getUTCDay();
    if (!settings.workDays.includes(dayOfWeek)) {
      errors.push({
        code: "NON_WORK_DAY",
        message: `Event ${ev.id} falls on a non-work day (${dayOfWeek})`,
        eventId: ev.id,
      });
    }
  }

  // Check 4: Events respect task duration (must be multiples of 30)
  for (const ev of generatedEvents) {
    const durationMs = new Date(ev.end).getTime() - new Date(ev.start).getTime();
    const durationMin = durationMs / 60000;
    if (durationMin % 30 !== 0 || durationMin < 30) {
      errors.push({
        code: "INVALID_DURATION",
        message: `Event ${ev.id} has invalid duration: ${durationMin}min (must be multiple of 30, min 30)`,
        eventId: ev.id,
      });
    }
  }

  // Check 5: No overlap with existing calendar events
  for (const ev of generatedEvents) {
    for (const existing of events) {
      if (existing.isCompleted) continue;
      if (eventsOverlap(ev, existing)) {
        errors.push({
          code: "CONFLICT_WITH_EXISTING",
          message: `Event ${ev.id} conflicts with existing event "${existing.title}"`,
          eventId: ev.id,
        });
      }
    }
  }

  // Check 6: Task constraints respected
  for (const ev of generatedEvents) {
    const task = taskMap.get(ev.taskId);
    if (!task) continue;

    for (const restriction of task.restrictions) {
      if (restriction.type === "no-weekends") {
        const day = new Date(ev.start).getUTCDay();
        if (day === 0 || day === 6) {
          errors.push({
            code: "WEEKEND_VIOLATION",
            message: `Event ${ev.id} violates no-weekends restriction for task "${task.title}"`,
            eventId: ev.id,
          });
        }
      }
    }
  }

  return errors;
}

function eventsOverlap(
  a: { start: string; end: string },
  b: { start: string; end: string },
): boolean {
  const aStart = new Date(a.start).getTime();
  const aEnd = new Date(a.end).getTime();
  const bStart = new Date(b.start).getTime();
  const bEnd = new Date(b.end).getTime();
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Returns true if the schedule is valid (no errors).
 */
export function isScheduleValid(generatedEvents: GeneratedEvent[], ...args: any[]): boolean {
  return validateSchedule(generatedEvents, ...args).length === 0;
}
```

### Step 9: Create `packages/domain/src/internal/allocationReporter.ts`

```ts
import type { Task } from "@brkroutnxdle/shared";
import type { AllocationFailure } from "./types.js";

interface RawFailure {
  taskId: string;
  taskName: string;
  required: number;
  allocated: number;
}

/**
 * Converts raw allocation failures into the standard AllocationFailure format
 * and enriches with task metadata.
 */
export function reportAllocationFailures(
  allTasks: Task[],
  rawFailures: RawFailure[],
): AllocationFailure[] {
  const taskMap = new Map(allTasks.map((t) => [t.id, t]));

  return rawFailures.map((f) => ({
    taskId: f.taskId,
    taskName: f.taskName,
    required: f.required,
    allocated: f.allocated,
  }));
}

/**
 * Returns a human-readable summary of allocation failures.
 */
export function summarizeFailures(failures: AllocationFailure[]): string {
  if (failures.length === 0) return "All tasks fully allocated.";

  return failures
    .map(
      (f) =>
        `${f.taskName}: ${f.allocated}/${f.required} occurrences allocated`,
    )
    .join("\n");
}

/**
 * Returns the total allocation rate as a percentage.
 */
export function allocationRate(
  totalRequired: number,
  totalAllocated: number,
): number {
  if (totalRequired === 0) return 100;
  return Math.round((totalAllocated / totalRequired) * 100);
}
```

### Step 10: Create `packages/domain/src/public/index.ts`

```ts
export { generateSchedule } from "./generateSchedule.js";
```

### Step 11: Update `packages/domain/src/index.ts` — Wire everything

Replace the existing placeholder with:

```ts
export { generateSchedule } from "./public/generateSchedule.js";
export type {
  ScheduleResult,
  GeneratedEvent,
  AllocationFailure,
  PreviousWeekSnapshot,
  WeekSlot,
  AvailabilityWindow,
} from "./internal/types.js";
```

### Step 12: Verify build

```powershell
cd packages/domain
pnpm build   # Must compile without errors
```

The domain package is a pure TypeScript library with zero runtime dependencies beyond `@brkroutnxdle/shared`.
