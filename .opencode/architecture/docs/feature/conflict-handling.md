# Conflict Handling

## Status

Planned (V1)

---

## Purpose

Detect and resolve conflicts when Google Calendar events change externally while the user has an unsaved preview.

---

## Source Documents

- `google-calendar-integration.md` — Conflict resolution, ADR-009
- `schedule-generation-workflow.md` — Preview conflict detection
- `references/workflow-details.md` — Conflict handling details

---

## Core Principle

Google Calendar always wins.

If a user modifies an event directly in Google Calendar, the next sync pulls the latest state. The system never overwrites user changes.

---

## Detection

```text
User has Working State (preview)
    ↓
System detects: Persisted State Changed
    ↓
Preview becomes invalid
```

---

## User Options

| Option | Description |
|---|---|
| Reload Calendar | Discard preview, load latest from Google Calendar |
| Generate Again | Discard preview, generate new distribution from latest data |

---

## Prevention

| Measure | Description |
|---|---|
| Cache expiry | Events refetched after 5 minutes |
| Save-time check | Before saving, system verifies persisted state hasn't changed |
| Read on calculate | Fresh data loaded every time algorithm runs |

---

## Success Criteria

1. System detects when Google Calendar has changed during preview.
2. User is notified of the conflict.
3. User can choose to reload or regenerate.
4. Google Calendar changes are never overwritten.

---

## References

- ADR-009: Google Calendar wins conflicts
- `google-calendar-integration.md` — Conflict resolution
- `references/workflow-details.md` — Detailed conflict handling
