# Tasks — Calendar, Settings & Task Restrictions

## Overview

Implementation of the 3-phase plan for Calendar overhaul, Settings fixes, and Task restriction enhancements.

**Total Tasks:** 7  
**Total Phases:** 3 (independent, parallelizable)  
**All Owners:** `senior-frontend`

---

## Dependency Graph

```
TASK-01 (Phase 1 — Settings)
  No dependencies

TASK-02 (Phase 2a — Calendar foundation)
  No dependencies
    ├── TASK-03 (Phase 2b — Click handlers)
    └── TASK-04 (Phase 2c — Drag-and-drop)

TASK-05 (Phase 3a — Shared types)
  No dependencies
    ├── TASK-06 (Phase 3b — TaskModal UI)
    └── TASK-07 (Phase 3c — Domain algorithm)
```

### Visual Dependency Graph

```
                    ┌─────────────────┐
                    │    TASK-01      │  Phase 1 — Settings
                    │ (no deps)       │
                    └─────────────────┘

                    ┌─────────────────┐
                    │    TASK-02      │  Phase 2a — Calendar foundation
                    │ (no deps)       │
                    └────────┬────────┘
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
        ┌─────────────────┐  ┌─────────────────┐
        │    TASK-03      │  │    TASK-04      │
        │ Click handlers  │  │  Drag-and-drop  │
        └─────────────────┘  └─────────────────┘

                    ┌─────────────────┐
                    │    TASK-05      │  Phase 3a — Shared types
                    │ (no deps)       │
                    └────────┬────────┘
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
        ┌─────────────────┐  ┌─────────────────┐
        │    TASK-06      │  │    TASK-07      │
        │  TaskModal UI   │  │ Domain algorithm│
        └─────────────────┘  └─────────────────┘
```

---

## Execution Order

### Round 1 (Parallel — no dependencies)

| Task | Owner | Phase | Description |
|------|-------|-------|-------------|
| TASK-01 | senior-frontend | 1 | Settings Sidebar Wiring + Modal Fixes |
| TASK-02 | senior-frontend | 2a | Calendar: 24h View + Editable + Block Rendering |
| TASK-05 | senior-frontend | 3a | Extend Shared Types |

### Round 2 (Parallel — depend on Round 1 tasks)

| Task | Owner | Phase | Depends On | Description |
|------|-------|-------|------------|-------------|
| TASK-03 | senior-frontend | 2b | TASK-02 | Calendar Click Handlers |
| TASK-04 | senior-frontend | 2c | TASK-02 | Calendar Drag-and-Drop |
| TASK-06 | senior-frontend | 3b | TASK-05 | TaskModal UI for Restrictions |
| TASK-07 | senior-frontend | 3c | TASK-05 | Domain Algorithm Update |

### Notes

- **Round 1** tasks have zero dependencies and can execute simultaneously.
- **Round 2** tasks depend on Round 1 but are independent of each other — all 4 can execute simultaneously.
- Phase 1 (TASK-01), Phase 2 (TASK-02→TASK-03+TASK-04), and Phase 3 (TASK-05→TASK-06+TASK-07) run as three independent streams with no cross-phase dependencies.

---

## Ownership Mapping

| Task | Owner | Primary Files |
|------|-------|---------------|
| TASK-01 | **senior-frontend** | Sidebar.tsx, SettingsModal.tsx, CalendarView.tsx, DashboardPage.tsx |
| TASK-02 | **senior-frontend** | CalendarView.tsx, DashboardPage.tsx, BlockContext.tsx |
| TASK-03 | **senior-frontend** | CalendarView.tsx, DashboardPage.tsx, CreateActionModal (new), TaskModal.tsx, BlockModal.tsx |
| TASK-04 | **senior-frontend** | CalendarView.tsx, DashboardPage.tsx, BlockContext.tsx, useScheduleEditing.ts |
| TASK-05 | **senior-frontend** | packages/shared/src/types/index.ts, packages/shared/src/constants/index.ts |
| TASK-06 | **senior-frontend** | apps/web/src/features/tasks/TaskModal.tsx |
| TASK-07 | **senior-frontend** | packages/domain/src/internal/taskDistributor.ts, availabilityCalculator.ts |

---

## Phase Summary

| Phase | Tasks | Effort | Description |
|-------|-------|--------|-------------|
| Phase 1 | TASK-01 | Small | Settings sidebar wiring, start/end hour binding, timezone select |
| Phase 2 | TASK-02→TASK-03+TASK-04 | Large | Calendar 24h, editable, blocks, click handlers, drag-drop |
| Phase 3 | TASK-05→TASK-06+TASK-07 | Medium | Task restrictions: types, UI, domain algorithm |

---

## Key Design Decisions

- All Phase 1, 2, and 3 streams are independent — no cross-phase dependencies
- Phase 2 internal dependency: TASK-02 must precede TASK-03 and TASK-04 (calendar foundation needed for interactions)
- Phase 3 internal dependency: TASK-05 must precede TASK-06 and TASK-07 (types needed for UI and algorithm)
- All tasks owned by `senior-frontend` — the domain algorithm runs client-side
- New fields are optional with defaults for backward compatibility
- Blocks have full drag-drop + delete on calendar (user-approved)
- 4 time groups: morning (6-12), afternoon (12-18), evening (18-0), night (0-6) + custom hour ranges (user-approved)

---

## References

- [Planning Index](../planning/index.md)
- [Impact Analysis](../planning/impact-analysis.md)
- [Feasibility Analysis](../planning/feasibility.md)
- [Risk Assessment](../planning/risks.md)
