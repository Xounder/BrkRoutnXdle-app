# Task Template

## Task Information

### ID

TASK-02

### Title

Fix block (event) name color in calendar to be a highlight/distinct color

### Owner

senior-frontend

### Status

Pending

---

## Description

The block name (event title) in the calendar currently displays with poor contrast — it appears white on light backgrounds, making it hard to read. The title text should use a highlight/distinct color that is clearly visible against the event background.

Currently the time text (`02:30-03:00`) appears correctly in black (`#333`), but the event name appears in white (FullCalendar's default for event titles on colored backgrounds). The event name must have an explicit contrasting color.

This affects:
- Generated events (`.brk-generated`)
- External events (`.brk-external`)
- Blocked slots (`.brk-block`)
- Preview events (`.brk-preview`)

---

## Acceptance Criteria

- [ ] Event title text (`.fc-event-title`) is clearly visible on all event types
- [ ] Generated event titles are a distinct highlight color (e.g., `var(--clr-primary-dark)`)
- [ ] Blocked slot titles are a distinct color (not gray `#888`, e.g., `var(--clr-coral-dark)`)
- [ ] Preview event titles are visible (not white)
- [ ] External event titles remain visible (currently `#2b6b9e`)
- [ ] The time text (`.fc-event-time`) remains black (`#333`)
- [ ] Fixes apply within the `.brk-calendar-google` scoped wrapper

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

Independent task — can run in parallel with all others. Only CSS changes needed.

---

## Technical Context

### Relevant Components

- `apps/web/src/styles/CalendarStyles.css` — All calendar visual styles

### Relevant Modules

- CSS / FullCalendar styling

### Relevant APIs

- N/A (pure CSS change)

### Relevant Types

- N/A

---

## Implementation Guidance

### Expected Changes

In **`apps/web/src/styles/CalendarStyles.css`**:

1. **Add a global default for `.fc-event .fc-event-title`** to ensure full calendar event title is never white:
   ```css
   .brk-calendar-google .fc-event .fc-event-title {
     color: #333 !important;
   }
   ```

2. **Update `.brk-block .fc-event-title`** to use a highlight color:
   ```css
   .brk-calendar-google .fc-event.brk-block .fc-event-title {
     color: var(--clr-coral-dark) !important;
   }
   ```

3. **Ensure `.brk-preview .fc-event-title`** has a visible color (currently inherits from `.brk-preview` which has `opacity: 0.9` and no explicit title color):
   ```css
   .brk-calendar-google .fc-event.brk-preview .fc-event-title {
     color: var(--clr-primary-dark) !important;
   }
   ```

4. Review all 15+ event style classes to ensure no title text inherits white from FullCalendar defaults.

### Constraints

- Must use `!important` where necessary to override FullCalendar's inline/component styles
- All selectors must be scoped under `.brk-calendar-google` wrapper to avoid leaking
- Must not reduce contrast or readability

### Validation Rules

- [ ] Each event type title is inspected and has explicit color
- [ ] No title text renders white on light backgrounds
- [ ] Color contrast ratio meets WCAG AA standards (min 4.5:1 for normal text)

---

## Testing

### Unit Tests

- [ ] N/A (CSS-only change)

### Integration Tests

- [ ] N/A

### Manual Validation

- [ ] Open calendar with generated events → verify titles are a distinct highlight color
- [ ] Open calendar with blocked slots → verify titles use coral/dark color
- [ ] Open calendar with preview events → verify titles are visible
- [ ] Open calendar with external/Google events → verify titles are visible
- [ ] Verify time text (e.g., "02:30-03:00") remains black in all cases
- [ ] Test on different days (weekday/weekend) and views (day/week/month)

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

- `apps/web/src/styles/CalendarStyles.css` (lines 74-171: all event style classes)
- `.opencode/architecture/docs/design-system.md` (color tokens)
- `.opencode/architecture/docs/frontend/component-architecture.md`
