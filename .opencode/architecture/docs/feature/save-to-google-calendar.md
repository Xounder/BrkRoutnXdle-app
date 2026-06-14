# Save To Google Calendar

## Status

Planned (V1)

---

## Purpose

Persist the approved schedule preview to Google Calendar.

Only differences are sent — the system never deletes and recreates all events.

---

## Source Documents

- `schedule-generation-workflow.md` — Save workflow, operation types
- `google-calendar-integration.md` — Event creation, update, deletion
- `api-specification.md` — Save workflow, diff strategy
- `references/workflow-details.md` — Save strategy, diff approach

---

## Flow

```text
Working State
    ↓
Compare With Persisted State
    ↓
Create Diff Operations
    ↓
Apply Operations
    ↓
Google Calendar
```

---

## Operation Types

| Operation | Condition |
|---|---|
| Create | Event exists in preview but not in Google Calendar |
| Update | Event exists in both but properties changed |
| Delete | Event exists in Google Calendar but not in preview |

---

## Diff Strategy

### Never

```text
Delete Everything
    ↓
Recreate Everything
```

### Always

```text
Detect Changes
    ↓
Apply Minimum Changes
```

---

## API Operations

| Method | Endpoint |
|---|---|
| Create | `POST /events` |
| Update | `PATCH /events/:id` |
| Delete | `DELETE /events/:id` |

---

## Event Metadata

Every generated event includes:

```json
{
  "extendedProperties": {
    "private": {
      "app": "BrkRoutnXdle",
      "generated": "true",
      "completed": "false",
      "taskId": "task-id",
      "created": "timestamp",
      "updated": "timestamp"
    }
  }
}
```

---

## Success Criteria

1. Only differences are persisted (no full recreate).
2. Created events appear in Google Calendar.
3. Updated events reflect changes in Google Calendar.
4. Deleted events are removed from Google Calendar.
5. User receives confirmation on success.
6. User can retry on failure.

---

## References

- `schedule-generation-workflow.md` — Complete save workflow
- `google-calendar-integration.md` — Event CRUD details
- `api-specification.md` — Save endpoints and error codes
