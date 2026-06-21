# Task Template

## Task Information

### ID

TASK-05

### Title

Fix event creation position accuracy on calendar

### Owner

senior-frontend

### Status

Pending

---

## Description

When creating blocks or events by clicking/dragging on the calendar, the saved position doesn't accurately match where the user clicked. The event or block is placed at a slightly different time than what was selected.

This is likely caused by a timezone handling issue. The CalendarView receives and processes ISO date strings from FullCalendar's select callback (`handleSelect`), but timezone offsets between the browser's local timezone and UTC may cause the start/end times to shift when stored or displayed.

The fix requires investigating how FullCalendar reports selection start/end times, how they're stored in the application state, and ensuring the displayed position matches the saved position.

---

## Acceptance Criteria

- [ ] Creating a block via the "Create Block" option (from an empty slot selection) places the block at exactly the selected time range
- [ ] Creating a task via the "Create in this slot" → "Create Task" flow places the event at exactly the selected time range
- [ ] The event/block start time matches the selected slot start time exactly
- [ ] The event/block end time matches the selected slot end time (or selected duration) exactly
- [ ] After saving and re-fetching, the event appears at the correct position
- [ ] Works consistently across different timezones

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This task is independent but investigates the same calendar interaction layer as TASK-04. Both tasks modify `CalendarView.tsx` — coordinate carefully to avoid merge conflicts.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/CalendarView.tsx` — FullCalendar `select` callback (lines 189-196)
- `apps/web/src/pages/DashboardPage.tsx` — `handleSelect` (lines 83-88) and `handleCreateBlockFromSlot` / `handleCreateTaskInline` handlers (lines 112-153)
- `apps/web/src/features/blocks/BlockModal.tsx` — Block creation that receives dates from slot selection
- `apps/web/src/features/shared/CreateActionModal.tsx` — Event creation modal

### Relevant Modules

- FullCalendar `select` callback — provides `startStr`, `endStr` (ISO-8601 strings)
- FullCalendar timezone handling — calendar's timezone setting affects how dates are reported
- JavaScript `Date` API — used throughout for date manipulation

### Relevant APIs

- FullCalendar `select` callback
- FullCalendar `slotDuration` and `slotMinTime`/`slotMaxTime` configuration

### Relevant Types

- FullCalendar `DateSelectArg` — includes `startStr`, `endStr`, `start`, `end`

---

## Implementation Guidance

### Expected Changes

1. **Investigate timezone handling**: Check if FullCalendar is configured with a timezone (it may default to UTC or local time). Verify that `startStr` and `endStr` represent the correct local times as displayed on the calendar grid.

2. **Check `Date` construction**: In `DashboardPage.tsx`, the `handleCreateTaskInline` function creates dates using:
   ```typescript
   new Date(new Date(start).getTime() + duration * 60000).toISOString()
   ```
   This may introduce timezone shifts if `start` is a local-time ISO string but `new Date()` interprets it differently. Verify the Date constructor behavior matches the expected timezone.

3. **Check block creation flow**: In `handleCreateBlockFromSlot`, the date portion is extracted:
   ```typescript
   const startDate = start.substring(0, 10);
   ```
   This drops time information. Ensure the block's start/end times correctly represent the full selected range.

4. **Add timezone configuration to FullCalendar**: Consider adding `timeZone: "local"` or the user's configured timezone to `CalendarView.tsx` to ensure consistent timezone handling between selection display and storage.

5. **Verify all handlers**: Trace the full flow from `handleSelect` → selected slot → `CreateActionModal` → `handleCreateTaskInline` / `handleCreateBlockFromSlot` → stored event/block → calendar display, ensuring time accuracy at each step.

### Constraints

- Must not break existing event/block creation flows
- Must handle timezone differences between browser and server
- Must preserve the 30-minute slot snapping behavior (FullCalendar's `slotDuration: "00:30:00"`)
- Changes must support users in different timezones

### Validation Rules

- The time displayed on the event block must match the time the user selected
- `startStr` from FullCalendar must match the stored event start exactly
- No timezone shifting between selection, storage, and display

---

## Testing

### Unit Tests

- [ ] N/A (timezone handling is environment-specific)

### Integration Tests

- [ ] N/A

### Manual Validation

- [ ] Click on the 09:00 slot to create a block — verify the block appears at 09:00 (not 08:00 or 10:00)
- [ ] Select a range from 14:00 to 15:30 — verify the created event/block spans exactly 14:00 to 15:30
- [ ] Create an event at 23:30 — verify it doesn't shift to the next day
- [ ] Test in a timezone with UTC+ offset (e.g., UTC+3) and UTC- offset (e.g., UTC-5) by changing system timezone
- [ ] Create a block at the same position before and after the fix — compare accuracy
- [ ] Verify the time displayed on the calendar event matches the saved event data

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

- `apps/web/src/components/CalendarView.tsx` (lines 189-196: `handleSelect` callback)
- `apps/web/src/pages/DashboardPage.tsx` (lines 82-153: slot selection handlers, block/task creation)
- `apps/web/src/features/blocks/BlockModal.tsx` (lines 13-51: block creation form receives dates)
- `apps/web/src/features/shared/CreateActionModal.tsx` (lines 145-182: task creation from slot)
- FullCalendar documentation: [Date Select](https://fullcalendar.io/docs/select-callback), [Timezone](https://fullcalendar.io/docs/timeZone)
