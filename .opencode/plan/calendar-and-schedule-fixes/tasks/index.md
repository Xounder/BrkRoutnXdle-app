# Calendar & Schedule Fixes — Task Index

## Overview

5 independent frontend-only tasks addressing UI/UX issues in the calendar and scheduling feature. No cross-dependencies. All tasks are low-to-medium complexity and can execute in parallel.

## Execution Order

All tasks are independent — no ordering constraints.

## Ownership Mapping

| Task | Title | Owner | Complexity |
|------|-------|-------|------------|
| TASK-01 | Schedule Task Font Color | senior-frontend | Low |
| TASK-02 | Create-in-Slot Modal | senior-frontend | Medium |
| TASK-03 | Home Screen Scroll Fix | senior-frontend | Low |
| TASK-04 | AM/PM Setting Sync | senior-frontend | Medium |
| TASK-05 | Timezone UTC Offset | senior-frontend | Low |

## Dependencies

- **None** — all 5 tasks are fully independent
- No shared files are modified by more than one task
- Each task can be implemented, tested, and merged separately

## Build Validation

Build passes clean on `apps/web` before task implementation.

## Planning Reference

`.opencode/plan/calendar-and-schedule-fixes/planning/`
- `index.md` — planning index
- `feasibility.md` — feasibility analysis
- `impact-analysis.md` — impact analysis
- `risks.md` — risk assessment
