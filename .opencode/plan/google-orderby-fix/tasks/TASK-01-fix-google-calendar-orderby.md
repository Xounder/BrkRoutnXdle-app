# Task Template

## Task Information

### ID

TASK-01

### Title

Fix invalid `orderBy` parameter in Google Calendar client

### Owner

senior-backend

### Status

Pending

---

## Description

Every calendar sync currently fails — even with a valid Google token — with:

```text
Failed to sync calendar events: Google API error: Invalid string value: 'start'. Allowed values: [startTime, updated]
```

**Root cause (verified against source):** `packages/calendar/src/public/operations.ts` passes `orderBy: "start"` to the Google Calendar API `events.list` in two places:

- `fetchEvents` — line ~103
- `fetchEventsFromCalendar` — line ~123

The Google Calendar API v3 `events.list` `orderBy` field only accepts `startTime` or `updated`. The value `"start"` is rejected with a 400 error, which is normalized by `apps/api/src/services/calendar-client.ts` (`withErrorHandling`) into `AppError(502, "GOOGLE_API_ERROR", ...)` and surfaced in the Dashboard sync banner.

The app already sets `singleEvents: true` and a `timeMin`/`timeMax` range on both calls, which are the required preconditions for `orderBy: "startTime"`. The frontend never sends an `orderBy` query parameter (verified: `apps/web/src/hooks/useCalendar.ts` sends only `timeMin`/`timeMax`; no `orderBy` exists anywhere in `apps/web` or `packages/shared`), so the fix is entirely backend.

**Fix:** Replace both occurrences of `orderBy: "start"` with `orderBy: "startTime"` in `packages/calendar/src/public/operations.ts`. Add a regression test that guards against reintroducing an invalid `orderBy` value.

---

## Acceptance Criteria

- [ ] `orderBy: "start"` replaced with `orderBy: "startTime"` in both `fetchEvents` and `fetchEventsFromCalendar` in `packages/calendar/src/public/operations.ts`
- [ ] A repository-wide grep finds no remaining `orderBy: "start"` in source code (valid values are only `startTime` or `updated`)
- [ ] `singleEvents: true` and `timeMin`/`timeMax` remain present on both `events.list` calls (they are preconditions for `orderBy: "startTime"`)
- [ ] `pnpm build` passes for `packages/calendar` and `apps/api`
- [ ] Manual validation with a **valid** token: `GET /events` (and the calendar sync banner) returns events without `GOOGLE_API_ERROR`
- [ ] Manual validation with an **invalid/expired** token: API returns `401 AUTH_EXPIRED` (verified via `withErrorHandling`) and the Dashboard retry flow opens the `TokenRetryModal` — behavior must not regress
- [ ] No frontend changes required (verified: frontend does not send `orderBy`)

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

Standalone fix. No other task in this pipeline touches these files.

---

## Technical Context

### Relevant Components

- `packages/calendar` — Google Calendar API client package (`@brkroutnxdle/calendar`)
- `apps/api` — backend consuming `@brkroutnxdle/calendar` via `services/calendar-client.ts`

### Relevant Modules

- `packages/calendar/src/public/operations.ts` — `fetchEvents`, `fetchEventsFromCalendar` (source of the invalid value)
- `packages/calendar/src/public/index.ts` — re-exports `fetchEvents`, `createEvent`, `updateEvent`, `deleteEvent`
- `packages/calendar/src/index.ts` — re-exports `fetchEventsFromCalendar`
- `apps/api/src/services/calendar-client.ts` — `withErrorHandling` maps `err.response.status` (401 → `AUTH_EXPIRED`, 403 → `CALENDAR_ACCESS_DENIED`, 404 → `EVENT_NOT_FOUND`, 429 → `GOOGLE_RATE_LIMIT`, else 502 → `GOOGLE_API_ERROR`)

### Relevant APIs

- Google Calendar API v3 `events.list` — `orderBy` accepts only `startTime` | `updated` (documented). `startTime` requires `singleEvents=true` and a time range.
- `GET /events` route (`apps/api/src/routes/events.ts`) — calls `calendarClient.fetchEvents`

### Relevant Types

- `packages/calendar/src/internal/types.ts` — `GoogleCalendarEvent`, `CreateEventPayload`
- `packages/shared/src/types/index.ts` — `CalendarEvent`, `ApiResponse`, `ApiError`

---

## Implementation Guidance

### Expected Changes

- In `packages/calendar/src/public/operations.ts` line ~103 (`fetchEvents`): change `orderBy: "start"` → `orderBy: "startTime"`
- In `packages/calendar/src/public/operations.ts` line ~123 (`fetchEventsFromCalendar`): change `orderBy: "start"` → `orderBy: "startTime"`
- Optionally define a module-level constant, e.g. `const ORDER_BY_START_TIME = "startTime" as const;`, and use it on both calls to make the valid value explicit and single-sourced
- Add a regression unit test (see Testing section) asserting both `events.list` calls pass `orderBy: "startTime"`

### Constraints

- Do **not** change `orderBy` to `"updated"` — the app expects events ordered by start time (week view, schedule generation)
- Do **not** remove or alter `singleEvents: true`, `timeMin`, or `timeMax` on either `events.list` call
- Do **not** touch `getBrkCalendarId`, `calendarIdCache`, or any other operation (`createEvent`, `updateEvent`, `deleteEvent`, `setCompletionStatus`)
- Do **not** modify error mapping in `apps/api/src/services/calendar-client.ts` or `apps/api/src/middleware/errorHandler.ts`
- Keep the change within the `@brkroutnxdle/calendar` package

### Validation Rules

- `grep -r "orderBy" packages apps` → only `startTime` / `updated` values in source
- `run-package-command build` on `packages/calendar` and `apps/api` must pass
- If a unit test runner is not yet available for `packages/calendar` (repo currently has no `*.test.ts` files), adding `vitest` as a devDependency with a `test` script is acceptable; the new test must assert real behavior (the params passed to `events.list`), not a trivial pass

---

## Edge Cases

- **Token validity regression:** The bug masked token validity — every token (valid or invalid) produced `GOOGLE_API_ERROR`. After the fix, invalid/expired tokens must surface the pre-existing `401 AUTH_EXPIRED` path (`withErrorHandling`) so the Dashboard opens `TokenRetryModal`; valid tokens must sync successfully. Verify both directions manually.
- **Google API 400 vs auth ordering:** Google can reject `orderBy` (400) before auth is evaluated. Confirming the fix removes the 400 for valid tokens proves the request is well-formed; the 401 mapping must then take over for bad tokens.
- **Async race (Promise.all):** `apps/api/src/services/calendar-client.ts` `fetchAllCalendarsEvents` runs `fetchEventsFromCalendar` for the primary and BrkRoutnXdle calendars concurrently — both calls pass through the fixed function. If one calendar fails, the whole sync fails (existing behavior, unchanged); error normalization must stay intact.
- **Empty calendars:** `events.list` with valid params returns `items: []` → `normalizeEvents([])`; sync must succeed with zero events and show no error banner.
- **Recurring events:** `singleEvents: true` expands recurring events into instances with concrete `start.dateTime`, keeping `startTime` ordering well-defined. Do not remove `singleEvents`.
- **Missing/invalid query params on routes:** `apps/api/src/routes/events.ts` defaults `timeMin`/`timeMax` (e.g., `new Date().toISOString()`); the fix must not introduce new validation errors when params are omitted.
- **Limits / many events:** `events.list` pagination (`nextPageToken`) behavior is unchanged; the fix only corrects the ordering parameter.
- **Regression on retry modal flow:** DashboardPage `handleCalendarRetry` / `TokenRetryModal` ("Apply & retry") must continue to work: after a corrected token is applied and the sync retried with valid `orderBy`, events load normally.
- **Magic-string drift:** Without the unit test, a future edit could reintroduce an invalid `orderBy`; the regression test must assert the exact `startTime` value.

---

## Testing

### Unit Tests

- [ ] Add `packages/calendar` regression test mocking the `googleapis` client: assert `fetchEvents` calls `events.list` with `orderBy: "startTime"` (and `singleEvents: true`, `timeMin`, `timeMax`)
- [ ] Assert `fetchEventsFromCalendar` calls `events.list` with `orderBy: "startTime"` for any calendar ID
- [ ] If vitest is added to `packages/calendar`, `run-package-command test` for the package must pass

### Integration Tests

- [ ] `pnpm build` passes for `packages/calendar` and `apps/api` (validated pre-task; must remain green post-change)
- [ ] Direct API check (requires real token): `GET /events` returns `{ success: true, data: [...] }` — no `GOOGLE_API_ERROR`

### Manual Validation

- [ ] With a **valid** Google token, trigger the calendar sync in the Dashboard: the sync banner must not show "Failed to sync calendar events"; events render in the week view ordered by start time
- [ ] With an **invalid/expired** token, trigger sync: the app must route to the token retry flow (`TokenRetryModal`, `AUTH_EXPIRED`) — not the generic `GOOGLE_API_ERROR` banner
- [ ] Use "Apply & retry" in `TokenRetryModal` with a valid token: sync succeeds (retry modal flow regression check)
- [ ] If a calendar has zero events, sync succeeds with an empty list and no error banner

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

- [architecture/google-calendar-integration.md](.opencode/architecture/google-calendar-integration.md)
- [architecture/docs/error-handling-strategy.md](.opencode/architecture/docs/error-handling-strategy.md)
- [packages/calendar/src/public/operations.ts](packages/calendar/src/public/operations.ts)
- [apps/api/src/services/calendar-client.ts](apps/api/src/services/calendar-client.ts)
- [apps/api/src/routes/events.ts](apps/api/src/routes/events.ts)
- [apps/web/src/features/completion/TokenRetryModal.tsx](apps/web/src/features/completion/TokenRetryModal.tsx)
- [apps/web/src/pages/DashboardPage.tsx](apps/web/src/pages/DashboardPage.tsx)