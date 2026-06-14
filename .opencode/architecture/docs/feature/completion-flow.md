# Completion Flow

## Status

Planned (V1)

---

## Purpose

Allow the user to mark generated events as completed.

Completed events are protected against recalculation — they stay in place.

---

## Source Documents

- `ux-flows.md` — Completion flow
- `google-calendar-integration.md` — Completion detection via extended properties
- `generation-algorithm.md` — Non-goal: changing completed events
- `domain-model.md` — INV-010: Completed events must not be recalculated

---

## Flow

```text
Select Generated Event
    ↓
Mark as Completed
    ↓
Confirm
    ↓
Update Extended Properties
    ↓
Persist to Google Calendar
```

---

## Detection

Completion is detected via extended properties:

```json
{
  "extendedProperties": {
    "private": {
      "completed": "true",
      "completedAt": "timestamp"
    }
  }
}
```

---

## Business Rules

| Rule | Description |
|---|---|
| INV-010 | Completed events must not be recalculated |
| Protected | Events with completed=true are frozen |
| Preserved | Completed events remain in Google Calendar |

---

## API

| Action | Endpoint |
|---|---|
| Mark complete | `PATCH /events/:id/complete` |
| Mark incomplete | `PATCH /events/:id/incomplete` |

---

## UI

- Calendar events show a completed state (green styling)
- Completed tasks cannot be dragged or resized
- Completion is reversible

---

## Success Criteria

1. User can mark a generated event as completed.
2. Completed events are visually distinct.
3. Completed events are not moved during recalculation.
4. Completion status persists in Google Calendar.
5. Completion can be undone.

---

## References

- `ux-flows.md` — Completion UX flow
- `google-calendar-integration.md` — Extended properties
- `domain-model.md` — INV-010
