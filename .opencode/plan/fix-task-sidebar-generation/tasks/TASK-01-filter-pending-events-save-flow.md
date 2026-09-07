# TASK-01 — Filter pending events before `computeDiff` matching in the save flow

## Task Information

### ID

TASK-01

### Title

Filter pending events (local UUID, not yet synced) before matching in `computeDiff` so the save flow stops PATCHing bogus local UUIDs to Google Calendar (fixes the 404)

### Owner

senior-backend

### Status

Pending

---

## Description

Fix the calendar save flow so that *pending* events — events that carry a local UUID id and have not yet been synced to Google Calendar — are excluded from being matched by `taskId` in `computeDiff` and therefore are never PATCHed to `/events/<local-uuid>` (which currently returns a 404 because the event does not exist remotely yet).

The 404 currently happens because an inline-created task (`handleCreateTaskInline` in `DashboardPage`) appends a `CalendarEvent` to the `events` array with `id = crypto.randomUUID()` and `taskId = task.id`. On a subsequent save (especially the preview/generate-week branch of `useSaveSchedule`), `findPersistedMatch` falls back to matching by `taskId`, finds this pending local event, and emits a `toUpdate` entry with `id = <local-uuid>`. The save loop then calls `api.patch("/events/<local-uuid>")`, and Google Calendar returns 404.

The fix must filter out pending (not-yet-synced) events from the set of events that `computeDiff` matches by `taskId` for *update* purposes, while keeping the persisted `events` array itself untouched (pending events must remain visible/savable locally). Genuinely synced events (those with a real Google Calendar reference, e.g. returned by `GET /events` with `source: "google"`) must remain eligible for update/PATCH.

## Acceptance Criteria

- [ ] In the save flow, `computeDiff` no longer matches pending events (local UUID id, not yet synced) by `taskId` for update, so no PATCH is issued with a local UUID as the event id.
- [ ] Saving a generated schedule after inline-creating a task produces no 404 error and succeeds as a CREATE (POST) for genuinely new events.
- [ ] Pending events remain present in the local `events` array after the fix (they are filtered only from the remote-sync *update* input, never dropped from persisted local state).
- [ ] Already-synced events (real Google Calendar reference / `source: "google"`) remain PATCHable and are still updated when their start/end change.
- [ ] A new E2E test proves both: (a) no local-UUID PATCH/404 on save, and (b) a synced (Google-sourced) event is still correctly updated on save.
- [ ] Existing tests continue to pass and are not modified.

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This task is independent from TASK-02 (sidebar event creation). Both may run in parallel. Coordination: Task 02 ensures sidebar-created tasks acquire a `CalendarEvent`; Task 01 ensures the save flow does not emit 404s for pending events. The E2E specs are authored in separate files to avoid merge conflicts.

---

## Technical Context

### Relevant Components

- Save flow orchestration: `apps/web/src/hooks/useSaveSchedule.ts`
- Diff computation: `apps/web/src/services/diffCalculator.ts`

### Relevant Modules

- `computeDiff(previewEvents, persistedEvents, tasks, options)` in `diffCalculator.ts`
- `buildPersistedLookup` / `findPersistedMatch` in `diffCalculator.ts`
- Manual-save and preview-save branches in `useSaveSchedule.ts`

### Relevant APIs

- `PATCH /events/:id` — currently receives the local UUID and returns 404
- `POST /events` — used for genuinely new events
- `GET /events` — returns only real (Google) events, used as the `persisted` source in the manual-save branch

### Relevant Types

- `CalendarEvent` (`@brkroutnxdle/shared`) — note `source: "google" | "brkroutnxdle"`, optional `taskId`, `id`, `start`, `end`
- `GeneratedEvent` (`@brkroutnxdle/domain`)
- `DiffResult` (`diffCalculator.ts`)

---

## Implementation Guidance

### Expected Changes

- Introduce a "pending event" filter that runs *before* `computeDiff` matching (in `useSaveSchedule.ts` and/or inside `computeDiff`/`buildPersistedLookup`).
- Ensure pending events are excluded from the match-by-`taskId` fallback used to produce `toUpdate`, but are NOT excluded from `toCreate` detection for the same preview event (a pending event with a changing slot should surface as a create, not an invalid update).
- Base eligibility on explicit sync identity rather than brittle ID-shape guesswork: an event is eligible for remote *update* only when it holds a real Google Calendar reference (e.g. `source: "google"` or present in the backend `GET /events` result); pending events are those BrkRoutnXdle-originated events whose id is a local UUID not yet synced.

### Constraints

- Do NOT drop pending events from the persisted `events` array — filtering applies only to the remote-sync update input.
- Do NOT modify source code in `packages/domain`, `packages/calendar`, `packages/shared` — this fix lives entirely in `apps/web`.
- Pre-existing tests must not be touched to make the implementation pass.
- Do not modify project configuration (tsconfig/eslint/package.json scripts) to pass tests.

### Validation Rules

- `apps/web` build must pass (run via `run-package-command`).
- New/updated E2E tests must pass. Existing tests must remain green.

---

## Edge Cases

- **Race conditions**: saving twice quickly or while the calendar refresh is in flight could re-introduce a pending event as a synced one. Ensure the filter is applied consistently on each save and that `setEvents`/`newEventMap` merging does not duplicate a just-created event.
- **Empty states**: an empty `previewEvents` array (manual-save branch) and an empty `persistedEvents` set must both produce a no-op diff (no PATCH, no bogus create/delete).
- **API/storage failures**: when `GET /events` fails and falls back to `[]` (`.catch(() => [])`), pending filtering must still prevent a local-UUID PATCH; a failed PATCH/POST must surface a clear error without corrupting the events array.
- **Optional/missing fields**: events without `taskId` must never be matched-by-taskId; events without a stable `id` (undefined/empty) must be handled gracefully and never PATCHed.
- **Limits**: many pending events (e.g. a large generated week) must all be filtered consistently so none trigger a 404; extreme start/end datetimes must not break matching.
- **Regressions**: already-synced Google events must still update after a drag/resize; previously-unsaved local events must still be creatable on save; deleting a pending event must still work.

---

## Testing

### Unit / Targeted Tests

- [ ] Filter excludes a pending event (local UUID id + `source: "brkroutnxdle"`) from match-by-`taskId` update, so `toUpdate` never contains a local UUID id.

### Integration / E2E Tests

- [ ] E2E: inline-create a task in a slot, run generate-week, save — assert no 404 and the task event is created (POST) without a local-UUID PATCH.
- [ ] E2E: with a Google-sourced (synced) event present, change its slot and save — assert it is updated (PATCH) with its real Google id.

> Cost note: each E2E run takes ~30s. Keep the number of E2E specs focused on the two assertions above.

### Manual Validation

- [ ] Create a task inline in an empty slot, generate/week save, confirm no error banner and the event appears on the calendar after refresh.
- [ ] Confirm pending events are still visible locally before save.

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
- Source: `apps/web/src/services/diffCalculator.ts`
- Source: `apps/web/src/hooks/useSaveSchedule.ts`
