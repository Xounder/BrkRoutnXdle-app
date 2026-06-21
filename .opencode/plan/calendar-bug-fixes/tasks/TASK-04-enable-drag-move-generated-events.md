# Task Template

## Task Information

### ID

TASK-04

### Title

Enable drag-to-move for Generate Week events

### Owner

senior-frontend

### Status

Pending

---

## Description

Events created via the "Generate Week" functionality are not draggable — users cannot drag-and-drop them to new time slots. However, events created via "Create in this slot" modal are movable (since they're in the main `events` array and not in the preview state).

The cause is in `CalendarView.tsx`: preview events (displayed as `.brk-preview` class) are explicitly given `editable: false` at line 165:
```typescript
const previewMapped = previewEvents.map((e) => ({
  id: e.id,
  title: e.title,
  start: e.start,
  end: e.end,
  classNames: ["brk-preview"],
  display: "auto" as const,
  editable: false,  // <-- This prevents drag-to-move
  extendedProps: { isPreview: true },
}));
```

The FullCalendar component has `editable={true}` globally (line 276), but individual events override this with `editable: false`, making preview events non-draggable.

The fix is to set `editable: true` (or remove the `editable` property entirely) for preview events so they inherit the global `editable={true}` setting.

---

## Acceptance Criteria

- [ ] Events created via "Generate Week" (preview events) can be dragged to a different time slot
- [ ] Events created via "Create in this slot" modal remain draggable (no regression)
- [ ] Drag validation still applies — dropped events must pass `canDropAt` validation
- [ ] Preview events still look visually distinct (`.brk-preview` class styling preserved)
- [ ] After dragging a preview event, the change is reflected in the preview state
- [ ] Save schedule includes the dragged event's new position

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

Independent task. Can run in parallel with all others.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/CalendarView.tsx` — FullCalendar component, preview event mapping (lines 158-167)

### Relevant Modules

- `@fullcalendar/interaction` — Drag-and-drop plugin
- FullCalendar event `editable` property

### Relevant APIs

- FullCalendar `eventDrop` callback — handled by `onEventDrop` → `editing.handleEventDrop` in `useScheduleEditing`
- FullCalendar `editable` property — per-event override

### Relevant Types

- FullCalendar event object (event source input format)

---

## Implementation Guidance

### Expected Changes

In `apps/web/src/components/CalendarView.tsx`, change the preview events mapping:

**Option A (recommended):** Remove `editable: false` completely so preview events inherit the global `editable={true}`:
```typescript
const previewMapped = previewEvents.map((e) => ({
  id: e.id,
  title: e.title,
  start: e.start,
  end: e.end,
  classNames: ["brk-preview"],
  display: "auto" as const,
  extendedProps: { isPreview: true },
}));
```

**Option B:** Set `editable: true` explicitly.

After this change, the `handleEventDrop` callback in `useScheduleEditing.ts` should already handle preview event drops correctly (lines 145-159) since it checks `extProps.isPreview` and updates the preview state.

### Constraints

- Preview events must remain visually distinct (`.brk-preview` with dashed border)
- Must not break resize functionality for preview events (the `handleEventResize` handler also handles preview events at lines 202-216)
- Must not make non-generated events accidentally editable

### Validation Rules

- Dragging a preview event triggers `eventDrop` → `handleEventDrop` → preview state update
- `canDropAt` validation must still be applied (it is already called in `handleEventDrop`)
- Non-preview, non-generated events (external tasks from Google) must still respect their own editable state

---

## Testing

### Unit Tests

- [ ] N/A

### Integration Tests

- [ ] N/A

### Manual Validation

- [ ] Click "Generate Week" to create preview events
- [ ] Drag a preview event to a different time slot — verify it moves
- [ ] Verify the preview event still shows the dashed border style
- [ ] Drag an event created via "Create in this slot" — verify it still works
- [ ] Drag to an invalid position (occupied slot) — verify it snaps back
- [ ] Save the schedule — verify the dragged position is persisted
- [ ] Verify resize still works for preview events (drag the bottom edge)

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

- `apps/web/src/components/CalendarView.tsx` (lines 158-167: preview event mapping with `editable: false`)
- `apps/web/src/hooks/useScheduleEditing.ts` (lines 145-159: `handleEventDrop` handler for preview events)
- `apps/web/src/styles/CalendarStyles.css` (lines 142-152: `.brk-preview` styling)
