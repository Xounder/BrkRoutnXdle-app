# Canonical-Data-Model.md

# BrkRoutnXdle Canonical Data Model

## Purpose

Defines the single canonical data model ensuring all packages use the same interpretation of entities.

---

# Core Principle

```text
There is only one truth for each entity in the system.
```

---

# Entity Overview

```text
Task
Event
CalendarSlot
BlockedSlot
Schedule
UserSettings
CalendarSourceEvent
```

---

# Task

## Canonical Model

```ts
type TaskPriority = "low" | "medium" | "high" | "critical";

type Task = {
  id: string;

  name: string;

  durationMinutes: number;

  occurrencesPerWeek: number;

  priority: TaskPriority;

  constraints: TaskConstraints;

  metadata: TaskMetadata;
};
```

---

## TaskConstraints

```ts
type TaskConstraints = {
  allowedTimeRanges?: TimeRange[];

  blockedDays?: WeekDay[];

  blockedPeriods?: DayPeriod[];

  minGapMinutes?: number;

  maxPerDay?: number;
};
```

---

## TaskMetadata

```ts
type TaskMetadata = {
  createdAt: string;
  updatedAt: string;

  source: "manual" | "imported";

  tags?: string[];
};
```

---

# Event

## Canonical Model

```ts
type EventType =
  | "task"
  | "external"
  | "blocked"
  | "system";

type Event = {
  id: string;

  title: string;

  start: string;

  end: string;

  type: EventType;

  taskId?: string;

  sourceCalendarId: string;

  completed: boolean;

  metadata: EventMetadata;
};
```

---

## EventMetadata

```ts
type EventMetadata = {
  createdAt: string;
  updatedAt: string;

  generatedBy: "brkroutnxdle" | "user" | "google";

  priority?: TaskPriority;

  originalHash?: string;
};
```

---

# CalendarSlot

## Canonical Model

```ts
type CalendarSlot = {
  start: string;
  end: string;

  status: "free" | "occupied" | "blocked";

  source: "google" | "system" | "manual";

  weight: number;
};
```

---

# BlockedSlot

## Canonical Model

```ts
type BlockedSlot = {
  id: string;

  start: string;
  end: string;

  reason?: string;

  scope: "day" | "period" | "custom";
};
```

---

# Schedule

## Canonical Model

```ts
type Schedule = {
  weekStart: string;
  weekEnd: string;

  tasks: Task[];
  events: Event[];

  score: number;

  generatedAt: string;
};
```

---

# UserSettings

## Canonical Model

```ts
type UserSettings = {
  defaultStartHour: string;
  defaultEndHour: string;

  enableShuffle: boolean;

  allowTaskRepetition: boolean;

  timezone: string;
};
```

---

# CalendarSourceEvent

## Canonical Model

```ts
type CalendarSourceEvent = {
  id: string;

  summary: string;

  start: string;
  end: string;

  calendarId: string;

  extendedProperties?: Record<string, any>;
};
```

---

# Normalization Rules

## Rule 1: Everything becomes Event

```text
Google Event → CalendarSourceEvent → Event
```

---

## Rule 2: Tasks generate Events

```text
Task → Scheduling Engine → Event
```

---

## Rule 3: BlockedSlots influence CalendarSlots

```text
BlockedSlot → CalendarSlot.status = blocked
```

---

## Rule 4: External events are read-only

```text
type = external → cannot be modified
```

---

# Identity Rules

## Event Identity

Event identity is determined by:

```text
sourceCalendarId + start + end + taskId
```

---

## Task Identity

Task identity is:

```text
id (UUID)
```

---

# Data Ownership Rules

## Source of Truth

```text
Google Calendar = truth for events
```

---

## Derived Data

```text
Tasks → derived schedule
Slots → derived availability
```

---

# Consistency Rules

## Rule 1

Events must always reflect real calendar state.

---

## Rule 2

Tasks never directly mutate events.

---

## Rule 3

Blocked slots override all scheduling logic.

---

## Rule 4

External events cannot be overwritten.

---

# Versioning Strategy

## Rule

Any change in this model is considered breaking.

---

## Impacted Packages

```text
domain
calendar
web
api
```

---

# Future Extensions

## Possible additions

```text
RecurringTask
FlexibleTask
AdaptivePriorityTask
ConstraintGraph
```

---

# Success Criteria

The canonical model is valid when:

1. All packages use identical entity definitions
2. No duplicate Task/Event definitions exist anywhere else
3. Google Calendar mapping is consistent
4. Scheduling engine uses only canonical entities
5. No ambiguity exists between Event types
6. Every entity has a single source of truth definition

---

# References

For transformation pipeline details, see [`references/transformation-pipeline.md`](references/transformation-pipeline.md).
