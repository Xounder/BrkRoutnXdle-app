# Task Template

## Task Information

### ID

TASK-01

### Title

API Sync Error Handling + Loading/Error States

### Owner

senior-frontend

### Status

Pending

---

## Description

The `useCalendarEvents` hook (in `useCalendar.ts`) only merges fetched data when `query.data` is defined. If the `/events` API call fails (network error, server error, timeout), `query.data` remains `undefined`, the merge never happens, and the user receives no feedback that the sync failed. This causes Google Calendar tasks to silently not sync.

Additionally, there is no loading indicator shown while the events are being fetched.

**Root cause**: `useCalendarEvents` does not expose `query.error` or `query.isLoading` to the consumer. The `DashboardPage` calls `useCalendarEvents` at line 205 but never checks for error or loading states.

**Fix scope**:
1. Modify `useCalendarEvents` to expose error and loading/refetching states (return `query` with its error/loading/isFetching fields — the hook already returns `query`, so consumers already have access but aren't using it).
2. In `DashboardPage.tsx`, consume the returned query's error and loading states and render appropriate UI feedback:
   - Show a sync error banner when the API call fails (similar to the existing save error banner pattern at lines 361-393).
   - Optionally show a loading indicator during initial fetch.
3. Ensure the error banner has a "Retry" / "Refresh" action that re-triggers the fetch.

---

## Acceptance Criteria

- [ ] When `/events` API call fails, an error banner is displayed in `DashboardPage` with the error message
- [ ] The error banner includes a retry/refresh action
- [ ] A loading indicator is shown while events are being fetched (optional but recommended)
- [ ] Successful re-fetch clears the error banner
- [ ] No regressions in existing event merging behavior

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

None — this task is fully independent and can run in parallel with TASK-02, TASK-03, and TASK-04.

---

## Technical Context

### Relevant Components

- `DashboardPage.tsx` — renders the sync error/loading UI
- `useCalendar.ts` — the `useCalendarEvents` hook

### Relevant Modules

- `apps/web/src/hooks/useCalendar.ts`
- `apps/web/src/pages/DashboardPage.tsx`

### Relevant APIs

- `api.get<CalendarEvent[]>("/events", { timeMin, timeMax })` — the failing call

### Relevant Types

- `CalendarEvent` from `@brkroutnxdle/shared`
- `UseQueryResult` from `@tanstack/react-query`

---

## Implementation Guidance

### Expected Changes

1. **`useCalendar.ts`**: No structural changes needed — the hook already returns `query`. Just ensure it's clear that consumers should use `query.error`, `query.isLoading`, `query.isFetching`.
2. **`DashboardPage.tsx`**:
   - Capture the return of `useCalendarEvents`:
     ```ts
     const calendarQuery = useCalendarEvents(timeMin, timeMax);
     ```
   - Add an error banner (between line 359 and line 361, after the save status blocks) that shows when `calendarQuery.isError` is true.
   - Style the banner similar to the existing error banner (red background, retry button).
   - Retry should call `calendarQuery.refetch()`.
   - Optionally add a subtle loading indicator when `calendarQuery.isLoading` or `calendarQuery.isFetching && !calendarQuery.isLoading`.

### Constraints

- Must not break existing event merge logic
- Error banner must be dismissable or auto-dismiss on successful refetch
- Loading indicator must be non-intrusive (spinner or dim overlay)

### Validation Rules

- Simulate API failure by disconnecting network — error banner must appear
- Simulate recovery — banner must disappear after successful refetch

---

## Edge Cases

- **Network flakiness**: Multiple rapid failures should show a persistent error state, not flash UI
- **Stale data on error**: If events were previously loaded from cache or prior fetch, the calendar should still display them even when a subsequent fetch fails
- **Empty error message**: The API may return no error message string — fall back to a generic message like "Failed to sync calendar events"
- **Concurrent fetches**: `isFetching` may be true during background refetches — avoid showing a full-page loader during background syncs
- **Retry during loading**: Prevent double-retry by disabling the retry button while `isFetching`

---

## Testing

### Unit Tests

- [ ] Test that error state renders correctly when query returns error
- [ ] Test that loading state shows indicator

### Integration Tests

- [ ] Test full flow: mount DashboardPage → API fails → error banner appears → retry → API succeeds → banner disappears

### Manual Validation

- [ ] Disconnect network, refresh page — verify error banner shows
- [ ] Reconnect network, click retry — verify banner disappears
- [ ] Check that existing events still render when the banner is showing (stale data preserved)

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

- [useCalendar.ts](../apps/web/src/hooks/useCalendar.ts)
- [DashboardPage.tsx](../apps/web/src/pages/DashboardPage.tsx)
- [Bug 1: Google Calendar tasks not syncing](../planning/README.md) (when available)
