# Task Template

## Task Information

### ID

TASK-04

### Title

Calendar: Full Drag-and-Drop Support for Tasks + Blocks

### Owner

senior-frontend

### Status

Pending

---

## Description

Enable drag-and-drop repositioning for both task events and block events on the calendar. Handle `eventDrop` and `eventResize` callbacks to persist position changes to the respective contexts (TaskContext for task events, BlockContext for block events).

### Sub-tasks

1. **Task event drag-drop**: Wire `eventDrop` for generated task events. On drop, update the event's start/end time in the schedule data (either localStorage or in-memory schedule state).
2. **Block event drag-drop**: Wire `eventDrop` for block events. On drop, update the BlockedSlot's startDate/time in BlockContext (which persists to localStorage).
3. **Event resize**: Wire `eventResize` for both task and block events. On resize, update duration in the appropriate context.
4. **Exclude preview events**: Preview events (from `previewEvents`) should NOT be draggable — they represent the generated schedule preview and should be read-only until saved.
5. **Conflict prevention**: When dragging a task/block, visually indicate if the new slot overlaps with an existing event.

---

## Acceptance Criteria

- [ ] Task events can be dragged to a new time slot
- [ ] Block events can be dragged to a new time slot
- [ ] Dragging a task event updates its stored start/end
- [ ] Dragging a block event updates its stored startDate/startTime/endTime
- [ ] Event resize works for both tasks and blocks
- [ ] Preview events are NOT draggable
- [ ] Drag-drop changes persist after page reload (via localStorage)
- [ ] Calendar provides visual feedback during drag (valid/invalid drop zones)

---

## Dependencies

### Required Tasks

- TASK-02

### Dependency Notes

TASK-02 must be completed first since it enables editable mode and block rendering. TASK-04 is independent of TASK-03 (click handlers) — both can run in parallel after TASK-02.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/CalendarView.tsx`
- `apps/web/src/pages/DashboardPage.tsx`
- `apps/web/src/contexts/BlockContext.tsx`
- `apps/web/src/hooks/useScheduleEditing.ts`

### Relevant Types

- `CalendarEvent`
- `BlockedSlot`
- `CalendarViewProps` (`onEventDrop`, `onEventResize`)

---

## Implementation Guidance

### Expected Changes

1. **CalendarView.tsx**: Ensure `editable={true}` is already set (from TASK-02). Add `eventDragStart` and `eventDragStop` callbacks if needed for UX feedback.
2. **DashboardPage.tsx**: Update `handleEventDrop` to:
   - Check `extendedProps` to determine if it's a block or task event
   - For blocks: calculate new startDate/startTime/endTime from the drop position and call `updateBlock` from BlockContext
   - For tasks: update the event's position in the schedule state
3. **BlockContext.tsx**: Ensure `updateBlock` can handle partial updates that change `startDate`, `startTime`, `endTime` correctly. Currently it does — verify.
4. **Preview event exclusion**: In `fcEvents` mapping, ensure preview events have `editable: false` or are excluded from drag-drop by checking the `isGenerated` + preview source.
5. **Drag feedback**: Use FullCalendar's `eventDrop` validation — return `false` from the callback if the drop is invalid (e.g., overlapping with another non-draggable event).
6. **useScheduleEditing.ts**: Review existing editing hooks — they may already handle event drop for tasks. Ensure blocks are also handled.

### Constraints

- Block events dragged to a new time must correctly update the underlying `BlockedSlot` fields:
  - `startDate` only (if single-day)
  - `startTime` and `endTime` (if recurring-weekday)
  - For recurring-period, the time shift should apply to all occurrences
- Task events dragged in preview mode represent rescheduling — the change should apply to the schedule data structure, not to the Task itself
- FullCalendar's `eventDrop` callback provides `oldEvent` and `newEvent` with `start`/`end` — use these to compute delta
- The `eventResize` callback should update duration; for blocks, resizing changes endTime

### Validation Rules

- Drag a task from 09:00 to 14:00 → task appears at 14:00 after drop
- Drag a block from Monday to Tuesday → block appears on Tuesday
- Resize a block from 1h to 2h → block end time extends by 1h
- Preview events cannot be dragged (no cursor change, no drop allowed)

---

## Testing

### Unit Tests

- [ ] Block drop handler correctly computes new startDate/startTime/endTime
- [ ] Task drop handler correctly updates event position in schedule state
- [ ] Preview events are correctly excluded from dragging

### Integration Tests

- [ ] Drag task → position persists after page reload
- [ ] Drag block → position persists after page reload
- [ ] Resize block → duration updates in BlockContext

### Manual Validation

- [ ] Grab a task event and drag it to a new time → event moves smoothly
- [ ] Grab a block event and drag it to a different day → block updates correctly
- [ ] Resize a block by dragging its bottom edge → duration changes
- [ ] Attempt to drag a preview (ghost) event → not possible
- [ ] Reload page → dragged events are in their new positions

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
