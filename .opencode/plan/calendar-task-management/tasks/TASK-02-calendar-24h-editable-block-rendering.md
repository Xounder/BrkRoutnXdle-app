# Task Template

## Task Information

### ID

TASK-02

### Title

Calendar: 24h View + Always-Editable Mode + Block Rendering

### Owner

senior-frontend

### Status

Pending

---

## Description

Overhaul the CalendarView foundation: always show all 24 hours, enable `editable` permanently (not only during preview), and render BlockedSlots from BlockContext as calendar events with distinct styling.

### Sub-tasks

1. **24h view**: Change `slotMinTime`/`slotMaxTime` to `"00:00:00"` / `"24:00:00"` (or derive from settings with a 24h toggle). Ensure the calendar scrolls to the user's work start hour on load.
2. **Always editable**: Set `editable={true}` always (remove dependency on `isPreviewActive`). Keep `selectable={true}`. Remove the preview-only edit mode distinction.
3. **Block rendering**: Map `BlockedSlot[]` from BlockContext to FullCalendar event format. Render them with distinct styling (e.g., striped/hatched pattern, different color). Handle all block types: single-day, recurring-weekday, recurring-period.
4. **Context wiring**: BlockContext already exposes `blocks`. DashboardPage (or a new hook) should merge blocks into the `events` array passed to CalendarView.

---

## Acceptance Criteria

- [ ] Calendar shows all 24 hours (00:00–24:00) in timeGrid views
- [ ] Calendar is always in editable mode (events can be dragged/resized without entering preview)
- [ ] BlockedSlots appear as calendar events with distinct visual styling
- [ ] Recurring weekday blocks repeat on correct days at correct times
- [ ] Recurring period blocks render within their date range
- [ ] Block events do not interfere with task/preview event rendering
- [ ] Calendar scrolls to work start hour on initial load

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

No cross-phase dependencies. TASK-02 is a prerequisite for TASK-03 (click handlers) and TASK-04 (drag-and-drop). TASK-02 is independent of Phase 1 and Phase 3.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/CalendarView.tsx`
- `apps/web/src/pages/DashboardPage.tsx`
- `apps/web/src/contexts/BlockContext.tsx`

### Relevant Modules

- `packages/shared/src/types/index.ts` (`BlockedSlot`, `BlockType`, `CalendarEvent`)
- `packages/shared/src/constants/index.ts`

### Relevant Types

- `BlockedSlot` (id, title, blockType, startDate, endDate, startTime, endTime, daysOfWeek, isRecurring)
- `CalendarEvent` (common interface with CalendarView)
- `BlockType` (SingleDay, RecurringWeekday, RecurringPeriod)

---

## Implementation Guidance

### Expected Changes

1. **CalendarView.tsx**: Change `slotMinTime` and `slotMaxTime` to `"00:00:00"` / `"24:00:00"`. Set `editable={true}` always. Set `selectable={true}`. Add a `scrollTime` prop initialized to work start hour.
2. **CalendarView.tsx**: Accept a `blocks` prop (or merge blocks into existing `events`). Map `BlockedSlot` to FullCalendar event format:
   - SingleDay: single event with start/end as combined date+time
   - RecurringWeekday: use `daysOfWeek`, `startTime`, `endTime` with FullCalendar's recurring event format
   - RecurringPeriod: render events for each day in range at the specified time
3. **DashboardPage.tsx**: Import `useBlockContext` (or `useBlocks` hook). Merge blocks into the events array passed to `CalendarView`. Add distinct `classNames` for block events (e.g., `["brk-block"]`).
4. **Styling**: Add CSS for `.brk-block` class — hatched/striped pattern or muted color to distinguish from task events. For example, light gray background with diagonal stripes.

### Constraints

- Blocks should not be confused with generated tasks — use distinct colors (e.g., `#E8E8E8` with a pattern)
- Recurring weekday blocks should use FullCalendar's native `dow` format for correct rendering
- Block events must have `display: "auto"` so they appear on the calendar properly
- The `isGenerated` flag should remain only for task-generated events

### Validation Rules

- A SingleDay block for tomorrow 14:00-15:00 shows as a gray event on the calendar
- A RecurringWeekday block Mon/Wed/Fri 09:00-10:00 shows on every Mon, Wed, Fri
- Calendar time axis shows 00:00 to 24:00

---

## Testing

### Unit Tests

- [ ] BlockedSlot-to-FullCalendar-event mapping works correctly for all 3 block types
- [ ] 24h slotMinTime/slotMaxTime renders correctly

### Integration Tests

- [ ] Creating a block → it appears on calendar immediately
- [ ] Deleting a block → it disappears from calendar immediately

### Manual Validation

- [ ] Create a single-day block: appears on calendar at correct date/time
- [ ] Create a recurring weekday block: appears on correct days
- [ ] Calendar scrollbar allows scrolling from midnight to midnight
- [ ] Block events look visually distinct from task/preview events

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

- [Planning Index](.opencode/plan/calendar-task-management/planning/index.md)
- [Impact Analysis](.opencode/plan/calendar-task-management/planning/impact-analysis.md)
