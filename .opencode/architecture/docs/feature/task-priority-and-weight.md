# Task-Priority-And-Weight.md

# Task Priority And Weight

## Status

Planned (V1.1)

---

# Purpose

Allow the user to indicate the relative importance of each task.

The goal is to improve the quality of automatic schedule generation when there is competition for available time slots.

Without weight, all tasks have the same priority.

With weight, more important tasks have preference during allocation.

---

# Problem

Currently the algorithm considers all tasks equivalent.

Example:

```text
Gym
English
Drawing
Netflix
```

All have the same allocation priority.

When there are fewer available time slots than needed, any task may not be allocated.

---

# Solution

Add priority to each task.

---

# Priority Levels

## Low

```text
Value: 25
```

---

## Medium

```text
Value: 50
```

---

## High

```text
Value: 75
```

---

## Critical

```text
Value: 100
```

---

# Task Model

## Current

```ts
type Task = {
  id: string;

  name: string;

  durationMinutes: number;

  occurrencesPerWeek: number;
}
```

---

## Future

```ts
type TaskPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

type Task = {
  id: string;

  name: string;

  durationMinutes: number;

  occurrencesPerWeek: number;

  priority: TaskPriority;
}
```

---

# Internal Weight Conversion

The algorithm converts priority to numeric weight.

```ts
const priorityWeight = {
  low: 25,
  medium: 50,
  high: 75,
  critical: 100
};
```

---

# Allocation Strategy

Before schedule generation:

```text
Sort Tasks
↓
Highest Weight First
↓
Lowest Weight Last
```

---

# Ordering Rules

## Primary

```text
Priority Weight DESC
```

---

## Secondary

```text
Duration DESC
```

---

## Tertiary

```text
Occurrences Per Week DESC
```

---

# Example

## Input

```text
Gym
Priority: Critical

English
Priority: High

Drawing
Priority: Medium

Netflix
Priority: Low
```

---

## Allocation Order

```text
Gym
↓
English
↓
Drawing
↓
Netflix
```

---

# Lack Of Availability

## Scenario

There is less available space than needed tasks.

---

## Expected Behaviour

The algorithm tries to preserve:

```text
Critical
↓
High
↓
Medium
↓
Low
```

---

# Allocation Failure Strategy

When a task cannot be fully allocated:

```text
Task Added To Failure List
```

---

## Example

```text
Could Not Allocate

Netflix

2 Missing Occurrences
```

---

# Future Expansion

The structure was designed to support future rules.

---

## Critical

```text
Must Always Be Scheduled
```

---

## High

```text
Avoid Removing
```

---

## Medium

```text
Normal Behaviour
```

---

## Low

```text
First Candidate For Removal
```

---

# UI Changes

## Task Form

New field:

```text
Priority
```

---

## Options

```text
Low
Medium
High
Critical
```

---

# Sidebar

Task cards may display:

```text
Priority Badge
```

---

# Calendar

No mandatory visual changes.

---

# Backward Compatibility

Old tasks without priority should assume:

```text
Medium
```

---

# Local Storage Migration

During loading:

```ts
task.priority ??= "medium";
```

---

# Success Criteria

The feature is considered complete when:

1. Every task has a priority.
2. The algorithm uses priority during ordering.
3. More important tasks have allocation preference.
4. Less important tasks are sacrificed first.
5. Old tasks continue to work.
6. Priority can be changed by the user.
