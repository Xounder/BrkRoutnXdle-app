# Event Classification Details

Detailed lifecycle descriptions, conflict resolution scenarios, scheduling impact rules, and JSON examples for BrkRoutnXdle event classification.

---

# Lifecycle Rules

## Task Event

```text
Created → Scheduled → Completed → Archived
```

---

## External Event

```text
Imported → Static
```

---

## Blocked Event

```text
Created → Active → Updated/Deleted
```

---

## System Event

```text
Generated → Ephemeral
```

---

# Scheduling Impact Rules

## Blocked

```text
Hard constraint
Slot is unusable
```

---

## External

```text
Hard constraint
Slot is occupied
```

---

## Task

```text
Soft constraint
Can be moved
```

---

## System

```text
No constraint impact
```

---

# Conflict Resolution

## Scenario 1: Task vs External

```text
External wins
Task must relocate
```

---

## Scenario 2: Task vs Blocked

```text
Blocked wins
Task must relocate
```

---

## Scenario 3: External vs Blocked

```text
Both coexist logically
Slot remains unavailable
```

---

## Scenario 4: Task vs Task

Resolved by:

```text
Priority → Weight → Constraints → Randomness
```

---

# JSON Examples

## Task Event

```json
{
  "type": "task",
  "taskId": "gym",
  "title": "Gym",
  "start": "2026-06-15T18:00:00",
  "end": "2026-06-15T19:00:00"
}
```

---

## External Event

```json
{
  "type": "external",
  "title": "Meeting",
  "start": "2026-06-15T14:00:00",
  "end": "2026-06-15T15:00:00"
}
```

---

## Blocked Event

```json
{
  "type": "blocked",
  "title": "No study time",
  "start": "2026-06-16T10:00:00",
  "end": "2026-06-16T12:00:00"
}
```

---

## System Event

```json
{
  "type": "system",
  "title": "Schedule snapshot",
  "start": "2026-06-15T00:00:00",
  "end": "2026-06-15T23:59:59"
}
```
