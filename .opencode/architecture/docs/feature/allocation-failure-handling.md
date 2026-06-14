# Allocation Failure Handling

## Status

Planned (V1)

---

## Purpose

Handle scenarios where the algorithm cannot allocate all task occurrences due to insufficient availability.

The user receives a clear report and can decide how to proceed.

---

## Source Documents

- `generation-algorithm.md` — Phase 11: Allocation Failure, failure report
- `error-handling-strategy.md` — Algorithm errors, UI error states
- `design-system.md` — Allocation failure panel styling

---

## Failure Scenarios

| Scenario | Behavior |
|---|---|
| No available slots | Report allocation failures per task |
| Partial allocation | Generate preview with warning |
| No tasks defined | Show empty state: "Create your first task" |

---

## Failure Report

```text
Could Not Allocate:
  - Drawing (2 occurrences)
  - Gym (1 occurrence)
```

Each failure item includes: task name, number of missing occurrences.

---

## User Options

| Option | Description |
|---|---|
| Accept | Keep partial schedule as-is |
| Adjust | Modify tasks, blocks, or settings and retry |
| Recalculate | Generate a new distribution |

---

## UI Component

Coral-themed Allocation Failure Panel with:

```text
[warning icon] Drawing — 2 occurrences could not be allocated
```

Visual: coral background, coral glow shadow.

---

## Algorithm Behavior

```text
Tasks sorted by priority
    ↓
Highest priority allocated first
    ↓
When insufficient slots remain:
    ↓
Task added to failure list
    ↓
Continue with next task
```

---

## Success Criteria

1. Partial schedules can still be generated and previewed.
2. User receives clear report of what couldn't be allocated.
3. User can accept, adjust, or recalculate.
4. Failure report shows task name and missing count.

---

## References

- `generation-algorithm.md` — Allocation failure phase
- `error-handling-strategy.md` — UI error states
- `design-system.md` — Failure panel styling
