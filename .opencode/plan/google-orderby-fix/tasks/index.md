# Tasks Index — google-orderby-fix

## Overview

Every Google Calendar sync fails for **every** token (valid or invalid) with:

```text
Failed to sync calendar events: Google API error: Invalid string value: 'start'. Allowed values: [startTime, updated]
```

**Verified root cause:** `packages/calendar/src/public/operations.ts` sends `orderBy: "start"` to the Google Calendar API v3 `events.list`, which only accepts `startTime` or `updated`. Both event-fetch functions are affected:

- `fetchEvents` (line ~103)
- `fetchEventsFromCalendar` (line ~123)

The 400 is normalized by `apps/api/src/services/calendar-client.ts` into `GOOGLE_API_ERROR` and shown in the Dashboard sync banner.

**Scope:** 1 backend task. The frontend never sends `orderBy` (verified in `apps/web/src/hooks/useCalendar.ts` and the repo-wide grep), so no frontend task is required.

| Task | Title | Owner | Depends on |
| --- | --- | --- | --- |
| TASK-01 | Fix invalid `orderBy` parameter in Google Calendar client | senior-backend | None |

## Execution Order

1. TASK-01 — Fix `orderBy: "start"` → `orderBy: "startTime"` in `packages/calendar/src/public/operations.ts`, add regression test, validate build.

## Dependency Graph

```text
TASK-01 (senior-backend)
   └── no dependencies
```

No task depends on another task; no circular dependencies.

## Ownership Mapping

| Task | Owner | Primary package |
| --- | --- | --- |
| TASK-01 | senior-backend | `packages/calendar` (consumed by `apps/api`) |

## File Overlaps

| File | Touched by | Merge strategy |
| --- | --- | --- |
| `packages/calendar/src/public/operations.ts` | TASK-01 (only task) | None — single owner, sequential not required |

No file is modified by more than one task, so no merge strategy is required.

## Parallelization Plan

- **Batch 1 (single batch):** TASK-01 (senior-backend) — the only task.
- **Justification:** The frontend does not send `orderBy` and requires no change; the fix is contained in one backend package file. Parallelizing further would split a two-line fix into micro tasks, which violates task granularity rules. QA validation of the sync flow (valid vs invalid token, retry modal regression) follows completion of TASK-01.

## Validation Baseline (pre-task)

- `run-package-command build` on `packages/calendar` — **passing**
- `run-package-command build` on `apps/api` — **passing**

Re-run these after TASK-01 implementation; also run `test` for `packages/calendar` if a runner is added.