# Google Calendar Operations — Reference

This file contains detailed endpoint descriptions, payload examples, mark complete/incomplete flows, recalculate week integration, event filtering, OAuth scope details, error handling details, and future integrations referenced from [google-calendar-integration.md](../google-calendar-integration.md).

---

# OAuth Scopes

## Minimum

```text
https://www.googleapis.com/auth/calendar
```

---

## Alternative

Separate reading and writing.

```text
https://www.googleapis.com/auth/calendar.readonly
```

and

```text
https://www.googleapis.com/auth/calendar.events
```

---

## Recommendation

Use:

```text
calendar
```

to simplify V1.

---

# Calendar Discovery

## Endpoint

```text
calendarList.list
```

---

## Expected Result

```text
Primary Calendar

BrkRoutnXdle Calendar

Other Calendars
```

---

# Dedicated Calendar Creation

## Startup Flow

```text
Login
    ↓
Search Calendar
    ↓
Found?
    ↓
Yes → Continue

No → Create Calendar
```

---

## Calendar Creation

### Endpoint

```text
calendars.insert
```

---

### Payload

```json
{
  "summary": "BrkRoutnXdle",
  "description": "Automatically generated schedule"
}
```

---

## Calendar Identification

### Rule

After creation, save:

```text
calendarId
```

locally.

---

### Storage

```text
localStorage
```

---

### Example

```json
{
  "calendarId": "xxxxxxxx"
}
```

---

# Event Model

## Extended Properties

### Purpose

Identify BrkRoutnXdle events.

---

### Structure

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

## Metadata Fields

### app

Identifies the system.

```text
BrkRoutnXdle
```

---

### generated

Indicates automatic generation.

```text
true
```

---

### taskId

Reference to the local Task.

---

### completed

Completion status.

---

### created

Creation timestamp.

---

### updated

Update timestamp.

---

# Event Creation

## Endpoint

```text
events.insert
```

---

## Calendar

```text
BrkRoutnXdle Calendar
```

---

## Example Payload

```json
{
  "summary": "Academia",
  "start": {
    "dateTime": "2026-06-15T18:00:00"
  },
  "end": {
    "dateTime": "2026-06-15T19:00:00"
  },
  "extendedProperties": {
    "private": {
      "app": "BrkRoutnXdle",
      "generated": "true",
      "taskId": "gym"
    }
  }
}
```

---

# Event Reading

## Primary Calendar

Used for:

```text
Availability Detection
```

---

## BrkRoutnXdle Calendar

Used for:

```text
Generated Events
Completed Events
Future Events
```

---

## Endpoint

```text
events.list
```

---

# Completion Detection

## Source

Extended Properties

---

## Example

```json
{
  "completed": "true"
}
```

---

## Rule

When:

```text
completed = true
```

the event becomes protected against recalculation.

---

# Mark Complete

## Flow

```text
User Action
    ↓
Frontend Update
    ↓
Backend Request
    ↓
Google Calendar Update
```

---

## Endpoint

```text
events.patch
```

---

## Payload

```json
{
  "extendedProperties": {
    "private": {
      "completed": "true",
      "completedAt": "timestamp"
    }
  }
}
```

---

# Mark Incomplete

## Endpoint

```text
events.patch
```

---

## Payload

```json
{
  "extendedProperties": {
    "private": {
      "completed": "false"
    }
  }
}
```

---

# Event Update

## Endpoint

```text
events.patch
```

---

## Use Cases

* Drag and drop
* Resize
* Manual move
* Completion
* Metadata update

---

# Event Deletion

## Endpoint

```text
events.delete
```

---

## Use Cases

* Recalculate week
* Manual delete
* Task removal

---

# Recalculate Week Integration

## Flow

```text
Load Events
    ↓
Freeze Protected Events
    ↓
Delete Future Generated Events
    ↓
Generate New Schedule
    ↓
Insert New Events
```

---

## Protected Events

Protected events cannot be removed.

### Condition 1

```text
event.start < now
```

---

### Condition 2

```text
completed = true
```

---

# Event Filtering

## Rule

Filter:

```json
{
  "app": "BrkRoutnXdle"
}
```

---

## Ignore

Events without this property.

---

# Error Handling

## Calendar Not Found

```text
Create Calendar
```

---

## Unauthorized

```text
Refresh Authentication
```

---

## Rate Limit

```text
Retry With Backoff
```

---

## Network Failure

```text
Keep Preview
Allow Retry
```

---

# Future Integrations

## Google Tasks

Possible future integration.

---

## Google Drive

Possible future settings sync.

---

## Multiple Calendars

Possible future support.
