# Calendar Sync And Refresh

## Status

Planned (V1)

---

## Purpose

Synchronize the application state with Google Calendar to reflect external changes.

Users may modify events directly in Google Calendar — the system must detect and load those changes.

---

## Source Documents

- `ux-flows.md` — Refresh flow, external change flow
- `schedule-generation-workflow.md` — Calendar refresh flow
- `google-calendar-integration.md` — Sync strategy, startup, calculate week, save
- `api-specification.md` — Cache strategy

---

## Refresh Flow

```text
User Clicks Refresh
    ↓
Load Events from Google Calendar
    ↓
Rebuild Availability
    ↓
Replace Local View
```

---

## External Change Detection

When the user returns to BrkRoutnXdle after changing events in Google Calendar:

```text
Open App
    ↓
Validate Session
    ↓
Load Calendars
    ↓
Load Events
    ↓
Open Dashboard
```

Always reads fresh data from Google Calendar.

---

## Automatic Sync Points

| Trigger | Action |
|---|---|
| App startup | Load calendars and events |
| Calculate week | Load fresh data before running algorithm |
| Save | Persist changes to Google Calendar |
| Refresh button | Manual full reload |

---

## Cache Strategy

| Layer | Duration | Storage |
|---|---|---|
| Calendar list | 5 minutes | localStorage |
| Week events | 5 minutes | localStorage |
| Availability | 5 minutes | localStorage |

After expiration: refetch from Google Calendar.

---

## Conflicts

If Google Calendar was modified externally while user had a preview:

```text
Persisted State Changed
    ↓
Preview Invalidated
    ↓
User Choice:
    - Reload Calendar
    - Generate Again
```

---

## Success Criteria

1. User can manually refresh calendar data.
2. External changes are loaded on next app open.
3. Cache expires after 5 minutes and triggers refetch.
4. User is warned when external changes conflict with preview.

---

## References

- `ux-flows.md` — External change flow
- `schedule-generation-workflow.md` — Calendar refresh
- `google-calendar-integration.md` — Sync and cache strategy
