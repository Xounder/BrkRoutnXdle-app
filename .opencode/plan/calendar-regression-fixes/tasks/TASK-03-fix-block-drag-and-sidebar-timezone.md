# Task Template

## Task Information

### ID

TASK-03

### Title

Fix Block Drag (excludeEventId) + Sidebar Drag Timezone Consistency

### Owner

senior-frontend

### Status

Pending

---

## Description

Two bugs related to drag-and-drop:

**Bug A — Blocks cannot be moved (self-overlap false rejection)**:
`handleEventAllow` in `CalendarView.tsx` (line 274-276) calls `validateDrop?.(dropInfo.startStr, dropInfo.endStr)` WITHOUT passing the dragged event's ID. The `validateDrop` prop then calls `canDropAt(startStr, endStr)` without `excludeEventId`, causing the overlap check to compare the dragged event against itself, resulting in a false rejection.

The `canDropAt` function in `useScheduleEditing.ts` already accepts an optional `excludeEventId` parameter (line 59), and `handleEventDrop` already passes it correctly (line 133). The gap is at the `validateDrop` prop level in `CalendarView.tsx`.

**Bug B — Sidebar drag to calendar fails (timezone mismatch)**:
`handleExternalDrop` in `DashboardPage.tsx` (lines 243-293) builds `start` as a local-time string but computes `end` by calling `.toISOString().slice(0, 19)` which produces a UTC-based string without timezone offset info. This inconsistency causes `canDropAt` to interpret the start and end times in different timezones, leading to validation failures.

**Fix scope**:
1. Update `validateDrop` prop contract to accept the dragged event ID.
2. Update `handleEventAllow` to pass `_draggedEvent.id`.
3. Update `DashboardPage`'s `validateDrop` lambda to forward the third argument.
4. Fix `handleExternalDrop` timezone handling so `start` and `end` use consistent timezone representation.

---

## Acceptance Criteria

- [ ] Blocks (single-day and recurring) can be dragged to new positions without false self-overlap rejection
- [ ] Generated events can be dragged to new positions without false self-overlap rejection
- [ ] Sidebar task drag-to-calendar creates events with correct start/end times
- [ ] Sidebar block drag-to-calendar creates blocks with correct start/end times
- [ ] Existing drag validation (work hours, block overlap, event overlap) still works correctly
- [ ] No regression in event resize validation

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

None — this task is fully independent and can run in parallel with TASK-01, TASK-02, and TASK-04.

---

## Technical Context

### Relevant Components

- `CalendarView.tsx` — `handleEventAllow`, `validateDrop` prop
- `DashboardPage.tsx` — `handleExternalDrop`, `validateDrop` lambda
- `useScheduleEditing.ts` — `canDropAt` (already accepts `excludeEventId`)

### Relevant Modules

- `apps/web/src/components/CalendarView.tsx` — lines 26 (prop type), 274-276 (handleEventAllow)
- `apps/web/src/pages/DashboardPage.tsx` — lines 243-293 (handleExternalDrop), lines 422-424 (validateDrop lambda)
- `apps/web/src/hooks/useScheduleEditing.ts` — line 59 (canDropAt already has excludeEventId param)

### Relevant Types

- `CalendarEvent` from `@brkroutnxdle/shared`

---

## Implementation Guidance

### Expected Changes

1. **`CalendarView.tsx`**:
   - Update the `validateDrop` prop type from `(startStr: string, endStr: string) => boolean` to `(startStr: string, endStr: string, draggedEventId?: string) => boolean` (line 26).
   - Update `handleEventAllow` to use the second argument's `id`:
     ```ts
     const handleEventAllow = (dropInfo: any, draggedEvent: any): boolean => {
       return validateDrop?.(dropInfo.startStr, dropInfo.endStr, draggedEvent?.id) ?? true;
     };
     ```
     (line 274-276).

2. **`DashboardPage.tsx`**:
   - Update the `validateDrop` lambda to pass the third argument:
     ```ts
     validateDrop={(startStr, endStr, draggedEventId) =>
       editing.canDropAt(startStr, endStr, draggedEventId)
     }
     ```
     (lines 422-424).
   - Fix `handleExternalDrop` timezone handling: Instead of building `start` as local and `end` as UTC-sliced, use consistent local-time arithmetic. Build `end` using the same date math as `start`:
     ```ts
     const endDate = new Date(startDate.getTime() + duration * 60000);
     end = `${dateStr.slice(0, 10)}T${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`;
     ```
     Or simply compute both `start` and `end` as `Date` objects and convert to ISO strings consistently. The key is that both `start` and `end` must be in the same timezone representation.

### Constraints

- Must not break event resize (which also uses `canDropAt` with `excludeEventId`)
- Must not break empty-slot event creation (which doesn't use drag)
- Sidebar drag must still validate against work hours and block overlaps

### Validation Rules

- Drag a block to a new slot — it should move (no self-rejection)
- Drag a generated event — it should move
- Drag a task from the sidebar to the calendar — event should appear with correct time
- Drag a block from the sidebar to the calendar — block should appear with correct time

---

## Edge Cases

- **Drag to the exact same position**: `canDropAt` should reject because the event still overlaps itself (or rather, the new position overlaps the old position). The `excludeEventId` excludes the dragged event from overlap checks, but the old position is the same as the new position so the event would replace itself — FC handles this internally.
- **Drag to a slot overlapping another event of the same type**: Should still be rejected (only the dragged event itself is excluded from overlap checks).
- **Sidebar drag to all-day slot**: `allDay` flag handling must remain correct — currently the code sets `start` to workStartHour for all-day drops.
- **Sidebar drag with 0-duration task**: `dragData.duration` may be missing or 0 — fallback to 30 minutes must remain.
- **Sidebar block drag**: Block drag uses 60-minute default duration, must be preserved.
- **FC view change after drag**: No effect expected.

---

## Testing

### Unit Tests

- [ ] Test that `handleEventAllow` passes the dragged event ID to `validateDrop`
- [ ] Test `canDropAt` with `excludeEventId` correctly skips the excluded event

### Integration Tests

- [ ] E2E test: Drag a block to a new position and verify it moves
- [ ] E2E test: Drag a generated event to a new position and verify it moves
- [ ] E2E test: Drag a task from sidebar to calendar and verify the event is created

### Manual Validation

- [ ] Verify block drag works in week view
- [ ] Verify block drag works in day view
- [ ] Verify sidebar task drag works with various work hour settings
- [ ] Verify timezone consistency by testing with a timezone far from UTC

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

- [CalendarView.tsx](../apps/web/src/components/CalendarView.tsx) — lines 26, 274-276
- [DashboardPage.tsx](../apps/web/src/pages/DashboardPage.tsx) — lines 243-293, 422-424
- [useScheduleEditing.ts](../apps/web/src/hooks/useScheduleEditing.ts) — lines 58-118 (canDropAt)
- [Bug 3: Blocks cannot be moved](./TASK-03-fix-block-drag-and-sidebar-timezone.md)
- [Bug 5: Sidebar drag to calendar doesn't work](./TASK-03-fix-block-drag-and-sidebar-timezone.md)
