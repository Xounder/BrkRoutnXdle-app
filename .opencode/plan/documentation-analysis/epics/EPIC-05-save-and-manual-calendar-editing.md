# Epic 05 — Save & Manual Calendar Editing

## Epic Information

### ID

EPIC-05

### Title

Save & Manual Calendar Editing

### Priority

High

### Status

Pending

---

## Objective

Allow the user to persist the approved schedule preview to Google Calendar and manually adjust events in the preview through drag-and-drop, resize, and delete operations before saving.

---

## User Value

### Problem

The algorithm produces a suggestion, but the user needs the final say. They must be able to move events to different times, adjust durations, or remove unwanted occurrences — all while previewing — and then persist only the approved version to Google Calendar with minimal API operations.

### Expected Outcome

The user can fine-tune any generated event by dragging it to a new time slot, resizing its duration, or deleting it from the preview. Once satisfied, a single "Save" click persists only the changes (create, update, delete) to Google Calendar. The user is in full control — the algorithm suggests, the user decides.

### Success Criteria

- User can drag and drop events to new time slots in the preview
- User can resize events to change duration (30min increments)
- User can delete events from the preview
- Save persists only differences between preview and Google Calendar
- Created events appear in Google Calendar
- Updated events reflect changes in Google Calendar
- Deleted events are removed from Google Calendar
- User receives confirmation on successful save
- User can retry on save failure
- Save does not affect events in the Primary calendar

---

## Scope

### Included

- Drag-and-drop event movement in preview (FullCalendar integration)
- Event resize in preview (30-minute increments)
- Event deletion from preview with confirmation
- Save action that computes diff and applies minimal operations
- Create/Update/Delete operations via backend API
- Save progress and confirmation feedback
- Save failure handling with retry option
- Discard action to cancel all changes

### Excluded

- Batch operations or multi-week saves
- Undo individual manual edits (use Discard to revert all)
- Saving to multiple calendars simultaneously

---

## Deliverables

- Drag-and-drop interaction for moving events in preview
- Resize handles for adjusting event duration in preview
- Delete action with confirmation dialog
- Save button that triggers the diff-and-persist workflow
- Backend endpoints for event CRUD (create, update, delete)
- Success/error feedback for save operations

---

## Acceptance Criteria

- [ ] User can drag a preview event to a new time slot and see the position update immediately
- [ ] User can drag an event across different days within the week
- [ ] User can resize an event by dragging its bottom edge (30min snap)
- [ ] User can delete an event from preview after confirming the action
- [ ] User clicks "Save" and only changed events are sent to Google Calendar
- [ ] New events appear in the BrkRoutnXdle Google Calendar after save
- [ ] Moved events reflect their new position in Google Calendar after save
- [ ] Deleted events are removed from Google Calendar after save
- [ ] User sees a success message after save completes
- [ ] If save fails, user sees an error and can retry
- [ ] Undo is not available after save (Discard reverts before save only)

---

## Dependencies

### Required

- EPIC-04 (Schedule Generation & Preview)

### Blocks

- EPIC-06 (Completion, Sync & Conflict Resolution)

---

## Risks

- Google Calendar API rate limits during save with many operations
- Partial save failures (some events created, others failed) need careful handling
- Drag-and-drop must enforce constraints (no overlap with existing events, no placement in blocked slots)

---

## Notes

The save-computes-diff approach (never delete-and-recreate all) minimizes API calls and reduces the risk of data loss. Manual editing gives users the flexibility and control that makes the algorithm trustworthy.

---

## References

- `architecture/docs/feature/save-to-google-calendar.md` — Feature spec
- `architecture/docs/feature/manual-calendar-editing.md` — Feature spec
- `architecture/docs/feature/schedule-generation-workflow.md` — Save workflow, diff strategy
- `architecture/google-calendar-integration.md` — Event CRUD, extended properties
- `architecture/docs/backend/api-specification.md` — Save endpoints
- `architecture/architecture.md` — ADR-007 (preview before save), ADR-009 (Google Calendar wins conflicts)
