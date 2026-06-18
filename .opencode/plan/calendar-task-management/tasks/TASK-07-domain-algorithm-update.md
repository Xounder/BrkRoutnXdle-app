# Task Template

## Task Information

### ID

TASK-07

### Title

Domain Algorithm Update for New Task Constraints (Frequency, Gap, Same-Day, Time Ranges)

### Owner

senior-frontend

### Status

Pending

---

## Description

Update the domain algorithm (`taskDistributor.ts` and `availabilityCalculator.ts`) to respect the new task constraint fields: `frequency`, `gapDays`, `allowSameDay`, and `restrictedRanges`. The algorithm must filter slots by restricted time ranges, enforce minimum gaps between occurrences, limit frequency per week, and allow same-day scheduling when permitted.

### Sub-tasks

1. **Time range filtering**: In `scoreSlot` (or a new helper), filter out slots that fall outside the task's `restrictedRanges`. For preset time groups, map to actual hour ranges using `TIME_GROUP_PRESETS`. For custom ranges, check if the slot's hour falls within the range.
2. **Frequency enforcement**: Modify the distribution loop to allocate exactly `frequency` occurrences per week (instead of the current logic that derives occurrences from `duration / SLOT_DURATION_MINUTES`).
3. **Gap days enforcement**: When allocating multiple occurrences, ensure at least `gapDays` days between consecutive occurrences.
4. **Same-day allowance**: When `allowSameDay=true`, allow multiple occurrences on the same day at different times. When `allowSameDay=false`, skip slots on days that already have an allocated occurrence.
5. **Backward compatibility**: Tasks without the new fields should behave exactly as before (frequency derived from duration, no gap enforcement, no same-day enforcement).

---

## Acceptance Criteria

- [ ] Tasks with `restrictedRanges` only schedule within those time ranges
- [ ] Tasks with `frequency=N` schedule exactly N times per week (or fewer if impossible)
- [ ] Tasks with `gapDays=N` have at least N days between consecutive occurrences
- [ ] Tasks with `allowSameDay=true` can have multiple occurrences on the same day
- [ ] Tasks with `allowSameDay=false` (default) do not repeat on the same day
- [ ] Tasks without new fields behave identically to current behavior
- [ ] Existing algorithm tests still pass
- [ ] New constraint violations are reported in the `failures` array

---

## Dependencies

### Required Tasks

- TASK-05

### Dependency Notes

TASK-05 must be completed first because the algorithm needs the new type definitions. TASK-07 is independent of TASK-06 (UI changes) — both can run in parallel after TASK-05.

---

## Technical Context

### Relevant Modules

- `packages/domain/src/internal/taskDistributor.ts`
- `packages/domain/src/internal/availabilityCalculator.ts`
- `packages/domain/src/internal/types.ts` (`GeneratedEvent`, `AvailabilityWindow`)

### Relevant Types

- `Task` (with new fields: frequency, gapDays, allowSameDay)
- `TaskRestriction` (with new `restricted-range` type)
- `RestrictedRange`, `CustomRange`, `TimeGroupPreset`
- `TIME_GROUP_PRESETS` constant

---

## Implementation Guidance

### Expected Changes

1. **taskDistributor.ts — `distributeTasks` function**:
   - For each task, determine `occurrencesPerWeek`:
     - If `task.frequency` is set, use it directly
     - Otherwise, fall back to current logic (`Math.max(1, Math.floor(task.duration / SLOT_DURATION_MINUTES))`)
   - Track allocated days to enforce `gapDays` and `allowSameDay`:
     - Maintain a `Set<number>` of days (as day-of-week + week offset keys) that already have allocations
     - Before allocating a slot, check gap rules and same-day rules
   - After finding the best slot, check if the slot's day satisfies constraints before allocating

2. **taskDistributor.ts — `scoreSlot` function**:
   - Add handling for `restricted-range` restrictions:
     - Get the slot's hour (UTCHours)
     - For each `RestrictedRange`:
       - If `preset`: look up the range in `TIME_GROUP_PRESETS`, check if slot hour falls within
       - If `custom`: check if slot hour falls within `startHour` to `endHour`
     - Return 0 if slot falls outside all specified ranges
   - If no `restricted-range` restrictions exist, return 0 only if other restriction types reject the slot (existing behavior preserved)

3. **New helper functions**:
   - `isInRestrictedRange(hour: number, range: RestrictedRange): boolean`
   - `getDayKey(slotStart: string): string` — returns a day identifier for gap/same-day tracking
   - `isGapSatisfied(lastDayKey: string, currentDayKey: string, gapDays: number): boolean`

### Constraints

- Handle edge case where `frequency=0` — treat as 0 (don't schedule) or clamp to 1? Decision: clamp frequency to minimum 1.
- `gapDays` is measured in calendar days, not business days
- When both `allowedSameDay=true` and `gapDays=0`, the task can fill multiple slots on the same day consecutively
- Time range check should use UTC hours to stay consistent with the rest of the algorithm
- The `restricted-range` restriction is additive with other restrictions (e.g., `no-weekends` + `restricted-range` → slot must satisfy both)

### Validation Rules

- Frequency=3, gapDays=1 → task scheduled on Mon, Wed, Fri (or similar pattern with 1-day gaps)
- Frequency=3, gapDays=0, allowSameDay=true → task could be scheduled Mon morning, Mon afternoon, Tue morning
- restricted-range with "morning" preset → task only appears between 06:00-12:00
- restricted-range with custom 20:00-22:00 → task only appears between 20:00-22:00
- Task with no new fields → scheduled exactly as before (backward compatible)

---

## Testing

### Unit Tests

- [ ] `isInRestrictedRange` with morning preset returns correct results for various hours
- [ ] `isInRestrictedRange` with custom range 20-22 returns correct results
- [ ] Gap enforcement: task with gapDays=2, frequency=2 → allocations at least 2 days apart
- [ ] Same-day enforcement: allowSameDay=false → only one allocation per day
- [ ] Frequency limit: task with frequency=5 → at most 5 allocations
- [ ] Backward compatibility: task without new fields → same distribution as current algorithm
- [ ] Edge case: restricted-range with no matching slots → reported in failures
- [ ] Edge case: impossible constraints (frequency=7, gapDays=3) → graceful degradation with fewer allocations

### Integration Tests

- [ ] Full schedule generation with new constraints produces valid schedule
- [ ] New constraints play well with existing blocks and events

### Manual Validation

- [ ] Create task with frequency=2, gapDays=2, morning-only → generated schedule shows 2 morning slots with 2+ days gap
- [ ] Create task with allowSameDay=true, frequency=3 → schedule shows 3 slots, possibly multiple on same day
- [ ] Create task without new fields → behaves identically to before

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

- [Planning Index](.opencode/plan/calendar-task-management/planning/index.md)
- [Impact Analysis](.opencode/plan/calendar-task-management/planning/impact-analysis.md)
