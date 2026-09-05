# Tasks — Calendar Persistence & Fixes

## Overview

Four frontend-only tasks to fix event persistence, block X button interaction, add 2-week display window with past event immutability, and fix delete modal not removing inline-created events from CalendarContext.

## Execution Order

```
TASK-01 (local event persistence) ── parallel with ── TASK-02 (X button fix)
    |
    v
TASK-03 (2-week window + past immutability) ── parallel with ── TASK-04 (delete modal fix)
```

TASK-01 is foundational. TASK-02 is independent (no deps). TASK-03 depends on TASK-01. TASK-04 depends on TASK-01 (CalendarContext API with persistence). TASK-03 and TASK-04 depend on TASK-01 but can run in parallel with each other (they modify different functions in useScheduleEditing.ts).

## Dependency Graph

| Task | Title | Depends On | Owner |
|------|-------|------------|-------|
| TASK-01 | Local event persistence | — | senior-frontend |
| TASK-02 | Fix X button on block events | — | senior-frontend |
| TASK-03 | 2-week window + past immutability | TASK-01 | senior-frontend |
| TASK-04 | Delete modal not removing inline events | TASK-01 | senior-frontend |

## Ownership

All tasks → senior-frontend (no backend work required)

## Parallelization

- **Batch 1**: TASK-01, TASK-02 (independent)
- **Batch 2**: TASK-03, TASK-04 (both depend on TASK-01; they modify different functions in useScheduleEditing.ts so they can run in parallel with merge strategy)

## File Overlaps

- `CalendarView.tsx` — touched by TASK-02 and TASK-03 → must sequence or use merge strategy
- `DashboardPage.tsx` — touched by TASK-01 and TASK-03 → sequence recommended: TASK-01 modifies, TASK-03 adds logic
- `useScheduleEditing.ts` — touched by TASK-03 (handleEventDrop/handleEventResize past guard) and TASK-04 (confirmDelete CalendarContext fix) → **different functions** → can run in parallel with merge strategy, or sequence (either order)

### Merge Strategy for useScheduleEditing.ts

If TASK-03 and TASK-04 run in parallel:
- TASK-03 modifies: `handleEventDrop` (lines 113-165), `handleEventResize` (lines 168-223) — add past event guards
- TASK-04 modifies: Line 39 (add `setEvents` to destructuring), `confirmDelete` (lines 230-241) — add CalendarContext deletion
- These are independent changes — no merge conflicts expected
- If sequential: TASK-03 → TASK-04 or TASK-04 → TASK-03 both work (no functional dependency)

Recommended dispatch order:
1. **Batch 1**: TASK-01 + TASK-02 in parallel
2. **Batch 2**: TASK-03 + TASK-04 in parallel (pass TASK-01 implementation context to both)
