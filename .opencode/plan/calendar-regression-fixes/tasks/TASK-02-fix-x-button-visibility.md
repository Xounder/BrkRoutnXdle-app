# Task Template

## Task Information

### ID

TASK-02

### Title

Fix X Button Visibility on Events (CSS Overflow + isPast Logic)

### Owner

senior-frontend

### Status

Pending

---

## Description

The × (delete) button on generated events and blocks is not appearing or is not clickable. Two contributing root causes have been identified:

**Cause 1 — CSS overflow clipping**: The `.fc-event .fc-event-title` CSS at line 86-92 of `CalendarStyles.css` sets `overflow: hidden !important`. The × button is positioned absolutely relative to the event element, but the overflow hidden on the title element (a child) does not clip the button since the button is appended to the parent `el`. However, FC's own event element may have `overflow: hidden` applied, or the FC event rendering structure may clip the absolutely positioned button. Additionally, FC events may have their own overflow rules that need to be overridden.

**Cause 2 — isPast check rejects current events**: In `handleEventDidMount` (CalendarView.tsx line 278), the `isPast` check uses `Date.now()` which runs at mount time. Events ending in the near future (within seconds/minutes) may be incorrectly classified as past. Additionally, the `isPast` extendedProp set in `fcEvents` memo (line 157) uses `new Date(e.end).getTime()` compared against `Date.now()`, which is evaluated once during render — this may cause timezone-related discrepancies where an event at the boundary (e.g., 11:59 PM in local time) gets `isPast = true` incorrectly if the comparison timezone doesn't match the event timezone.

**Fix scope**:
1. **CSS**: Override FC's event container overflow to allow the absolute-positioned × button to be visible. Ensure the button has proper `z-index` and is not clipped by any parent.
2. **isPast logic**: Review and fix the `isPast` computation in both the `fcEvents` memo and `handleEventDidMount` to use consistent timezone handling. Consider using the event's own end time in local time rather than UTC comparison against `Date.now()`.

---

## Acceptance Criteria

- [ ] The × button is visible on all non-past generated events and blocks
- [ ] The × button is clickable (not hidden behind overflow or other elements)
- [ ] Past events do NOT show the × button
- [ ] Events ending in the future (even by 1 minute) correctly show the × button
- [ ] No regression in existing event styling
- [ ] No regression in block event styling

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

None — this task is fully independent and can run in parallel with TASK-01, TASK-03, and TASK-04.

---

## Technical Context

### Relevant Components

- `CalendarView.tsx` — `handleEventDidMount`, `fcEvents` memo, `isPast` computation
- `CalendarStyles.css` — FC event styling, overflow rules

### Relevant Modules

- `apps/web/src/components/CalendarView.tsx`
- `apps/web/src/styles/CalendarStyles.css`

### Relevant Types

- `CalendarEvent` from `@brkroutnxdle/shared`

---

## Implementation Guidance

### Expected Changes

1. **`CalendarStyles.css`**: Add/update CSS rules to ensure events do not clip the delete button:
   ```css
   /* Override FC overflow to allow absolute-positioned delete button */
   .brk-calendar-google .fc .fc-event {
     overflow: visible !important;
   }
   .brk-calendar-google .fc .fc-event .fc-event-main {
     overflow: visible !important;
   }
   ```
   And ensure the button's `z-index` is sufficiently high.

2. **`CalendarView.tsx`**:
   - Fix the `isPast` extendedProp computation in the `fcEvents` memo (line 150-213): Replace `Date.now()` comparison with a timezone-aware check. Consider using the event's end time without timezone conversion issues. One approach: use the end string directly to check if the event has ended.
   - Fix the `handleEventDidMount` runtime `isPast` check (line 287-290): Use the same timezone-consistent logic.
   - Ensure the delete button CSS (lines 297-315) explicitly avoids being clipped: check that the button is added to the correct parent element (not inside a clipped container).

### Constraints

- Must not break block events (`.brk-block`) which have `pointer-events: none` — they should still show the × button
- Must not break preview events (`.brk-preview`)
- The fix must work in all FullCalendar views (dayGridMonth, timeGridWeek, timeGridDay)

### Validation Rules

- Generate events with a mix of past and future times
- Verify × button visibility in all three calendar views
- Verify × button click triggers the delete confirmation

---

## Edge Cases

- **All-day events**: FC renders all-day events differently (in the all-day slot header). The × button must still be visible and clickable.
- **Recurring blocks**: Recurring blocks don't have explicit `start`/`end` — they use `daysOfWeek`, `startTime`, `endTime`. The runtime `isPast` check in `handleEventDidMount` must handle this gracefully (it currently uses `endStr` which may be undefined for recurring).
- **Rapid time boundary crossing**: If an event ends at `Date.now()` exactly, edge rounding may cause intermittent × button visibility. Use `>=` vs `>` carefully.
- **Timezone DST transitions**: Events near DST boundaries may have ambiguous time representations — ensure the comparison is robust.
- **FC view reuse**: FC reuses DOM elements across view changes — ensure `eventWillUnmount` properly cleans up the button to avoid duplicates.
- **Double-click guard**: The existing guard (`if (e.detail > 1) return;`) must remain functional.

---

## Testing

### Unit Tests

- [ ] Test `isPast` computation logic with various timezone scenarios
- [ ] Test that events ending in the future return `isPast = false`

### Integration Tests

- [ ] E2E test: Verify × button is visible on a generated event in week view
- [ ] E2E test: Verify clicking × triggers delete dialog

### Manual Validation

- [ ] Create events at various times and verify × button visibility across views
- [ ] Create past events (drag to past) and verify × button is hidden
- [ ] Create blocks and verify × button visibility

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

- [CalendarView.tsx](../apps/web/src/components/CalendarView.tsx) — lines 150-213 (fcEvents isPast), lines 278-324 (handleEventDidMount)
- [CalendarStyles.css](../apps/web/src/styles/CalendarStyles.css) — lines 73-92 (event styling with overflow)
- [Bug 2: X button on blocks not appearing/working](./TASK-02-fix-x-button-visibility.md)
- [Bug 4: Task X button not appearing](./TASK-02-fix-x-button-visibility.md)
