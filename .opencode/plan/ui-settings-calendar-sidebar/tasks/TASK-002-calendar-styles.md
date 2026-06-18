# Task Template

## Task Information

### ID

TASK-002

### Title

Calendar Visual Refresh — Google Calendar-like styling & padding reduction

### Owner

senior-frontend

### Status

Pending

---

## Description

Enhance the existing `CalendarStyles.css` file with Google Calendar-like visual overrides and reduce the outer padding in `CalendarView.tsx`. The existing CSS file already has basic event styling; this task adds grid lines, weekend tint, red "now" indicator, compact headers, and refined time gutter labels.

---

## Acceptance Criteria

- [ ] `CalendarStyles.css` is updated with styles for:
  - Subtle grid lines (`#f0f0f0`) on the time slots
  - Event pills with `border-radius`, no borders, `font-size: 12px`
  - Weekend columns (`fc-day-sat`, `fc-day-sun`) with tinted background (`#fafafa`)
  - Red "now" indicator (`#ea4335`) for the `.fc-now-indicator` element
  - Compact day headers (`font-size: 12px`, `font-weight: 500`)
  - Time gutter labels (`fc-timegrid-slot-label`) small and gray (`#888`)
- [ ] `CalendarStyles.css` is already imported in `CalendarView.tsx` (verify the import exists; add if missing)
- [ ] Outer padding in `CalendarView.tsx` reduced from `16px` to `8px`

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This task is independent and can run in parallel with TASK-001 and TASK-003.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/CalendarView.tsx` — Wraps FullCalendar in a `<div>` with inline `padding: "16px"`
- `apps/web/src/styles/CalendarStyles.css` — Existing CSS file with basic event styling

### Relevant Modules

- `apps/web/src/styles/` — Styles directory where `CalendarStyles.css` lives

### Relevant APIs

- FullCalendar CSS class documentation: `.fc-timegrid-now-indicator-line`, `.fc-timegrid-slot`, `.fc-col-header-cell`, `.fc-timegrid-slot-label`, `.fc-day-sat`, `.fc-day-sun`, `.fc-event`

---

## Implementation Guidance

### Expected Changes

1. **`apps/web/src/styles/CalendarStyles.css` — Add new CSS overrides:**
   - Keep existing `.brk-generated`, `.brk-preview`, `.brk-completed`, `.brk-external`, `.brk-block` styles (do not remove)
   - Add subtle grid lines on `.fc-timegrid-slot`:
     ```css
     .fc-timegrid-slots .fc-timegrid-slot {
       border-bottom: 1px solid #f0f0f0 !important;
     }
     ```
   - Style events as pills:
     ```css
     .fc-event {
       border-radius: 4px !important;
       border: none !important;
       font-size: 12px !important;
     }
     ```
   - Weekend tint:
     ```css
     .fc-day-sat, .fc-day-sun {
       background-color: #fafafa !important;
     }
     ```
   - Red now indicator:
     ```css
     .fc-now-indicator-line {
       border-color: #ea4335 !important;
     }
     .fc-now-indicator-arrow {
       color: #ea4335 !important;
     }
     ```
   - Compact day headers:
     ```css
     .fc-col-header-cell-cushion {
       font-size: 12px !important;
       font-weight: 500 !important;
     }
     ```
   - Small gray time gutter labels:
     ```css
     .fc-timegrid-slot-label-cushion {
       font-size: 11px !important;
       color: #888 !important;
     }
     ```

2. **`apps/web/src/components/CalendarView.tsx` — Verify CSS import:**
   - Check that `import "../styles/CalendarStyles.css";` exists at the top of the file
   - If missing, add the import

3. **`apps/web/src/components/CalendarView.tsx` — Reduce padding (line 267):**
   - Change `padding: "16px"` to `padding: "8px"`

### Constraints

- Do not remove or break existing `.brk-*` CSS class styles
- Keep import statements consistent with the project's existing style import pattern (see `global.css` or `design-tokens.css` for reference)
- The `!important` flags may be necessary to override FullCalendar's inline styles

### Validation Rules

- Calendar should still render all events, blocks, and preview elements correctly
- Weekend columns should have a subtle visual distinction
- The "now" indicator line should be red (#ea4335)
- Grid lines between time slots should be visible at #f0f0f0

---

## Testing

### Unit Tests

- [ ] No unit tests needed (CSS-only changes)

### Integration Tests

- [ ] Verify calendar renders without visual regressions

### Manual Validation

- [ ] Open the calendar in week view and verify grid lines are subtle gray
- [ ] Verify weekend columns have a tinted background
- [ ] Verify the current time indicator is red
- [ ] Verify event pills have no border, correct border-radius, and 12px font
- [ ] Verify day headers are compact (12px, weight 500)
- [ ] Verify time gutter labels are small and gray
- [ ] Verify outer padding is reduced from 16px to 8px

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Tests created or updated
- [ ] Build passes (`pnpm build` in `apps/web`)
- [ ] Lint passes
- [ ] Validation completed

---

## References

- `apps/web/src/styles/CalendarStyles.css` (existing file, will be enhanced)
- `apps/web/src/components/CalendarView.tsx`
- FullCalendar CSS class reference: https://fullcalendar.io/docs/css-customization
