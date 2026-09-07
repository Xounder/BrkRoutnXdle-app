# Tasks — fix-task-sidebar-generation

Status: Ready for execution
Pipeline context: `fix-task-sidebar-generation`
Planning: Approach A (approved) — see `.opencode/plan/fix-task-sidebar-generation/index.md`

## Overview

Tasks created from the sidebar / generate-week flow don't appear on the calendar, and saving them returns a 404. Approved Approach A fixes both root causes:

1. **Root cause 1** — Sidebar task creation never adds a `CalendarEvent` to the `events` array, so the task is never shown on the calendar. → **TASK-02 (senior-frontend)**
2. **Root cause 2** — Pending events with local UUID ids are matched by `taskId` in `computeDiff` and then PATCHed to Google Calendar, which returns 404 because the event doesn't exist remotely yet. → **TASK-01 (senior-backend)**

Expected outcome: sidebar/generate-week-created tasks appear on the calendar, saving creates/persists the event without 404s (remote sync targets only events eligible for Google Calendar), existing tests keep passing, and new tests cover pending-event filtering and sidebar event creation.

## Task List

| ID | Title | Owner | Depends on |
|----|-------|-------|------------|
| TASK-01 | Filter pending events (local UUID, not yet synced) before matching in `computeDiff` so the save flow stops PATCHing bogus local UUIDs to Google Calendar (fixes the 404) | senior-backend | None |
| TASK-02 | Sidebar task creation adds a `CalendarEvent` to the `events` array so sidebar- and generate-week-created tasks appear on the calendar | senior-frontend | None |

## Execution Order

1. **Batch 1 (parallel):** TASK-01 + TASK-02 run simultaneously.
2. **Validation gate (after both complete):** run `apps/web` build + E2E tests together; confirm the joint behavior (sidebar create → generate week → save without 404, no duplicates).

No task depends on another. The two tasks are intentionally independent so the backend (save/diff pipeline) and frontend (task-creation UI) can be implemented in parallel.

## Dependency Graph

```text
TASK-01 (senior-backend)   TASK-02 (senior-frontend)
         \                        /
          \                      /
      Joint validation gate (build + E2E)
```

No edges exist between TASK-01 and TASK-02 — both have `Required Tasks: None`.

## Ownership Mapping

- **TASK-01 → senior-backend** — save-flow diff computation and remote sync semantics; pure logic + API interaction (PATCH/POST/GET) + E2E validation.
- **TASK-02 → senior-frontend** — sidebar/generate-week task-creation UI and local `events` array mutation; single shared event-creation helper + E2E validation.

## File Overlaps

Both tasks operate inside `apps/web` but touch disjoint files. The only shared *area* is the calendar save pipeline vs. the sidebar creation UI; there is no shared file today. Documented overlaps and merge strategy:

| File | TASK-01 | TASK-02 | Merge strategy |
|------|---------|---------|----------------|
| `apps/web/src/services/diffCalculator.ts` | Modify (pending-event filter in matching) | — | No overlap — TASK-01 exclusive |
| `apps/web/src/hooks/useSaveSchedule.ts` | Modify (filter before `computeDiff`) | — | No overlap — TASK-01 exclusive |
| `apps/web/src/features/tasks/TaskPanel.tsx` | — | Modify (wire event creation) | No overlap — TASK-02 exclusive |
| `apps/web/src/features/tasks/TaskModal.tsx` | — | Modify (event creation on create) | No overlap — TASK-02 exclusive |
| `apps/web/src/contexts/TaskContext.tsx` | — | Possibly modify (createTask returning Task for event mapping) | No overlap — TASK-02 exclusive |
| `apps/web/src/contexts/CalendarContext.tsx` | — | Possibly modify (event append helper) | No overlap — TASK-02 exclusive |
| `apps/web/src/pages/DashboardPage.tsx` | — (read-only reference) | Possibly modify (reuse shared helper in `handleCreateTaskInline`) | Parallel with careful merge only if both touch this file — by default TASK-01 does not modify it, so no conflict. If TASK-01 later needed it, the change is confined to the save-mutation area (separate section from task creation helpers). |
| `apps/web/e2e/*.spec.ts` | New spec (save-flow / no-404 assertions) | New spec (sidebar creation assertions) | **Sequential not required — keep separate files.** `TASK-01.spec.ts` and `TASK-02.spec.ts`. If a shared E2E helper (e.g. a `loginAndLoadDashboard` fixture) is extracted, create it in a shared `e2e/fixtures.ts` file; both tasks may add to it — merge in parallel appending non-conflicting helpers, or run the two E2E specs sequentially if a conflict is detected. |

> **Note:** Neither task may edit `packages/domain`, `packages/calendar`, or `packages/shared`. The pre-existing `packages/domain` build blocker (`slotBuilder.ts` missing `use12h` in a fixture inside the source file) is unrelated to this fix and is tracked as a concern in the Tech Lead summary; it does not block either task (the `apps/web` build passes against the existing `dist`).

## Parallelization Plan

### Batch 1 — TASK-01 + TASK-02 (parallel)

- **TASK-01** (senior-backend): save/diff pipeline pending-event filtering.
- **TASK-02** (senior-frontend): sidebar task creation → `CalendarEvent` append.

**Justification:** TASK-01 changes the save/diff computation; TASK-02 changes the task-creation UI. They touch disjoint files (see File Overlaps) and neither depends on the other's output. Running them simultaneously maximizes developer utilization and delivery speed while preserving correctness — the only integration point (the actual save behavior) is verified after both land in the joint validation gate.

### Batch 2 — Joint validation gate

- Run `apps/web` build via `run-package-command`.
- Run `apps/web` E2E tests (Playwright) — validating the two acceptance flows together: sidebar create → generate week → save without 404, and synced-events still update.

**Justification:** E2E interaction (FullCalendar save flow, ~30s per run) requires both changes present to prove the end-to-end outcome promised by the plan.

## References

- `.opencode/plan/fix-task-sidebar-generation/index.md`
- `.opencode/plan/fix-task-sidebar-generation/feasibility.md`
- `.opencode/plan/fix-task-sidebar-generation/impact-analysis.md`
- `.opencode/plan/fix-task-sidebar-generation/risks.md`
- Template: `.opencode/template/task-template.md`