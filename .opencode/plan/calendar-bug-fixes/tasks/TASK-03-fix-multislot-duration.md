# Task Template

## Task Information

### ID

TASK-03

### Title

Fix multi-slot duration selection in CreateActionModal

### Owner

senior-frontend

### Status

Pending

---

## Description

When a user selects a range on the calendar (e.g., 07:00–09:30 = 150 minutes) and the "Create in this slot" modal opens, the duration dropdown defaults to **30 minutes** (the first item in the `DURATIONS` array) instead of defaulting to the actual duration of the selected slot. 

If the user does not manually change the duration, the created task gets a 30-minute duration instead of the intended 150 minutes. The UI shows the correct slot duration in the label, but the form field defaults to 30 min, causing a mismatch between what the user selected and what gets saved.

The fix should default the duration dropdown to the closest valid option that matches the actual selected slot duration.

---

## Acceptance Criteria

- [ ] When the modal opens, the duration dropdown defaults to the closest valid option matching the selected slot duration
- [ ] Example: selecting 07:00–09:30 (150 min) defaults the dropdown to "150 min"
- [ ] Example: selecting 07:00–07:30 (30 min) defaults the dropdown to "30 min"
- [ ] Example: selecting 07:00–08:00 (60 min) defaults the dropdown to "60 min"
- [ ] If no exact match exists, the nearest valid option is selected (e.g., 45 min → 30 or 60)
- [ ] The user can still manually override the duration to any valid option
- [ ] The duration shown in the modal header label (e.g., "150 min") remains accurate

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

Independent task — can run in parallel with all others.

---

## Technical Context

### Relevant Components

- `apps/web/src/features/shared/CreateActionModal.tsx` — Modal shown when user selects an empty slot on the calendar

### Relevant Modules

- React (useState, useEffect)

### Relevant APIs

- N/A (local UI state only)

### Relevant Types

- `CreateActionModalProps` — includes `start: string`, `end: string`
- `DURATIONS` constant array: `[30, 60, 90, 120, 150, 180]`

---

## Implementation Guidance

### Expected Changes

In `apps/web/src/features/shared/CreateActionModal.tsx`:

1. Change the `duration` state initialization to dynamically calculate the default based on the selected slot duration:
   ```typescript
   const durationMin = Math.round(
     (new Date(end).getTime() - new Date(start).getTime()) / 60000,
   );
   // Find the closest valid duration from DURATIONS
   const closestDuration = DURATIONS.reduce((prev, curr) =>
     Math.abs(curr - durationMin) < Math.abs(prev - durationMin) ? curr : prev
   );
   const [duration, setDuration] = useState(closestDuration);
   ```

2. Alternatively, use a `useMemo` or `useEffect` to compute the default whenever `start`/`end` changes.

3. Ensure the computed default is only set on initial mount (not when the user has already made a selection).

### Constraints

- Must not change the behavior when the user explicitly selects a different duration
- Must not break the "Create Task" form submission logic
- Must keep the `DURATIONS` constant as-is

### Validation Rules

- The default duration must always be one of the values in the `DURATIONS` array
- Rounding must be consistent (floor for ties or pick nearest)

---

## Testing

### Unit Tests

- [ ] Test that 150-min slot defaults to 150 min duration
- [ ] Test that 30-min slot defaults to 30 min duration
- [ ] Test that 45-min slot defaults to 30 or 60 min (nearest)
- [ ] Test that user manual selection is not overridden

### Integration Tests

- [ ] N/A

### Manual Validation

- [ ] Select a 07:00–09:30 range (150 min) — verify dropdown defaults to "150 min"
- [ ] Select a 07:00–07:30 range (30 min) — verify dropdown defaults to "30 min"
- [ ] Select a 07:00–08:00 range (60 min) — verify dropdown defaults to "60 min"
- [ ] Manually change to a different duration and verify the change is preserved when submitting
- [ ] Save the created task and verify the event shows the correct duration on the calendar

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

- `apps/web/src/features/shared/CreateActionModal.tsx` (lines 3-5: `DURATIONS` constant, line 154: `duration` state, lines 164-166: `durationMin` calculation, lines 168-182: submit handler)
- `apps/web/src/pages/DashboardPage.tsx` (lines 124-153: `handleCreateTaskInline` consumes the duration from the modal)
