# Task Template

## Task Information

### ID

TASK-06

### Title

Implement sidebar drag-to-calendar for tasks and blocks

### Owner

senior-frontend

### Status

Pending

---

## Description

Tasks in the TaskPanel and blocks in the BlockPanel (displayed in the sidebar) should be draggable onto the calendar, similar to how existing events inside the calendar can be moved via drag-and-drop. This allows users to:

- Drag a task from the sidebar onto a specific time slot in the calendar to quickly create an event for that task
- Drag a block from the sidebar onto the calendar to place a blocked slot at a specific time

This feature should leverage FullCalendar's external drag-and-drop support (via `@fullcalendar/interaction` plugin, which is already included), making sidebar items behave as "lego blocks" that snap into calendar slots.

---

## Acceptance Criteria

- [ ] Tasks in the sidebar (TaskCard) are draggable
- [ ] Blocks in the sidebar (BlockCard) are draggable
- [ ] Dragging a task onto the calendar creates an event at the dropped position with the task's properties
- [ ] Dragging a block onto the calendar creates a blocked slot at the dropped position
- [ ] Visual feedback shows a "ghost" element while dragging
- [ ] Dropping respects existing constraints (no overlap with existing events/blocks)
- [ ] Dropping outside valid areas reverts gracefully (no crash, no event created)
- [ ] Drag-and-drop from sidebar works in Day, Week, and Month views

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This is a standalone feature with no code dependencies on other tasks. However, it touches `CalendarView.tsx` which is also modified by TASK-03. Coordinate changes if assigned separately.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/CalendarView.tsx` — Needs `droppable` prop and `@drop` handler
- `apps/web/src/features/tasks/TaskCard.tsx` — Make draggable
- `apps/web/src/features/blocks/BlockCard.tsx` — Make draggable
- `apps/web/src/components/Sidebar.tsx` — May need layout adjustments for drag
- `apps/web/src/features/tasks/TaskPanel.tsx` — Parent container
- `apps/web/src/features/blocks/BlockPanel.tsx` — Parent container
- `apps/web/src/pages/DashboardPage.tsx` — Wiring drag-drop handlers

### Relevant Modules

- `@fullcalendar/interaction` — Already imported; provides `droppable` for external drag
- `apps/web/src/hooks/useScheduleEditing.ts` — Validation logic (`canDropAt`)

### Relevant APIs

- N/A (UI interaction only)

### Relevant Types

- `Task` — from `@brkroutnxdle/shared`
- `BlockedSlot` — from `@brkroutnxdle/shared`

---

## Implementation Guidance

### Expected Changes

1. **`apps/web/src/components/CalendarView.tsx`**:
   - Add `droppable={true}` prop to the `FullCalendar` component
   - Add `drop={handleExternalDrop}` event handler for external drops
   - Implement `handleExternalDrop` to receive the drop info and create events/blocks

   ```tsx
   interface CalendarViewProps {
     // ... existing props
     onExternalDrop?: (info: { dateStr: string; allDay: boolean; dragData: any }) => void;
   }
   ```

2. **`apps/web/src/features/tasks/TaskCard.tsx`**:
   - Add HTML5 `draggable="true"` attribute
   - Add `onDragStart` handler that sets `dataTransfer` data with task info
   - Style changes to indicate draggability (grab cursor)

3. **`apps/web/src/features/blocks/BlockCard.tsx`**:
   - Same as TaskCard but for blocks

4. **`apps/web/src/pages/DashboardPage.tsx`**:
   - Add handler for external drops that creates events/blocks at the drop position
   - Wire up CalendarView's `onExternalDrop` prop

5. **`apps/web/src/hooks/useScheduleEditing.ts`**:
   - Optionally extend `canDropAt` to also handle external drops

### Implementation Approaches

**Approach A: HTML5 Drag and Drop API**
- Make TaskCard/BlockCard draggable with `draggable="true"`
- Set event data in `dataTransfer` on `dragStart`
- FullCalendar's `droppable` setting automatically listens for HTML5 drops
- Use `drop` callback to receive dropped data and create event/block

**Approach B: FullCalendar External Drag**
- FullCalendar supports external elements via `@fullcalendar/interaction`'s `draggable` utility
- Requires element IDs and explicit registration

**Recommended: Approach A** (simpler, more standard, FullCalendar supports it natively)

### Constraints

- Must validate drops against existing events and blocks (use existing `canDropAt`)
- Must provide visual feedback (cursor changes, ghost element)
- Must handle drops on all-day slots and time-specific slots differently
- Dropping a task that already exists should create a scheduled event, not duplicate the task

### Validation Rules

- [ ] Drop is rejected if the slot overlaps an existing event or block
- [ ] Drop is rejected if outside working hours
- [ ] After drop, the event/block appears in the calendar immediately
- [ ] Sidebar task/block count remains unchanged (it's a copy/schedule action, not a move)

---

## Testing

### Unit Tests

- [ ] Test that drag data is properly set on TaskCard dragStart
- [ ] Test that drag data is properly set on BlockCard dragStart
- [ ] Test that external drop handler creates correct event/block

### Integration Tests

- [ ] Test end-to-end: drag task → drop on calendar → verify event appears

### Manual Validation

- [ ] Drag a task to a specific time slot → verify event appears at that position
- [ ] Drag a block to a time slot → verify block appears as coral striped area
- [ ] Drag to an occupied slot → verify drop is rejected (visual feedback)
- [ ] Drag to outside working hours → verify drop is rejected
- [ ] Verify sidebar items still function (click to edit, delete button works)
- [ ] Drag the same task multiple times → verify multiple events can be created

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

- `apps/web/src/components/CalendarView.tsx` (lines 260-295: FullCalendar component with props)
- `apps/web/src/features/tasks/TaskCard.tsx` (full file)
- `apps/web/src/features/blocks/BlockCard.tsx` (full file)
- `apps/web/src/hooks/useScheduleEditing.ts` (`canDropAt`, `handleEventDrop`)
- FullCalendar documentation: [External Draggable Elements](https://fullcalendar.io/docs/draggable)
- `.opencode/architecture/docs/frontend/component-architecture.md`
