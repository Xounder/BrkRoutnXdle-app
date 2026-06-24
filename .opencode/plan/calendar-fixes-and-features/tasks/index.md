# Calendar Fixes and Features — Task Index

## Overview

This index defines the implementation tasks for fixing 7 issues in the BrkRoutnXdle application's calendar and task management features. All issues are frontend-only and span visual fixes, interaction bugs, data persistence, and new UI capabilities.

### Issue Summary

| # | Issue | Severity | Task ID | Owner |
|---|-------|----------|---------|-------|
| 1 | Add Save button before Calculate Week (manual saves) | Medium | TASK-01 | senior-frontend |
| 2 | Block name color in calendar (white → highlight) | Low | TASK-02 | senior-frontend |
| 3 | "Create in this slot" modal — block events missing X button | Medium | TASK-03 | senior-frontend |
| 4 | Time selection bug — end time doesn't match selection | High | TASK-04 | senior-frontend |
| 5 | "Generate Again" button not working | High | TASK-05 | senior-frontend |
| 6 | Sidebar drag-to-calendar | Medium | TASK-06 | senior-frontend |
| 7 | Task save/persistence bug — wrong names + data loss on refresh | Critical | TASK-07 | senior-frontend |

---

## Execution Order

All tasks are **independent** and can be executed in parallel:

```
TASK-01 ────── Senior Frontend
TASK-02 ────── Senior Frontend
TASK-03 ────── Senior Frontend
TASK-04 ────── Senior Frontend
TASK-05 ────── Senior Frontend
TASK-06 ────── Senior Frontend
TASK-07 ────── Senior Frontend
```

| Order | Task ID | Title | Duration Estimate |
|-------|---------|-------|-------------------|
| 1 | TASK-01 | Add Save button before Calculate Week | 4–8 hours |
| 2 | TASK-02 | Fix block name color in calendar | 1 hour |
| 3 | TASK-03 | Add X button to block events | 2–4 hours |
| 4 | TASK-04 | Fix time selection bug | 1–2 hours |
| 5 | TASK-05 | Fix Generate Again button | 2–4 hours |
| 6 | TASK-06 | Implement sidebar drag-to-calendar | 8–16 hours |
| 7 | TASK-07 | Fix task save/persistence bug | 4–8 hours |

**Parallel execution:**
- All 7 tasks can run in parallel since they have no hard dependencies
- All tasks are assigned to `senior-frontend` (only one developer), so they will be executed sequentially in practice
- Suggested execution order: TASK-07 (critical data loss) → TASK-04/TASK-05 (high severity bugs) → TASK-01/TASK-03 (medium features) → TASK-02/TASK-06 (lower priority)

---

## Dependency Graph

```
                    ┌─────────────────┐
                    │      None       │
                    │ (all parallel)  │
                    └────────┬────────┘
         ┌───────────┬───────┼───────┬───────────┐
         │           │       │       │           │
         ▼           ▼       ▼       ▼           ▼
   ┌──────────┐ ┌────────┐ ┌──────┐ ┌──────┐ ┌──────────┐
   │ TASK-01  │ │TASK-02 │ │TASK- │ │TASK- │ │ TASK-06  │
   │Save btn  │ │Color   │ │03    │ │04    │ │Drag to   │
   │          │ │fix     │ │X btn │ │Time  │ │calendar   │
   └──────────┘ └────────┘ └──────┘ └──────┘ └──────────┘
                              │                 │
                              ▼                 ▼
                        ┌──────────┐     ┌──────────┐
                        │ TASK-05  │     │ TASK-07  │
                        │Generate  │     │ Persist  │
                        │Again     │     │ fix      │
                        └──────────┘     └──────────┘
```

**Dependency Rules:**
- No task depends on any other task
- All tasks can be started simultaneously
- Maximum parallelism is limited by available developers

---

## Ownership Mapping

| Task ID | Title | Owner | Key Files |
|---------|-------|-------|-----------|
| TASK-01 | Add Save button before Calculate Week | senior-frontend | `DashboardPage.tsx`, `useSaveSchedule.ts`, `diffCalculator.ts` |
| TASK-02 | Fix block name color in calendar | senior-frontend | `CalendarStyles.css` |
| TASK-03 | Add X button to block events | senior-frontend | `CalendarView.tsx`, `useScheduleEditing.ts` |
| TASK-04 | Fix time selection bug | senior-frontend | `DashboardPage.tsx`, `CreateActionModal.tsx` |
| TASK-05 | Fix Generate Again button | senior-frontend | `useScheduleGeneration.ts` |
| TASK-06 | Implement sidebar drag-to-calendar | senior-frontend | `CalendarView.tsx`, `TaskCard.tsx`, `BlockCard.tsx`, `Sidebar.tsx`, `DashboardPage.tsx` |
| TASK-07 | Fix task save/persistence bug | senior-frontend | `diffCalculator.ts`, `DashboardPage.tsx`, `useCalendar.ts` |

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| TASK-01 + TASK-07 share `diffCalculator.ts`/`DashboardPage.tsx` changes | Medium | Medium | Assign same developer or coordinate merge carefully |
| TASK-03 + TASK-06 share `CalendarView.tsx` changes | Medium | Medium | Coordinate changes to avoid merge conflicts |
| TASK-06: Browser drag-and-drop API differences | Medium | Low | Test across Chrome, Firefox, Edge |
| TASK-07: Data loss during save fix could cause temporary corruption | High | Low | Implement with careful state handling; test before deploying |
| TASK-05: `PreviousWeekSnapshot` may not produce visibly different schedules | Medium | Medium | Verify the shuffle engine responds to previous week data; implement fallback randomization if needed |

---

## Task Files

- [TASK-01: Add Save button before Calculate Week](./TASK-01-add-save-button-before-calculate.md)
- [TASK-02: Fix block name color in calendar](./TASK-02-fix-block-name-color-in-calendar.md)
- [TASK-03: Add X button to block events](./TASK-03-add-x-button-to-block-events.md)
- [TASK-04: Fix time selection bug](./TASK-04-fix-time-selection-bug.md)
- [TASK-05: Fix Generate Again button](./TASK-05-fix-generate-again-button.md)
- [TASK-06: Implement sidebar drag-to-calendar](./TASK-06-implement-sidebar-drag-to-calendar.md)
- [TASK-07: Fix task save/persistence bug](./TASK-07-fix-task-save-persistence-bug.md)
