# Logging & Monitoring Strategy

## Purpose

Define what to log, what to never log, and how to monitor system health.

Logging is intentionally minimal in V1 — the backend is stateless (see `ADR-006`) and there is no persistent storage.

---

## Logging Levels

| Level | When |
|---|---|
| `INFO` | Startup, shutdown, successful OAuth flow, calendar created |
| `WARN` | Rate limit approaching, retry attempts, deprecated usage |
| `ERROR` | API failures, auth failures, unexpected exceptions |

---

## What to Log

### Backend

```text
INFO:  OAuth callback received for user <id>
INFO:  Calendar created: <calendarId>
WARN:  Rate limit approaching: <current>/<max>
WARN:  Retry attempt <n> for event <id>
ERROR: Failed to create event <id>: <error>
ERROR: Auth token refresh failed for user <id>
```

### Frontend

```text
ERROR: Failed to generate schedule: <reason>
ERROR: Calendar sync failed: <reason>
WARN:  Preview discarded with unsaved changes
```

Frontend logs are console-only in V1.

---

## Never Log

```text
Access Token
Refresh Token
OAuth Code
Client Secret
User email (unless anonymized)
Event titles
Calendar event content
```

---

## Log Format

```text
<timestamp> <level> <message> [<requestId>]
```

Example:

```text
2026-06-13T10:00:00.000Z INFO OAuth callback received for user abc123 [req-xyz]
```

---

## Backend Endpoint Logging

Log per request:

```text
Method, path, status code, duration
```

Never log:

```text
Request body (unless sanitized)
Authorization header
Query parameters containing tokens
```

---

## Monitoring

### Health Check

```text
GET /health → { "status": "ok" }
```

Used by hosting provider for uptime monitoring.

---

### Alerts (V1)

No automated alerting.

Manual monitoring via:

- Hosting provider dashboard
- Periodic health check pings

---

### Metrics (V1)

No metric collection.

Future considerations:

```text
Request count
Error rate
Average response time
Active sessions
```

---

## Error Tracking (V1)

Console logs only.

Future considerations:

```text
Sentry / Logtail / DataDog
Error grouping
Stack trace capture
```

---

## Audit Trail

No audit trail in V1.

The Google Calendar event history serves as the de-facto audit log for all persisted changes.

---

## References

- `error-handling-strategy.md` — error categories and retry strategy
- `api-specification.md` — error codes and HTTP status codes
- `security-architecture.md` — secure logging rules, secrets management
- `deployment-strategy.md` — environment and hosting details
