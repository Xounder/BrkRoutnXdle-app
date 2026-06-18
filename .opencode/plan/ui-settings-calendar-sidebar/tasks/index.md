# Tasks — UI Settings, Calendar & Sidebar

## Overview

This plan covers three independent frontend areas in `apps/web`:

1. **Settings Modal** — Hour clamping, off-by-one fix, 12h/12h toggle, layout improvements, default timezone
2. **Calendar Styles** — Visual refresh with Google Calendar-like overrides and padding reduction
3. **Sidebar Toggle** — Icon replacement, absolute positioning for clickability when collapsed

All areas are **frontend-only**. No backend changes are required.

## Execution Order

All three tasks are independent and can be executed **in parallel** (no dependency chain):

```
TASK-001 ───┐
TASK-002 ───┼──▶ All parallel, no ordering required
TASK-003 ───┘
```

## Dependency Graph

```
TASK-001 (Settings Modal)      — No dependencies
TASK-002 (Calendar Styles)     — No dependencies
TASK-003 (Sidebar Toggle)      — No dependencies
```

There are no cross-task dependencies. All tasks can be assigned simultaneously.

## Ownership Mapping

| Task ID | Title | Owner |
|---------|-------|-------|
| TASK-001 | Settings Modal — Hour clamping, off-by-one fix, 12h/12h toggle, layout & timezone | Senior Frontend |
| TASK-002 | Calendar Visual Refresh — Google Calendar-like styling & padding reduction | Senior Frontend |
| TASK-003 | Sidebar Toggle — Icon replacement, absolute positioning, and relative container | Senior Frontend |

## Parallelization Strategy

Maximum parallelism is achieved by assigning all three tasks at the same time:

- **Senior Frontend** owns all three tasks (all frontend work)
- Since tasks modify different files with no overlap, a single developer could implement them in any order, or multiple developers could each take one task

## Files to be Changed

| File | Tasks |
|------|-------|
| `apps/web/src/components/SettingsModal.tsx` | TASK-001 |
| `apps/web/src/pages/DashboardPage.tsx` | TASK-001 |
| `apps/web/src/hooks/useScheduleEditing.ts` | TASK-001 |
| `packages/shared/src/constants/index.ts` | TASK-001 |
| `apps/web/src/styles/CalendarStyles.css` | TASK-002 |
| `apps/web/src/components/CalendarView.tsx` | TASK-002 |
| `apps/web/src/components/Sidebar.tsx` | TASK-003 |
| `apps/web/src/components/MainLayout.tsx` | TASK-003 |

## Risk Assessment

- **Low risk** — All changes are localized, well-scoped, and independent
- **Watch item:** The off-by-one fix in `useScheduleEditing.ts` could affect drag-and-drop validation; ensure thorough testing
- **Watch item:** The `Intl.DateTimeFormat()` call in shared constants may not work in SSR/browser-less environments; verify before merging
