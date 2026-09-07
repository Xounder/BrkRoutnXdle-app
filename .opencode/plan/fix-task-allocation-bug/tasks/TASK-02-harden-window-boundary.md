# Task Template

## Task Information

### ID

TASK-02

### Title

Harden window-boundary check in taskDistributor

### Owner

senior-backend

### Status

Pending

---

## Description

Harden the consecutive-slot allocation logic in `packages/domain/src/internal/taskDistributor.ts`.

The current `distributeTasks` function builds a flattened `allSlots` array from the
`availableWindows` list. When a task requires `taskSlotsNeeded` consecutive slots, the code
checks only that `consecutiveEnd < allSlots.length` and that each `allSlots[i]` exists. It
does **not** verify that consecutive slots belong to the **same real-world availability
window**. As a result, an allocation can span an occupied gap (boundary between two adjacent
windows that happen to be contiguous in `allSlots`), producing a schedule that conflicts with
real events when validated.

The fix must enforce that all consecutive slots a task consumes come from a single contiguous
availability window. When a task cannot be fully placed within one window, the candidate slot
should be rejected (moved to a different window) rather than spanning the gap.

---

## Acceptance Criteria

- [ ] `distributeTasks` verifies that all `taskSlotsNeeded` consecutive slots fall within one real availability window
- [ ] A candidate starting at the last slot of window A that would extend into window B is rejected when there is an occupied gap between A and B
- [ ] If the same window has enough contiguous length, allocation succeeds inside that window
- [ ] Slots consumed by an allocation are removed from both `allSlots` and re-indexed in `validSlots` correctly (no off-by-one)
- [ ] Existing task shapes (with `duration`, `frequency`, `gapDays`, `allowSameDay`) continue to allocate correctly
- [ ] `generateSchedule` validation phase (Phase 10) no longer reports schedule conflicts caused by allocations spanning occupied gaps

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This is a secondary robustness fix and has no strict dependency on TASK-01. It can run in
parallel with TASK-01 (different source file).

---

## Technical Context

### Relevant Components

- `packages/domain/src/internal/taskDistributor.ts` — function `distributeTasks`
- `packages/domain/src/internal/types.ts` — `AvailabilityWindow` type
- `packages/domain/src/internal/availabilityCalculator.ts` — produces the windows consumed here

### Relevant Modules

- `packages/domain` distribution pipeline: availability windows → flattened slots → task distribution

### Relevant APIs

- Internal: `distributeTasks(tasks, availableWindows, settings, previousWeek?, targetWeekStart?)`
- Internal: `calculateAvailability(slots: WeekSlot[]): AvailabilityWindow[]`

### Relevant Types

- `AvailabilityWindow` (`start`, `end`)
- `Task` (`duration`, `frequency`, `restrictions`, `allowSameDay`, `gapDays`)
- `GeneratedEvent` (`id`, `taskId`, `start`, `end`, `completed`)

---

## Implementation Guidance

### Expected Changes

- Edit `packages/domain/src/internal/taskDistributor.ts`, function `distributeTasks`
- Track window boundaries: instead of (or in addition to) a flattened `allSlots[]`, record which window each slot belongs to (e.g., a `windowIndex` or `windowId` per slot, or store window metadata alongside the flattened list)
- Before allocating `taskSlotsNeeded` consecutive slots, verify all slots from `consecutiveStart` through `consecutiveEnd` share the **same window index**
- If they do not, treat the candidate as invalid (skip or remove from `validSlots`) — do NOT let it span into the next window when a gap exists
- Preserve the existing index re-indexing logic after `allSlots.splice(consecutiveStart, taskSlotsNeeded)` so validSlot indexes remain correct

### Constraints

- Do NOT modify `availabilityCalculator.ts` — the windows produced there are correct
- Do NOT change the `DistributionResult` return shape or `generateSchedule` public API
- Keep the behavior conservative: only reject allocations that genuinely cross an occupied gap
- Existing task shape attributes (`frequency`, `duration`, `gapDays`, `allowSameDay`) must continue to work with the new boundary-aware logic

### Validation Rules

- The re-indexing logic (`vs.index -= taskSlotsNeeded` for `vs.index > consecutiveEnd`) must still be correct after the boundary check is introduced
- Confirm that removing the correct slot range from `allSlots` does not corrupt the mapping between `validSlots[].index` and `allSlots[]`

---

## Edge Cases

- **Slot exactly at window end:** The last slot of a window whose end matches the next window's start — if they are truly adjacent with no occupied gap, the boundary check should allow spanning; if there IS a gap, it must reject.
- **Task duration longer than any window:** If no single window has `taskSlotsNeeded` consecutive slots, the task correctly fails to allocate (reported as a failure). Do not silently under-allocate.
- **Single-slot task (`taskSlotsNeeded === 1`):** Every available slot trivially belongs to one window; the boundary check is a no-op and must not reject valid single-slot allocations.
- **Re-indexing after splice:** When an allocation removes slots, ensure `validSlots[].index` values are remapped correctly AND that the window-boundary mapping stays consistent (since slots within the same window shift together).
- **Multiple identical windows:** Distinct windows with the same start/end times (unlikely but possible) must be treated as separate unless they are genuinely contiguous.
- **Empty availability windows:** If `availableWindows` is empty, `allSlots` is empty and no allocations occur. Every task reports a failure — that is correct behavior.
- **Frozen/occupied gap between windows:** If two windows appear adjacent in the flattened list but an occupied/invisible slot exists between them in the real calendar, the boundary check is what prevents the span. This is the core scenario the fix must handle.
- **Off-by-one on `taskSlotsNeeded`:** `taskSlotsNeeded = task.duration / SLOT_DURATION_MINUTES` could be fractional if `duration` is not a multiple of 30. Verify the math (this is a pre-existing concern, not introduced by this task).

### File Overlap Warning

- **Overlap file:** `packages/domain/package.json` — if TASK-01 also touches package.json (e.g., adding tests), coordinate on *parallel with careful merge*: both should edit different keys/sections (TASK-02 may add a test script or vitest config; TASK-01 may add test files only). Avoid conflicting edits to the same key.
- No overlap with TASK-01's source file (`generateSchedule.ts`). This task modifies `taskDistributor.ts` only.

---

## Testing

### Unit Tests

- [ ] Create test: two availability windows separated by an occupied gap → a task whose duration spans the boundary is NOT allocated across the gap
- [ ] Create test: a single contiguous window of sufficient length → a task of matching duration allocates successfully
- [ ] Create test: re-indexing remains correct after removal of used slots for a subsequent task allocation
- [ ] Create test: a task longer than any single window fails allocation (reported as failure) rather than spanning

Note: The `packages/domain` package has no test infrastructure yet. If neither TASK-01 nor TASK-02 establishes it, this is a gap that must be elevated to the orchestrator. If test infra is added, place TASK-02 tests in `packages/domain/src/__tests__/taskDistributor.test.ts` (or the package convention).

### Integration Tests

- [ ] Full pipeline test: build windows → distribute with a gap between windows → confirm no generated event spans the occupied gap

### Manual Validation

- [ ] Run `pnpm run build` (or `run-package-command` `build` for `packages/domain`) and confirm no TS compilation errors introduced by this change
- [ ] Confirm the pre-existing `slotBuilder.ts` TS error (missing `use12h` in `Settings`) is unrelated to this task and document it as a concern

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

- `.opencode/plan/fix-task-allocation-bug/planning/feasibility.md` — Approach A item 2
- `.opencode/plan/fix-task-allocation-bug/planning/risks.md` — technical risk: consecutive-slot re-indexing
- `packages/domain/src/internal/taskDistributor.ts` — source file to modify
- `packages/domain/src/internal/types.ts` — `AvailabilityWindow` definition
