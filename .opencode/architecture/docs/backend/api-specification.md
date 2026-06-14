# BrkRoutnXdle Backend API Specification

## Purpose
This document defines the backend API.

The backend acts as:

```text
Backend For Frontend (BFF)
```

and has the following responsibilities:
- Google OAuth
- Session management
- Google Calendar integration
- Calendar operations
- Event operations
- Basic availability calculation (optional)
- Token refresh

The backend does NOT have:
- Database
- Business state
- Schedule generation engine
- Own persistence

All week generation logic occurs in the frontend.

---

# Architecture

```text
Frontend
    ↓
Express API
    ↓
Google OAuth
    ↓
Google Calendar API
```

---

# Responsibility Split

## Frontend
Responsible for:

```text
Tasks
Blocked Slots
Settings
Generation Algorithm
Preview State
Schedule Simulation
Schedule Validation
```

## Backend
Responsible for:

```text
Authentication
Token Management
Calendar Access
Event CRUD
Google API Abstraction
```

---

# Base URL

## Development

```text
http://localhost:3001/api
```

## Production

```text
https://api.brkroutnxdle.com/api
```

---

# API Versioning

## Current Version

```text
v1
```

## Base Path

```text
/api/v1
```

---

# Authentication

## Provider
Google OAuth 2.0

## Authentication Flow

```text
Frontend
    ↓
GET /auth/google
    ↓
Google Login
    ↓
GET /auth/google/callback
    ↓
Session Created
    ↓
Frontend Authenticated
```

---

# Session Model
Backend maintains:

```text
Access Token
Refresh Token
Session Metadata
```

Frontend never receives:

```text
Refresh Token
Client Secret
```

---

# Standard Response

## Success

```json
{
  "success": true,
  "data": {}
}
```

## Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Something went wrong"
  }
}
```

---

# Endpoints Overview

## Health

```text
GET /health
```

## Authentication

```text
GET /auth/google
GET /auth/google/callback
GET /auth/me
POST /auth/logout
```

## Calendars

```text
GET /calendars
POST /calendars/ensure
GET /calendars/brkroutnxdle
```

## Events

```text
GET /events
GET /events/week
GET /events/generated
POST /events
PATCH /events/:id
DELETE /events/:id
PATCH /events/:id/complete
PATCH /events/:id/incomplete
```

---

# Save Workflow

See `schedule-generation-workflow.md` for the full save workflow description.

---

# Diff Strategy

## Never

```text
Delete Everything
↓
Recreate Everything
```

## Always

```text
Detect Changes
↓
Apply Minimum Changes
```

---

# Cache Strategy

## Backend Cache
Allowed only for:

```text
Calendar List
Availability
```

## Cache TTL

```text
5 minutes
```

---

# Rate Limiting

## Goal
Prevent abuse.

## Limit

```text
100 requests/minute
```

per session.

---

# Error Codes

## Authentication

```text
AUTH_REQUIRED
AUTH_EXPIRED
AUTH_INVALID
```

## Calendar

```text
CALENDAR_NOT_FOUND
CALENDAR_ACCESS_DENIED
```

## Events

```text
EVENT_NOT_FOUND
EVENT_UPDATE_FAILED
EVENT_DELETE_FAILED
EVENT_CREATE_FAILED
```

## Google

```text
GOOGLE_API_ERROR
GOOGLE_RATE_LIMIT
```

---

# HTTP Status Codes

## Success

```text
200 OK
201 Created
204 No Content
```

## Client Errors

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
```

## Server Errors

```text
500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
```

---

# Security

## Backend Only

```text
Client Secret
Refresh Token
```

## Session Protection

```text
HttpOnly Cookies
Secure Cookies
SameSite=Lax
```

---

# Success Criteria
The API is considered complete when:
1. OAuth works correctly.
2. The BrkRoutnXdle calendar is created automatically.
3. Events can be listed.
4. Events can be created.
5. Events can be updated.
6. Events can be deleted.
7. Completed events can be identified.
8. The frontend can synchronize with Google Calendar.
9. The frontend can persist changes using minimal operations.
10. The backend remains stateless.
11. Google Calendar remains the single source of truth.

---

# References
For detailed endpoint specifications (request/response JSON, query parameters, examples), see:

```text
references/api-endpoints.md
```

Includes: Health, Authentication Endpoints, Calendar Endpoints, Event Endpoints, Availability, Synchronization, Settings, Event Metadata, Supported Operations, Logging, OpenAPI/Swagger.
