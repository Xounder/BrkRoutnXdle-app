# TASK-02 — Ensure sidebar / generate-week task creation adds a `CalendarEvent` to the `events` array

## Task Information

### ID

TASK-02

### Title

Sidebar task creation adds a `CalendarEvent` to the `events` array so sidebar- and generate-week-created tasks appear on the calendar

### Owner

senior-frontend

### Status

Pending

---

## Description

Fix the sidebar task-creation flow so that creating a task from the Tasks panel (the `TaskPanel` → `TaskModal` → `TaskContext.createTask` path) appends a corresponding `CalendarEvent` to the `events` array. Currently only the inline "Create in this slot" path (`handleCreateTaskInline` in `DashboardPage`) adds a `CalendarEvent`; the sidebar path only calls `createTask` and never touches the calendar `events`, so tasks created from the sidebar never appear on the calendar (and are invisible to generate-week scheduling/placement).

The goal is a single, shared, idempotent event-creation path used by both the sidebar flow and the existing inline "Create in this slot" flow, so a task creation yields exactly one `CalendarEvent` (no duplicates) and the event appears immediately on the calendar.

## Acceptance Criteria

- [ ] Creating a task from the sidebar Tasks panel appends a `CalendarEvent` to the `events` array (persisted via `CalendarContext`), so the task appears on the calendar without an extra step.
- [ ] The generated `CalendarEvent` carries the task id (`id = task.id`, `taskId = task.id`), `isGenerated: true`, `source: "brkroutnxdle"`, and a sensible default `start`/`end` (default duration from settings when no slot is chosen, e.g. today at the work-start hour for `defaultTaskDuration` minutes).
- [ ] Inline "Create in this slot" and sidebar creation share a single event-creation helper; creating a task cannot produce duplicate `CalendarEvent` entries.
- [ ] Tasks created via the sidebar are subsequently visible to generate-week (they occupy/are scheduled based on the same `events` state) and to the save flow.
- [ ] A new E2E test proves: creating a task from the sidebar results in a calendar event being shown, and saving does not duplicate that event.
- [ ] Existing tests continue to pass and are not modified.

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

Independent of TASK-01 (save-flow pending-event filtering). Both run in parallel. Files touched here are frontend task-creation files; TASK-01 touches the save/diff pipeline. Keep E2E specs in separate files to avoid merge conflicts. If this task extracts a shared event-creation helper used by `DashboardPage` (`handleCreateTaskInline`), coordinate with TASK-01 only if TASK-01 also references that helper — by default TASK-01 does not, so no coordination is required.

---

## Technical Context

### Relevant Components

- Sidebar task list: `apps/web/src/features/tasks/TaskPanel.tsx`
- Task create/edit modal: `apps/web/src/features/tasks/TaskModal.tsx`
- Task context (create): `apps/web/src/contexts/TaskContext.tsx`
- Inline creation (reference for shared helper): `apps/web/src/pages/DashboardPage.tsx` (`handleCreateTaskInline`)
- Calendar events context: `apps/web/src/contexts/CalendarContext.tsx`

### Relevant Modules

- `createTask` in `TaskContext.tsx`
- `TaskPanel` `+ New` button flow
- `TaskModal` submit flow
- `handleCreateTaskInline` in `DashboardPage.tsx`
- `useCalendar().setEvents` / `setEvents` in `CalendarContext.tsx`

### Relevant APIs

- No backend API — this is purely local state (events persisted to localStorage via `CalendarContext`).

### Relevant Types

- `CalendarEvent` (`@brkroutnxdle/shared`) — `id`, `title`, `start`, `end`, `isAllDay`, `isGenerated`, `taskId?`, `isCompleted`, `source`
- `Task` (`@brkroutnxdle/shared`)

---

## Implementation Guidance

### Expected Changes

- Introduce (or reuse) a shared helper that builds a `CalendarEvent` from a created `Task` and appends it to the `events` array (via `setEvents`), used by both the sidebar creation flow and the inline "Create in this slot" flow, so there is a single source of truth for event creation.
- Wire the sidebar `TaskPanel`/`TaskModal` creation path to create both the `Task` (via `createTask`) and the corresponding `CalendarEvent`.
- When no explicit slot is selected (sidebar creation), default the event start to the work-start hour of the relevant day using `defaultTaskDuration` for the end (read from `SettingsContext`).
- Ensure idempotency: if a `CalendarEvent` for the task already exists (same `taskId`/`id`), do not add a duplicate on re-save/re-render.

### Constraints

- Do NOT modify source in `packages/domain`, `packages/calendar`, `packages/shared`.
- Do NOT modify the inline creation behavior such that it now double-creates events.
- Pre-existing tests must not be modified to force a pass.
- Do not modify project configuration to pass tests.

### Validation Rules

- `apps/web` build must pass (via `run-package-command`).
- New E2E test must pass; existing tests remain green.

---

## Edge Cases

- **Race conditions**: rapid "New" clicks / double-submit in `TaskModal` must not create multiple `CalendarEvent` entries for the same task; React state batching on `setEvents` must not drop the newly appended event.
- **Empty states**: creating the first task when `events` is empty must still append correctly; creating with an empty title is blocked by existing validation.
- **API/storage failures**: `localStorage` persistence failure in `CalendarContext` already warns but must not break task creation; the event must still exist in memory state.
- **Optional/missing fields**: `Settings.defaultTaskDuration` may be missing/unset — fall back to a sensible default (e.g. 60). A task with no explicit slot must still get a valid `start`/`end`.
- **Limits**: many sidebar-created tasks must each get exactly one event; none lost or duplicated.
- **Regressions**: inline "Create in this slot" (with real slot times) must keep using the provided `start`/`end` (not override with defaults); editing an existing task must not create a second event; deleting a task must not leave an orphan/duplicate event to reappear.

---

## Testing

### Unit / Targeted Tests

- [ ] The shared event-creation helper maps a `Task` (+ optional slot) to the correct `CalendarEvent` fields (`id`, `taskId`, `isGenerated`, `source`, default start/end).

### Integration / E2E Tests

- [ ] E2E: create a task from the sidebar Tasks panel — assert a corresponding calendar event is visible, and saving it does not duplicate the event.
- [ ] E2E: after sidebar creation, run generate-week — assert the task participates in scheduling and saving produces no 404 (covered jointly with TASK-01's save assertions but in a separate spec file).

> Cost note: each E2E run takes ~30s. Keep the number of E2E specs focused on the above assertions.

### Manual Validation

- [ ] Open sidebar → Tasks → "+ New", create a task, confirm it appears on the calendar immediately in the current week view.
- [ ] Create a task inline in a slot, confirm it still appears exactly once (no duplicate).

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

- `.opencode/plan/fix-task-sidebar-generation/index.md` (Approach A)
- `.opencode/plan/fix-task-sidebar-generation/feasibility.md`
- `.opencode/plan/fix-task-sidebar-generation/impact-analysis.md`
- `.opencode/plan/fix-task-sidebar-generation/risks.md`
- Source: `apps/web/src/features/tasks/TaskPanel.tsx`
- Source: `apps/web/src/features/tasks/TaskModal.tsx`
- Source: `apps/web/src/contexts/TaskContext.tsx`
- Source: `apps/web/src/contexts/CalendarContext.tsx`
- Reference: `apps/web/src/pages/DashboardPage.tsx` (`handleCreateTaskInline`)
