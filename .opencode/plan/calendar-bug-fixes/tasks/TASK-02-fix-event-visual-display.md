# Task Template

## Task Information

### ID

TASK-02

### Title

Fix calendar event visual display — time text color and slot height

### Owner

senior-frontend

### Status

Pending

---

## Description

Two visual bugs exist in the calendar event rendering:

**Bug 2 (White time text):** Event titles appear in black text (correct), but event times appear in white text (wrong — should be black). FullCalendar renders event time inside a `.fc-event-time` element which is not explicitly styled in `CalendarStyles.css`, so it inherits styles that result in white text on a light background.

**Bug 3 (Event blocks don't fill slot height):** An event from 5:00 to 5:30 should visually fill the full 5:00–5:30 time slot in the timeGrid view. Currently, the event block only occupies the top portion of the slot rather than extending to the bottom edge. This makes events look smaller than their actual duration and reduces readability.

---

## Acceptance Criteria

- [ ] Event time text color is black (`#333`) instead of white — both `.fc-event-time` text is visible and matches the event title color
- [ ] Event blocks visually fill their full time slot height (e.g., a 5:00–5:30 event fills the entire 5:00–5:30 row)
- [ ] All event types (generated, external, preview, block) display correctly with these fixes
- [ ] No regression in other event visual styles (hover, borders, backgrounds, etc.)

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This is a pure CSS/frontend task independent of all others.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/CalendarView.tsx` — FullCalendar configuration, event rendering
- `apps/web/src/styles/CalendarStyles.css` — All calendar event styling (lines 73-161)

### Relevant Modules

- FullCalendar (timeGrid plugin)
- `@fullcalendar/react` — React wrapper

### Relevant APIs

- FullCalendar `eventDidMount` callback — can be used to inspect/modify event DOM elements
- FullCalendar event rendering — `.fc-event`, `.fc-event-title`, `.fc-event-time` CSS classes

### Relevant Types

- `CalendarEvent` (packages/shared/src/types/index.ts)
- FullCalendar event object shape

---

## Implementation Guidance

### Expected Changes

**For Bug 2 (white time text):**

1. In `CalendarStyles.css`, add explicit styling for the `.fc-event-time` element within calendar events:
   ```css
   .brk-calendar-google .fc-event .fc-event-time {
     color: #333 !important;
   }
   ```
2. Ensure the style is applied consistently across all event types (`.brk-generated`, `.brk-external`, `.brk-preview`, `.brk-block`) by adding it at the general event level.

**For Bug 3 (slot height):**

1. Investigate the event's CSS `height` or `min-height` — events in timeGrid views should stretch to fill their allocated slot. Check if the `.fc-event` element has constraints.
2. Ensure the event's `display` property is appropriate for timeGrid events (use `display: block` instead of `display: auto` for timeGrid events if needed).
3. If the issue is in the event rendering data, adjust the `end` time to ensure it correctly aligns with slot boundaries in `CalendarView.tsx`.
4. Verify the `slotDuration="00:30:00"` setting aligns with event durations. Consider adding a CSS rule like:
   ```css
   .brk-calendar-google .fc-timegrid-event {
     min-height: 100% !important;
   }
   ```
   or adjusting the event's `display` property to `block` in the timeGrid view.

### Constraints

- Must use CSS-in-file approach (keep styles in CalendarStyles.css)
- Must not break FullCalendar's own layout calculations
- Must not use JavaScript to manually calculate/force element heights
- Changes must be scoped under `.brk-calendar-google` wrapper class

### Validation Rules

- `.fc-event-time` must have explicit `color` set, not inherited
- Event block bottom edge must align with the slot boundary line in timeGrid view
- Time text must be readable against all event background styles

---

## Testing

### Unit Tests

- [ ] N/A — visual CSS changes, manual validation

### Integration Tests

- [ ] N/A

### Manual Validation

- [ ] In week view, create/load events and verify time text is black, not white
- [ ] In week view, verify a 30-min event fills its full 30-min slot height
- [ ] Verify a 60-min event fills its full 60-min slot height
- [ ] Toggle between day/week/month views and verify no visual regression
- [ ] Verify all event types (generated, external, preview, block) display correctly
- [ ] Test with both light and dark color schemes (if applicable)

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

- `apps/web/src/styles/CalendarStyles.css` — Main calendar CSS file (lines 73-161: event styling rules)
- `apps/web/src/components/CalendarView.tsx` — FullCalendar component with event configuration
- FullCalendar documentation: [Event Rendering](https://fullcalendar.io/docs/event-rendering)
- `.opencode/architecture/docs/design-system.md` — Visual design system reference
