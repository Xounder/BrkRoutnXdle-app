# Manual Calendar Editing

## Status

Planned (V1)

---

## Purpose

Allow the user to manually adjust events in the preview using direct calendar interaction.

The algorithm suggests. The user decides.

---

## Source Documents

- `ux-flows.md` — Drag and drop, resize, delete event flows
- `schedule-generation-workflow.md` — Preview editing
- `component-architecture.md` — FullCalendar drag/drop/resize
- `references/workflow-details.md` — Manual preview editing details

---

## Operations

### Drag And Drop

Move events by selecting, dragging, and dropping at a new time slot. Preview is updated immediately.

### Resize Event

Change event duration by selecting and resizing the event edge. Preview is updated immediately.

### Delete Event

Remove an occurrence from the preview. Confirmation is required.

---

## Rules

| Rule | Description |
|---|---|
| Preview only | All edits occur in Working State only |
| No persistence | Changes are not sent to Google Calendar |
| Undo via Discard | Discard reverts all manual edits |
| Save required | Only persisted after explicit save |

---

## Flow

```text
Select Event
    ↓
Drag / Resize / Delete
    ↓
Update Working State
    ↓
Display Updated Preview
    ↓
User Reviews
    ↓
Save or Discard
```

---

## Constraints

- Only generated events can be manually edited
- External events are read-only
- Completed events cannot be moved
- Past events (start < now) cannot be changed

---

## Success Criteria

1. User can drag events to new time slots.
2. User can resize events to change duration.
3. User can delete events from the preview.
4. All edits only affect the Working State.
5. Discard reverts all manual changes.

---

## References

- `ux-flows.md` — Manual editing interaction flows
- `schedule-generation-workflow.md` — Preview and working state
- `workflow-details.md` — Detailed editing specifications
