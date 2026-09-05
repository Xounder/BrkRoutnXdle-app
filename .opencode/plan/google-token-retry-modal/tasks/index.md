# Google Token Retry Modal — Task Index

## Overview

**Pipeline:** google-token-retry-modal

**Problem:** In dev mode, when the Google calendar token sync fails, the Dashboard shows "Failed to sync calendar events: Google token expired. Please re-authenticate." with a Retry button. Pressing Retry appears to do nothing.

**Root cause analysis (confirmed against source):**

1. **No in-Dashboard token UI.** `DevModePanel` is only rendered on the login path (`apps/web/src/App.tsx:31-43`, gated by `!authenticated`). On the authenticated Dashboard there is no way to insert a replacement token.
2. **Blind retry with a dead token.** The banner's Retry calls `calendarQuery.refetch()` (`DashboardPage.tsx:422`). The backend returns `401` `AUTH_EXPIRED` (`apps/api/src/services/calendar-client.ts:20`); retrying re-runs the exact same query with the unchanged expired token from `sessionStorage`, producing the identical error — visually "nothing happens".
3. **Unhandled rejection.** `refetch()` returns a rejected promise on failure and DashboardPage never catches it.
4. **No error routing.** Nothing distinguishes `AUTH_EXPIRED` (recoverable by inserting a token) from transient/network errors (plain retry is appropriate).

**Solution:** a shared `DevModeContext` + a reusable `TokenRetryModal` (TASK-01), wired into `DashboardPage` so the modal auto-appears on `AUTH_EXPIRED` and both actions ("Retry" / "Insert another token") close the modal and trigger a refetch — same token on retry, the newly persisted token when inserted (TASK-02).

**Backend error contract:** `AUTH_EXPIRED` (401), message "Google token expired. Please re-authenticate." — surfaced to the frontend as `ApiError.code === "AUTH_EXPIRED"`.

---

## Execution Order

```
Batch 1: TASK-01 (shared infrastructure)
Batch 2: TASK-02 (Dashboard integration + retry fix)
```

Sequential — TASK-02 imports files created by TASK-01 and cannot compile without them.

---

## Dependency Graph

```
TASK-01 (DevModeContext + TokenRetryModal)
    ↓
TASK-02 (Dashboard wiring + root-cause retry fix)
```

**Edge:** no circular dependencies. Both tasks are `senior-frontend`.

---

## Ownership Mapping

| Task | Owner | Primary Files |
|------|-------|---------------|
| TASK-01 | senior-frontend | `contexts/DevModeContext.tsx` (new), `hooks/useDevMode.ts`, `App.tsx`, `features/completion/TokenRetryModal.tsx` (new) |
| TASK-02 | senior-frontend | `services/api.ts`, `pages/DashboardPage.tsx` |

**Backend tasks: 0.**

---

## File Overlaps

**No file is modified by more than one task.** The split is file-disjoint:

| File | Touched By |
|------|-----------|
| `contexts/DevModeContext.tsx` (new) | TASK-01 |
| `hooks/useDevMode.ts` | TASK-01 |
| `App.tsx` | TASK-01 |
| `features/completion/TokenRetryModal.tsx` (new) | TASK-01 |
| `services/api.ts` | TASK-02 |
| `pages/DashboardPage.tsx` | TASK-02 |

### File Overlap Warning & Merge Strategy

None required — zero file overlap. Merge as sequential commits in one PR: TASK-01 first, then TASK-02.

**Cross-task import note (not a file overlap):** TASK-02 imports `TokenRetryModal` and relies on `DevModeProvider`/`useDevModeContext` from TASK-01. These are compile-time dependencies, so the two tasks MUST NOT be merged in the reverse order.

---

## Parallelization Plan

```
Time ──────────────────────────────────────────────────────────────>
├── TASK-01 [senior-frontend]  ─────────────────────────────────────
│   ├── DevModeContext (new)          (no overlap)
│   ├── useDevMode.ts                 (no overlap)
│   ├── App.tsx                       (no overlap)
│   └── TokenRetryModal (new)         (no overlap)
│
├── TASK-02 [senior-frontend]  ─────────────────────────────────────
│   ├── api.ts                        (no overlap)
│   └── DashboardPage.tsx             (no overlap)
│
└── Merge & Validation ────────────────────────────────────────────
    ├── Single PR, 2 commits (TASK-01 → TASK-02)
    └── Build validation → E2E (if full-stack available) → QA review
```

**Justification:** TASK-01 and TASK-02 cannot run in parallel because TASK-02 imports TASK-01's new component and context — a compile-time coupling that cannot be avoided (the modal and the shared token source of truth must exist before the Dashboard can use them). Within each task all edits are independent.

**Recommended execution:** a single senior-frontend assignee implementing TASK-01 then TASK-02 in sequence, committing after each, then one build + QA pass.

---

## Delivery Outputs (Feature Requirements)

| # | Requirement | Delivered By |
|---|-------------|--------------|
| 1 | Root-cause + fix the non-working Retry button | TASK-02 |
| 2 | On sync failure (token expired), show a modal with "insert another token" / "retry" | TASK-01 + TASK-02 |
| 3 | Both actions close the modal and trigger a retry — same token on retry, new token when inserted | TASK-01 (persist) + TASK-02 (refetch) |
| 4 | Build validation passes | Both (validated at pipeline level) |

---

## Summary

| Item | Value |
|------|-------|
| Total tasks | 2 |
| All owners | senior-frontend |
| Backend tasks | 0 |
| Parallelizable | 0% (TASK-02 depends on TASK-01 — compile-time import) |
| Files touched | 4 edited (`useDevMode.ts`, `App.tsx`, `api.ts`, `DashboardPage.tsx`) + 2 new (`DevModeContext.tsx`, `TokenRetryModal.tsx`) |
| File overlaps | None |
| Merge strategy | One PR, sequential commits TASK-01 → TASK-02 |