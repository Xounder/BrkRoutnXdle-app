# Planning — Fix Task Allocation Bug

## Overview

### Objective

Diagnose and plan the fix for the reported schedule-generation failure where tasks
report `0/1 allocated` (Allocation Warning) even though the user clearly has free
time in the agenda. The symptom observed: all 4 tasks (treinar, correr, estudar,
Ler) show `0/1 allocated`, meaning the availability pool used by the distributor is
empty or effectively unusable.

### Root Cause (confirmed by code analysis)

**Primary bug — whole-week freeze in `markSlotsOccupied`:**

In `packages/domain/src/public/generateSchedule.ts`, the `markSlotsOccupied` helper
applies the freeze condition to **every slot in the week** whenever an event is in
the past or completed:

```ts
if (event.end < now || event.isCompleted) {
  slot.frozen = true; // applied to EVERY slot, regardless of overlap
}
```

The freeze flag is set outside of any overlap check, so a single past or completed
event marks the **entire week** as frozen. `calculateAvailability` then excludes all
frozen slots, producing an empty list of availability windows. `distributeTasks`
receives zero slots and reports every task as `0/1 allocated`.

This exactly matches the user report: free space exists, but allocation fails for all
tasks simultaneously.

### Scope

- `packages/domain` — allocation algorithm (`generateSchedule.ts`, `taskDistributor.ts`)
- Correctness of the availability/slot pipeline
- No frontend or backend API changes required for the primary fix

### Recommendation

**Approach A (Recommended):** Fix the freeze logic in `markSlotsOccupied` so that only
the slots an event actually occupies are marked frozen, and only when that event is in
the past or completed. Additionally harden the consecutive-slot window-boundary check
in `taskDistributor.ts` to prevent allocations spanning occupied gaps.

---

## Pipeline Context

- Pipeline: `fix-task-allocation-bug`
- Current step: `planning-analyst`
- Independent flow (no prior Solution Designer design documents)
