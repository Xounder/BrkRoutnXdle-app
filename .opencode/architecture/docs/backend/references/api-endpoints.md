# API Endpoints — Detailed Specifications

This document contains detailed endpoint specifications moved from the main API specification entry point.

---

# Health

## GET /health

### Purpose

Health Check.

---

### Response

```json
{
  "status": "ok"
}
```

---

# Authentication Endpoints

## GET /auth/google

### Purpose

Start Google authentication.

---

### Response

```json
{
  "authorizationUrl": "..."
}
```

---

## GET /auth/google/callback

### Purpose

Receive OAuth callback.

---

### Query Params

```text
code
state
```

---

### Flow

```text
Exchange Code
↓
Create Session
↓
Redirect Frontend
```

---

## GET /auth/me

### Purpose

Get authenticated user.

---

### Response

```json
{
  "id": "...",
  "email": "...",
  "name": "...",
  "picture": "..."
}
```

---

## POST /auth/logout

### Purpose

End session.

---

### Response

```json
{
  "success": true
}
```

---

# Calendar Endpoints

## GET /calendars

### Purpose

List available calendars.

---

### Response

```json
[
  {
    "id": "...",
    "name": "Primary"
  },
  {
    "id": "...",
    "name": "BrkRoutnXdle"
  }
]
```

---

## POST /calendars/ensure

### Purpose

Ensure dedicated calendar exists.

---

### Flow

```text
Search Calendar
↓
Found?
↓
Yes → Return
No → Create
```

---

### Response

```json
{
  "calendarId": "..."
}
```

---

## GET /calendars/brkroutnxdle

### Purpose

Get dedicated calendar.

---

### Response

```json
{
  "id": "...",
  "name": "BrkRoutnXdle"
}
```

---

# Event Endpoints

## GET /events

### Purpose

List events.

---

### Query Params

```text
calendarId
start
end
```

---

### Example

```http
GET /events?calendarId=primary&start=2026-06-01&end=2026-06-30
```

---

### Response

```json
[
  {
    "id": "...",
    "title": "Gym",
    "start": "...",
    "end": "..."
  }
]
```

---

## GET /events/week

### Purpose

Get week events.

---

### Query Params

```text
weekStart
weekEnd
```

---

### Response

```json
[
  {
    "id": "...",
    "title": "Drawing"
  }
]
```

---

## GET /events/generated

### Purpose

List only events created by BrkRoutnXdle.

---

### Filter

```json
{
  "app": "BrkRoutnXdle"
}
```

---

### Response

```json
[]
```

---

## POST /events

### Purpose

Create event.

---

### Request

```json
{
  "title": "Gym",
  "start": "2026-06-15T18:00:00",
  "end": "2026-06-15T19:00:00",
  "taskId": "gym"
}
```

---

### Response

```json
{
  "id": "event-id"
}
```

---

## PATCH /events/:id

### Purpose

Update event.

---

### Request

```json
{
  "start": "...",
  "end": "...",
  "title": "..."
}
```

---

### Response

```json
{
  "success": true
}
```

---

## DELETE /events/:id

### Purpose

Delete event.

---

### Response

```json
{
  "success": true
}
```

---

## PATCH /events/:id/complete

### Purpose

Mark event as completed.

---

### Request

```json
{
  "completed": true
}
```

---

### Response

```json
{
  "success": true
}
```

---

## PATCH /events/:id/incomplete

### Purpose

Unmark completion.

---

### Response

```json
{
  "success": true
}
```

---

# Availability Endpoint

## GET /availability

### Purpose

Provide consolidated availability.

---

### Query Params

```text
weekStart
weekEnd
```

---

### Response

```json
{
  "occupiedSlots": [],
  "availableSlots": []
}
```

---

### Notes

This endpoint is optional.

The frontend can also calculate availability locally.

---

# Synchronization

## POST /sync

### Purpose

Force synchronization.

---

### Flow

```text
Reload Calendars
↓
Reload Events
↓
Return Fresh Data
```

---

### Response

```json
{
  "success": true
}
```

---

# Settings Endpoint

## GET /settings

### Purpose

Return default application settings.

---

### Response

```json
{
  "defaultStartHour": "07:00",
  "defaultEndHour": "22:00"
}
```

---

# Event Metadata

All events created by the system must contain:

```json
{
  "extendedProperties": {
    "private": {
      "app": "BrkRoutnXdle",
      "generated": "true",
      "taskId": "task-id",
      "completed": "false",
      "created": "timestamp",
      "updated": "timestamp"
    }
  }
}
```

---

# Supported Operations

## Create

```text
POST /events
```

---

## Update

```text
PATCH /events/:id
```

---

## Delete

```text
DELETE /events/:id
```

---

# Logging

## Levels

```text
INFO
WARN
ERROR
```

---

## Never Log

```text
Access Token
Refresh Token
OAuth Code
Client Secret
```

---

# OpenAPI

## Future

```text
/openapi.json
```

---

## Swagger

```text
/docs
```
