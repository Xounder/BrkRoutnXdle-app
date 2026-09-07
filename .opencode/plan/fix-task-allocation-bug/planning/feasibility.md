# Feasibility Analysis

## Approach A (Recommended)

### Description

Fix the schedule-generation allocation algorithm in `packages/domain`. Two changes:

1. **Correct the freeze semantics** in `markSlotsOccupied`
   (`packages/domain/src/public/generateSchedule.ts`). The freeze flag must only be
   applied to the slots that a given in-the-past or completed event actually occupies,
   not to every slot in the week. Freeze should be set **inside** the overlap check:

   ```ts
   if (slotStart < eventEnd && slotEnd > eventStart) {
     slot.occupied = true;
     if (event.end < now || event.isCompleted) {
       slot.frozen = true;
     }
   }
   ```

   This preserves the intent of "protect events that cannot change" while keeping the
   rest of the week available. Slots occupied by a frozen event become both `occupied`
   and `frozen` — correctly excluded from allocation — while all other slots remain
   available.

2. **Enforce window-boundary integrity in `taskDistributor.ts`.** When a task needs
   `taskSlotsNeeded` consecutive slots, verify that all consecutive slots belong to the
   same contiguous availability window. This prevents false allocation across an
   occupied gap and keeps validation consistent.

### Advantages

- Directly addresses the confirmed root cause; minimal, surgical change.
- No API contract, data model, or UI changes required.
- Keeps the intended "freeze past/completed events" behavior.
- Secondary change makes allocation results consistent with the validator, reducing
  risk of invalid schedules surfacing later.
- Located entirely in the domain package, which is unit-tested independently.

### Disadvantages

- Fixing the freeze logic changes behavior by design (more slots become available),
  so existing schedules generated under the bug will differ after the fix.
- The window-boundary fix requires careful re-indexing of `validSlots` when removing
  used slots (the current code mutates both `allSlots` and slot indices).

### Estimated Effort

Small

---

## Alternative Approaches

### Approach B

#### Description

Only fix the freeze logic (item 1 above), leaving `taskDistributor.ts` untouched. This
is the minimal change that resolves the reported `0/1 allocated` symptom.

#### Advantages

- Smallest possible diff; lowest regression surface.
- Fast to implement and validate.

#### Disadvantages

- Leaves the window-boundary correctness bug in place, so `distributeTasks` may still
  allocate tasks across occupied gaps, producing schedules that fail validation.
- Risk of a follow-up bug report after the primary symptom is fixed.

#### Estimated Effort

Small

---

### Custom Approach

#### Description

A user-provided adjustment to either Approach A or Approach B. Any customization to the
recommended approach (e.g., a different freeze policy, additional edge-case handling for
timezone, or scoping the fix to a specific task config) can be folded in during planning.

#### Notes

Customization will be incorporated after the user reviews the recommended approach.
No source changes were made (analysis only) in this document.
