# Task Template

## Task Information

### ID

TASK-03

### Title

Two-week display window and past event immutability

### Owner

senior-frontend

### Status

Pending

---

## Description

Two requirements:

### 1. Two-week display window

The app should always display events for at least the previous week and the current week. Currently, `DashboardPage.tsx` sets `timeMin` as `currentDate - 3 days` and `timeMax` as `currentDate + 10 days`. This should be expanded to ensure the full previous week and current week are always visible.

When the user navigates to different weeks via prev/next buttons, the API fetch range should always cover at least a 2-week window centered on the current view.

### 2. Past event immutability

Events that have already ended (based on current date/time) must be immutable:
- Cannot be dragged (eventDragStart should be prevented or reverted)
- Cannot be resized
- The × delete button should be hidden or disabled for past events
- The eventClick can still work (to view details) but editing is not allowed

This applies to calendar events displayed in FullCalendar. The `editable` property in FullCalendar can be controlled per-event via `eventStartEditable` and `eventDurationEditable` extendedProps, or by filtering in the `eventDrop`/`eventResize` callbacks.

---

## Acceptance Criteria

- [ ] API fetch range covers at least the full previous week and current week (minimum 2 weeks)
- [ ] Past events (end time < now) cannot be dragged
- [ ] Past events cannot be resized
- [ ] × delete button is hidden on past events
- [ ] Current/future events remain fully editable
- [ ] EventClick still works on past events (for viewing)
- [ ] Events without an `end` property are handled (default to `start + 30min` for past check, or treat as not-past if start is in future)
- [ ] All-day events: past check uses end of day (`end` or `start + 24h`) vs `Date.now()`
- [ ] Recurring blocks: each rendered occurrence is checked independently for past/current status
- [ ] Timezone: comparison uses client-side `Date.now()` with event times parsed from ISO strings (no timezone conversion needed — both are in local time)

---

## Dependencies

### Required Tasks

- TASK-01

### Dependency Notes

TASK-03 depends on TASK-01 because event persistence ensures events exist in the calendar for proper testing of past event immutability. The 2-week window logic could be implemented independently but depends on TASK-01's data being present for validation.

**File overlap**: TASK-03 and TASK-04 both modify `useScheduleEditing.ts` (different functions — handleEventDrop/handleEventResize vs confirmDelete). They can run in parallel with careful merge strategy, or sequentially (either order).

---

## Technical Context

### Relevant Components

- DashboardPage (`apps/web/src/pages/DashboardPage.tsx`) — timeMin/timeMax calculation
- CalendarView (`apps/web/src/components/CalendarView.tsx`) — per-event editability
- useScheduleEditing (`apps/web/src/hooks/useScheduleEditing.ts`) — canDropAt, handleEventDrop, handleEventResize

### Relevant Types

- `CalendarEvent` from `@brkroutnxdle/shared`

---

## Implementation Guidance

### Expected Changes

1. **DashboardPage.tsx**: Change timeMin/timeMax calculation to ensure full previous + current week coverage (e.g., `timeMin = start of previous week`, `timeMax = end of next week`)
2. **CalendarView.tsx handleEventDidMount**: Hide × button for past events (check `end` vs current time). Handle missing `end` — default to `start + 30min`
3. **CalendarView.tsx**: Add `eventDragStart` check to prevent dragging past events (revert immediately). Or use per-event `editable` via `eventStartEditable`/`eventDurationEditable` in the event mapping
4. **CalendarView.tsx**: Add `eventAllow` or per-event `editable` prop to prevent past event resizing
5. **useScheduleEditing.ts handleEventDrop/handleEventResize**: Add guard to revert if event is past (defense-in-depth — FullCalendar may still fire callbacks)

### Alternative approach

Use FullCalendar's per-event `editable` support via the `eventContent` custom render, or set `eventStartEditable`/`eventDurationEditable` on the FullCalendar event objects. FullCalendar supports these as extended event properties that can be set per-event in the events array. This is cleaner than reverting in callbacks.

### Edge Case Implementation Details

- **Events without `end`**: Some events may only have `start`. For past check, use `end ?? new Date(start).getTime() + 30 * 60000` (default 30min duration). If the start is in the future, event is not past.
- **All-day events**: These typically span the full day. `end` = `start + 24h` or `start` day boundary. Check if the day has fully ended.
- **Recurring blocks**: For recurring blocks (`RecurringWeekday`/`RecurringPeriod`), FullCalendar renders individual FC event instances per occurrence. Each occurrence has its own `start`/`end` computed by FullCalendar. The past check should use the rendered occurrence's end time. Use `fcEvent.startStr`/`fcEvent.endStr` in `handleEventDidMount` or `eventContent`.
- **Time zone**: All comparisons are client-side. Parse ISO strings with `new Date(endStr).getTime() < Date.now()`. No timezone conversion needed.

### Constraints

- Must not break drag-and-drop for future events
- Past event check must use client-side time (not server time)
- Past = event.end < Date.now() (or `event.start + 30min < Date.now()` if no end)
- × button visibility must match the per-event past check
- Must handle events without `end` gracefully

### File Overlap Warning

**This task conflicts with TASK-04 on `useScheduleEditing.ts`**:
- TASK-03 modifies `handleEventDrop` and `handleEventResize` (add past event guard)
- TASK-04 modifies `confirmDelete` (add CalendarContext event deletion)
- These are different functions in the same file, so they CAN run in parallel IF the developer merges carefully
- If not running in parallel, sequence: TASK-03 first, then TASK-04 (or vice versa)

### Validation Rules

- Navigate to a past week — past events show but cannot be dragged/resized/deleted
- Navigate to current week — past events (earlier today) cannot be modified, future events can
- Create a new event — it can be dragged/resized/deleted normally

---

## Testing

### Manual Validation

- [ ] Navigate to a month view with past events — × button hidden on past events
- [ ] Try dragging a past event — event reverts to original position
- [ ] Try resizing a past event — event reverts to original size
- [ ] Navigate to current week — past events immutable, future events editable
- [ ] Verify API fetch covers at least 2 weeks
- [ ] Create an inline event (will be future) — it should be fully editable (draggable, resizable, × visible)
- [ ] All-day event in the past — should be immutable
- [ ] Event without end time (only start) — if start is in the past, event is treated as past
- [ ] Recurring block: today's occurrence should be modifiable; yesterday's should not
- [ ] Navigate to a date range and verify timeMin/timeMax cover full previous + current week

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Build passes
- [ ] Lint passes
- [ ] Manual validation completed

---

## References

- `apps/web/src/pages/DashboardPage.tsx`
- `apps/web/src/components/CalendarView.tsx`
- `apps/web/src/hooks/useScheduleEditing.ts`
- FullCalendar eventStartEditable: https://fullcalendar.io/docs/eventStartEditable
- FullCalendar eventDurationEditable: https://fullcalendar.io/docs/eventDurationEditable
