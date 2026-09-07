# Risk Assessment — Task Allocation Bug Fix

| Risk | Likelihood | Impact | Mitigation |
|--------|--------|--------|--------|
| Freeze fix exposes other latent allocation defects | Medium | Medium | Add regression tests on the full schedule pipeline; run validation after change. |
| Window-boundary fix over-restricts allocation | Low | Medium | Keep behavior conservative: only reject slots that genuinely cross an occupied gap. |
| Fixed schedules differ from previous (buggy) outputs | High | Low | Document the behavioral change; preview flow already asks the user to accept. |
| Timezone mismatch (UTC vs local work hours) still produces unexpected failures | Medium | Medium | Treat as separate follow-up; validate with targeted test cases. |
| Regression on previously-working task shapes | Low | Medium | Cover common task configs (frequency/gap/duration) in tests. |

---

## Technical Risks

- **Freeze logic change:** Moving `frozen = true` inside the overlap check alters which
  slots are available. Without tests, this could silently change many schedules. The fix
  is small, but the blast radius is the whole weekly schedule.
- **Consecutive-slot re-indexing:** `taskDistributor` mutates `allSlots` and re-indexes
  `validSlots`. Touching this logic risks introducing off-by-one errors that either
  over- or under-allocate.
- **Timezone:** The algorithm uses `getUTCHours()`/`getUTCDay()` against user local work
  hours/days. Non-UTC users may still see availability miscalculations. This is a
  separate concern from the reported bug and should be tracked independently.

## Delivery Risks

- The fix logic is symmetric but the root cause is confirmed, so the primary change is
  well-scoped. Low delivery risk.
- The secondary window-boundary fix adds scope; if it proves risky during
  implementation, it can be deferred to a follow-up while the freeze fix ships first.

## Operational Risks

- After the fix, users may regenerate schedules that now allocate tasks in slots that
  were previously frozen (past/completed). The existing preview-and-confirm flow already
  requires explicit user acceptance, mitigating accidental persistence.
- No data migration is required; no operational downtime.

---

## Risk of NOT Fixing

- The Allocation Warning persists for any user with a completed/past event, rendering
  the schedule generation feature effectively broken (permanent `0/1` failures).
- Users lose trust in the headline feature and may abandon the product.
- The latent window-boundary bug can produce silently invalid schedules that pass the
  preview but conflict with real calendar events at save time.
