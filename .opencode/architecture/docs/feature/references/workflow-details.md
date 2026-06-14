# Workflow Details — Detailed Specifications

This document contains detailed workflow specifications moved from the main schedule generation workflow entry point.

---

# Multiple Simulations

## Example

```text
Generate
↓
Preview #1
↓
Generate Again
↓
Preview #2
↓
Generate Again
↓
Preview #3
```

---

## Save

Only the last version can be saved.

---

# Manual Preview Editing

## Goal

Allow fine adjustments.

---

## Example

```text
Generated:
Gym
Monday 18:00
```

User moves to:

```text
Monday 19:00
```

---

## Result

The change occurs only in the Working State.

---

# Delete Preview Event

## Flow

```text
Select Event
    ↓
Delete
    ↓
Update Working State
```

---

## Result

Event will not be saved.

---

# Resize Preview Event

## Flow

```text
Select Event
    ↓
Resize
    ↓
Update Working State
```

---

# Save Strategy

## Rule

Send only differences.

---

## Never

```text
Delete All
↓
Recreate All
```

---

## Always

```text
Diff
↓
Minimal Changes
```

---

# Unsaved Changes Protection

## Scenario

Working State exists.

---

## User Action

```text
Refresh
Navigate Away
Logout
```

---

## Prompt

```text
You Have Unsaved Changes

Continue?
```

---

## Options

```text
Stay
Discard
```

---

# Conflict Handling

## Scenario

User modifies event directly in Google Calendar.

---

## Before Save

System detects:

```text
Persisted State Changed
```

---

## Result

Invalid preview.

---

## User Choice

```text
Reload Calendar
```

or

```text
Generate Again
```

---

# Success Messages

## Generate

```text
Schedule Generated
```

---

## Generate Again

```text
New Schedule Generated
```

---

## Save

```text
Schedule Saved Successfully
```

---

# Error Messages

## Generate Failure

```text
Unable To Generate Schedule
```

---

## Save Failure

```text
Unable To Save Schedule
```

---

## Sync Failure

```text
Unable To Refresh Calendar
```
