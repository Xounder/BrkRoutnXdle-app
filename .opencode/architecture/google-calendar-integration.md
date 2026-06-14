# Google-Calendar-Integration.md

# BrkRoutnXdle Google Calendar Integration

# Purpose

This document defines the entire integration between BrkRoutnXdle and Google Calendar.

The goal is to ensure that:

* Google Calendar is the single source of truth.
* The system can discover availability.
* The system can create events.
* The system can update events.
* The system can remove events.
* The system can identify events created by itself.

---

# Integration Principles

## Google Calendar Is The Source Of Truth

All events must exist in Google Calendar.

The system must never maintain a parallel copy of events.

All synchronization must originate from Google Calendar.

---

## Dedicated Calendar

The system uses its own calendar.

Name:

```text
BrkRoutnXdle
```

---

## Read + Write Separation

### Primary Calendar

Responsible for:

* Personal commitments
* Work
* College
* External events

Permissions:

```text
Read Only
```

---

### BrkRoutnXdle Calendar

Responsible for:

* Generated tasks
* Events created by the algorithm
* Completion marking

Permissions:

```text
Read + Write
```

---

# OAuth

## Authentication Provider

Google OAuth 2.0

---

## Login Flow

```text
Frontend
    ↓
Google Login
    ↓
Backend OAuth Callback
    ↓
Token Exchange
    ↓
Frontend Authenticated
```

---

# Calendar Discovery

Discover existing calendars using the Calendar List API. The system identifies the Primary calendar and the BrkRoutnXdle calendar among existing calendars.

---

# Dedicated Calendar Creation

On first login, the system searches for the BrkRoutnXdle calendar. If not found, it creates a new dedicated calendar and stores its calendarId locally.

---

# Event Model

All events created by the system carry extended properties for identification and metadata:

* app: Identifies the system (BrkRoutnXdle)
* generated: Indicates automatic generation
* taskId: Reference to the local Task
* completed: Completion status
* created: Creation timestamp
* updated: Update timestamp

---

# Event Creation

Generated events are persisted to the BrkRoutnXdle Calendar using the events.insert endpoint. Payload includes summary, start/end time, and extended properties.

---

# Event Reading

Primary calendar events are read for availability detection. BrkRoutnXdle calendar events are read for generated events, completed events, and future events. Uses the events.list endpoint.

---

# Availability Discovery

Both Primary and BrkRoutnXdle calendar events are used to determine busy times. An existing event equals unavailable time.

---

# Completion Detection

Completion is detected via extended properties. When completed = true, the event becomes protected against recalculation.

---

# Event Update

Events are updated via events.patch. Use cases include drag and drop, resize, manual move, completion, and metadata update.

---

# Event Deletion

Events are removed via events.delete. Use cases include week recalculation, manual delete, and task removal.

---

# Sync Strategy

## Startup

```text
Load Calendars
    ↓
Load Events
    ↓
Build Availability
```

---

## Calculate Week

```text
Load Fresh Data
    ↓
Run Algorithm
    ↓
Generate Preview
```

---

## Save

```text
Preview
    ↓
Insert
Update
Delete
    ↓
Google Calendar
```

---

# Cache Strategy

Caches calendar list, week events, and derived availability for 5 minutes in localStorage to reduce API calls.

---

# Conflict Resolution

Google Calendar always wins. If a user moves an event directly in Google Calendar, the next sync pulls from Google Calendar. The system must never overwrite user changes.

---

# Error Handling

Common errors: Calendar Not Found (create calendar), Unauthorized (refresh authentication), Rate Limit (retry with backoff), Network Failure (keep preview, allow retry).

---

# Security

Access Token is never stored permanently. Refresh Token and Client Secret are backend only. The frontend never receives Client Secret or Refresh Token.

---

# Success Criteria

The integration is considered complete when:

1. The user can authenticate with Google.
2. The BrkRoutnXdle calendar is created automatically.
3. Events can be read.
4. Events can be created.
5. Events can be updated.
6. Events can be removed.
7. Completed events can be identified.
8. The system can discover availability.
9. The system can recalculate the week.
10. Google Calendar remains the single source of truth.

---

# References

Detailed endpoint descriptions, JSON payload examples, mark complete/incomplete flows, recalculate week integration, event filtering, OAuth scope details, rate limiting, error handling details, and future integrations are available in:

- [references/google-operations.md](references/google-operations.md)
