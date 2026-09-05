# TASK-01 — Shared Dev-Mode Token Context + Reusable Token Retry Modal

## Task Information

### ID

TASK-01

### Title

Create a shared dev-mode token context and a reusable "Google token expired" retry modal component

### Owner

senior-frontend

### Status

Pending

---

## Description

Build the shared infrastructure required by the Google token retry flow:

1. **DevModeContext** — a single source of truth for dev-mode state (`enabled`, `token`, `panelOpen`, plus `updateToken`, `toggleEnabled`, `togglePanel`). Today `useDevMode()` is instantiated only inside `App.tsx`, which means DashboardPage has no access to the dev token update path. The context makes `updateToken` globally available so the token retry modal (rendered on the Dashboard) can persist a newly inserted token before triggering a retry. On the authenticated Dashboard, `DevModePanel` is not even rendered (`App.tsx:31-43` only renders it when `!authenticated`), so there is currently no in-Dashboard UI to replace an expired token — this context + modal is the required replacement.

2. **TokenRetryModal** — a reusable modal offering two actions when the Google calendar token is expired:
   - **Retry** — retry with the same token (calls `onRetry()` and closes).
   - **Insert another token** — reveals a token textarea; on submit it persists the new token through the dev-mode context (`updateToken`) and then triggers `onRetry()` and closes.

The modal must be self-contained (consumes `useDevModeContext()` directly for the token write) so the DashboardPage integration task only renders it and passes an `onRetry` callback.

### Root Cause Context (shared with TASK-02)

On the authenticated dashboard there is no token insertion UI, and the existing `Retry` button blindly re-runs the query with the still-expired token, so the banner never clears — visually "Retry does nothing". TASK-02 wires the modal into that flow; this task creates the modal itself.

---

## Acceptance Criteria

- [ ] `DevModeProvider` + `useDevModeContext()` exist in `apps/web/src/contexts/DevModeContext.tsx`; `useDevModeContext()` throws a clear error when used outside the provider (consistent with `useCalendar` in `apps/web/src/contexts/CalendarContext.tsx`).
- [ ] The context exposes exactly: `enabled`, `token`, `panelOpen`, `togglePanel`, `updateToken`, `toggleEnabled`. State persists through `sessionStorage` keys `brkroutnxdle:devMode` and `brkroutnxdle:devToken` as today.
- [ ] `App.tsx` is wrapped in `DevModeProvider` and reads state via `useDevModeContext()`; the login screen `DevModeBadge`/`DevModePanel` behavior is unchanged (toggle, persist, update token).
- [ ] `TokenRetryModal` renders using the `Modal` component from `@brkroutnxdle/ui` and supports the two actions described above.
- [ ] In insert mode, submitting an empty or whitespace-only token is prevented and the token is written via `updateToken` (sessionStorage) *before* `onRetry()` fires.
- [ ] Modal internal state (draft token, choice/insert mode) resets every time the modal opens.
- [ ] `pnpm build` passes for `apps/web`.

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This task creates the files TASK-02 imports. It has no dependency of its own.

---

## Technical Context

### Relevant Components

- `apps/web/src/App.tsx` — current owner of `useDevMode()`; switch to context
- `apps/web/src/components/DevModePanel.tsx` — stays props-driven; App passes context values (do not change its interface)
- `packages/ui/src/components/Modal.tsx` — reusable modal base (props: `isOpen`, `onClose`, `title`, `children`, `ariaLabel`)

### Relevant Modules

- `apps/web/src/hooks/useDevMode.ts` — sessionStorage-backed state logic; refactor so the provider consumes it (do not change the shape of the returned values)

### Relevant APIs

- `sessionStorage` keys: `brkroutnxdle:devMode`, `brkroutnxdle:devToken`

### Relevant Types

- `DevModeState` (internal interface in `useDevMode.ts`)

---

## Implementation Guidance

### Expected Changes

- **New** `apps/web/src/contexts/DevModeContext.tsx`:
  - `DevModeContext` with `useDevMode()`'s current shape as the value type.
  - `DevModeProvider` wraps the app children; internally calls `useDevMode()` once.
  - Export `useDevModeContext()` that throws `useDevModeContext must be used within DevModeProvider` when `null`.
- **Edit** `apps/web/src/hooks/useDevMode.ts`: keep the state/sessionStorage logic identical; ensure it can be called exactly once by the provider (it already uses a lazy `useState` initializer). No exported-shape change.
- **Edit** `apps/web/src/App.tsx`:
  - Wrap the returned JSX with `<DevModeProvider>...`.
  - Replace the current `const devMode = useDevMode()` with `const devMode = useDevModeContext()`.
  - Remove the `useDevMode` import; add the context import. `DevModeBadge`/`DevModePanel` untouched.
- **New** `apps/web/src/features/completion/TokenRetryModal.tsx`:
  - Props: `{ isOpen: boolean; onClose: () => void; onRetry: () => void }`.
  - Uses `Modal` from `@brkroutnxdle/ui`. Title: "Google token expired".
  - Choice mode (initial): explanatory text (match the existing banner wording: "Google token expired. Please re-authenticate.") + two actions: "Insert another token" (switches to insert mode) and "Retry" (calls `onRetry()` then `onClose()`).
  - Insert mode: `textarea` (reuse the monospace styling of `DevModePanel.tsx`), "Apply & retry" button disabled when the trimmed value is empty; on submit → `updateToken(trimmed)` then `onRetry()` then `onClose()`. Provide a "Back" control to return to choice mode.
  - Reset draft + mode via `useEffect` when `isOpen` transitions to `true`.
- Do NOT modify `DashboardPage.tsx` (owned by TASK-02). Do NOT modify `DevModePanel.tsx`.

### Constraints

- English UI copy (matches existing error banner). No new runtime dependencies.
- Keep `sessionStorage` key names unchanged (they are read by `apps/web/src/services/api.ts` at request time).
- No application behavior regressions on the login screen.

### Validation Rules

- The refactored App must render identically (login and dashboard).
- `updateToken` must immediately reflect in `sessionStorage` so the next API request uses the new token.

---

## Edge Cases

- **Provider misuse**: `useDevModeContext()` outside the provider → throw a descriptive error (matches `useCalendar` convention).
- **Missing token**: `token` is `null` when never set; the modal insert mode must start with an empty draft, never `"null"`.
- **Empty / whitespace token**: submit prevented; `sessionStorage` must never be written with an empty value.
- **Storage failure** (quota, private mode, S3V denied): wrap `sessionStorage.setItem`/`getItem` in `try/catch`, `console.warn`, and keep the in-memory context value functional so the retry still runs.
- **Modal state resets**: reopening the modal must not show a stale draft or an old choice/insert mode (reset via `useEffect` on `isOpen`).
- **Dismiss paths**: Escape key and overlay click (handled by `Modal`) discard any typed draft — acceptable; no partial write to sessionStorage.
- **Race between persist and retry**: `updateToken` is synchronous (sessionStorage write + setState) and `onRetry()` must be invoked *after* it in the same submit handler, so the subsequent request always sees the new token.
- **Repeated open/close churn**: opening the modal repeatedly must not stack Modals or leak event listeners (the base `Modal` cleans up its `keydown` listener on unmount).

---

## Testing

### Unit Tests

No unit test runner is configured in `apps/web` (Playwright E2E only). Skip unit tests; cover behavior via manual validation and the E2E below.

### Integration Tests

- [ ] (Optional) Playwright E2E — cost note ~30s per run: mount the app in dev mode, open `TokenRetryModal`, assert both actions render; click "Insert another token", assert textarea appears; assert "Apply & retry" is disabled for an empty value.

### Manual Validation

- [ ] Login screen: DevModeBadge toggles the DevModePanel; enabling bypass + pasting a token persists across reload (sessionStorage).
- [ ] Render `TokenRetryModal` from the dashboard path (temporarily or via TASK-02's wiring); both actions work; inserting a token writes `brkroutnxdle:devToken` and calls `onRetry`.

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

- `apps/web/src/App.tsx`
- `apps/web/src/hooks/useDevMode.ts`
- `apps/web/src/components/DevModePanel.tsx`
- `packages/ui/src/components/Modal.tsx`
- `apps/web/src/contexts/CalendarContext.tsx` (context convention reference)
- `.opencode/plan/calendar-regression-fixes/tasks/` (prior pipeline that added the sync error banner)