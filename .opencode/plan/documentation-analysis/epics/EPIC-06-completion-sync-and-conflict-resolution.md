# Epic 06 — Completion, Sync & Conflict Resolution

## Epic Information

### ID

EPIC-06

### Title

Completion, Sync & Conflict Resolution

### Priority

Medium

### Status

Pending

---

## Objective

Enable ongoing use of the system: allow users to mark events as completed (protecting them from recalculation), synchronize with external Google Calendar changes, and handle conflicts when the persisted state changes unexpectedly.

---

## User Value

### Problem

Users need to track what they've already done to avoid rescheduling completed tasks. They also need the system to respect changes made directly in Google Calendar (e.g., moving an event on the phone) and to handle situations where the preview becomes stale due to external changes.

### Expected Outcome

After completing an event, it is visually marked as done and never moved by recalculation. When the user manually refreshes or opens the app, external Google Calendar changes are loaded. If the user has a preview that conflicts with the latest Google Calendar state, they are warned and can reload or regenerate.

### Success Criteria

- User can mark a generated event as completed
- Completed events are visually distinct (green styling)
- Completed events are never moved during recalculation
- Completion can be undone (mark as incomplete)
- Completion status persists in Google Calendar (extended properties)
- User can manually refresh calendar data
- External changes are loaded on next app startup
- Cache expires after 5 minutes and triggers refetch
- User is warned when external changes conflict with a preview
- Google Calendar always wins in conflicts

---

## Scope

### Included

- Event completion via context menu or event click
- Completion visual state (green/different styling)
- Undo completion (mark as incomplete)
- Backend endpoints for completion (`PATCH /events/:id/complete`, `PATCH /events/:id/incomplete`)
- Manual refresh button in the header
- Automatic data load on app startup
- 5-minute localStorage cache with expiry-based refetch
- Conflict detection when Google Calendar state differs from preview
- Warning dialog with options: Reload or Generate Again

### Excluded

- Habit tracking or completion streaks (V2+)
- Historical analytics on completion rates (V2+)
- Push notifications for due events (V2+)

---

## Deliverables

- Complete/incomplete action on calendar events
- Visual distinction for completed events
- Backend endpoints for completion status updates
- Manual refresh action
- Cache layer with 5-minute TTL
- Conflict detection and warning dialog

---

## Acceptance Criteria

- [ ] User can click an event and mark it as completed
- [ ] Completed events show a visual change (e.g., green color or checkmark)
- [ ] Completed events are not moved when the user recalculates the week
- [ ] User can undo completion and the event returns to normal state
- [ ] Completion status persists in Google Calendar and survives page refresh
- [ ] User can click "Refresh" and see the latest Google Calendar data
- [ ] External changes (events added/moved in Google Calendar) appear after refresh
- [ ] Calendar data older than 5 minutes triggers automatic refetch
- [ ] If external changes occurred while viewing a preview, user sees a warning
- [ ] User can choose to reload or regenerate when conflict is detected

---

## Dependencies

### Required

- EPIC-05 (Save & Manual Calendar Editing)

### Blocks

- None

---

## Risks

- Completion detection via extended properties depends on Google Calendar API read accuracy
- Cache invalidation timing could lead to stale data display for up to 5 minutes
- Conflict detection requires comparing preview state with current Google Calendar state

---

## Notes

This epic transitions the application from "setup and generate" to "ongoing use." Completion tracking gives users a sense of progress. Sync and conflict handling ensure the system stays reliable even when users interact with Google Calendar directly.

---

## References

- `architecture/docs/feature/completion-flow.md` — Feature spec
- `architecture/docs/feature/calendar-sync-refresh.md` — Feature spec
- `architecture/docs/feature/conflict-handling.md` — Feature spec
- `architecture/google-calendar-integration.md` — Extended properties, sync strategy
- `architecture/domain-model.md` — INV-010 (completed events not recalculated)
- `architecture/architecture.md` — ADR-009 (Google Calendar wins conflicts)
