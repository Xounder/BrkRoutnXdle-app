# Task Template

## Task Information

### ID

TASK-02

### Title

Fix calendar click creation — position inference and pre-fill values

### Owner

senior-frontend

### Status

Pending

---

## Description

When a user clicks on an empty calendar slot, a `CreateActionModal` should open with the correct time and date inferred from the click position. Currently the positioning/inference is not working correctly — the time values passed from the click to the task/block creation modals may be missing, incorrect, or not aligning with the user's intended slot.

Investigate and fix the full click → modal → creation chain:

1. **FullCalendar `select` event**: Verify that clicking on a slot fires `select` with the correct `startStr`/`endStr` values matching the clicked time position.
2. **HandleSelect in DashboardPage**: Ensure `selectedSlot` is set correctly.
3. **CreateActionModal**: Verify the displayed time and duration match the clicked slot.
4. **Create Task flow**: Ensure `handleCreateTaskFromSlot` correctly derives the duration and passes it to `TaskModal` via `defaultDuration`.
5. **Create Block flow**: Ensure `handleCreateBlockFromSlot` correctly extracts the date and passes it to `BlockModal` via `defaultStartDate`/`defaultEndDate`.

---

## Acceptance Criteria

- [ ] Clicking on an empty calendar slot opens `CreateActionModal` at the correct time position
- [ ] The modal displays the correct time range (start time, end time, duration in minutes)
- [ ] Clicking "Create Task" opens `TaskModal` with the duration pre-filled from the clicked slot
- [ ] Clicking "Create Block" opens `BlockModal` with the date pre-filled from the clicked slot
- [ ] For week/day view: clicking a slot selects the exact 30-minute block (matching `slotDuration="00:30:00"`)
- [ ] For month view: clicking a slot selects the full day (or nearest available granularity)
- [ ] Creating a task or block from the modal works without errors

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This task is purely frontend (`apps/web`) and has no dependencies. Can run in parallel with TASK-01 and TASK-03.

---

## Technical Context

### Relevant Components

- `apps/web/src/pages/DashboardPage.tsx` — wires `onSelect` to `handleSelect`, manages `selectedSlot` state, contains `handleCreateTaskFromSlot` and `handleCreateBlockFromSlot`
- `apps/web/src/components/CalendarView.tsx` — FullCalendar wrapper with `select={handleSelect}` callback
- `apps/web/src/features/shared/CreateActionModal.tsx` — modal showing time/duration, buttons for Create Task / Create Block
- `apps/web/src/features/tasks/TaskModal.tsx` — task creation form, receives `defaultDuration` prop
- `apps/web/src/features/blocks/BlockModal.tsx` — block creation form, receives `defaultStartDate`/`defaultEndDate` props

### Relevant Types

- `CalendarEvent` (packages/shared) — internal event type
- `Task` (packages/shared) — task definition type
- `BlockedSlot` (packages/shared) — blocked time slot type

---

## Implementation Guidance

### Investigation Steps

1. **Verify FullCalendar select event**: Check that `info.startStr` and `info.endStr` in `CalendarView.handleSelect` are correct ISO strings representing the clicked slot. FullCalendar's `select` callback fires after a selection is made — verify this works on single click (not just click+drag). If it requires a drag, consider using `dateClick` or adjusting `selectMinDistance`.

2. **Check the chain**:
   ```
   CalendarView.handleSelect(info)
     → props.onSelect({ start: info.startStr, end: info.endStr })
     → DashboardPage.handleSelect(info)
     → setSelectedSlot({ start, end })
     → CreateActionModal renders with { start, end }
     → User clicks "Create Task"
     → handleCreateTaskFromSlot(start, end)
     → setCreatingTaskDuration(durationMin)
     → TaskModal renders with defaultDuration={creatingTaskDuration}
   ```

3. **Edge case — FullCalendar month view**: In `dayGridMonth` view, clicking a day cell fires `select` with the full day as start/end. This may not provide time granularity. Consider whether additional handling is needed for month view.

4. **Edge case — selected time outside work hours**: If `slotMinTime` and `slotMaxTime` restrict visible slots, verify the click still produces valid times.

### Expected Changes

Possible fixes based on findings:

#### If `select` is not firing on single click:
- Add `selectMinDistance={0}` to FullCalendar props in `CalendarView.tsx`
- Or switch to using the `dateClick` callback from `@fullcalendar/interaction` plugin:
  ```typescript
  const handleDateClick = (info: DateClickArg) => {
    if (onSelect && info.view.type !== 'dayGridMonth') {
      const end = new Date(info.date);
      end.setMinutes(end.getMinutes() + 30);
      onSelect({
        start: info.dateStr,
        end: end.toISOString(),
      });
    }
  };
  ```
  Add `dateClick={handleDateClick}` to the FullCalendar component.

#### If time values are wrong:
- Verify `info.startStr`/`info.endStr` are in the correct timezone
- Ensure the values are passed as-is through the chain without unintended mutations
- Check that `CreateActionModal.formatTimeDisplay`/`formatDateDisplay` produce correct output

#### If Task creation loses duration context:
- Verify `handleCreateTaskFromSlot` correctly calculates `durationMin` from `start`/`end`
- Ensure `TaskModal` receives and uses `defaultDuration` when `task` is `null`

#### If Block creation loses date context:
- Verify `handleCreateBlockFromSlot` correctly extracts YYYY-MM-DD from ISO strings
- Ensure `BlockModal` receives `defaultStartDate` and `defaultEndDate`

### Constraints

- Do not change the task/block creation logic itself (only fix the value inference chain)
- Do not introduce new state management complexity
- The `CreateActionModal` already works correctly once it receives the right values — focus on the values reaching it

### Validation Rules

- Click on a timeGrid slot at 10:00 → CreateActionModal shows "10:00 AM – 10:30 AM (30 min)"
- Click "Create Task" → TaskModal shows duration = 30
- Click "Create Block" → BlockModal shows the correct date
- Click at different times → inferred values match

---

## Testing

### Unit Tests

- [ ] Test `handleCreateTaskFromSlot` with various ISO inputs computes correct duration
- [ ] Test `handleCreateBlockFromSlot` extracts correct date strings
- [ ] Test `formatTimeDisplay` and `formatDateDisplay` in CreateActionModal

### Manual Validation

- [ ] Open the app, click on an empty calendar slot at 9:00 AM
- [ ] Verify the CreateActionModal shows "9:00 AM – 9:30 AM (30 min)"
- [ ] Click "Create Task" and verify TaskModal has pre-filled duration
- [ ] Click "Create Block" and verify BlockModal has the correct date pre-filled
- [ ] Repeat at different times and dates

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Tests created or updated
- [ ] Build passes (`pnpm build` on `apps/web`)
- [ ] Lint passes
- [ ] Validation completed

---

## References

- `apps/web/src/pages/DashboardPage.tsx` — lines 82–133 (select handling, create callbacks)
- `apps/web/src/components/CalendarView.tsx` — lines 194–201 (handleSelect), lines 266–293 (FullCalendar props)
- `apps/web/src/features/shared/CreateActionModal.tsx` — modal display
- `apps/web/src/features/tasks/TaskModal.tsx` — task form with `defaultDuration`
- `apps/web/src/features/blocks/BlockModal.tsx` — block form with `defaultStartDate`/`defaultEndDate`
