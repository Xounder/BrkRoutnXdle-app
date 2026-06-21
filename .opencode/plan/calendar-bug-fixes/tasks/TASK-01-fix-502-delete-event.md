# Task Template

## Task Information

### ID

TASK-01

### Title

Fix 502 Bad Gateway error when deleting events

### Owner

senior-backend

### Status

Pending

---

## Description

Deleting events returns a 502 Bad Gateway with the error message: `Google API error: BrkRoutnXdle calendar not found`. This occurs because the `getBrkCalendarId()` function in `packages/calendar/src/public/operations.ts` makes a `calendarList.list()` API call on every CRUD operation and fails to find the BrkRoutnXdle calendar.

Additionally, events created via "Create in this slot" modal have locally-generated UUIDs as their IDs (from `TaskContext`), but after saving (POST /events), the response containing the real Google Calendar event ID is **ignored** in `useSaveSchedule.ts`. Subsequent DELETE calls use the local UUID, which doesn't match any Google Calendar event.

Two root causes need fixing:
1. **Calendar ID resolution is fragile**: `getBrkCalendarId()` is called on every operation (create, update, delete, fetch). If the calendar list API fails or returns inconsistent results, operations fail with 502.
2. **Event ID mismatch**: After creating events via POST, the returned Google Calendar event ID is discarded. Delete operations use the local task UUID instead of the real Google Calendar event ID.

---

## Acceptance Criteria

- [ ] Deleting an event (via the save schedule flow) no longer returns a 502 error
- [ ] The BrkRoutnXdle calendar ID is cached and reused across operations to reduce API calls
- [ ] After creating an event via POST, the returned Google Calendar event ID is stored and used for subsequent update/delete operations
- [ ] If the BrkRoutnXdle calendar does not exist, the system either auto-creates it (via `/calendars/ensure`) or returns a clear, actionable error
- [ ] Existing events that were saved with local UUIDs can still be found and deleted (migration/fallback strategy)

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This task is independent of all other tasks and can run in parallel with TASK-02 through TASK-05.

---

## Technical Context

### Relevant Components

- `packages/calendar/src/public/operations.ts` — Calendar ID discovery (`getBrkCalendarId`) and all CRUD operations
- `apps/api/src/services/calendar-client.ts` — Error wrapping layer that converts "BrkRoutnXdle calendar not found" into 502 GOOGLE_API_ERROR
- `apps/api/src/routes/events.ts` — DELETE /events/:id endpoint
- `apps/web/src/services/api.ts` — API client (delete calls go through this)
- `apps/web/src/services/diffCalculator.ts` — Computes which events to create/update/delete
- `apps/web/src/hooks/useSaveSchedule.ts` — Save flow that calls POST/PATCH/DELETE but ignores POST response

### Relevant Modules

- `@brkroutnxdle/calendar` — Calendar operations module
- `apps/api` — Backend BFF

### Relevant APIs

- `DELETE /events/:id` — Deletes an event from Google Calendar
- `POST /events` — Creates an event and returns the Google Calendar event with real ID
- `GET /calendars/ensure` — Creates the BrkRoutnXdle calendar if it doesn't exist

### Relevant Types

- `CreateEventPayload` (packages/calendar/src/internal/types.ts)
- `CalendarEvent` (packages/shared/src/types/index.ts)
- `DiffResult` (apps/web/src/services/diffCalculator.ts)

---

## Implementation Guidance

### Expected Changes

1. **Cache calendar ID in `getBrkCalendarId`**: Store the resolved `brkCalId` in a module-level variable (or use a Map keyed by access token) so `calendarList.list()` is called only once per session instead of on every operation.

2. **Handle "calendar not found" gracefully**: In `calendar-client.ts`, catch the "BrkRoutnXdle calendar not found" error and attempt to auto-create the calendar via `POST /calendars/ensure` before retrying the operation. Or expose the error more clearly with a suggestion to create the calendar first.

3. **Store the real Google event ID after creation**: In `useSaveSchedule.ts` (or in the `api.post` response handling), capture the returned `CalendarEvent.id` (the real Google Calendar ID) and update the local event reference so that future update/delete operations use the correct ID. This may require adding an `externalId` field to the local event state.

4. **Update `diffCalculator` if needed**: Ensure the diff calculator can match local events to their Google Calendar counterparts using the stored external ID.

### Constraints

- Must not break existing create/update/fetch operations
- Must handle token expiration gracefully (401 responses)
- The calendar ID cache must be cleared if the access token changes
- Must not introduce circular dependencies

### Validation Rules

- The Google Calendar event ID returned from POST must be preserved in the application state
- Calendar list API must not be called more than once per session for calendar ID resolution
- Deleting an event should send DELETE request with the correct Google Calendar event ID

---

## Testing

### Unit Tests

- [ ] Test that `getBrkCalendarId` caches the result and only calls the API once
- [ ] Test that POST response ID is captured and stored
- [ ] Test that DELETE uses the stored Google event ID

### Integration Tests

- [ ] Test full create → save → delete flow end-to-end
- [ ] Test that calendar not found triggers auto-creation

### Manual Validation

- [ ] Create an event via "Create in this slot" modal, save, then delete — verify no 502 error
- [ ] Verify the calendar list API is only called once by checking server logs
- [ ] Delete a generated event after saving — verify it's actually removed from Google Calendar

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

- `.opencode/plan/calendar-bug-fixes/planning/` (planning documents)
- `packages/calendar/src/public/operations.ts` (lines 21-27: `getBrkCalendarId`, lines 148-155: `deleteEvent`)
- `apps/api/src/services/calendar-client.ts` (lines 14-33: `withErrorHandling`)
- `apps/web/src/hooks/useSaveSchedule.ts` (lines 37-70: save mutation that ignores POST response)
- `apps/web/src/services/diffCalculator.ts` (lines 24-71: diff computation)
