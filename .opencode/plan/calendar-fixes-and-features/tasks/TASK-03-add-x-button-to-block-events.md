# Task Template

## Task Information

### ID

TASK-03

### Title

Add X close/delete button to block events created via Create in this slot modal

### Owner

senior-frontend

### Status

Pending

---

## Description

When users create events (tasks or blocks) via the "Create in this slot" modal, these events appear on the calendar. Currently, task events (with `isGenerated: true`) already display a "×" (close/delete) button that allows users to remove them. However, block events (created from blocked slots) do **not** have this "×" button, making it impossible to delete them directly from the calendar.

The fix must ensure that block events rendered on the calendar also get the "×" delete button, matching the behavior of generated task events.

---

## Acceptance Criteria

- [ ] Block events on the calendar display an "×" close/delete button
- [ ] Clicking the "×" button on a block event triggers the delete confirmation dialog
- [ ] Confirming deletion removes the block from the calendar
- [ ] The "×" button only appears for BrkRoutnXdle-created blocks (not external calendar blocks)
- [ ] The "×" button has the same visual style as the one on generated task events

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

Independent task — can run in parallel with all others.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/CalendarView.tsx` — `handleEventDidMount` function that adds the delete button

### Relevant Modules

- `apps/web/src/hooks/useScheduleEditing.ts` — Delete confirmation logic

### Relevant APIs

- N/A (UI-only change)

### Relevant Types

- `CalendarEvent` — `isGenerated` and `isBlock` extended props

---

## Implementation Guidance

### Expected Changes

In **`apps/web/src/components/CalendarView.tsx`**:

1. **Modify `handleEventDidMount`** (lines 226-258):
   - Currently, the "×" button is only added when `props.isGenerated` is true
   - Change the condition to also add the "×" button when `props.isBlock` is true:
   ```typescript
   const handleEventDidMount = (info: any) => {
     if (!onDeleteRequest) return;
     const props = info.event.extendedProps;
     // Add delete button to both generated events AND block events
     if (!props.isGenerated && !props.isBlock) return;
     // ... rest of the function remains the same
   };
   ```

2. **Verify `onDeleteRequest` handler** in `useScheduleEditing.ts`:
   - The `requestDelete` function currently uses `previewEvents.filter()` to handle deletion (line 232-233)
   - For block events, the deletion must call `deleteBlock` from context instead
   - The `confirmDelete` callback needs to distinguish between deleting a preview event vs deleting a block event

Alternatively, modify the `confirmDelete` in `useScheduleEditing.ts` to:
```typescript
const confirmDelete = useCallback(() => {
  if (!editing.deleteTarget) return;
  
  const targetId = editing.deleteTarget.id;
  
  // Check if it's a block event
  if (targetId.startsWith("block-")) {
    const blockId = targetId.replace("block-", "");
    // Call deleteBlock from context
    deleteBlock(blockId);
    setEditing((prev) => ({ ...prev, deleteTarget: null }));
    return;
  }
  
  // Handle preview event deletion (existing logic)
  const updatedEvents = previewEvents.filter(
    (e) => e.id !== targetId,
  );
  setPreview(updatedEvents, allocationFailures);
  setEditing((prev) => ({ ...prev, deleteTarget: null }));
}, [editing.deleteTarget, previewEvents, allocationFailures, setPreview, deleteBlock]);
```

### Constraints

- Must preserve existing behavior for generated task event deletion
- Block deletion must cascade properly to the block state (not just remove from calendar view)
- Must update the dashboard `onDeleteRequest` prop pass-through correctly

### Validation Rules

- [ ] Delete button only appears on BrkRoutnXdle-managed events (blocks and generated tasks)
- [ ] Deleting a block from the calendar also removes it from the Block Panel list
- [ ] Deleting a block does not affect task events

---

## Testing

### Unit Tests

- [ ] Test that `handleEventDidMount` adds "×" for block events
- [ ] Test that `confirmDelete` handles block deletion correctly

### Integration Tests

- [ ] N/A

### Manual Validation

- [ ] Create a block via "Create in this slot" → verify "×" button appears on the calendar
- [ ] Click "×" on the block → verify delete confirmation dialog appears
- [ ] Confirm deletion → verify block disappears from calendar AND from Block Panel
- [ ] Verify generated task events still have "×" button and deletion works
- [ ] Verify external events (Google Calendar) do not get "×" button

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

- `apps/web/src/components/CalendarView.tsx` (lines 226-258: `handleEventDidMount`)
- `apps/web/src/hooks/useScheduleEditing.ts` (lines 226-241: `requestDelete`, `confirmDelete`, `cancelDelete`)
- `apps/web/src/pages/DashboardPage.tsx` (lines 340-352: CalendarView props)
