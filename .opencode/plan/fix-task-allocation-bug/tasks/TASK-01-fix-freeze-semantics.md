# Task Template

## Task Information

### ID

TASK-01

### Title

Fix whole-week freeze semantics in markSlotsOccupied

### Owner

senior-backend

### Status

Pending

---

## Description

Fix the confirmed root-cause bug in `packages/domain/src/public/generateSchedule.ts`.

The `markSlotsOccupied` function applies `slot.frozen = true` to EVERY slot in the week
whenever an event is in the past (`event.end < now`) or completed (`event.isCompleted`).
This causes `calculateAvailability` to filter all frozen slots, producing zero available
windows. `distributeTasks` then receives an empty availability pool, and every task reports
`0/1 allocated` with an "Allocation Warning".

Move the `slot.frozen = true` assignment **inside** the slot-overlap check so that only the
specific slot(s) actually overlapped by a past/completed event become both `occupied` and
`frozen`. All other slots in the week remain available for task allocation.

Intended behavioral change: more slots become available for allocation once the fix ships.
This is the intended outcome — see planning `impact-analysis.md`.

---

## Acceptance Criteria

- [ ] `markSlotsOccupied` only sets `frozen = true` on slots that overlap with a past or completed event
- [ ] Slots that overlap a past/completed event are both `occupied = true` and `frozen = true`
- [ ] Slots that have no overlap with any event remain non-frozen (available for allocation)
- [ ] A week containing a single past event still yields availability windows for the rest of the week
- [ ] `calculateAvailability` returns non-empty windows when at least one slot is not occupied/blocked/frozen
- [ ] `generateSchedule` no longer reports `0/1` allocation for all tasks when valid free time exists

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This is the primary fix and has no upstream dependency.

---

## Technical Context

### Relevant Components

- `packages/domain/src/public/generateSchedule.ts`
- `packages/domain/src/internal/availabilityCalculator.ts` (downstream consumer of the freeze flag)

### Relevant Modules

- Schedule generation pipeline: `buildWeekSlots` -> `markSlotsOccupied` -> `calculateAvailability` -> `distributeTasks`

### Relevant APIs

- Public: `generateSchedule(tasks, blocks, events, settings, previousWeek?)` — signature unchanged
- Internal: `calculateAvailability(slots: WeekSlot[]): AvailabilityWindow[]`

### Relevant Types

- `WeekSlot` (`start`, `end`, `dayOfWeek`, `occupied`, `blocked`, `frozen`)
- `CalendarEvent` (`start`, `end`, `isCompleted`)
- `AvailabilityWindow` (`start`, `end`)

---

## Implementation Guidance

### Expected Changes

- Edit `packages/domain/src/public/generateSchedule.ts`, function `markSlotsOccupied`
- Move the `slot.frozen = true` assignment inside the existing slot-overlap `if` block:

  ```ts
  if (slotStart < eventEnd && slotEnd > eventStart) {
    slot.occupied = true;
    if (event.end < now || event.isCompleted) {
      slot.frozen = true;
    }
  }
  ```

- Remove the unconditional `slot.frozen = true` block that currently sits outside the overlap check

### Constraints

- Do NOT modify other functions in the same file (`applyBlocks`, `isSameDay`, `getMonday`)
- Do NOT change the `generateSchedule` public signature or return shape
- Do NOT modify `availabilityCalculator.ts` — it already correctly filters frozen slots
- Keep the freeze intent: past/completed events must still protect their occupied slots

### Validation Rules

- Confirm comparing `event.end` (ISO string) against `now` (ISO string) is lexicographically valid — ISO-8601 UTC strings compare correctly as strings
- Verify the fix does not introduce allocations that overlap real events (validation phase catches this)

---

## Edge Cases

- **Race condition (async state):** `now` is captured once at `generateSchedule` entry and passed as a string. No async mutation occurs; the string comparison is stable for the duration of the call.
- **Event with `end` equal to `now`:** An event ending exactly at `now` uses `event.end < now` (strict), so a boundary-equal event is NOT frozen. Confirm this matches intent.
- **Event without `end`:** The `CalendarEvent` type requires `end`, but if a malformed event has an undefined `end`, `new Date(undefined).getTime()` yields `NaN`, and all comparisons resolve `false` (no overlap, no freeze). Consider defensive handling or document the assumption.
- **Multiple past/completed events:** Each event independently freezes its overlapping slots. Overlapping slots freeze once; no double-freeze side effects.
- **Empty `events` array:** Loop body never executes; no slots frozen. Should still allocate normally.
- **Empty `slots` array:** Loop body never executes; function returns immediately. No crash.
- **All-week event (Monday-Sunday):** The entire week's slots become occupied AND frozen. No availability remains — this is correct, not a regression.
- **Event in the future (not completed):** `event.end < now` is false and `isCompleted` is false → the overlapping slot gets `occupied = true` but NOT `frozen`. This matches current logic and should not regress.
- **Regression risk:** Existing behavior where a past event froze the whole week will change. Any test/consumer relying on that (buggy) behavior will need updating — document this as the intended behavioral change.

### File Overlap Warning

- **Overlap file:** `packages/domain/package.json` — if TASK-02 also adds test infrastructure (test script, vitest config) to this file, apply the *parallel with careful merge* strategy: TASK-01 and TASK-02 edit **different sections** (TASK-01 may add test files only; TASK-02 may add the test runner script). Merge carefully by editing different keys.
- No overlap with other task source files. TASK-02 modifies `taskDistributor.ts`, which is NOT touched by this task.

---

## Testing

### Unit Tests

- [ ] Create test: a single past event in the week → `markSlotsOccupied` marks only the overlapping slot(s) as frozen; remaining slots are not frozen
- [ ] Create test: a completed event → overlapping slot frozen + occupied; non-overlapping slots not frozen
- [ ] Create test: a future event → overlapping slot occupied but NOT frozen
- [ ] Create test: `generateSchedule` with a past event + free space yields non-zero allocation (regression test for the reported bug)
- [ ] Create test: multiple past events → each freezes only its own overlapping slots

Note: The `packages/domain` package has no test infrastructure yet. If neither TASK-01 nor TASK-02 establishes it, this is a gap that must be elevated to the orchestrator. If test infra is added, place TASK-01 tests in `packages/domain/src/__tests__/generateSchedule.test.ts` (or the package convention).

### Integration Tests

- [ ] Full pipeline test: `buildWeekSlots` → `markSlotsOccupied` (with a past event) → `calculateAvailability` returns a non-empty window set covering the non-frozen slots

### Manual Validation

- [ ] Run `pnpm run build` (or `run-package-command` `build` for `packages/domain`) and confirm no TS compilation errors introduced by this change
- [ ] Confirm the pre-existing `slotBuilder.ts` TS error (missing `use12h` in `Settings`) is unrelated to this task and document it as a concern

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

- `.opencode/plan/fix-task-allocation-bug/planning/index.md` — root cause confirmation
- `.opencode/plan/fix-task-allocation-bug/planning/feasibility.md` — Approach A recommendation
- `.opencode/plan/fix-task-allocation-bug/planning/impact-analysis.md` — behavioral change impact
- `packages/domain/src/public/generateSchedule.ts` — source file to modify
