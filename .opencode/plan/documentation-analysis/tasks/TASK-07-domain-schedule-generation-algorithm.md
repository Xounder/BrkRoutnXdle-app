# Task 07 — Domain Schedule Generation Algorithm

## Task Information

### ID

TASK-07

### Title

Domain Schedule Generation Algorithm

### Owner

senior-backend

### Status

Pending

---

## Description

Implement the core schedule generation algorithm in `packages/domain`. The algorithm takes tasks, blocked slots, existing calendar events, and settings as inputs, and produces an optimized weekly schedule. It respects all constraints (available hours, blocks, task restrictions, existing events, priority levels) and includes shuffle mode for variation.

---

## Acceptance Criteria

- [ ] `generateSchedule(tasks, blocks, events, settings, previousWeek?)` produces a list of `GeneratedEvent` allocations
- [ ] Algorithm phases implemented: build week slots, mark occupied, freeze existing events, apply blocks, build availability, distribute tasks by priority, validate
- [ ] No generated event conflicts with existing Google Calendar events
- [ ] No generated event falls within a blocked slot
- [ ] No generated event falls outside available hours (from settings)
- [ ] Generated events respect task-specific day-of-week and time-period restrictions
- [ ] High-priority tasks (critical) are allocated before low-priority tasks (low) when slots are limited
- [ ] With shuffle enabled, two consecutive generations produce different distributions (non-deterministic)
- [ ] With shuffle disabled, generation is deterministic (same input = same output)
- [ ] Past events (start < now) are never included in generation
- [ ] Completed events are never modified
- [ ] Algorithm avoids repeating the previous week's exact pattern when shuffle is enabled
- [ ] Allocation failures are reported with task name, required occurrences, and allocated occurrences
- [ ] Function exported from `packages/domain` as `generateSchedule()`
- [ ] Pure function with no side effects (no API calls, no localStorage access)
- [ ] Algorithm completes within 1 second for up to 30 tasks and 100 existing events

---

## Dependencies

### Required Tasks

- TASK-01

### Dependency Notes

Requires shared types (Task, BlockedSlot, Settings, CalendarEvent) from TASK-01. This is pure domain logic and can run in parallel with frontend tasks.

---

## Technical Context

### Relevant Components

- `packages/domain/src/public/generateSchedule.ts`
- `packages/domain/src/internal/slotBuilder.ts`
- `packages/domain/src/internal/availabilityCalculator.ts`
- `packages/domain/src/internal/taskDistributor.ts`
- `packages/domain/src/internal/priorityScorer.ts`
- `packages/domain/src/internal/shuffleEngine.ts`
- `packages/domain/src/internal/validator.ts`
- `packages/domain/src/internal/allocationReporter.ts`

### Relevant Modules

- `packages/domain`
- `packages/shared` (types only)

### Relevant APIs

- N/A (pure logic, no API calls)

### Relevant Types

- `Task`, `BlockedSlot`, `Settings`, `CalendarEvent`, `GeneratedEvent`, `ScheduleResult`, `AllocationFailure`

---

## Step-by-Step Implementation — Part 1 of 4

*Continuation files: `references/TASK-07-impl-guide-part2.md`, `part3.md`, `part4.md`*

---

### Step 1: Create `packages/domain/src/internal/types.ts` — Algorithm-specific types

```ts
import type { Task, BlockedSlot, CalendarEvent, Settings } from "@brkroutnxdle/shared";

/** A single 30-minute time slot used by the algorithm. */
export interface WeekSlot {
  start: string;   // ISO-8601
  end: string;     // ISO-8601 (start + 30 min)
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  occupied: boolean;
  blocked: boolean;
  frozen: boolean;
}

/** A continuous available window. */
export interface AvailabilityWindow {
  start: string;
  end: string;
}

/** A single generated event output by the algorithm. */
export interface GeneratedEvent {
  id: string;
  taskId: string;
  start: string;
  end: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Allocation failure for a specific task. */
export interface AllocationFailure {
  taskId: string;
  taskName: string;
  required: number;
  allocated: number;
}

/** Final result of the schedule generation. */
export interface ScheduleResult {
  weekStart: string;
  weekEnd: string;
  generatedEvents: GeneratedEvent[];
  failures: AllocationFailure[];
  generatedAt: string;
}

/** Snapshot of the previous week's generation. */
export interface PreviousWeekSnapshot {
  generatedEvents: Array<{
    taskId: string;
    start: string;
    end: string;
  }>;
}

/** Input parameters for the generation algorithm. */
export interface ScheduleInput {
  tasks: Task[];
  blocks: BlockedSlot[];
  events: CalendarEvent[];
  settings: Settings;
  previousWeek?: PreviousWeekSnapshot;
  targetWeekStart: string;  // ISO-8601 Monday 00:00
}
```

### Step 2: Create `packages/domain/src/public/generateSchedule.ts` — Main entry point

```ts
import type { Task, BlockedSlot, CalendarEvent, Settings } from "@brkroutnxdle/shared";
import { SLOT_DURATION_MINUTES } from "@brkroutnxdle/shared";
import type { ScheduleResult, ScheduleInput, PreviousWeekSnapshot } from "../internal/types.js";
import { buildWeekSlots } from "../internal/slotBuilder.js";
import { calculateAvailability } from "../internal/availabilityCalculator.js";
import { distributeTasks } from "../internal/taskDistributor.js";
import { validateSchedule } from "../internal/validator.js";
import { reportAllocationFailures } from "../internal/allocationReporter.js";

/**
 * Generates an optimized weekly schedule from tasks, blocks, events, and settings.
 *
 * Pure function — no side effects, no async, no API calls.
 *
 * @param tasks - User-defined task definitions
 * @param blocks - User-defined blocked time slots
 * @param events - Existing calendar events (both primary and BrkRoutnXdle)
 * @param settings - User settings (available hours, shuffle, etc.)
 * @param previousWeek - Optional snapshot of last week's schedule (for shuffle variety)
 * @returns A ScheduleResult with generated events and allocation failures
 */
export function generateSchedule(
  tasks: Task[],
  blocks: BlockedSlot[],
  events: CalendarEvent[],
  settings: Settings,
  previousWeek?: PreviousWeekSnapshot,
): ScheduleResult {
  const now = new Date();
  const targetWeekStart = getMonday(now).toISOString();
  const targetWeekEnd = new Date(getMonday(now).getTime() + 7 * 86400_000).toISOString();

  const input: ScheduleInput = {
    tasks,
    blocks,
    events,
    settings,
    previousWeek,
    targetWeekStart,
  };

  // Phase 1-2: Build week slots and mark occupied/frozen
  const slots = buildWeekSlots(targetWeekStart, targetWeekEnd, settings);

  // Phase 3: Mark occupied from existing events
  const nowISO = now.toISOString();
  for (const event of events) {
    markSlotsOccupied(slots, event, nowISO);
  }

  // Phase 4: Apply blocks
  applyBlocks(slots, blocks, targetWeekStart, targetWeekEnd);

  // Phase 5: Build availability pool
  const availableSlots = calculateAvailability(slots);

  // Phase 6-9: Distribute tasks
  const { generatedEvents, failures } = distributeTasks(
    tasks,
    availableSlots,
    settings,
    previousWeek,
    targetWeekStart,
  );

  // Phase 10: Validate
  const validationErrors = validateSchedule(generatedEvents, tasks, blocks, events, settings);
  if (validationErrors.length > 0) {
    console.warn("Schedule validation warnings:", validationErrors);
  }

  // Phase 11-12: Report and return
  return {
    weekStart: targetWeekStart,
    weekEnd: targetWeekEnd,
    generatedEvents,
    failures: reportAllocationFailures(tasks, failures),
    generatedAt: nowISO,
  };
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function markSlotsOccupied(
  slots: import("../internal/types.js").WeekSlot[],
  event: CalendarEvent,
  now: string,
): void {
  const eventStart = new Date(event.start).getTime();
  const eventEnd = new Date(event.end).getTime();

  for (const slot of slots) {
    const slotStart = new Date(slot.start).getTime();
    const slotEnd = new Date(slot.end).getTime();

    // Mark occupied if event overlaps this slot
    if (slotStart < eventEnd && slotEnd > eventStart) {
      slot.occupied = true;
    }

    // Freeze if in the past or completed
    if (event.end < now || event.isCompleted) {
      slot.frozen = true;
    }
  }
}

function applyBlocks(
  slots: import("../internal/types.js").WeekSlot[],
  blocks: BlockedSlot[],
  weekStart: string,
  weekEnd: string,
): void {
  const weekStartMs = new Date(weekStart).getTime();
  const weekEndMs = new Date(weekEnd).getTime();

  for (const block of blocks) {
    const blockStart = new Date(block.startDate).getTime();
    const blockEnd = block.endDate ? new Date(block.endDate).getTime() : blockStart + 86400_000;

    // Skip if block is outside the target week
    if (blockEnd < weekStartMs || blockStart > weekEndMs) continue;

    for (const slot of slots) {
      const slotStartMs = new Date(slot.start).getTime();

      // Single day: block the exact day
      if (block.blockType === "single-day") {
        if (isSameDay(slotStartMs, blockStart)) {
          slot.blocked = true;
        }
      }

      // Recurring weekday: block specific weekdays
      if (block.blockType === "recurring-weekday" && block.daysOfWeek) {
        if (
          slotStartMs >= blockStart &&
          slotStartMs < blockEnd &&
          block.daysOfWeek.includes(slot.dayOfWeek)
        ) {
          if (block.startTime && block.endTime) {
            const slotTime = slot.start.split("T")[1];
            if (slotTime >= block.startTime && slotTime < block.endTime) {
              slot.blocked = true;
            }
          } else {
            slot.blocked = true;
          }
        }
      }

      // Recurring period: block the entire date range
      if (block.blockType === "recurring-period") {
        if (slotStartMs >= blockStart && slotStartMs < blockEnd) {
          slot.blocked = true;
        }
      }
    }
  }
}

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
```

*See Part 2 for slotBuilder, availabilityCalculator, and taskDistributor.*

---

## Testing

### Unit Tests

- [ ] Basic schedule generation with 1 task, no constraints
- [ ] Multiple tasks with different priorities
- [ ] Tasks with day-of-week restrictions
- [ ] Tasks with time-period restrictions
- [ ] Blocked slots (all three types)
- [ ] Existing events blocking slots
- [ ] Shuffle mode produces different results
- [ ] Deterministic mode produces same results
- [ ] Previous week memory avoids exact repetition
- [ ] Allocation failure reporting (more tasks than slots)
- [ ] Past events are not modified
- [ ] Completed events are not modified
- [ ] Edge case: no available slots in week
- [ ] Edge case: task duration > any available slot
- [ ] Performance: 30 tasks, 100 events under 1 second

### Integration Tests

- [ ] Algorithm integrated with mocked task/block/event data
- [ ] Full week generation with mixed constraints

### Manual Validation

- [ ] Run algorithm with sample data and inspect generated schedule visually

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Tests created or updated
- [ ] Build passes
- [ ] Lint passes
- [ ] Validation completed

---

## References

- `architecture/generation-algorithm.md` — Complete algorithm specification
- `architecture/domain-model.md` — Domain invariants
- `architecture/docs/feature/schedule-generation-workflow.md` — Feature spec
- `architecture/architecture.md` — ADR-005 (30-min slots), ADR-008 (future-only recalculation)
- `plan/documentation-analysis/epics/EPIC-04-schedule-generation-and-preview.md`
