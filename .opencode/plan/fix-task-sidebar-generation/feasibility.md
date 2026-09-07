# Feasibility Analysis — fix-task-sidebar-generation

## Approach A (Recommended)

### Description

Fix the save flow to filter pending events before matching in `computeDiff`, and ensure sidebar task creation adds a `CalendarEvent` to the `events` array.

- In the save flow, exclude pending events (local UUID IDs, not yet synced) from the list of events that `computeDiff` matches by `taskId`.
- Only events that already have a remote Google Calendar reference (or are clearly eligible for remote sync) are sent to Google Calendar.
- When a task is created from the sidebar / generate-week flow, append a `CalendarEvent` to the `events` array so the task is represented on the calendar.

### Advantages

- Directly fixes both root causes with minimal surface area.
- Keeps the canonical data model intact — no schema changes, no data migration.
- Low regression risk; restricted to the save flow and event creation.
- Removes the pending-events-with-local-UUID match that produces Google Calendar 404s without disabling sync.

### Disadvantages

- Requires care to keep pending events still visible/savable locally (filtering must not accidentally drop them from the persisted events list).
- Touches two related flows (save + sidebar creation), so changes must be validated together.

### Estimated Effort

Small

---

## Alternative Approaches

### Approach B

#### Description

Defer sync of newly created tasks until they are explicitly confirmed/saved in a second step, so no pending events are ever sent to Google Calendar before a stable ID exists.

#### Advantages

- Clear separation between local draft state and remote sync state.

#### Disadvantages

- Adds a confirmation step / extra state to the UX flow.
- Larger interaction change than the problem requires.

#### Estimated Effort

Medium

---

### Approach C

#### Description

Generate stable Google Calendar events upfront for every task creation (pre-sync) instead of using local UUID placeholders.

#### Advantages

- Removes the mismatch between local and remote identities at the source.

#### Disadvantages

- Requires changes to event identity and lifecycle handling across the domain.
- Higher complexity and regression surface for the same outcome as Approach A.

#### Estimated Effort

Large

---

## Conclusion

Approach A is the smallest, lowest-risk change that resolves both root causes. Approaches B and C remain valid fallbacks if broader refactoring is later desired, but are not required for this fix.