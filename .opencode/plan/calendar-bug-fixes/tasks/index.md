# Calendar Bug Fixes — Task Index

## Overview

This index defines the implementation tasks for fixing 6 calendar bugs in the BrkRoutnXdle application. The bugs span both backend (API/Google Calendar integration) and frontend (visual, interaction, and form behavior).

### Bug Summary

| Bug ID | Description | Severity | Task ID |
|--------|-------------|----------|---------|
| Bug 1 | 502 Bad Gateway when deleting events | High | TASK-01 |
| Bug 2 | Event time text is white instead of black | Low | TASK-02 |
| Bug 3 | Event blocks don't fill their time slot height | Medium | TASK-02 |
| Bug 4 | Multi-slot duration selection saves incorrectly | Medium | TASK-03 |
| Bug 5 | 'Generate Week' events are not movable | Medium | TASK-04 |
| Bug 6 | Block creation not saving at exact marked location | Medium | TASK-05 |

---

## Execution Order

All tasks are **independent** and can be executed in parallel:

```
TASK-01 ────────────────────── Senior Backend
                     ↓
TASK-02 ────┬───────────────── Senior Frontend
TASK-03 ────┼───────────────── Senior Frontend
TASK-04 ────┼───────────────── Senior Frontend
TASK-05 ────┴───────────────── Senior Frontend
```

| Order | Task ID | Owner | Duration Estimate |
|-------|---------|-------|-------------------|
| 1 | TASK-01 | senior-backend | 4–6 hours |
| 2 | TASK-02 | senior-frontend | 1–2 hours |
| 3 | TASK-03 | senior-frontend | 1–2 hours |
| 4 | TASK-04 | senior-frontend | 1 hour |
| 5 | TASK-05 | senior-frontend | 2–4 hours |

**Parallel execution:**
- TASK-01 (backend) can run in parallel with all frontend tasks (TASK-02, TASK-03, TASK-04, TASK-05)
- All frontend tasks can run in parallel with each other (no shared dependencies)

**Note:** TASK-04 and TASK-05 both modify `CalendarView.tsx`. If assigned to different developers, coordinate changes to avoid merge conflicts. Consider assigning both to the same developer, or implement them sequentially within a single branch.

---

## Dependency Graph

```
                    ┌─────────────────┐
                    │      None       │
                    │ (all parallel)  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │   TASK-01    │   │   TASK-02    │   │   TASK-03    │
  │  (Backend)   │   │ (Frontend)   │   │ (Frontend)   │
  │  Bug 1       │   │  Bugs 2, 3   │   │  Bug 4       │
  └──────────────┘   └──────────────┘   └──────────────┘
                             │                   │
                             ▼                   ▼
                     ┌──────────────┐   ┌──────────────┐
                     │   TASK-04    │   │   TASK-05    │
                     │ (Frontend)   │   │ (Frontend)   │
                     │  Bug 5       │   │  Bug 6       │
                     └──────────────┘   └──────────────┘
```

**Dependency Rules:**
- No task depends on any other task
- All tasks can be started simultaneously
- Maximum parallelism: 2 concurrent pipelines (1 backend + 1 frontend), or more if multiple frontend developers

---

## Ownership Mapping

| Task ID | Title | Owner | Key Files |
|---------|-------|-------|-----------|
| TASK-01 | Fix 502 event deletion error | senior-backend | `packages/calendar/src/public/operations.ts`, `apps/api/src/services/calendar-client.ts`, `apps/api/src/routes/events.ts`, `apps/web/src/hooks/useSaveSchedule.ts` |
| TASK-02 | Fix calendar event visual display | senior-frontend | `apps/web/src/styles/CalendarStyles.css`, `apps/web/src/components/CalendarView.tsx` |
| TASK-03 | Fix multi-slot duration in CreateActionModal | senior-frontend | `apps/web/src/features/shared/CreateActionModal.tsx` |
| TASK-04 | Enable drag-to-move for generated events | senior-frontend | `apps/web/src/components/CalendarView.tsx`, `apps/web/src/hooks/useScheduleEditing.ts` |
| TASK-05 | Fix event creation position accuracy | senior-frontend | `apps/web/src/components/CalendarView.tsx`, `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/features/blocks/BlockModal.tsx`, `apps/web/src/features/shared/CreateActionModal.tsx` |

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| TASK-01: Breaking existing CRUD operations | High | Low | Add comprehensive tests; validate create/update/fetch still work after changes |
| TASK-02: CSS specificity conflicts | Low | Medium | Use `!important` with `.brk-calendar-google` wrapper scope |
| TASK-03: User confusion if default changes too aggressively | Low | Low | Always allow manual override of duration |
| TASK-04: Enabling drag on preview may cause unintended moves | Low | Low | Existing `canDropAt` validation still applies |
| TASK-05: Timezone fix may behave differently across browsers | Medium | Medium | Test across multiple timezones and browsers |
| TASK-04 + TASK-05 merge conflict in CalendarView.tsx | Medium | Low | Assign both to same developer or coordinate changes |

---

## Task Files

- [TASK-01: Fix 502 event deletion error](./TASK-01-fix-502-delete-event.md)
- [TASK-02: Fix calendar event visual display](./TASK-02-fix-event-visual-display.md)
- [TASK-03: Fix multi-slot duration in CreateActionModal](./TASK-03-fix-multislot-duration.md)
- [TASK-04: Enable drag-to-move for generated events](./TASK-04-enable-drag-move-generated-events.md)
- [TASK-05: Fix event creation position accuracy](./TASK-05-fix-event-creation-position.md)
