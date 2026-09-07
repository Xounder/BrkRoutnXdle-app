# Task Index — Fix Task Allocation Bug

## Overview

Two-domain logic fixes in `packages/domain` to resolve the "Allocation Warning" bug where
all tasks report `0/1 allocated` despite free time in the agenda.

| Task | Title | Owner | File(s) |
|------|-------|-------|---------|
| TASK-01 | Fix whole-week freeze semantics in markSlotsOccupied | senior-backend | `packages/domain/src/public/generateSchedule.ts` |
| TASK-02 | Harden window-boundary check in taskDistributor | senior-backend | `packages/domain/src/internal/taskDistributor.ts` |

## Execution Order

1. **TASK-01** — primary fix (root cause): freeze flag applied to all slots.
2. **TASK-02** — secondary robustness fix: prevent allocations spanning occupied gaps.

Both can run in **parallel** (different source files).

## Dependency Graph

```text
TASK-01 (no deps)
TASK-02 (no deps)
```

There are **no dependencies** between the two tasks. Both are independently executable.

## Ownership Mapping

Both tasks are owned by **senior-backend** because:
- The changes are pure domain-logic in `packages/domain` (a backend/domain-layer package).
- No frontend (UI) or API changes are required.
- The public `generateSchedule` signature is unchanged.

## File Overlaps

| File | Touched by | Merge Strategy |
|------|-----------|----------------|
| `packages/domain/package.json` (possible) | TASK-01, TASK-02 (if both add test infra) | **Parallel with careful merge** — edit different keys/sections. TASK-01 may add test files only; TASK-02 may add the test runner script. Merge carefully; avoid conflicting edits to the same key. |
| `packages/domain/src/__tests__/` (possible) | TASK-01, TASK-02 (new tests) | **Sequential recommended** — if both create the same test directory/runner, sequence them. If separate test files are used (`generateSchedule.test.ts` vs `taskDistributor.test.ts`), parallel is safe. |

**No source-file overlaps.** TASK-01 modifies `generateSchedule.ts`; TASK-02 modifies
`taskDistributor.ts` — disjoint files.

## Parallelization Plan

- **Batch 1: TASK-01 + TASK-02** — independent, disjoint source files. Run simultaneously to
  maximize delivery speed. Watch the shared `package.json` test-infra concern.
- **No Batch 2 required** — no follow-on work. After both complete, the orchestrator runs
  build + validation on `packages/domain`.

### Justification

Both tasks are:
- Domain-logic only (no frontend/UI dependency)
- Discrete source files with no shared-modification risk (except potential test-infra overlap)
- Small, surgical changes with clear acceptance criteria

## Concerns

### Pre-existing Build Failure

`packages/domain` currently fails `tsc` build validation with:
```
src/internal/slotBuilder.ts(55,45): error TS2345: Property 'use12h' is missing in type
'{ workStartHour: number; ... }' but required in type 'Settings'.
```
This is **unrelated** to the task-allocation bug. Both tasks must run build after their
changes and document that this pre-existing error remains (or is fixed if trivially safe).
Escalate to the orchestrator if this blocks validation.

### No Test Infrastructure in packages/domain

The domain package has no test runner, test config, or test files. Both tasks require test
coverage per the acceptance criteria. The orchestrator should decide whether a single
"test-infra setup" task is needed first, or whether each task sets up its own tests.

### Behavioral Change

After TASK-01 ships, schedules will allocate tasks in slots that were previously frozen.
This is the intended fix but means generated output differs from the buggy version. The
preview-and-confirm flow in the frontend already requires user acceptance, mitigating risk.

### Timezone (Deferred, NOT in scope)

Timezone handling (UTC vs local work hours) is explicitly deferred per planning. Do not
address it in these tasks.

## References

- `.opencode/plan/fix-task-allocation-bug/planning/index.md`
- `.opencode/plan/fix-task-allocation-bug/planning/feasibility.md`
- `.opencode/plan/fix-task-allocation-bug/planning/impact-analysis.md`
- `.opencode/plan/fix-task-allocation-bug/planning/risks.md`
- Task files: `TASK-01-fix-freeze-semantics.md`, `TASK-02-harden-window-boundary.md`
