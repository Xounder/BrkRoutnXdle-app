# Epic 02 — Task & Block Definition

## Epic Information

### ID

EPIC-02

### Title

Task & Block Definition

### Priority

High

### Status

Pending

---

## Objective

Allow the user to define what activities should be scheduled (tasks) and which time periods should never be used (blocked slots). This provides the raw material the generation algorithm needs to produce a schedule.

---

## User Value

### Problem

The user needs to tell the system what to schedule — recurring activities like exercise, studies, hobbies, or work focus time — and when they are unavailable due to fixed commitments. Without these definitions, the algorithm has nothing to generate.

### Expected Outcome

The user can create, edit, and delete task definitions with name, duration, frequency per week, priority level, and day/time restrictions. The user can also define blocked slots of three types (single day, recurring weekday, recurring period). All definitions persist in localStorage across sessions.

### Success Criteria

- User can create, edit, and delete tasks
- Task properties include name, duration (multiples of 30min), occurrences per week, priority, day restrictions, and optional date range
- User can create all three blocked slot types
- Blocked slots prevent the algorithm from scheduling during those times
- User can visually select calendar ranges for blocking
- All data persists across page refreshes (localStorage)
- Validation enforces domain invariants (duration multiple of 30, positive occurrences, non-empty name)

---

## Scope

### Included

- Sidebar task list panel with create/edit/delete
- Task creation/editing modal with form for all properties
- Priority level selection (low, medium, high, critical)
- Day-of-week and time-period restrictions per task
- Optional start/end date range for tasks
- Sidebar blocked slot panel with create/edit/delete
- Blocked slot creation modal with type selection (single-day, recurring-weekday, recurring-period)
- Calendar-based visual blocking (select date range directly on calendar)
- localStorage persistence for both tasks and blocks
- Form validation enforcing domain invariants

### Excluded

- Advanced task types (RecurringTask, FlexibleTask, AdaptivePriorityTask — V2+)
- Task templates or presets
- Importing tasks from external sources
- Blocked slot recurrence rules beyond the three defined types

---

## Deliverables

- Task management panel with CRUD operations in the sidebar
- Task modal form with all property fields and validation
- Blocked slot management panel with CRUD operations
- Blocked slot modal form with type selector
- Calendar range selection for visual blocking
- localStorage persistence layer

---

## Acceptance Criteria

- [ ] User can create a task with name, duration (30min increments), occurrences per week, and priority
- [ ] User can set day-of-week and time-period restrictions on a task
- [ ] User can set an optional date range (start/end) on a task
- [ ] User can edit any property of an existing task
- [ ] User can delete a task
- [ ] Tasks are listed in the sidebar and persist after page refresh
- [ ] User can create a single-day blocked slot
- [ ] User can create a recurring-weekday blocked slot
- [ ] User can create a recurring-period blocked slot
- [ ] User can select a date range directly on the calendar to create a block
- [ ] User can edit and delete blocked slots
- [ ] Validation rejects invalid inputs (non-30min durations, zero occurrences, empty names)
- [ ] Old tasks without priority default to "medium"

---

## Dependencies

### Required

- EPIC-01 (Google Authentication & Calendar Foundation)

### Blocks

- EPIC-04 (Schedule Generation & Preview)

---

## Risks

- localStorage size limits could be a concern with very large numbers of tasks or blocks (unlikely for typical usage)
- No cross-device sync means tasks are lost if the user clears browser data

---

## Notes

Task and block definitions are the primary user-generated input to the generation algorithm. Their quality and completeness directly affect the quality of generated schedules.

---

## References

- `architecture/domain-model.md` — Task and BlockedSlot entities, invariants (INV-001 through INV-006)
- `architecture/ux-flows.md` — Task management flow, blocked slot flow
- `architecture/docs/feature/task-management.md` — Feature spec
- `architecture/docs/feature/task-priority-and-weight.md` — Feature spec
- `architecture/docs/feature/blocked-slot-management.md` — Feature spec
