# Planning — fix-task-sidebar-generation

Status: Approved
Scope: Save flow + sidebar task creation

## Overview

### Objective

Tasks created from the sidebar / generate-week flow don't appear on the calendar, and saving them gives a 404 error.

Expected behavior: every task created through the sidebar or generate-week flow must produce a `CalendarEvent` so it appears on the calendar, and saving must not trigger Google Calendar API calls that return 404.

### Root Causes

1. Sidebar task creation doesn't add a `CalendarEvent` to the `events` array.
2. The 404 is caused by pending events with local UUID IDs being matched by `taskId` in `computeDiff`, then PATCHed to Google Calendar, which returns 404 (the event does not exist remotely yet).

### Scope

- Calendar save flow (pending event creation, `computeDiff` matching, remote sync to Google Calendar)
- Sidebar task creation flow (`events` array mutation)
- generate-week flow task creation
- Related tests

### Recommendation

Adopt **Approach A** — fix the save flow to filter pending events, and ensure sidebar task creation adds a `CalendarEvent` to the `events` array. See `feasibility.md` for the comparison with alternatives B and C.

---

## Navigation

| Document | Content |
|----------|---------|
| `feasibility.md` | Approach A (recommended) and alternatives B, C |
| `impact-analysis.md` | Affected areas, expected changes, breaking changes |
| `risks.md` | Risk assessment and mitigation |

Implementation tasks are created by the Tech Lead based on this plan.

---

## Decision Summary

### Selected Approach

Option A: Fix the save flow to filter pending events + ensure sidebar task creation adds a `CalendarEvent` to the `events` array.

### Reasoning

- Directly addresses both root causes: pending events are no longer matched in `computeDiff` (no bogus PATCH), and sidebar-created tasks gain a real `CalendarEvent` (they appear on the calendar).
- Low complexity, no data migration, no new dependencies.
- Alternatives B and C introduce larger changes with higher regression risk for marginal benefit.

### Expected Outcome

- Tasks created from the sidebar and generate-week flows appear on the calendar.
- Saving a newly created task creates/persists the calendar event, and remote sync targets only events eligible for Google Calendar (no 404s from local UUID matches).
- Existing tests continue to pass; new tests cover pending-event filtering and sidebar event creation.

### Open Questions

- None (planning already completed and approved).