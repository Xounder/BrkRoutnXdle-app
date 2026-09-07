# Impact Analysis — Task Allocation Bug Fix

## Affected Areas

| Area | Impact | Notes |
|--------|--------|--------|
| Frontend | Low | No sourcing change required; `AllocationFailurePanel` and `useScheduleGeneration` consume the result unchanged. Only the data returned by the algorithm improves. |
| Backend | None | `packages/domain` is consumed by the backend if it proxies generation, but the domain API signature is unchanged. |
| Database | None | No data model or persistence change. |
| Infrastructure | None | No deployment/infra change. |
| Testing | Low/Medium | Domain unit tests must cover the freeze fix and window-boundary behavior; add regression tests. |

---

## Expected Changes

### Files

- `packages/domain/src/public/generateSchedule.ts` — correct `markSlotsOccupied` freeze
  semantics (primary fix).
- `packages/domain/src/internal/taskDistributor.ts` — enforce consecutive-slot slots
  staying within a single contiguous availability window (secondary robustness fix).
- `packages/domain/src/internal/allocationReporter.ts` — likely unchanged; report format
  remains valid.
- Domain tests (add regression coverage for full-week freeze and window boundary).

### Modules

- `packages/domain` allocation pipeline: slot build → availability calc → distribution.
- Public API (`generateSchedule`) is **unchanged** in signature and return shape, so all
  consumers (frontend hook, backend if used) keep working.

### Dependencies

- `@brkroutnxdle/domain` is depended on by `apps/web` (`useScheduleGeneration`) and the
  backend. No dependency contract changes.
- `@brkroutnxdle/shared` constants (`SLOT_DURATION_MINUTES`) remain the source of truth.

---

## Breaking Changes

- None. The public `generateSchedule` signature, `ScheduleResult`, `GeneratedEvent`,
  and `AllocationFailure` types are unchanged.
- **Behavioral change (intended):** schedules generated after the fix will allocate
  tasks in previously-frozen slots, so the generated output for the same input may
  differ from what the buggy version produced.

---

## Consumers

Primary consumer: `apps/web/src/hooks/useScheduleGeneration.ts` → calls
`generateSchedule` and passes `result.failures` to
`apps/web/src/features/preview/AllocationFailurePanel.tsx`. No consumer-side changes
needed; the fix simply produces fewer/zero failures.
