# Blocked Slot Management

## Status

Planned (V1)

---

## Purpose

Allow the user to define periods of unavailability.

Blocked slots prevent the algorithm from scheduling events during specific times.

---

## Source Documents

- `domain-model.md` — BlockedSlot entity, properties
- `canonical-data-model.md` — BlockedSlot canonical model
- `ux-flows.md` — Block creation flow, types
- `component-architecture.md` — BlockPanel, BlockModal, BlockContext

---

## Block Types

| Type | Description |
|---|---|
| Single Day | Blocks a specific date and time range |
| Recurring Weekday | Blocks a time range on a specific weekday every week |
| Recurring Period | Blocks a date range that repeats periodically |

---

## Block Model

```ts
type BlockedSlot = {
  id: string;
  type: "single-day" | "recurring-weekday" | "recurring-period";
  start: string;
  end: string;
};
```

---

## UX Flow

### Create Block

- Manual: select type, fill values, save
- Visual: select a calendar range directly

### Edit Block

Select a block and modify its values.

### Delete Block

Select a block, confirm deletion.

---

## UI Components

- Sidebar BlockPanel — lists all blocks
- BlockModal — create/edit form
- Calendar visual selection

---

## Business Rules

| Rule | Description |
|---|---|
| INV-006 | Events cannot be generated during blocked times |
| Blocked overrides | Blocked events always win in scheduling |
| Rule 3 | Blocked slots override all scheduling logic |

---

## Data Storage

Blocked slots are stored in localStorage under `blockedSlots` key.

---

## Success Criteria

1. User can create all three block types.
2. Blocks prevent scheduling in blocked time ranges.
3. User can visually select calendar ranges for blocking.
4. Blocks persist across page refreshes.

---

## References

- `domain-model.md` — BlockedSlot entity and invariants
- `canonical-data-model.md` — Canonical BlockedSlot model
- `event-classification.md` — Blocked event type
