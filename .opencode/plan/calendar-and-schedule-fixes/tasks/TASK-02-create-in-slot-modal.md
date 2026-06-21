# Task Template

## Task Information

### ID

TASK-02

### Title

Create-in-Slot Modal — Inline Name + Duration Form

### Owner

senior-frontend

### Status

Pending

---

## Description

When a user clicks an empty calendar slot, the `CreateActionModal` appears with two buttons ("Create Block" and "Create Task"). Clicking "Create Task" sets a duration and opens the full `TaskModal` with 10+ fields (name, duration, priority, time groups, custom ranges, frequency, gap days, etc.). This is excessive for quick task creation.

The fix is to add a simple inline form directly in the `CreateActionModal` with just **Name** (text input) and **Duration** (dropdown/select). On submit, call `createTask` with those two fields and place the event at the selected calendar position, bypassing the full `TaskModal` entirely.

The existing "Create Task" button should be replaced or modified to show the inline form within the same modal instead of navigating away.

---

## Acceptance Criteria

- [ ] Clicking "Create Task" in the slot modal shows an inline form with Name (text) and Duration (select/minutes) fields
- [ ] Submitting the form calls `createTask` with the entered name, duration, and the selected calendar start/end times
- [ ] On successful creation, the event appears at the clicked calendar position
- [ ] The modal closes after successful creation
- [ ] The full `TaskModal` with 10 fields is bypassed for slot creation
- [ ] Inline validation prevents empty name or invalid duration
- [ ] The "Create Block" flow remains unchanged

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

Depends on the existing `createTask` function from `useTasks` hook being available in `DashboardPage`.

---

## Technical Context

### Relevant Components

- `apps/web/src/features/shared/CreateActionModal.tsx`
- `apps/web/src/pages/DashboardPage.tsx`
- `apps/web/src/features/tasks/TaskModal.tsx` (no changes needed, but the bypass path should be clear)

### Relevant Modules

- `apps/web/src/features/shared/CreateActionModal.tsx`

### Relevant APIs

- `createTask` from `useTasks` hook or `useTaskContext`

### Relevant Types

- `Task` from `@brkroutnxdle/shared`
- `CalendarEvent` from `@brkroutnxdle/shared`

---

## Implementation Guidance

### Expected Changes

1. **Modify `CreateActionModal.tsx`:**
   - Add a `onCreateTaskWithDetails` callback prop: `(name: string, duration: number, start: string, end: string) => void`
   - When "Create Task" is clicked, show an inline form with:
     - Name text input
     - Duration select (30, 60, 90, 120, 150, 180 min)
     - Submit and Cancel buttons
   - Add form validation (non-empty name, valid duration)
   - Keep the "Create Block" flow unchanged

2. **Modify `DashboardPage.tsx`:**
   - Remove the `creatingTaskDuration` state path that opens `TaskModal`
   - Add a new handler `handleCreateTaskInline` that calls `createTask` directly and places the event at the selected slot position
   - Pass the handler to `CreateActionModal`

### Constraints

- Must not break the existing "Create Block" flow
- Must not require changes to `TaskModal.tsx`
- Form styling should match existing modal design (rounded corners, same color scheme)

### Validation Rules

- Empty name shows inline error message
- Duration must be one of the allowed values (30-180, multiples of 30)
- Verify the created task event appears at the correct calendar position

---

## Testing

### Unit Tests

- [ ] Test that inline form renders after clicking "Create Task"
- [ ] Test that form validation rejects empty name
- [ ] Test that submit calls `createTask` with correct parameters

### Integration Tests

- [ ] Test end-to-end: slot click → Create Task → fill name+duration → submit → event appears in calendar

### Manual Validation

- [ ] Click an empty slot → verify CreateActionModal appears
- [ ] Click "Create Task" → verify inline form appears with Name and Duration fields
- [ ] Submit with empty name → verify error message
- [ ] Submit with valid data → verify modal closes and event appears
- [ ] Click "Create Block" → verify it still opens BlockModal correctly

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

- `.opencode/plan/calendar-and-schedule-fixes/planning/impact-analysis.md`
- `.opencode/plan/calendar-and-schedule-fixes/planning/risks.md`
- `apps/web/src/features/shared/CreateActionModal.tsx`
- `apps/web/src/pages/DashboardPage.tsx`
- `apps/web/src/features/tasks/TaskModal.tsx`
