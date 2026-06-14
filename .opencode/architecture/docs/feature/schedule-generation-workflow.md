# BrkRoutnXdle Schedule Generation Workflow

## Purpose

This document describes the complete flow of generation, simulation, recalculation and persistence of schedules.

The goal is to allow the user to experiment with multiple distributions before saving any changes to Google Calendar.

---

# Core Principle

The algorithm never modifies Google Calendar automatically.

Every change must go through:

```text
Generate
↓
Preview
↓
User Review
↓
Save
```

---

# States

The system works with two states.

## Persisted State

Current state existing in Google Calendar.

```text
Google Calendar
↓
Persisted State
```

---

## Working State

Temporary state used for calculations.

```text
Generate
↓
Preview
↓
Working State
```

---

# Important Rule

The Working State exists only in memory.

No changes are persisted until the user clicks:

```text
Save
```

---

# Initial Load

## Flow

```text
Open App
    ↓
Load Calendars
    ↓
Load Events
    ↓
Build Availability
    ↓
Display Calendar
```

---

## Result

User sees exactly what exists in Google Calendar.

---

# Generate Week

## Goal

Create a new distribution.

---

## Flow

```text
Calculate Week
    ↓
Read Current State
    ↓
Run Algorithm
    ↓
Generate Preview
    ↓
Store Working State
    ↓
Display Preview
```

---

## Result

The user sees a proposal.

No events were saved.

---

# Preview State

## Purpose

Allow inspection before persistence.

---

## User Actions

During preview, the user can:

```text
Move Events
Resize Events
Delete Events
Generate Again
Save
Discard
```

---

# Generate Again

## Goal

Produce a new distribution.

---

## Flow

```text
Generate Again
    ↓
Discard Working State
    ↓
Run Algorithm Again
    ↓
Generate New Preview
```

---

## Rule

No changes are sent to Google Calendar.

---

# Save Workflow

## Goal

Persist the approved schedule.

---

## Flow

```text
Working State
    ↓
Compare With Persisted State
    ↓
Create Operations
    ↓
Apply Operations
    ↓
Google Calendar
```

---

# Operation Types

## Create

Event does not exist.

```text
Create Event
```

---

## Update

Event exists but changed.

```text
Update Event
```

---

## Delete

Event was removed.

```text
Delete Event
```

---

# Discard Workflow

## Goal

Cancel preview.

---

## Flow

```text
Discard
    ↓
Delete Working State
    ↓
Reload Persisted State
```

---

# Recalculate Week

## Goal

Reorganize future events.

---

## Protected Events

Protected events:

```text
start < now
```

or

```text
completed = true
```

---

## Flow

```text
Load Current Week
    ↓
Freeze Protected Events
    ↓
Remove Future Generated Events
    ↓
Run Algorithm
    ↓
Generate Preview
```

---

# Calendar Refresh

## Goal

Synchronize external changes.

---

## Flow

```text
Refresh
    ↓
Load Events
    ↓
Rebuild Availability
    ↓
Replace Local View
```

---

# State Diagram

```text
Persisted State
        │
        ▼
Generate
        │
        ▼
Working State
        │
 ┌──────┼──────┐
 ▼      ▼      ▼
Edit  Generate Discard
Again
 │      │
 └──┬───┘
    ▼
Working State
    │
    ▼
Save
    │
    ▼
Persisted State
```

---

# Success Criteria

The flow is considered complete when:

1. The user can generate a schedule.
2. The user can generate multiple versions.
3. The user can edit the preview.
4. The user can discard changes.
5. The user can save changes.
6. Only differences are persisted.
7. No changes are saved without explicit confirmation.

---

# References

For detailed workflow specifications (simulation details, manual editing, conflict handling, messages), see:

```text
references/workflow-details.md
```

Includes: Multiple Simulations, Manual Preview Editing, Delete Preview Event, Resize Preview Event, Save Strategy, Unsaved Changes Protection, Conflict Handling, Success/Error Messages.
