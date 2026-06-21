# Task Template

## Task Information

### ID

TASK-03

### Title

Home Screen Scroll Fix

### Owner

senior-frontend

### Status

Pending

---

## Description

The entire page scrolls vertically, even though only the calendar area should scroll. The `<main>` container has `overflow: auto`, allowing the full page to scroll when the calendar content overflows.

The fix involves:
1. Changing the `<main>` container's overflow from `auto` to `hidden` in `MainLayout.tsx`
2. Wrapping the `CalendarView` in a scrollable container in `DashboardPage.tsx` so the calendar itself scrolls independently

---

## Acceptance Criteria

- [ ] The page's `<main>` container does not scroll (overflow hidden)
- [ ] The calendar area scrolls independently when content overflows
- [ ] Header, sidebar, toolbar buttons, and status bars remain fixed in position
- [ ] No layout shift or content clipping on other pages using `MainLayout`
- [ ] Works in all calendar views (day, week, month)

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

N/A

---

## Technical Context

### Relevant Components

- `apps/web/src/components/MainLayout.tsx`
- `apps/web/src/pages/DashboardPage.tsx`
- `apps/web/src/components/CalendarView.tsx`

### Relevant Modules

- `apps/web/src/components/MainLayout.tsx` — contains `<main>` element with `overflow: "auto"`
- `apps/web/src/pages/DashboardPage.tsx` — renders `CalendarView` inside `MainLayout`
- `apps/web/src/components/CalendarView.tsx` — the calendar component itself

### Relevant APIs

- None

### Relevant Types

- None

---

## Implementation Guidance

### Expected Changes

1. **In `MainLayout.tsx`** (line 51):
   - Change `<main style={{ flex: 1, overflow: "auto" }}>` to `<main style={{ flex: 1, overflow: "hidden" }}>`

2. **In `DashboardPage.tsx`** (or alternatively in `CalendarView.tsx`):
   - Wrap the `CalendarView` component in a scrollable container:
     ```tsx
     <div style={{ flex: 1, overflow: "auto" }}>
       <CalendarView ... />
     </div>
     ```
   - Ensure the scrollable container fills the remaining vertical space

### Constraints

- `overflow: hidden` should be applied only to the `<main>` in `MainLayout` — verify it doesn't break other pages using `MainLayout`
- The calendar wrapper should only be scrollable when its content overflows (use `overflow: auto`)
- Must retain the `flex: 1` on the scrollable container to fill available space

### Validation Rules

- Verify the page does not have a vertical scrollbar when the calendar content fits
- Verify the calendar wrapper gains a vertical scrollbar when content overflows
- Verify the header and sidebar remain fixed during scroll

---

## Testing

### Unit Tests

- None (CSS/layout change)

### Integration Tests

- None (layout change)

### Manual Validation

- [ ] Open the dashboard in a short viewport
- [ ] Verify no page-level scrollbar appears
- [ ] Verify the calendar area has its own scrollbar
- [ ] Scroll inside the calendar → header, sidebar, toolbar should remain fixed
- [ ] Switch between day, week, month views → scroll behavior works correctly

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
- `apps/web/src/components/MainLayout.tsx`
- `apps/web/src/pages/DashboardPage.tsx`
- `apps/web/src/components/CalendarView.tsx`
