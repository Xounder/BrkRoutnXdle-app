# Task Template

## Task Information

### ID

TASK-02

### Title

Fix X delete button click on block events in CalendarView

### Owner

senior-frontend

### Status

Pending

---

## Description

The × delete button created in `handleEventDidMount` (CalendarView.tsx lines 236-268) appears on block events but does not respond to click events.

The root cause: `handleEventDidMount` has a guard condition `if (!props.isGenerated && !props.isBlock) return;` that correctly allows blocks through, but the click handler may be intercepted by FullCalendar's internal event management. When a click occurs on the × button, FullCalendar's `eventClick` handler fires instead of the button's `onclick`, or the button's `e.stopPropagation()` is insufficient.

Additionally, the button may have `pointer-events` issues — FullCalendar's event elements may use pointer event manipulation for drag-and-drop that interferes.

### Required investigation areas

1. Check if FullCalendar's `eventClick` is intercepting the × button click
2. Check if the × button's `e.stopPropagation()` is actually working (the button is inside the event element, which has its own click handler)
3. Check if FullCalendar's event wrapper applies `pointer-events: none` or similar CSS that blocks the button
4. Consider using `eventMouseEnter`/`eventMouseLeave` approach instead of always-rendered button
5. Consider using a FullCalendar custom rendering approach (`eventContent`) instead of DOM manipulation in `eventDidMount` — this is the preferred fix approach

---

## Acceptance Criteria

- [ ] × button on block events is clickable and triggers the delete confirmation dialog
- [ ] × button on generated events still works (no regression)
- [ ] Clicking the event body (not the × button) still opens the edit modal
- [ ] No console errors related to event handling
- [ ] No memory leaks from orphaned DOM elements (use `eventWillUnmount` to clean up if using `eventDidMount`)
- [ ] Double-clicking the × button does not trigger the delete dialog twice
- [ ] Recurring block events: each occurrence shows a clickable × button; deleting one occurrence deletes the entire block via `deleteBlock`

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

No dependencies — this is a self-contained UI fix.

---

## Technical Context

### Relevant Components

- CalendarView (`apps/web/src/components/CalendarView.tsx`)
- useScheduleEditing (`apps/web/src/hooks/useScheduleEditing.ts`) — `requestDelete` / `confirmDelete`
- DeleteEventDialog (`apps/web/src/features/preview/DeleteEventDialog.tsx`)

### Relevant Types

- `CalendarEvent` from `@brkroutnxdle/shared`
- `BlockedSlot` from `@brkroutnxdle/shared`

---

## Implementation Guidance

### Expected Changes

1. **CalendarView.tsx handleEventDidMount**: Fix the × button click interaction for block events.
   
   **Recommended approach**: Use FullCalendar's `eventContent` custom render function instead of `eventDidMount` DOM manipulation. This avoids the pointer event conflicts entirely because the button is rendered as part of FullCalendar's own DOM construction. If `eventContent` is not feasible, use `eventDidMount` with:
   - `pointer-events: auto` on the × button style
   - `z-index: 10` to ensure it's above the event wrapper
   - `eventWillUnmount` cleanup to prevent memory leaks from orphaned `<button>` elements

2. **CalendarView.tsx**: Add `eventWillUnmount` handler that removes the appended × button if it exists (prevents memory leaks when FullCalendar recycles DOM nodes)

3. **Double-click guard**: In the `deleteBtn.onclick` handler, use a flag or `event.detail` to prevent processing if the click count exceeds 1, or rely on `requestDelete` being idempotent (it just sets state)

### Constraints

- Must not break existing drag-and-drop on events
- Must not break eventClick for editing
- Button should only appear on generated events and block events (not on external Google Calendar events)
- DOM cleanup must be handled to avoid memory leaks when FullCalendar recycles event elements

### Validation Rules

- Click × on block event → DeleteEventDialog should appear
- Click × on generated event → DeleteEventDialog should appear
- Click on event body (not ×) → edit modal should open (for tasks) or BlockModal should open (for blocks)

---

## Testing

### Manual Validation

- [ ] Click × on a block event — delete confirmation appears
- [ ] Click × on a generated (preview) event — delete confirmation appears
- [ ] Click on event body (not ×) — edit modal opens
- [ ] Click × on a Google Calendar event — no button appears (correct)
- [ ] Drag-and-drop of events still works
- [ ] Double-click × quickly — dialog opens only once
- [ ] Navigate between weeks (causing event remount) — no orphaned buttons, no duplicate buttons
- [ ] Recurring block event (RecurringWeekday) — × button appears on each occurrence; click × on any occurrence → entire block deleted
- [ ] Verify no "Failed to execute 'appendChild'" or other DOM errors in console

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Build passes
- [ ] Lint passes
- [ ] Manual validation completed

---

## References

- `apps/web/src/components/CalendarView.tsx`
- `apps/web/src/hooks/useScheduleEditing.ts`
- `apps/web/src/features/preview/DeleteEventDialog.tsx`
- FullCalendar eventDidMount docs: https://fullcalendar.io/docs/eventDidMount
- FullCalendar eventContent docs: https://fullcalendar.io/docs/eventContent
