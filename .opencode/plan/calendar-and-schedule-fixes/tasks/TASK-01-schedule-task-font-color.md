# Task Template

## Task Information

### ID

TASK-01

### Title

Schedule Task Font Color

### Owner

senior-frontend

### Status

Pending

---

## Description

Preview events (`.brk-preview` class) have no explicit `color` on their title element (`.fc-event-title`), causing them to inherit FullCalendar's default white text. This makes preview event titles unreadable against the translucent teal background.

Add `color: #333` to the `.brk-preview .fc-event-title` selector so preview event text is always dark and readable.

---

## Acceptance Criteria

- [ ] Preview event titles display with `color: #333` (dark gray)
- [ ] Other event types (generated, external, block) remain visually unchanged
- [ ] No regressions in event styling

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

N/A

---

## Technical Context

### Relevant Components

- CalendarPreview (or any component rendering `.brk-preview` events)

### Relevant Modules

- `apps/web/src/styles/CalendarStyles.css`

### Relevant APIs

- None

### Relevant Types

- None

---

## Implementation Guidance

### Expected Changes

1. In `apps/web/src/styles/CalendarStyles.css`, add a new CSS rule after the existing `.brk-preview` block (section 13):
   ```css
   .brk-calendar-google .fc-event.brk-preview .fc-event-title {
     color: #333 !important;
   }
   ```

### Constraints

- Must use `!important` to override FullCalendar's default title color
- Must be scoped under `.brk-calendar-google` to match existing pattern

### Validation Rules

- Verify with browser devtools that `.brk-preview .fc-event-title` has `color: #333`
- Verify other event title colors (`.brk-generated .fc-event-title`, `.brk-external .fc-event-title`) are unchanged

---

## Testing

### Unit Tests

- None (CSS-only change)

### Integration Tests

- None (CSS-only change)

### Manual Validation

- [ ] Open the calendar with preview events visible
- [ ] Confirm preview event titles are dark (#333) and readable
- [ ] Confirm generated/external/block event titles retain their original colors

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
- `apps/web/src/styles/CalendarStyles.css`
