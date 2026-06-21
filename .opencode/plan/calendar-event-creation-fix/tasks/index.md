# Calendar Event Creation Fix — Task Index

## Overview

Fix two bugs in the calendar event creation/save flow:

1. **Bug 1**: Calendar click does not correctly infer position values (time slot, date) when opening the create modal
2. **Bug 2**: "Save to Calendar" fails with JSON parse error due to payload format mismatch and missing async error handling

## Task List

| ID | Title | Owner | Est. Effort |
|----|-------|-------|-------------|
| TASK-01 | Fix events API validation (accept flexible payload, fix error handling) | senior-backend | 2–4h |
| TASK-02 | Fix calendar click creation (position inference and pre-fill) | senior-frontend | 2–4h |
| TASK-03 | Fix Save to Calendar payload (field mapping and error handling) | senior-frontend | 2–3h |

## Execution Order

```
TASK-01 (Backend)    TASK-02 (Frontend)
         \              /
          \            /
        TASK-03 (Frontend)
```

All three tasks can be implemented in parallel:

- **TASK-01** and **TASK-02** have zero dependencies — they are in different packages (`apps/api` vs `apps/web`).
- **TASK-03** is conceptually related to TASK-01 (aligns the frontend payload with the API contract) but is not strictly blocked by it — TASK-01 will accept both the old and new payload formats, so TASK-03 can safely update the frontend to send the correct format regardless.

## Dependency Graph

```
TASK-01 (senior-backend) ──► (none)
TASK-02 (senior-frontend) ──► (none)
TASK-03 (senior-frontend) ──► (none)
```

All three tasks are **independent** and can execute in parallel.

## Ownership Mapping

| Package | Owner | Tasks |
|---------|-------|-------|
| `apps/api` | senior-backend | TASK-01 |
| `apps/web` | senior-frontend | TASK-02, TASK-03 |
| `packages/shared` | senior-backend | TASK-01 (if types change) |
| `packages/calendar` | senior-backend | TASK-01 (if types change) |

## Validation

After all tasks are complete:

1. Verify POST /api/v1/events accepts `title` → `summary` mapping
2. Verify POST /api/v1/events accepts ISO string `start`/`end` values
3. Verify validation errors return JSON body (not empty/unparseable)
4. Verify clicking on calendar opens modal with correct time slot
5. Verify creating a Task from slot pre-fills duration
6. Verify creating a Block from slot pre-fills date
7. Verify "Save to Calendar" completes without JSON parse error
