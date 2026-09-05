# Calendar Regression Fixes — Task Index

## Overview

This pipeline fixes 5 identified bugs in the calendar feature related to:
1. **Sync errors** — Google Calendar tasks not syncing silently
2. **X button visibility** — Delete button hidden by CSS overflow + incorrect `isPast`
3. **Block drag** — Self-overlap rejection preventing block movement
4. **Task X button** — Same root cause as Bug 2
5. **Sidebar drag** — Timezone mismatch between start/end computation

All tasks are `senior-frontend` owned. No backend changes required.

---

## Execution Order

```
ALL TASKS RUN IN PARALLEL
```

No sequential dependencies exist between any tasks. Each task addresses a distinct bug with minimal file overlap.

---

## Dependency Graph

```
TASK-01 (API error handling)     ← No deps → fully parallel
TASK-02 (X button visibility)     ← No deps → fully parallel
TASK-03 (Block drag + timezone)   ← No deps → fully parallel
TASK-04 (canDropAt timezone)      ← No deps → fully parallel
```

```
         ┌─────────┐
         │ TASK-01 │  API sync error handling + loading/error states
         └─────────┘
         ┌─────────┐
         │ TASK-02 │  X button visibility (CSS overflow + isPast)
         └─────────┘
         ┌─────────┐
         │ TASK-03 │  Block drag (excludeEventId) + sidebar timezone
         └─────────┘
         ┌─────────┐
         │ TASK-04 │  canDropAt timezone validation (endHour check)
         └─────────┘
```

**No arrows** — all tasks execute in parallel.

---

## Ownership Mapping

| Task | Owner | Primary Files |
|------|-------|---------------|
| TASK-01 | senior-frontend | `useCalendar.ts`, `DashboardPage.tsx` |
| TASK-02 | senior-frontend | `CalendarView.tsx`, `CalendarStyles.css` |
| TASK-03 | senior-frontend | `CalendarView.tsx`, `DashboardPage.tsx`, `useScheduleEditing.ts` |
| TASK-04 | senior-frontend | `useScheduleEditing.ts` |

---

## File Overlap Matrix

The following files are modified by multiple tasks. Merge strategies are documented below.

| File | Touched By | Conflict Risk |
|------|-----------|---------------|
| `DashboardPage.tsx` | TASK-01 (error banner), TASK-03 (validateDrop lambda + handleExternalDrop) | **Low** — changes are in different areas of the file |
| `CalendarView.tsx` | TASK-02 (X button + isPast), TASK-03 (validateDrop prop type + handleEventAllow) | **Low** — changes are in different functions |
| `useScheduleEditing.ts` | TASK-03 (minimal — no changes expected, canDropAt already has param), TASK-04 (endHour timezone fix) | **Medium** — both touch `canDropAt` |

### File Overlap Warnings & Merge Strategy

#### 1. `DashboardPage.tsx` (TASK-01 ⟷ TASK-03)

**Conflict**: TASK-01 adds error/loading state UI near line 360+ (after save status banners). TASK-03 modifies the `validateDrop` lambda at line 422-424 and `handleExternalDrop` at lines 243-293.

**Merge strategy**: Apply TASK-01 first (adds UI elements), then apply TASK-03 (modifies specific functions). No overlapping lines. No merge conflict expected.

#### 2. `CalendarView.tsx` (TASK-02 ⟷ TASK-03)

**Conflict**: TASK-02 modifies `handleEventDidMount` (~lines 278-324) and `fcEvents` memo (~lines 150-213). TASK-03 modifies `validateDrop` prop type (~line 26) and `handleEventAllow` (~lines 274-276).

**Merge strategy**: No overlapping lines. Apply in any order. TASK-02's changes are in the middle of the file, TASK-03's are at the top and right before `handleEventDidMount`. Use a single PR for both to ensure coherence, or apply independently if using separate branches with `git rebase`.

#### 3. `useScheduleEditing.ts` (TASK-03 ⟷ TASK-04)

**Conflict**: TASK-03 may need to verify `canDropAt`'s `excludeEventId` parameter works correctly (lines 58-118). TASK-04 changes the timezone logic within the same `canDropAt` function (lines 60-61 for startHour/endHour, lines 106-110 for recurring block overlap).

**Merge strategy**: **Apply TASK-04 first**, then TASK-03. TASK-04's timezone fix changes lines 60-61 and 106-110. TASK-03's changes are purely about the external wiring (CalendarView + DashboardPage) — it does not change `canDropAt`'s logic. If TASK-03 discovers that the `canDropAt` signature needs adjustment, it would be a separate change at the function declaration level only.

**Alternative**: Assign both to the same developer and deliver as a single combined commit to eliminate merge risk.

---

## Parallelization Plan

```
Time ────────────────────────────────────────────────────────────────>
│
├── TASK-01 [senior-frontend]  ──────────────────────────────────
│   ├── useCalendar.ts          (no overlap)
│   └── DashboardPage.tsx       (⚠ overlaps TASK-03 — different areas)
│
├── TASK-02 [senior-frontend]  ──────────────────────────────────
│   ├── CalendarView.tsx         (⚠ overlaps TASK-03 — different areas)
│   └── CalendarStyles.css       (no overlap)
│
├── TASK-03 [senior-frontend]  ──────────────────────────────────
│   ├── CalendarView.tsx         (⚠ overlaps TASK-02 — different areas)
│   ├── DashboardPage.tsx        (⚠ overlaps TASK-01 — different areas)
│   └── useScheduleEditing.ts    (minimal, if any)
│
├── TASK-04 [senior-frontend]  ──────────────────────────────────
│   └── useScheduleEditing.ts    (⚠ overlaps TASK-03 — same function)
│
└── Merge & Validation ──────────────────────────────────────────
    ├── All tasks → PR #1 (recommended: single PR with 4 commits)
    └── Build validation → E2E tests → QA review
```

### Recommended Execution Strategy

**Option A — Single assignee (recommended)**:
Since all tasks are `senior-frontend` owned, assign a single developer. Implement in any order:
1. Start with TASK-04 (most isolated, foundational fix for timezone)
2. Then TASK-01 + TASK-02 + TASK-03 in any order (file overlaps are minimal and in different areas)
3. Build and test after each task, or batch them

**Option B — Parallel PRs (if team has multiple senior frontend devs)**:
- Dev A: TASK-01 + TASK-04 (no file overlap between them)
- Dev B: TASK-02 (completely isolated from A)
- Dev C: TASK-03 (watch for merge conflicts with A's DashboardPage.tsx + B's CalendarView.tsx)

### Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| `useScheduleEditing.ts` merge conflict (TASK-03 ⟷ TASK-04) | Medium | Apply TASK-04 first, or assign same dev |
| `DashboardPage.tsx` merge conflict | Low | Changes are in different parts of the file |
| `CalendarView.tsx` merge conflict | Low | Changes are in different functions |
| Build breakage | Low | Run build after each task |
| E2E test regression | Medium | Run calendar E2E tests before merging |

---

## Summary

| Item | Value |
|------|-------|
| Total tasks | 4 |
| All owners | senior-frontend |
| Backend tasks | 0 |
| Parallelizable | 100% (all 4 tasks) |
| Files modified | 5 (`useCalendar.ts`, `DashboardPage.tsx`, `CalendarView.tsx`, `CalendarStyles.css`, `useScheduleEditing.ts`) |
| Merge strategy | One PR with sequential commits, or parallel PRs with conflict resolution |
