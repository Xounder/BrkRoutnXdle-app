# Epic 04 — Schedule Generation & Preview

## Epic Information

### ID

EPIC-04

### Title

Schedule Generation & Preview

### Priority

High

### Status

Pending

---

## Objective

Deliver the core value proposition: automatically generate a weekly schedule that distributes the user's tasks across available time slots, respecting all constraints and preferences, and display a preview for the user to review before any changes are persisted.

---

## User Value

### Problem

The user has defined tasks and blocked slots but still needs to manually figure out when to do each activity each week. The generation algorithm automates this — distributing tasks intelligently across the week, avoiding conflicts with existing events, respecting blocked times, and avoiding repetition of the previous week's pattern.

### Expected Outcome

With a single click, the user gets a complete weekly schedule proposal displayed as a preview overlay on the calendar. The algorithm respects all constraints (existing events, blocks, task restrictions, settings) and distributes tasks evenly. If some tasks cannot be allocated, the user sees which ones failed and can retry, adjust constraints, or accept the partial result.

### Success Criteria

- User can generate a weekly schedule with one click
- Algorithm respects existing Google Calendar events (no conflicts)
- Algorithm respects blocked slots
- Algorithm respects task day/time restrictions
- Algorithm respects available hours from settings
- Algorithm distributes tasks across the week without clustering
- Algorithm avoids repeating the previous week's exact pattern (shuffle mode)
- Past events and completed events are never modified
- Preview displays generated events visually distinct from existing events
- User can generate multiple versions and compare
- If allocation fails, user sees which tasks could not be scheduled and can retry

---

## Scope

### Included

- "Calculate Week" button in the header
- Schedule generation algorithm running on the frontend (pure domain logic)
- Algorithm phases: build week slots, mark occupied, freeze existing, apply blocks, build availability, distribute tasks, validate
- Priority-based allocation (critical first, low last)
- Previous week memory model to avoid exact repetition
- Randomized shuffle mode
- Preview state with visual diff (new events with teal styling)
- Preview user actions: Generate Again, Discard
- Allocation failure report showing which occurrences could not be placed
- Retry mechanism after allocation failure
- Option to accept partial allocation

### Excluded

- Advanced task types (RecurringTask, FlexibleTask, AdaptivePriorityTask — V2+)
- AI-assisted or smart scheduling recommendations (V2+)
- Historical analytics on schedule patterns (V2+)
- ConstraintGraph or complex dependency-based scheduling (V2+)

---

## Deliverables

- Schedule generation algorithm (pure domain logic, testable)
- "Calculate Week" action in the UI header
- Preview overlay on the calendar with visual diff styling
- "Generate Again" button for producing alternative distributions
- "Discard" button to cancel preview
- Allocation failure UI showing unallocated tasks
- Retry mechanism for failed allocations

---

## Acceptance Criteria

- [ ] User clicks "Calculate Week" and sees a schedule preview within 1 second
- [ ] No generated event conflicts with existing Google Calendar events
- [ ] No generated event falls within a blocked slot
- [ ] No generated event falls outside available hours
- [ ] Generated events respect task-specific day-of-week and time-period restrictions
- [ ] High-priority tasks are scheduled before low-priority tasks when slots are limited
- [ ] With shuffle enabled, two consecutive generations produce different distributions
- [ ] With shuffle disabled, generation is deterministic
- [ ] Past events (start < now) are never modified
- [ ] Completed events are never modified
- [ ] Allocation failures are displayed clearly with task names and suggested actions
- [ ] User can generate multiple versions and each replaces the previous preview
- [ ] User can discard preview and return to the persisted state
- [ ] No events are saved to Google Calendar during generation

---

## Dependencies

### Required

- EPIC-02 (Task & Block Definition)
- EPIC-03 (Calendar Navigation & Settings)

### Blocks

- EPIC-05 (Save & Manual Calendar Editing)

---

## Risks

- Algorithm may produce poor distributions for edge cases (e.g., too many tasks, too few slots)
- Performance must stay under 1 second for typical workloads (5-30 tasks, 20-100 events, ~300 slots)
- Previous week snapshot requires reading Google Calendar events to build memory

---

## Notes

This is the heart of the product. The algorithm is the main differentiator. Users will judge the product's value based on the quality of generated schedules. The preview-before-save principle (ADR-007) ensures the user stays in control.

---

## References

- `architecture/generation-algorithm.md` — Complete algorithm specification
- `architecture/docs/feature/schedule-generation-workflow.md` — Feature spec
- `architecture/docs/feature/schedule-preview.md` — Feature spec
- `architecture/docs/feature/allocation-failure-handling.md` — Feature spec
- `architecture/domain-model.md` — Domain invariants (INV-001 through INV-010)
- `architecture/architecture.md` — ADR-007 (preview before save), ADR-008 (future-only recalculation)
