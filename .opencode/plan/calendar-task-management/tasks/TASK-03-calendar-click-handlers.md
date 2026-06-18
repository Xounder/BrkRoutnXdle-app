# Task Template

## Task Information

### ID

TASK-03

### Title

Calendar: Click Handlers (Empty Slot → Create Modal, Event → Edit/Delete)

### Owner

senior-frontend

### Status

Pending

---

## Description

Add FullCalendar click interaction handlers: clicking an empty time slot opens a choice modal asking whether to create a Block or a Task; clicking an existing event opens the appropriate edit/delete modal (TaskModal for tasks, BlockModal for blocks).

### Sub-tasks

1. **Empty slot click (`select` handler)**: Wire FullCalendar's `select` callback. When a user selects/click a time range, show a new "CreateActionModal" component that prompts: "Create Block" or "Create Task".
2. **CreateActionModal**: A small modal with two buttons — "Block" (opens BlockModal with start/end pre-filled) and "Task" (opens TaskModal with duration pre-filled based on selection length).
3. **Event click (`eventClick` handler)**: Distinguish between task events and block events. For task events → open TaskModal in edit mode. For block events → open BlockModal in edit mode.
4. **Block edit support**: Ensure BlockModal can be opened from calendar click (already supports edit via `block` prop).
5. **Task edit support**: Ensure TaskModal can be opened from calendar click (already supports edit via `task` prop).

---

## Acceptance Criteria

- [ ] Clicking/dragging on an empty calendar slot opens the CreateActionModal
- [ ] CreateActionModal lets user pick "Block" or "Task"
- [ ] Selecting "Block" opens BlockModal with pre-filled start/end date/time
- [ ] Selecting "Task" opens TaskModal with pre-filled duration
- [ ] Clicking an existing task event opens TaskModal in edit mode
- [ ] Clicking an existing block event opens BlockModal in edit mode
- [ ] Edit mode correctly pre-fills all fields from existing data
- [ ] Delete from event click works (via existing delete button or new modal integration)

---

## Dependencies

### Required Tasks

- TASK-02

### Dependency Notes

TASK-02 must be completed first because blocks need to render on the calendar before event clicks can distinguish block vs task events.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/CalendarView.tsx`
- `apps/web/src/pages/DashboardPage.tsx`
- `apps/web/src/features/tasks/TaskModal.tsx`
- `apps/web/src/features/blocks/BlockModal.tsx`
- New: `apps/web/src/features/shared/CreateActionModal.tsx`

### Relevant Contexts

- `apps/web/src/contexts/BlockContext.tsx`
- `apps/web/src/contexts/TaskContext.tsx`
- `apps/web/hooks/useBlocks.ts`, `useTasks.ts`

### Relevant Types

- `CalendarEvent` (used by eventClick)
- `BlockedSlot`, `Task`
- `CalendarViewProps` (needs `onSelect` or new callback props)

---

## Implementation Guidance

### Expected Changes

1. **CreateActionModal** (new component): A simple overlay with two large buttons. Receives `start: string` and `end: string` (ISO). Has `onCreateBlock(start, end)` and `onCreateTask(start, end)` callbacks.
2. **CalendarView.tsx**: Add `onSelect` prop. Wire to FullCalendar's `select` callback. Set `selectable={true}` and `selectMinTime`/`selectMaxTime` to match the 24h view. Ensure `selectOverlap` allows selection over empty slots only.
3. **DashboardPage.tsx**: Add state for `createSlot: { start: string; end: string } | null`. Handle `onSelect` → set `createSlot`. Render `CreateActionModal` when `createSlot` is set.
4. **DashboardPage.tsx**: Handle `onEventClick` — check if the clicked event is a block or task. Use `extendedProps` to distinguish. Open the appropriate modal.
5. **TaskModal.tsx / BlockModal.tsx**: These already support creating and editing. No major changes needed — just ensure they accept pre-filled values from the outside.
6. **Styling**: Ensure CreateActionModal matches the existing modal design language (rounded corners, gradient buttons, overlay).

### Constraints

- The `select` handler should only fire on empty slots (not overlapping existing events)
- Block events need an `isBlock: true` flag in `extendedProps` so `eventClick` can distinguish them
- Clicking a generated task event should still toggle completion (existing behavior) — consider whether to replace or augment this. Decision: clicking a generated task event opens the edit modal; the completion toggle can be moved to a checkbox inside the edit modal or kept as a secondary action.
- The existing `onEventClick` in DashboardPage toggles completion. This should be replaced by the modal behavior.

### Validation Rules

- Select a 2-hour empty slot → CreateActionModal shows with correct time range
- Click "Block" → BlockModal opens with start/end pre-filled
- Click "Task" → TaskModal opens with duration = 120 min pre-filled
- Click a block event → BlockModal opens in edit mode with all fields filled
- Click a task event → TaskModal opens in edit mode with all fields filled

---

## Testing

### Unit Tests

- [ ] CreateActionModal renders correct time range
- [ ] Block vs task distinction logic in eventClick handler

### Integration Tests

- [ ] Full flow: select empty slot → create block → block appears on calendar
- [ ] Full flow: select empty slot → create task → task appears in task list

### Manual Validation

- [ ] Click 09:00-10:00 empty slot → modal appears with "Create Block" / "Create Task"
- [ ] Click "Create Block" → BlockModal shows 09:00 as start, 10:00 as end
- [ ] Click an existing block → BlockModal opens with data filled
- [ ] Click an existing task → TaskModal opens with data filled
- [ ] Delete an existing event via the × button on the event element

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
