# TASK-07 Implementation Guide — Part 4

Test data, usage example, and files summary.

---

### Usage Example

```ts
import { generateSchedule } from "@brkroutnxdle/domain";
import type { Task, BlockedSlot, CalendarEvent, Settings } from "@brkroutnxdle/shared";
import { Priority, BlockType } from "@brkroutnxdle/shared";

// Sample tasks
const tasks: Task[] = [
  {
    id: "task-1",
    title: "Exercise",
    description: "Morning workout",
    duration: 60,
    priority: Priority.High,
    restrictions: [{ type: "no-weekends" }],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-2",
    title: "Reading",
    description: "Read technical books",
    duration: 30,
    priority: Priority.Medium,
    restrictions: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Sample blocks
const blocks: BlockedSlot[] = [
  {
    id: "block-1",
    title: "Team standup",
    blockType: BlockType.RecurringWeekday,
    startDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "09:30",
    daysOfWeek: [1, 2, 3, 4, 5],
    isRecurring: true,
  },
];

// Sample existing events
const events: CalendarEvent[] = [];

// Settings
const settings: Settings = {
  workStartHour: 8,
  workEndHour: 18,
  workDays: [1, 2, 3, 4, 5],
  maxTasksPerDay: 5,
  defaultTaskDuration: 60,
  timezone: "UTC",
};

// Generate!
const result = generateSchedule(tasks, blocks, events, settings);

console.log(`Generated ${result.generatedEvents.length} events`);
console.log(`Failures: ${result.failures.length}`);
if (result.failures.length > 0) {
  for (const f of result.failures) {
    console.log(`  ${f.taskName}: ${f.allocated}/${f.required}`);
  }
}
```

### Edge Cases Covered

| Scenario | Behavior |
|----------|----------|
| Zero tasks | Returns empty generatedEvents, no failures |
| Zero available slots | All tasks fail allocation, failures reported |
| Task duration > any window | Task partially or fully fails |
| All slots occupied | No events generated, all tasks report failures |
| Single slot available | Only one occurrence allocated |
| Past events | Marked as frozen, never moved |
| Completed events | Marked as frozen, never modified |
| Previous week snapshot | Penalty applied to same day+time slots |

### Files Created Summary

| File | Purpose |
|------|---------|
| `packages/domain/src/internal/types.ts` | Algorithm-specific type definitions |
| `packages/domain/src/public/generateSchedule.ts` | Main entry point with phase orchestration |
| `packages/domain/src/internal/slotBuilder.ts` | 30-min slot generation within available hours |
| `packages/domain/src/internal/availabilityCalculator.ts` | Available window calculation |
| `packages/domain/src/internal/priorityScorer.ts` | Priority weight mapping and sorting |
| `packages/domain/src/internal/shuffleEngine.ts` | Seeded RNG and Fisher-Yates shuffle |
| `packages/domain/src/internal/taskDistributor.ts` | Slot scoring and task allocation |
| `packages/domain/src/internal/validator.ts` | Post-generation validation |
| `packages/domain/src/internal/allocationReporter.ts` | Failure reporting and summary |
| `packages/domain/src/public/index.ts` | Public API re-exports |
| `packages/domain/src/index.ts` | Package entry point (updated) |

### Performance Target

- 30 tasks, 100 existing events: **< 500ms** on modern hardware
- Memory: < 10MB for typical workloads (~300 slots)
- Deterministic mode: same seed = identical output every time
