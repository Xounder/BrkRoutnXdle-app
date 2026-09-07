# Impact Analysis — fix-task-sidebar-generation

## Affected Areas

| Area | Impact | Notes |
|--------|--------|--------|
| Frontend | Medium | Sidebar task creation and generate-week flow mutate the `events` array |
| Backend | Medium | Save flow filtering of pending events before `computeDiff`; Google Calendar sync |
| Database | Low | No schema change; persisted data shape unchanged (only event lifecycle handling) |
| Infrastructure | None | No deployment, networking, or hosting changes |
| Testing | Medium | Existing tests plus new tests for pending-event filtering and sidebar event creation |

---

## Expected Changes

### Files

- Save-flow module that invokes `computeDiff` and applies diffs to Google Calendar — add pending-event filtering.
- `computeDiff` matching logic (or its caller) — ensure pending events with local UUID IDs are excluded from match-by-`taskId`.
- Sidebar task creation handler and generate-week flow — append a `CalendarEvent` to the `events` array on task creation.
- Relevant test files covering the save flow and sidebar/generate-week creation.

### Modules

- Calendar save / diff computation pipeline.
- Task creation through sidebar and generate-week flows.
- Google Calendar sync entry points.

### Dependencies

- No new external dependencies.
- Google Calendar integration module (existing) — behavior of which events get PATCHed is constrained by the new filtering.
- Canonical data model (`CalendarEvent`, `events` array) — unchanged at the schema level.

---

## Breaking Changes

- None for external consumers or persisted data.
- Internal behavior change: pending events are no longer sent to Google Calendar; this restores intended sync semantics and removes the 404 errors.
- Local tasks created from the sidebar now carry a corresponding `CalendarEvent` immediately, so calendar views show them without an extra save step.