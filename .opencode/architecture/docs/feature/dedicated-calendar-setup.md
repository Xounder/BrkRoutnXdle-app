# Dedicated Calendar Setup

## Status

Planned (V1)

---

## Purpose

Create and maintain a dedicated BrkRoutnXdle calendar in the user's Google Calendar.

This calendar stores all generated events, keeping them separate from personal events.

---

## Source Documents

- `architecture.md` — Dedicated calendar strategy, ADR-004
- `google-calendar-integration.md` — Calendar discovery, creation, read/write separation

---

## Calendar Separation

### Primary Calendar

- Read-only
- Used for availability discovery
- Contains personal commitments

### BrkRoutnXdle Calendar

- Read + Write
- Stores generated tasks
- Stores completed tasks
- Stores system events

---

## Flow

```text
First Login
    ↓
Discover Calendars (Calendar List API)
    ↓
BrkRoutnXdle Calendar Found?
    ├── Yes → Store calendarId locally
    └── No  → Create dedicated calendar
                ↓
              Name: "BrkRoutnXdle"
                ↓
              Store calendarId locally
```

---

## Calendar Properties

| Property | Value |
|---|---|
| Name | BrkRoutnXdle |
| Permissions | Read + Write |
| Scope | Generated events only |

---

## Error Scenarios

| Error | Resolution |
|---|---|
| Calendar not found | Auto-create on startup |
| Calendar access denied | Re-authenticate |

---

## Success Criteria

1. Dedicated calendar is created automatically on first login.
2. Existing calendar is detected on subsequent logins.
3. Calendar ID is stored locally for API operations.
4. Separation between personal and generated events is maintained.

---

## References

- `google-calendar-integration.md` — Calendar discovery and creation
- ADR-004: Dedicated BrkRoutnXdle calendar
- API: `GET /calendars`, `POST /calendars/ensure`, `GET /calendars/brkroutnxdle`
