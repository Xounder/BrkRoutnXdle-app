# Task Template

## Task Information

### ID

TASK-04

### Title

Fix time selection bug — event end time does not match selected slot end

### Owner

senior-frontend

### Status

Pending

---

## Description

When selecting a time range on the calendar (e.g., 5:00 to 7:00) and creating a task via the "Create in this slot" modal, the resulting event on the calendar has the wrong end time. For example, selecting 5:00-7:00 creates a task from 5:00 to 7:30 instead of 5:00 to 7:00.

**Root cause:** The `handleCreateTaskInline` function in `DashboardPage.tsx` computes the event's end time using the task's `duration` field instead of using the actual `end` parameter passed from the modal selection. The duration may not match the selected slot duration (e.g., if the user changed the duration dropdown, or if the duration defaults to a different value than the selected range).

**Secondary cause:** The `CreateActionModal` computes `durationMin` from `start` and `end`, but this duration is then used as the task's `duration` property, and `handleCreateTaskInline` recalculates `end = start + duration`, producing a different end time than what the user selected.

---

## Acceptance Criteria

- [ ] Selecting 5:00-7:00 creates an event from 5:00 to 7:00 (end matches user selection)
- [ ] Selecting 5:00-7:30 creates an event from 5:00 to 7:30
- [ ] The event end time always matches the slot end time selected by the user
- [ ] The task's `duration` field still reflects the correct duration for scheduling purposes
- [ ] The "Create in this slot" duration dropdown remains functional for the schedule algorithm
- [ ] Existing task creation from sidebar (TaskModal) is not affected

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

Independent task — can run in parallel with all others.

---

## Technical Context

### Relevant Components

- `apps/web/src/pages/DashboardPage.tsx` — `handleCreateTaskInline` (lines 128-166)
- `apps/web/src/features/shared/CreateActionModal.tsx` — Duration state initialization (lines 154-161)

### Relevant Modules

- `apps/web/src/contexts/CalendarContext.tsx` — Calendar state

### Relevant APIs

- N/A (local state change only)

### Relevant Types

- `CreateActionModalProps` — includes `start: string`, `end: string`, `onCreateTaskInline: (name, duration, start, end) => void`
- `DURATIONS` constant: `[30, 60, 90, 120, 150, 180]`

---

## Implementation Guidance

### Expected Changes

1. **Fix `handleCreateTaskInline` in `DashboardPage.tsx`** (lines 128-166):

   The function should use the `end` parameter directly instead of recomputing it from `duration`:

   ```typescript
   const handleCreateTaskInline = useCallback(
     (name: string, duration: number, start: string, end: string) => {
       const task = createTask({
         title: name,
         duration,           // Keep duration for scheduling algorithm
         priority: PriorityEnum.Medium,
         frequency: 1,
         gapDays: 1,
         allowSameDay: false,
         description: undefined,
         isActive: true,
         restrictions: [],
       });

       setEvents((prev) => [
         ...prev,
         {
           id: task.id,
           title: task.title,
           start,
           end,              // Use the actual end from user selection, NOT start + duration
           isAllDay: false,
           isGenerated: true,
           taskId: task.id,
           isCompleted: false,
           source: "brkroutnxdle",
         },
       ]);
       setSelectedSlot(null);
     },
     [createTask],
   );
   ```

2. **Optional: Fix `CreateActionModal.tsx`** to ensure `DURATIONS` list is consistent with the `ALLOWED_DURATIONS` from shared constants (if applicable), and ensure the duration defaults correctly to the selected slot range.

### Constraints

- The `duration` property on Task must reflect the actual intended duration (used by schedule algorithm), even if the event's start/end times are set differently
- Must not affect the `CreateActionModal` form's behavior for selecting durations
- Must not affect tasks created from the sidebar TaskPanel

### Validation Rules

- [ ] 5:00-7:00 selection → event end is 7:00 exactly
- [ ] 5:00-5:30 selection → event end is 5:30 exactly
- [ ] Duration field in task still shows the correct value
- [ ] Non-default durations (user changed dropdown) still work correctly for the event end time

---

## Testing

### Unit Tests

- [ ] Test that `handleCreateTaskInline` creates an event with end matching the `end` parameter
- [ ] Test that task duration is preserved correctly

### Integration Tests

- [ ] N/A

### Manual Validation

- [ ] Select 5:00-7:00 on calendar → Create Task → verify event shows 5:00-7:00
- [ ] Select 8:00-9:30 on calendar → Create Task → verify event shows 8:00-9:30
- [ ] Select 5:00-7:00 → change duration to 60 min → verify end time is still 7:00
- [ ] After saving and reloading, verify event end time persists correctly
- [ ] Verify task duration in sidebar matches what was set in the modal

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

- `apps/web/src/pages/DashboardPage.tsx` (lines 128-166: `handleCreateTaskInline`)
- `apps/web/src/features/shared/CreateActionModal.tsx` (lines 145-274: modal component)
- `.opencode/architecture/docs/frontend/component-architecture.md`
