# Transformation Pipeline

This file contains the transformation pipeline details moved from the canonical data model entry point.

---

## Input Flow

```text
CalendarSourceEvent
    ↓
Normalization
    ↓
Event
    ↓
Slot Generation
```

---

## Scheduling Flow

```text
Task
    ↓
Constraints Engine
    ↓
Priority Sorting
    ↓
Slot Allocation
    ↓
Event Generation
```
