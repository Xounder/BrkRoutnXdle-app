# Error Handling Strategy

## Purpose

Define how errors are categorized, communicated, and handled across the system.

Error handling is split between frontend (user-facing) and backend (API-facing).

---

## Error Categories

### Authentication Errors

| Code | Meaning | User Action |
|---|---|---|
| `AUTH_REQUIRED` | Not logged in | Login |
| `AUTH_EXPIRED` | Session expired | Re-authenticate |
| `AUTH_INVALID` | Invalid credentials | Login again |

---

### Calendar Errors

| Code | Meaning | Resolution |
|---|---|---|
| `CALENDAR_NOT_FOUND` | Calendar missing | Auto-create on startup |
| `CALENDAR_ACCESS_DENIED` | Permission revoked | Re-authenticate |

---

### Event Errors

| Code | Meaning | Resolution |
|---|---|---|
| `EVENT_NOT_FOUND` | Deleted externally | Refresh calendar |
| `EVENT_CREATE_FAILED` | API write failure | Retry |
| `EVENT_UPDATE_FAILED` | API update failure | Retry |
| `EVENT_DELETE_FAILED` | API delete failure | Retry |

---

### Google API Errors

| Code | Meaning | Resolution |
|---|---|---|
| `GOOGLE_API_ERROR` | Generic API failure | Retry with backoff |
| `GOOGLE_RATE_LIMIT` | Quota exceeded | Wait and retry |

---

### Algorithm Errors

| Scenario | Behavior |
|---|---|
| No available slots | Report allocation failures per task |
| Partial allocation | Generate preview with warning |
| No tasks defined | Show empty state: "Create your first task" |

See `generation-algorithm.md` Phase 11 for allocation failure details.

---

## Backend Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Event not found"
  }
}
```

No stack traces, no internal details.

---

## Frontend Error Handling

| Layer | Strategy |
|---|---|
| React Query | `onError` callbacks, automatic retry (3 attempts) |
| Google OAuth | Redirect to login on auth failure |
| Calendar API | Exponential backoff on rate limit |
| Preview save | Show failure panel, allow retry |

---

## Retry Strategy

| Error Type | Retries | Interval |
|---|---|---|
| Network failure | 3 | 1s, 2s, 4s |
| Rate limit | 3 | 5s, 10s, 20s |
| Auth expired | 1 | Immediate (re-auth) |
| Calendar not found | 1 | Immediate (create) |
| Event conflict | 0 | Report to user |

---

## UI Error States

### Toast / Banner

```text
[Error] Unable to save schedule
[Error] Authentication required
[Warning] Some tasks could not be allocated
[Info] Calendar updated externally — please refresh
```

### Modal

```text
Could not allocate:

- Drawing (2 occurrences)
- Gym (1 occurrence)
```

See `ux-flows.md` for full UI error state specifications.

---

## Error Boundaries

React error boundaries catch unexpected render errors.

Scope: Each major component tree (Calendar, Sidebar, Modal).

---

## User Facing Messages

All user-facing messages must be:

- Specific about what went wrong
- Actionable (what the user can do)
- Free of technical details

---

## References

- `api-specification.md` — HTTP status codes and error codes
- `ux-flows.md` — UI error states and user messages
- `generation-algorithm.md` — allocation failure handling
- `google-calendar-integration.md` — API error handling
- `logging-monitoring-strategy.md` — error logging
