# Task Template

## Task Information

### ID

TASK-01

### Title

Add Save button before Calculate Week for manual saves

### Owner

senior-frontend

### Status

Pending

---

## Description

Currently, the "Save to Calendar" button only appears inside the `PreviewToolbar`, which is only shown after a user performs "Calculate Week" (when `isPreviewActive` is true). Users need the ability to manually save events (e.g., tasks created via the "Create in this slot" modal) to Google Calendar **before** running the schedule generation.

The implementation must:
1. Show a Save button that is visible even when no preview is active
2. Make the save mechanism work for manually created events (events created via inline modals), not just preview events
3. The Save button should be disabled when there's nothing to save (no unsaved events)

---

## Acceptance Criteria

- [ ] Save button is visible on the toolbar even when no preview is active
- [ ] Clicking Save persists manually created calendar events to Google Calendar
- [ ] Save button shows appropriate saving state (loading spinner, progress)
- [ ] Save button is disabled when there are no unsaved changes
- [ ] Existing save behavior for preview events remains unchanged
- [ ] Success/error feedback is shown after save completes

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

No hard dependencies. However, TASK-07 (Task save/persistence bug) also modifies `useSaveSchedule.ts` and `diffCalculator.ts`. Coordinate changes to avoid merge conflicts.

---

## Technical Context

### Relevant Components

- `apps/web/src/pages/DashboardPage.tsx` — Main page; controls visibility of Calculate/Save buttons
- `apps/web/src/features/preview/SaveButton.tsx` — Save button visual component
- `apps/web/src/features/preview/PreviewToolbar.tsx` — Toolbar that currently contains the Save button
- `apps/web/src/hooks/useSaveSchedule.ts` — Save logic hook; currently only saves preview events
- `apps/web/src/services/diffCalculator.ts` — Computes diff between preview and calendar state

### Relevant Modules

- `apps/web/src/contexts/PreviewContext.tsx` — Preview state (isPreviewActive)

### Relevant APIs

- `POST /api/v1/events` — Create event in Google Calendar
- `PATCH /api/v1/events/:id` — Update event
- `DELETE /api/v1/events/:id` — Delete event

### Relevant Types

- `CalendarEvent` — from `@brkroutnxdle/shared`
- `GeneratedEvent` — from `@brkroutnxdle/domain`
- `SaveState` — in `useSaveSchedule.ts`

---

## Implementation Guidance

### Expected Changes

1. **`apps/web/src/pages/DashboardPage.tsx`**:
   - Add a Save button next to the "Calculate Week" button (or in the header toolbar) that's always visible
   - Conditionally disable it when there are no unsaved events (track `events` state that haven't been saved)
   - Wire `onSave` to `handleSave` for both preview and non-preview states

2. **`apps/web/src/hooks/useSaveSchedule.ts`**:
   - Extend `save()` to handle the case when there are no preview events but there are manually created events in `events` state
   - The diff currently compares `previewEvents` vs `events`. When there's no preview, save should compute what manual events need to be created in Google Calendar
   - Add a `saveEvents` method or modify `save` to accept optional event arrays

3. **`apps/web/src/services/diffCalculator.ts`**:
   - May need a new entry point or modification to handle saving manual events (non-preview events) to Google Calendar
   - Currently assumes preview events are the source of truth

4. **`apps/web/src/features/preview/SaveButton.tsx`**:
   - No changes expected (already a reusable component)

### Constraints

- Must not regress existing preview save functionality
- Must handle Google Calendar API rate limits gracefully
- Save progress indicator must work for manual saves too

### Validation Rules

- [ ] Save only sends events that haven't been saved yet (avoid duplicates)
- [ ] After save completes, events should be marked as "saved" and button disabled
- [ ] Error handling (retry, error message) should work the same as preview save

---

## Testing

### Unit Tests

- [ ] Test that save is enabled/disabled correctly based on unsaved events count
- [ ] Test that manually created events are persisted to Google Calendar with correct data
- [ ] Test that save works when no preview is active

### Integration Tests

- [ ] Test end-to-end: create event via modal → save → verify in Google Calendar
- [ ] Test that preview save still works after changes

### Manual Validation

- [ ] Create a task from sidebar, then Save without Calculate Week
- [ ] Verify the task appears in Google Calendar
- [ ] Verify button states (enabled/disabled, saving spinner)
- [ ] Verify error state and retry

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

- `apps/web/src/pages/DashboardPage.tsx` (lines 248-265: button visibility logic)
- `apps/web/src/hooks/useSaveSchedule.ts` (full file: save orchestration)
- `apps/web/src/services/diffCalculator.ts` (full file: diff computation)
- `apps/web/src/features/preview/PreviewToolbar.tsx` (current Save button location)
- `.opencode/architecture/docs/frontend/component-architecture.md`
