# Task Template

## Task Information

### ID

TASK-04

### Title

Review and Fix canDropAt Timezone Validation (endHour Check)

### Owner

senior-frontend

### Status

Pending

---

## Description

The `canDropAt` function in `useScheduleEditing.ts` uses `getUTCHours()` for the work-hours boundary check, but `settings.workStartHour` and `settings.workEndHour` are configured in the user's local timezone. This timezone mismatch causes false rejections for valid drop positions.

**Current code** (lines 60-66):
```ts
const startHour = new Date(startStr).getUTCHours();
const endHour = new Date(endStr).getUTCHours();

if (startHour < settings.workStartHour || endHour > settings.workEndHour + 1) {
  return false;
}
```

**Problem**: If the user is in UTC-3 and has workStartHour=9, a drop at 09:00 local time has `getUTCHours() = 12`, which passes. But a drop at 08:00 local time has `getUTCHours() = 11`, which is NOT < 9, so it incorrectly passes when it should be rejected. Conversely, a drop at 09:00 local in UTC+3 has `getUTCHours() = 06`, which IS < 9, so it's incorrectly rejected.

The same issue applies to `endHour` — an event ending at 18:00 local in UTC-3 has `getUTCHours() = 21`, which may be > workEndHour+1, causing false rejection.

Additionally, the `endHour > settings.workEndHour + 1` buffer rule needs review: the `+ 1` is meant to allow events that extend one hour past `workEndHour` (e.g., a 1-hour event starting at 17:00 when workEndHour=17). However, the logic should compare against the event's end time relative to the work-end boundary in local time, not UTC.

**Fix scope**:
1. Replace `getUTCHours()` with local time `getHours()` in both the `startHour` and `endHour` computations.
2. Review and clarify the `endHour` boundary: should events be allowed to end exactly at `workEndHour`, or `workEndHour + 1`? The intent of `+ 1` should be documented and confirmed.
3. The same local-timezone fix should be applied to the recurring block overlap check inside `canDropAt` (lines 106-110), which currently uses `getUTCHours()` and `getUTCMinutes()` for computing `dropStartMin` and `dropEndMin`.

---

## Acceptance Criteria

- [ ] Users in any timezone can drag events to slots within their configured work hours
- [ ] Events dropped at workStartHour local time are accepted
- [ ] Events dropped before workStartHour local time are rejected
- [ ] Events ending at or near workEndHour local time are correctly validated
- [ ] Recurring block overlap validation uses consistent local-time hours
- [ ] No regression in overlap detection for existing events and blocks

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

None — this task is independent and can run in parallel with TASK-01, TASK-02, and TASK-03.

---

## Technical Context

### Relevant Components

- `useScheduleEditing.ts` — `canDropAt` function

### Relevant Modules

- `apps/web/src/hooks/useScheduleEditing.ts` — lines 58-118

### Relevant APIs

- None (local logic only)

### Relevant Types

- `CalendarEvent`, `BlockedSlot` from `@brkroutnxdle/shared`
- `Settings` from settings context (contains `workStartHour`, `workEndHour`)

---

## Implementation Guidance

### Expected Changes

1. **`useScheduleEditing.ts`**, in `canDropAt`:
   - Change `getUTCHours()` to `getHours()` for `startHour` and `endHour` (lines 60-61).
   - Change recurring block overlap check (lines 106-110) to use `getHours()` / `getMinutes()` instead of `getUTCHours()` / `getUTCMinutes()`, AND change the `dropDate` computation to use local time methods consistently.
   - Add a clarifying comment about the `endHour > settings.workEndHour + 1` boundary rule: the `+ 1` allows events whose end time falls within the hour after workEndHour (e.g., a 30-min event at 17:00 when workEndHour=17 has endHour=17, which passes the check; a 1-hour event at 17:00 has endHour=18, which is not > 18, so it passes; a 1-hour event at 17:30 has endHour=18:30 → 18, which also passes; an event at 17:00 ending at 19:00 has endHour=19, which is > 18 and is rejected).
   - Consider whether the `+ 1` should be kept or replaced with a more precise minute-level comparison.

### Constraints

- Must not break event resize validation (also uses `canDropAt`)
- Must not break sidebar drag validation (also uses `canDropAt`)
- The fix must work for all timezones the browser supports

### Validation Rules

- Test with browser timezone set to UTC-5, UTC+0, UTC+3, UTC+8
- Verify events can be dropped at workStartHour local time in each timezone
- Verify events before workStartHour are rejected in each timezone

---

## Edge Cases

- **DST transitions**: On DST change days, `getHours()` may be off by 1 due to the 1-hour shift. The comparison uses the *result* of parsing the ISO string with `new Date(startStr)`, which JS Date handles correctly in local time even across DST. Verify this is correct.
- **Midnight boundary (workStartHour=0)**: Ensure events at midnight local time are allowed.
- **24-hour work day (workEndHour=23)**: Ensure events ending at or after midnight are handled correctly.
- **EndHour at exact boundary**: An event ending at exactly `workEndHour + 1` (e.g., 18:00 when workEndHour=17) has `endHour = 18`, which fails the `> settings.workEndHour + 1` check because `18 > 18` is false. This means the event is allowed. Is this correct? Review the expected behavior with the product owner if needed.
- **Cross-midnight events**: Events spanning midnight should be validated against work-hour rules for their start and end dates separately (currently not handled — out of scope but document as a known limitation).
- **UTC-based startStr/endStr from FullCalendar**: FullCalendar provides `startStr` and `endStr` in the local timezone (since `timeZone="local"` is set in CalendarView). Verify this assumption and ensure the fix aligns.

---

## Testing

### Unit Tests

- [ ] Test `canDropAt` with various timezone offsets (UTC-5, UTC+0, UTC+3, UTC+8)
- [ ] Test `canDropAt` at workStartHour boundary in each timezone
- [ ] Test `canDropAt` before workStartHour boundary in each timezone
- [ ] Test `canDropAt` endHour boundary with events of various durations
- [ ] Test recurring block overlap with local-time hours

### Integration Tests

- [ ] Test full drag-and-drop flow in multiple timezones

### Manual Validation

- [ ] Change browser timezone to UTC-5, restart app, verify drag behavior
- [ ] Change browser timezone to UTC+3, restart app, verify drag behavior
- [ ] Verify that blocks dragged near work-end boundary behave correctly

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

- [useScheduleEditing.ts](../apps/web/src/hooks/useScheduleEditing.ts) — lines 58-118
- [Bug 5: Sidebar drag timezone component](../planning/README.md) (when available)
