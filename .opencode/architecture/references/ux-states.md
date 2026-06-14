# UX States — Reference

# Empty State Flow

# No Tasks

## Message

```text
Create your first task to start generating schedules.
```

## Action

```text
Add Task
```

---

# No Calendar Found

## Message

```text
Creating BrkRoutnXdle Calendar...
```

---

# Loading States

# Initial Load

```text
Loading Calendar...
```

---

# Calculate Week

```text
Generating Schedule...
```

---

# Save

```text
Saving Changes...
```

---

# Error States

# Authentication Error

## Message

```text
Authentication Required
```

## Action

```text
Login Again
```

---

# Network Error

## Message

```text
Connection Error
```

## Actions

```text
Retry
```

---

# Calendar Error

## Message

```text
Unable To Access Calendar
```

---

# Unsaved Changes Flow

## Scenario

User has pending changes.

## Action

```text
Navigate Away
```

## Prompt

```text
You Have Unsaved Changes

Leave Anyway?
```

## Actions

```text
Stay
Leave
```

---

# Logout Flow

## Flow

```text
Logout
    ↓
Clear Local State
    ↓
Redirect To Login
```

---

# Detailed Flow Sub‑Steps

## Task Management Flow

### Create Task — Full Flow

```text
Click Add Task
    ↓
Open Modal
    ↓
Fill Form
    ↓
Save
    ↓
Task Created
```

### Create Task — Form Fields

```text
Name
Duration
Times Per Week
Blocked Week Days
Blocked Periods
Start Date
End Date
```

### Edit Task — Full Flow

```text
Select Task
    ↓
Open Modal
    ↓
Edit Values
    ↓
Save
```

### Delete Task — Full Flow

```text
Select Task
    ↓
Delete
    ↓
Confirm
    ↓
Task Removed
```

---

## Blocked Slot Flow

### Create Block — Full Flow

```text
Click Add Block
    ↓
Select Type
    ↓
Fill Values
    ↓
Save
```

### Block Types — Examples

### Single Day

```text
18/07/2026
18:00 → 20:00
```

### Recurring Weekday

```text
Every Tuesday
18:00 → 20:00
```

### Recurring Period

```text
Every Morning
```

### Calendar Block Creation — Flow

```text
Select Calendar Range
    ↓
Create Block
    ↓
Save
```

---

## Calculate Week Flow

### Success State

```text
Preview Generated
```

### Failure State

```text
Some Tasks Could Not Be Allocated
```

### Failure Example

```text
Could not allocate:

Drawing (2 occurrences)

Gym (1 occurrence)
```

---

## Recalculate Flow

### Full Flow

```text
Calculate Week
    ↓
Preview Generated
    ↓
Not Satisfied
    ↓
Calculate Again
    ↓
New Preview
```

---

## Save Flow

### Success Message

```text
Schedule Saved Successfully
```

### Failure Message

```text
Could Not Save Changes
```

### Failure Actions

```text
Retry
Cancel
```

---

## Manual Calendar Editing

### Drag And Drop — Full Flow

```text
Select Event
    ↓
Drag
    ↓
Drop
    ↓
Preview Updated
```

### Resize Event — Full Flow

```text
Select Event
    ↓
Resize
    ↓
Preview Updated
```

### Delete Event — Full Flow

```text
Select Event
    ↓
Delete
    ↓
Confirm
```

---

## Completion Flow

### Mark Complete — Full Flow

```text
Select Event
    ↓
Mark Complete
    ↓
Update Preview
    ↓
Save
```

### Uncomplete Flow

```text
Select Event
    ↓
Mark Incomplete
    ↓
Save
```

---

## Refresh Flow

### Full Flow

```text
Refresh
    ↓
Load Calendars
    ↓
Load Events
    ↓
Rebuild Availability
```

---

## External Change Flow

### Scenario

User opens Google Calendar and moves an event.

### Then

```text
Return To BrkRoutnXdle
    ↓
Refresh
    ↓
Load Updated Events
```

---

## Settings Flow

### Open Settings — Full Flow

```text
Settings
    ↓
Open Modal
```

### Available Settings — Detail

```text
Shuffle: Enabled / Disabled
Week Start: Monday / Sunday
Available Hours: Start Hour / End Hour
```
