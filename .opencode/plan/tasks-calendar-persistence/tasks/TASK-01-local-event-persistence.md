# Task Template

## Task Information

### ID

TASK-01

### Title

Local event persistence for inline-created calendar events

### Owner

senior-frontend

### Status

Pending

---

## Description

Manually created calendar events (from 'create in this slot' modal, drag-drop from sidebar) are stored only in-memory in CalendarContext.events. On page refresh they are lost.

Create a localStorage persistence layer for these inline events so they survive page refresh. On CalendarContext initialization, load persisted events and merge with events fetched from the Google Calendar API.

The persistence key should be `brkroutnxdle:events` (following the existing pattern in BlockContext and TaskContext).

### How it should work

1. When a new inline event is created (via `handleCreateTaskInline`, `handleExternalDrop`, or `handleEventDrop`), persist it to localStorage immediately
2. On CalendarContext mount, load persisted events from localStorage and merge with API-fetched events
3. API-fetched events (from Google Calendar) take precedence — if an event ID exists in both sources, use the API version (more current)
4. When Save to Calendar succeeds, remove persisted events that were successfully saved (they now live in Google Calendar)

---

## Acceptance Criteria

- [ ] Inline-created events survive page refresh
- [ ] API-fetched events merge correctly with local events (no duplicates)
- [ ] After Save to Calendar succeeds, saved events are no longer persisted locally (they come from API now)
- [ ] Event deletion also removes from localStorage — CalendarContext must expose a way to delete events (either `deleteEvent` method or `setEvents`-filter pattern) that also persists the removal
- [ ] No regression in existing event display
- [ ] localStorage quota exceeded or parse errors are handled gracefully (app should still work, with console warning)
- [ ] Race condition handled: if localStorage load and API fetch happen concurrently, the merge must be idempotent (no duplicate events, no lost events)

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This task is foundational — TASK-03 depends on event persistence being in place.

---

## Technical Context

### Relevant Components

- CalendarContext (`apps/web/src/contexts/CalendarContext.tsx`) — must add `STORAGE_KEY`, load on mount, persist on setEvents
- DashboardPage (`apps/web/src/pages/DashboardPage.tsx`) — `handleCreateTaskInline` and `handleExternalDrop` call `setEvents` directly; CalendarContext will auto-persist after TASK-01
- localStorage service (`apps/web/src/services/localStorage.ts`) — `storage.get<T>()` with fallback, `storage.set<T>()`, `storage.remove()`
- useCalendarRefresh (`apps/web/src/hooks/useCalendarRefresh.ts`) — `refreshFromApi` currently calls `setEvents(freshEvents)` which REPLACES events (line 25); must be updated to merge with persisted events instead of replacing
- useCalendarEvents (`apps/web/src/hooks/useCalendar.ts`) — already implements merge pattern with `setEvents(prev => ...)` keeping local-only events; must be preserved
- useSaveSchedule (`apps/web/src/hooks/useSaveSchedule.ts`) — after successful save, must trigger removal of persisted events that were persisted to Google Calendar

### Relevant Modules

- `packages/shared/src/types/index.ts` (CalendarEvent type)

### Relevant APIs

- localStorage via existing storage service (already used by BlockContext and TaskContext)

### Relevant Types

- `CalendarEvent` from `@brkroutnxdle/shared`
- `BlockedSlot` from `@brkroutnxdle/shared` (reference pattern for persistence)

---

## Edge Cases

- **Race condition on init**: `useCalendarEvents.ts` loads API data and calls `setEvents(prev => ...)` merge. If TASK-01 adds localStorage loading via `useState(loadEvents)` and then API fetch calls `setEvents`, the merge must not drop local-only events.
- **localStorage quota**: If storage exceeds ~5MB, `storage.set` throws. CalendarContext should catch and log a warning, keeping events in memory.
- **Malformed localStorage data**: `storage.get<T>` catches JSON parse errors and returns fallback. CalendarContext must handle the case where `loadEvents()` returns data that doesn't match the `CalendarEvent[]` shape.
- **Save to Calendar partial success**: Some events may save, others may fail. Only successfully saved events should be removed from localStorage. `useSaveSchedule.ts` already tracks per-event success via `diff.toCreate`.
- **Event ID collision**: An inline-created event's ID (generated via `crypto.randomUUID()`) could theoretically collide with an API event ID. The merge strategy (API wins) handles this, but should be documented.
- **Event deletion persistence**: When an inline event is deleted (via TASK-04), `setEvents(filter)` must also persist the updated array. If CalendarContext wraps `setEvents` to auto-persist, deletion persistence is automatic.

---

## Implementation Guidance

### Expected Changes

1. **CalendarContext.tsx**: Add `STORAGE_KEY = "brkroutnxdle:events"` constant, add `loadEvents()` function (patterned after `loadBlocks()` in BlockContext), initialize state with `useState<CalendarEvent[]>(loadEvents)`, persist on every change via wrapper around `setEvents` (use a `persist` callback like BlockContext's pattern)
2. **DashboardPage.tsx**: No changes needed for persistence — CalendarContext handles it automatically. However, ensure `handleCreateTaskInline` and `handleExternalDrop` still work correctly (they call `setEvents` which now auto-persists)
3. **useSaveSchedule.ts**: After successful save, remove persisted events that were successfully saved from localStorage. The `onSuccess` callback should use `setEvents` to filter out persisted-then-saved events, and CalendarContext's auto-persist will update localStorage
4. **useCalendarRefresh.ts**: Update `refreshFromApi` to merge API events with persisted events instead of replacing: `setEvents(prev => { const apiIds = new Set(freshEvents.map(e => e.id)); return [...prev.filter(e => !apiIds.has(e.id)), ...freshEvents]; })` — matching the merge pattern already used in `useCalendarEvents.ts`
5. **useCalendarEvents.ts**: Confirm existing merge pattern (lines 24-27 of `useCalendar.ts`) is compatible — it keeps local-only events and adds API events where IDs don't match

### Constraints

- Must not break existing Google Calendar save flow
- Must not duplicate events (API events vs local events with same taskId)
- Storage key must follow project convention: `brkroutnxdle:events`
- Must follow the persist pattern established by `BlockContext.tsx` (using `persist` wrapper callback)
- `useCalendarRefresh.refreshFromApi()` must not overwrite inline-created events — must merge them

### Validation Rules

- Create an event via 'create in this slot' modal → refresh page → event should still appear
- Save to Google Calendar → refresh page → event should appear (from API)
- Delete event → refresh page → event should be gone
- Kill localStorage (simulate quota exceeded) → app should still work, event stays in memory
- Corrupt localStorage data → app should handle gracefully with fallback to empty array

---

## Testing

### Unit Tests

- No existing test framework detected — manual testing required

### Manual Validation

- [ ] Create task inline, refresh page, verify event persists
- [ ] Drag task from sidebar to calendar, refresh page, verify event persists
- [ ] Save to Calendar, refresh page, verify event appears (from API)
- [ ] Delete event, refresh page, verify event is gone

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Build passes
- [ ] Lint passes
- [ ] Manual validation completed

---

## References

- `apps/web/src/contexts/CalendarContext.tsx` — target: add storage key + load + auto-persist
- `apps/web/src/contexts/BlockContext.tsx` — reference pattern for localStorage persistence (persist wrapper)
- `apps/web/src/contexts/TaskContext.tsx` — reference pattern for localStorage persistence (persist wrapper)
- `apps/web/src/pages/DashboardPage.tsx` — calls setEvents in handleCreateTaskInline, handleExternalDrop, handleEventDrop
- `apps/web/src/hooks/useSaveSchedule.ts` — after save success, remove persisted events
- `apps/web/src/hooks/useCalendarRefresh.ts` — refreshFromApi must merge, not replace
- `apps/web/src/hooks/useCalendar.ts` — useCalendarEvents merge pattern (lines 24-27)
- `apps/web/src/services/localStorage.ts` — typed localStorage wrapper with get/set/remove + JSON parse error handling
