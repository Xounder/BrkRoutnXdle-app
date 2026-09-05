# Task Template

## Task Information

### ID

TASK-04

### Title

Delete modal not removing inline-created events from CalendarContext

### Owner

senior-frontend

### Status

Pending

---

## Description

After clicking the × button on an inline-created event (persisted via CalendarContext), the DeleteEventDialog opens. When the user clicks "Delete" in the dialog, the `confirmDelete()` function in `useScheduleEditing.ts` only handles:

- Events with `id` starting with `"block-"` → calls `deleteBlock(blockId)` from BlockContext
- Everything else → filters out from `previewEvents` using `PreviewContext.setPreview`

Events created inline (persisted in `CalendarContext.events`) are **not** in `previewEvents` and are **not** blocks. They have IDs like `crypto.randomUUID()` or `task.id` — neither starts with `"block-"`. So `confirmDelete()` never removes them from `CalendarContext.events` or localStorage. The delete appears to do nothing.

### The Bug

In `useScheduleEditing.ts`, lines 230-241:

```typescript
const confirmDelete = useCallback(() => {
  if (!editing.deleteTarget) return;
  const { id } = editing.deleteTarget;
  if (id.startsWith("block-")) {
    const blockId = id.slice(6);
    deleteBlock(blockId);
  } else {
    // THIS ONLY removes from previewEvents — not from CalendarContext.events!
    const updatedEvents = previewEvents.filter((e) => e.id !== id);
    setPreview(updatedEvents, allocationFailures);
  }
  setEditing((prev) => ({ ...prev, deleteTarget: null }));
}, [editing.deleteTarget, previewEvents, allocationFailures, setPreview, deleteBlock]);
```

There is **no branch** for events that exist in `CalendarContext.events`. Inline-created tasks, external drops, and dragged events are stored in `CalendarContext.events`, not in `previewEvents`. The `previewEvents` array only contains generated schedule preview items (from `PreviewContext`).

### Required Fix

Extend `confirmDelete()` to also handle events from `CalendarContext.events`. The fix must:

1. Detect if the delete target's ID exists in `CalendarContext.events`
2. Remove the event from `CalendarContext.events` state
3. This automatically triggers localStorage persistence (after TASK-01)
4. Continue to work for preview events and block events (no regression)

---

## Acceptance Criteria

- [ ] Click × on an inline-created event → DeleteEventDialog → click Delete → event is removed from CalendarContext.events
- [ ] After deletion, refresh page → event is gone (requires TASK-01 persistence to be in place)
- [ ] Block events still deleted correctly via `deleteBlock`
- [ ] Generated preview events still deleted correctly via `setPreview`
- [ ] No regression: events that exist in BOTH CalendarContext.events AND previewEvents are handled correctly (preview deletion takes precedence, or safe merge)
- [ ] Deleting an event that does not exist in any context does not crash
- [ ] Edge case: event ID starts with "block-" but is NOT a block (e.g., generated event with coincidental ID prefix) — handled correctly

---

## Dependencies

### Required Tasks

- TASK-01

### Dependency Notes

TASK-04 depends on TASK-01 because:
1. TASK-01 establishes the `CalendarContext.events` persistence layer (load, save, merge)
2. TASK-04's delete needs to work with the final CalendarContext API (including auto-persist on setEvents)
3. After TASK-01, `setEvents` auto-persists to localStorage, so TASK-04 just needs to call `setEvents` with the filtered array

TASK-04 does NOT depend on TASK-02 or TASK-03.

**File overlap**: TASK-04 and TASK-03 both modify `useScheduleEditing.ts` (different functions — confirmDelete vs handleEventDrop/handleEventResize). Can run in parallel with careful merge, or sequentially (either order).

---

## Technical Context

### Relevant Components

- `useScheduleEditing.ts` (`apps/web/src/hooks/useScheduleEditing.ts`) — `confirmDelete` (lines 230-241), also imports `useCalendar` already (line 3)
- `CalendarContext.tsx` (`apps/web/src/contexts/CalendarContext.tsx`) — `events` state, `setEvents` dispatch; no `deleteEvent` method exists yet (deletion is done via `setEvents(prev => prev.filter(...))`)
- `DeleteEventDialog.tsx` (`apps/web/src/features/preview/DeleteEventDialog.tsx`) — calls `onConfirm` which is `editing.confirmDelete`
- `CalendarView.tsx` (`apps/web/src/components/CalendarView.tsx`) — `handleEventDidMount` creates × button, calls `onDeleteRequest` which is `editing.requestDelete`
- `DashboardPage.tsx` (`apps/web/src/pages/DashboardPage.tsx`) — wires `onDeleteRequest={editing.requestDelete}`, renders `DeleteEventDialog` with `onConfirm={editing.confirmDelete}`

### Relevant Modules

- `packages/shared/src/types/index.ts` (CalendarEvent type)

### Relevant APIs

- `CalendarContext.setEvents` — use to filter out the deleted event
- `PreviewContext.setPreview` — existing path for generated event deletion
- `BlockContext.deleteBlock` — existing path for block event deletion

### Relevant Types

- `CalendarEvent` from `@brkroutnxdle/shared`

---

## Implementation Guidance

### Expected Changes

1. **useScheduleEditing.ts** — Update `confirmDelete` to handle CalendarContext events:

   ```typescript
   const confirmDelete = useCallback(() => {
     if (!editing.deleteTarget) return;
     const { id } = editing.deleteTarget;
     
     if (id.startsWith("block-")) {
       // Block event: delete via BlockContext
       const blockId = id.slice(6);
       deleteBlock(blockId);
     } else if (events.some((e) => e.id === id)) {
       // Inline-created event (in CalendarContext.events): remove via setEvents
       setEvents((prev) => prev.filter((e) => e.id !== id));
     } else {
       // Preview/generated event: remove via PreviewContext
       const updatedEvents = previewEvents.filter((e) => e.id !== id);
       setPreview(updatedEvents, allocationFailures);
     }
     
     setEditing((prev) => ({ ...prev, deleteTarget: null }));
   }, [editing.deleteTarget, events, setEvents, previewEvents, allocationFailures, setPreview, deleteBlock]);
   ```

   **Note**: This requires destructuring `setEvents` from `useCalendar()` at the top of the hook (line 39 currently only destructures `events`).

2. **useScheduleEditing.ts** — Update the `useCalendar()` destructuring on line 39:

   ```typescript
   // Before:
   const { events } = useCalendar();
   // After:
   const { events, setEvents } = useCalendar();
   ```

3. **useScheduleEditing.ts** — Add `setEvents` to the dependency array of `confirmDelete` (already shown above)

### Implementation Notes

- The `events.some()` check ensures we only try to remove from CalendarContext if the event actually exists there
- Using `setEvents(prev => prev.filter(...))` ensures functional state update (no stale closure issues)
- After TASK-01, CalendarContext's `setEvents` will auto-persist to localStorage, so deletion is automatically persisted
- The event MAY exist in both CalendarContext.events AND previewEvents — the new code checks CalendarContext first (the `events.some` branch), so inline events deleted via the × button are handled before the previewEvents fallback. This is correct because an event stored in CalendarContext should be removed from there.
- The order of checks matters: blocks first (distinct ID prefix), then CalendarContext events, then previewEvents as fallback
- No changes needed to `DeleteEventDialog.tsx`, `CalendarView.tsx`, or `DashboardPage.tsx` — they already wire `onDeleteRequest` → `requestDelete` → dialog → `confirmDelete`

### Constraints

- Must not break existing block deletion (block- prefix check must remain first)
- Must not break existing preview event deletion (fallback else branch)
- `confirmDelete` must still update `setEditing` to clear `deleteTarget`
- Must work correctly when TASK-01 persistence is in place (auto-persist on setEvents)
- Must work correctly when TASK-01 is NOT yet in place (state removal still functions)

### Validation Rules

- Create inline event → click × → confirm delete → event disappears from calendar
- Create inline event → click × → confirm delete → refresh page → event is gone (requires TASK-01)
- Block event → click × → confirm delete → block disappears
- Generated (preview) event → click × → confirm delete → preview event disappears
- Delete event that doesn't exist → no crash

---

## Edge Cases

### 1. Event exists in BOTH CalendarContext.events AND previewEvents

If an event was created inline AND is also in the generated preview (e.g., user creates inline, then generates schedule including that same event), the `CalendarContext.event` check should be attempted first. The previewEvents deletion (else branch) would still work but would be a no-op for the CalendarContext removal. The implementation using `events.some()` then `setEvents(filter)` handles this safely.

**Risk**: If the event should actually be deleted from previewEvents instead, this could cause unexpected behavior. However, the × button on inline-created and preview events are visually separate use cases — a preview event would not typically be in CalendarContext.events.

### 2. Event ID starts with "block-" but is NOT a BlockContext block

Currently, only BlockContext events use `block-` prefix IDs. If a future feature creates events with IDs starting with `block-`, they would be incorrectly routed to `deleteBlock`. Mitigation: the current check is correct because all block events are explicitly given the `block-` prefix in `CalendarView.tsx` line 98. Low risk.

### 3. Double-click or rapid delete

`requestDelete` is idempotent (sets state), and `confirmDelete` clears `deleteTarget` after processing. Rapid double-click would just show the dialog once. Low risk.

### 4. Deleted event is the last event in CalendarContext

If `events` goes from `[singleEvent]` to `[]` after filter, CalendarContext should handle empty state correctly. `setEvents([])` is valid.

### 5. TASK-01 persistence not yet implemented

If TASK-04 runs before TASK-01, `CalendarContext.events` still exists as state. The state removal in TASK-04 will work correctly — the event just won't persist across refreshes until TASK-01 is complete.

---

## Testing

### Manual Validation

- [ ] Create inline task via 'create in this slot' modal → click × → confirm delete → event disappears
- [ ] Drag task from sidebar to calendar → click × → confirm delete → event disappears
- [ ] Generate preview → click × on a generated event → confirm delete → preview event disappears
- [ ] Create block → click × on block event → confirm delete → block disappears (regression check)
- [ ] Delete a non-existent event (simulate race condition) → no crash
- [ ] With TASK-01 complete: delete inline event → refresh → verify it's permanently gone

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Build passes
- [ ] Lint passes
- [ ] Manual validation completed

---

## References

- `apps/web/src/hooks/useScheduleEditing.ts` — **PRIMARY**: update confirmDelete (lines 230-241) and useCalendar destructuring (line 39)
- `apps/web/src/contexts/CalendarContext.tsx` — events state, setEvents dispatch
- `apps/web/src/contexts/PreviewContext.tsx` — setPreview used in existing confirmDelete
- `apps/web/src/contexts/BlockContext.tsx` — deleteBlock used in existing confirmDelete
- `apps/web/src/features/preview/DeleteEventDialog.tsx` — dialog UI (no changes needed)
- `apps/web/src/components/CalendarView.tsx` — × button wiring (no changes needed)
- `apps/web/src/pages/DashboardPage.tsx` — delete wiring (no changes needed)
