# TASK-02 — Fix Non-Working Retry, Detect Token Expiry, and Wire the Retry Modal into DashboardPage

## Task Information

### ID

TASK-02

### Title

Root-cause and fix the calendar sync Retry button; auto-open the token retry modal on Google token expiry

### Owner

senior-frontend

### Status

Pending

---

## Description

Deliver the end-to-end desired behavior on the Dashboard:

1. **Root-cause + fix the "Retry does nothing" report.**
   - The current Retry button (`DashboardPage.tsx:421-437`) calls `calendarQuery.refetch()` directly. When the Google token is expired, the backend returns `401` with code `AUTH_EXPIRED` ("Google token expired. Please re-authenticate."). Retrying re-runs the same query with the unchanged expired token → the same error → the banner reappears with identical text, so the click appears to do nothing.
   - Secondary defect: `refetch()` returns a rejected promise when the fetch fails again, and DashboardPage does not catch it → unhandled promise rejection.
   - Fix: route the retry action through a guarded `handleCalendarRetry` that (a) is a no-op while `isFetching`, (b) catches the rejected promise, and (c) for `AUTH_EXPIRED` errors opens the `TokenRetryModal` instead of blindly re-fetching with a dead token.

2. **Auto-open the modal on token expiry.** When the calendar query fails with `AUTH_EXPIRED`, the `TokenRetryModal` (created in TASK-01) must appear automatically, offering "Insert another token" or "Retry".

3. **Both actions close the modal and trigger a retry.**
   - **Retry** → same token → `calendarQuery.refetch()`.
   - **Insert another token** → modal persists the new token via the dev-mode context (`updateToken`, writes `sessionStorage` `brkroutnxdle:devToken`) then triggers the same refetch. Because `apps/web/src/services/api.ts` reads `sessionStorage` at request time, the refetch automatically uses the new token.
   - If the retry fails again with `AUTH_EXPIRED`, the modal reopens (repeatable). If it succeeds, the error banner clears and the modal stays closed.

---

## Acceptance Criteria

- [ ] Export a type guard `isAuthTokenExpiredError(error: unknown): boolean` from `apps/web/src/services/api.ts` (true only when the error is an `ApiError` with `code === "AUTH_EXPIRED"`).
- [ ] The calendar sync error banner's Retry button opens `TokenRetryModal` when the error is `AUTH_EXPIRED`; for any other error it performs a plain refetch (existing behavior).
- [ ] The modal auto-opens when the calendar query transitions to error with `AUTH_EXPIRED` (including on a fresh page load when the stored token is expired).
- [ ] `handleCalendarRetry` guards against `isFetching`, fully handles the refetch promise (no unhandled rejection), and leaves the banner/loading indicators consistent.
- [ ] Choosing "Retry" closes the modal and triggers a refetch with the same token; inserting a new token closes the modal and triggers a refetch that uses the new token.
- [ ] Modal closes automatically if the underlying query recovers while it is open (error clears).
- [ ] Non-auth sync failures (network error, `GOOGLE_API_ERROR`, `GOOGLE_RATE_LIMIT`, etc.) keep the current banner + plain Retry behavior; no modal.
- [ ] `pnpm build` passes for `apps/web`.

---

## Dependencies

### Required Tasks

- TASK-01

### Dependency Notes

TASK-02 imports `TokenRetryModal` (new file) and relies on `DevModeProvider`/`useDevModeContext` (refactored in TASK-01). These must exist and compile first. This frontend→frontend dependency is technically unavoidable: the modal component and the shared token source of truth must exist before the Dashboard can render/use them.

---

## Technical Context

### Relevant Components

- `apps/web/src/pages/DashboardPage.tsx` — error banner (lines 405-439), loading indicator (441-455), retry wiring, modal render
- `apps/web/src/features/completion/TokenRetryModal.tsx` — (from TASK-01) consumes `useDevModeContext().updateToken` internally; takes `isOpen`, `onClose`, `onRetry`

### Relevant Modules

- `apps/web/src/hooks/useCalendar.ts` — `useCalendarEvents` query (`queryKey: ["calendar", "events", timeMin, timeMax]`); do not change the query shape
- `apps/web/src/services/api.ts` — add the `isAuthTokenExpiredError` type guard

### Relevant APIs

- `calendarQuery.refetch()`, `calendarQuery.isFetching`, `calendarQuery.isError`, `calendarQuery.error`
- Backend error contract: `401` `AUTH_EXPIRED` (see `apps/api/src/services/calendar-client.ts:20` and `apps/api/src/middleware/errorHandler.ts`)

### Relevant Types

- `ApiError` (exported from `apps/web/src/services/api.ts`) with `code: string`
- `CalendarEvent` (from `@brkroutnxdle/shared`)

---

## Implementation Guidance

### Expected Changes

- **Edit** `apps/web/src/services/api.ts`:
  - Add `export function isAuthTokenExpiredError(error: unknown): boolean { return error instanceof ApiError && error.code === "AUTH_EXPIRED"; }`.
- **Edit** `apps/web/src/pages/DashboardPage.tsx`:
  - `import { TokenRetryModal } from "../features/completion/TokenRetryModal";`
  - `import { isAuthTokenExpiredError } from "../services/api";`
  - Add `const [tokenModalOpen, setTokenModalOpen] = useState(false);`
  - Add `const handleCalendarRetry = useCallback(() => { if (calendarQuery.isFetching) return; calendarQuery.refetch().catch(() => undefined); }, [calendarQuery]);`
  - Add a `useEffect` keyed on `[calendarQuery.isError, calendarQuery.error]`: when `calendarQuery.isError` and `isAuthTokenExpiredError(calendarQuery.error)` → `setTokenModalOpen(true)`; when the error clears → `setTokenModalOpen(false)`.
  - Change the banner's Retry button `onClick` to: `isAuthTokenExpiredError(calendarQuery.error) ? () => setTokenModalOpen(true) : handleCalendarRetry`. Keep the existing `disabled={calendarQuery.isFetching}` and opacity styling.
  - Render `<TokenRetryModal isOpen={tokenModalOpen} onClose={() => setTokenModalOpen(false)} onRetry={handleCalendarRetry} />` alongside the other modals.
- Preserve the existing "Loading calendar events..." indicator, save-error banner, and all other Dashboard behavior.

### Constraints

- Do NOT modify `apps/web/src/hooks/useCalendar.ts`, `apps/web/src/hooks/useCalendarRefresh.ts`, or `apps/web/src/contexts/CalendarContext.tsx`.
- Do NOT edit files owned by TASK-01 (`App.tsx`, `useDevMode.ts`, `DevModeContext.tsx`) except as needed to import them. No source code changes outside `DashboardPage.tsx` + `api.ts`.

### Validation Rules

- After a successful refetch, `calendarQuery.isError` becomes `false` and the banner + modal are gone.
- The refetch triggered after "Insert another token" must hit the API with the new `X-Dev-Access-Token` header.

---

## Edge Cases

- **Race — double click / retry while fetching**: `handleCalendarRetry` must no-op while `calendarQuery.isFetching`; the button already disables during fetch.
- **Race — repeated AUTH_EXPIRED failures**: retry with same token fails again → the effect reopens the modal after it closes. Desired and repeatable; guard against stacking (single boolean state, one modal instance).
- **Error clears while modal open** (e.g., an external refetch succeeds): the effect must close the modal.
- **Non-ApiError errors** (network down, timeout, `PARSE_ERROR`): `isAuthTokenExpiredError` returns `false` → plain banner + plain Retry; no modal. `handleCalendarRetry` still catches rejection (no unhandled rejection even for non-Auth errors).
- **`error` is `null` or stale during initial loading**: effect must not open the modal when `isError` is false.
- **Optional/missing data**: if `calendarQuery.error` exists but is not an `ApiError`, guard returns `false` — safe.
- **New empty token** (user submits blank): prevented in TASK-01's modal; TASK-02 must not duplicate the write. If a blank value somehow reaches the refetch, `api.ts` simply omits the header (existing behavior) — the 401 repeats and the modal reopens.
- **Limits**: no new limits apply; modal content is short; textarea inherits TASK-01's styling.
- **Regressions**: `useCalendarRefresh` (RefreshButton, ConflictDialog), save flow, preview flow, and the non-auth error banner must behave exactly as before.

---

## Testing

### Unit Tests

No unit test runner is configured in `apps/web` (Playwright E2E only). Skip unit tests; cover behavior via E2E and manual validation.

### Integration Tests

- [ ] Playwright E2E — cost note ~30s per run. Full-stack dev-mode scenario:
  1. Store a bogus token in `sessionStorage.brkroutnxdle:devToken`, open the Dashboard → assert the error banner appears **and** `TokenRetryModal` auto-opens with "Retry" and "Insert another token".
  2. Click "Retry" → modal closes → banner remains (same error) → modal reopens (repeatable).
  3. Insert a valid token → modal closes → the request goes out with the new `X-Dev-Access-Token` and the banner clears on success.

### Manual Validation

- [ ] Simulate `AUTH_EXPIRED` in dev mode (paste a bogus OAuth token) → banner + modal appear on load.
- [ ] Retry with same token → modal reopens after the refetch fails.
- [ ] Insert a new valid token → events sync, banner clears, modal stays closed.
- [ ] Force a non-auth failure (e.g., API down) → banner shows the plain Retry; no modal appears; no unhandled rejection in the console.

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

- `apps/web/src/pages/DashboardPage.tsx` (banner lines 405-439, loading indicator 441-455)
- `apps/web/src/services/api.ts` (ApiError, sessionStorage dev token read at request time)
- `apps/api/src/services/calendar-client.ts:20` (AUTH_EXPIRED 401)
- `apps/api/src/middleware/errorHandler.ts` (error JSON shape `{ error: { code, message } }`)
- `apps/web/src/hooks/useCalendar.ts` (query to refetch)
- `.opencode/plan/calendar-regression-fixes/tasks/` (prior pipeline that introduced the sync error banner + Retry)