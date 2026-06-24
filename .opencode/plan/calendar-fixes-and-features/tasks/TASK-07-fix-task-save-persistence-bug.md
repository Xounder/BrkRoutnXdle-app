# Task Template

## Task Information

### ID

TASK-07

### Title

Fix task save and persistence bug — wrong event names and data loss on refresh

### Owner

senior-frontend

### Status

Pending

---

## Description

There are two related bugs in the save/persistence flow:

**Bug A — Wrong event names in Google Calendar:**
When events are saved to Google Calendar, they appear with names like "Task 16d4aed8-..." instead of the actual task name. The `diffCalculator.ts` uses `Task ${preview.taskId}` as the event summary instead of the actual task title. Additionally, Google Calendar shows "Created by: Renan Fellipe" because the summary lacks the proper task name.

**Bug B — Events disappear after page refresh:**
After saving events to Google Calendar and refreshing the page, the events do not reappear in the app. This happens because:
1. The `events` state in `DashboardPage.tsx` is initialized as an empty array `[]`
2. The `useCalendarEvents` hook that fetches events from the backend on mount is **commented out** (line 191: `// useCalendarEvents(timeMin, timeMax); // Will be wired when backend is ready`)
3. There is no mechanism to load saved events from the API on page load

**Bug C — Events getting deleted during save:**
When saving tasks, events that were already in calendar slots get deleted. This is likely because the `computeDiff` function compares `previewEvents` against the local `events` state, and events not present in the preview are marked for deletion. If the local `events` array is empty at the start, all previous events get re-created and no deletion happens, but if there are mixed manual events and preview events, some may be incorrectly deleted.

---

## Acceptance Criteria

- [ ] Saved events appear in Google Calendar with the correct task name (not "Task {uuid}")
- [ ] After page refresh, previously saved events are loaded from Google Calendar and appear in the app
- [ ] Saving does not delete existing events that were not part of the current save operation
- [ ] Events created manually (via Create in this slot) persist across page refreshes after saving
- [ ] The summary field sent to Google Calendar API uses the correct task title

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This task modifies `diffCalculator.ts` and `DashboardPage.tsx`, which are also touched by TASK-01 (Save button before Calculate). Coordinate changes to avoid merge conflicts.

---

## Technical Context

### Relevant Components

- `apps/web/src/services/diffCalculator.ts` — Uses `Task ${preview.taskId}` as summary (line 98)
- `apps/web/src/pages/DashboardPage.tsx` — Events state initialization (line 50), commented-out `useCalendarEvents` (line 191)
- `apps/web/src/hooks/useCalendar.ts` — `useCalendarEvents` hook that fetches events from API
- `apps/web/src/hooks/useSaveSchedule.ts` — Save orchestration, event state update logic
- `apps/web/src/services/api.ts` — API client

### Relevant APIs

- `GET /api/v1/events?timeMin=...&timeMax=...` — Fetch events from Google Calendar
- `POST /api/v1/events` — Create event
- `PATCH /api/v1/events/:id` — Update event
- `DELETE /api/v1/events/:id` — Delete event

### Relevant Types

- `DiffResult` — `toCreate`, `toUpdate`, `toDelete`
- `CalendarEvent` — from `@brkroutnxdle/shared`
- `GeneratedEvent` — from `@brkroutnxdle/domain`

---

## Implementation Guidance

### Expected Changes

1. **Fix `apps/web/src/services/diffCalculator.ts`** (Bug A — line 98):

   Change the summary from a generic `Task ${taskId}` to use the actual task title. The `computeDiff` function currently doesn't have access to the task list. Two options:

   **Option 1 (Recommended):** Pass the tasks list to `computeDiff` and look up the title:

   ```typescript
   export function computeDiff(
     previewEvents: GeneratedEvent[],
     persistedEvents: CalendarEvent[],
     tasks: Task[], // New parameter
   ): DiffResult {
     // ...
     result.toCreate.push({
       summary: getTaskTitle(preview.taskId, tasks) ?? `Task ${preview.taskId}`,
       start: { dateTime: preview.start },
       end: { dateTime: preview.end },
       taskId: preview.taskId,
     });
   }
   ```

   **Option 2:** Map task titles earlier and pass them through `GeneratedEvent` extended properties.

2. **Fix `apps/web/src/pages/DashboardPage.tsx`** (Bug B — line 191):

   Uncomment and wire up `useCalendarEvents` to fetch events on page mount:

   ```typescript
   const eventsQuery = useCalendarEvents(timeMin, timeMax);
   ```

   And ensure the `useCalendar` context `setEvents` is properly populated with fetched data.

3. **Fix save behavior** (Bug C):

   In `apps/web/src/hooks/useSaveSchedule.ts`, ensure that the save process:
   - Only deletes events that were explicitly removed from the preview
   - Does not delete events that existed before the preview was created
   - Properly reconciles the `events` state after save

   Consider separate tracking of "which events existed before the preview" to prevent false deletions.

### Constraints

- Must not break existing save flow (preview → save to Google Calendar)
- Event names in Google Calendar must be human-readable (the task title, not a UUID)
- API fetching must handle loading, error, and empty states

### Validation Rules

- [ ] After save, Google Calendar shows "Morning Exercise" instead of "Task a1b2c3d4-..."
- [ ] After page refresh, all saved events appear in the app
- [ ] Manually created events (not from generation) are not deleted during save
- [ ] Generated events that were not modified during edit are not deleted during save

---

## Testing

### Unit Tests

- [ ] Test that `computeDiff` uses correct task title in summary
- [ ] Test that events are properly fetched on page mount
- [ ] Test that save does not delete non-preview events

### Integration Tests

- [ ] Test full flow: create event → save → refresh → verify event persists
- [ ] Test that event title in Google Calendar matches task title

### Manual Validation

- [ ] Create a task named "Reading" → Calculate Week → Save → verify Google Calendar shows "Reading"
- [ ] Refresh the page → verify "Reading" event still appears in the app
- [ ] Create a manual event (not from preview) → Save → verify it persists across refresh
- [ ] Edit a generated event → Save → verify edit persists across refresh
- [ ] Verify no events are incorrectly deleted after save

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

- `apps/web/src/services/diffCalculator.ts` (line 98: `summary: \`Task ${preview.taskId}\``)
- `apps/web/src/pages/DashboardPage.tsx` (line 50: `events` state init; line 191: commented-out `useCalendarEvents`)
- `apps/web/src/hooks/useCalendar.ts` (full file: `useCalendarEvents` hook)
- `apps/web/src/hooks/useSaveSchedule.ts` (full file: save orchestration)
- `apps/api/src/routes/events.ts` (GET /events endpoint)
