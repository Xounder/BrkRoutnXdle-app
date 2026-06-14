# Algorithm Phases — Reference

This file contains detailed phase descriptions, weight mappings, tie breakers, examples, and additional operational details referenced from [generation-algorithm.md](../generation-algorithm.md).

---

# Internal Weight Mapping

Critical = 100
High = 75
Medium = 50
Low = 25

---

# Tie Breakers (Same Priority Level)

1. Duration DESC
2. Occurrences Per Week DESC
3. Name ASC

---

# Example Allocation Order

Input:
```
Gym (Critical)
English (High)
Drawing (Medium)
Netflix (Low)
```
Output:
```
Gym
↓
English
↓
Drawing
↓
Netflix
```

---

# Phase 1 - Build Week

## Goal

Build the week in memory.

---

## Example

```text
Monday
07:00
07:30
08:00
08:30
...
22:00
```

---

## Rules

Use:

```text
availableStartHour
availableEndHour
```

---

## Slot Size

```text
30 minutes
```

---

## Example

```text
07:00 → 07:30
07:30 → 08:00
08:00 → 08:30
```

---

# Phase 2 - Mark Occupied Slots

## Goal

Discover unavailability from Google Calendar.

---

## Sources

### Primary Calendar

Read-only.

---

### BrkRoutnXdle Calendar

Read.

---

## Rule

Every occupied slot must be marked as unavailable.

---

## Example

Evento:

```text
18:00 → 20:00
```

Slots:

```text
18:00
18:30
19:00
19:30
```

All become occupied.

---

# Phase 3 - Freeze Existing Events

## Goal

Protect events that cannot be changed.

---

## Frozen Event Conditions

An event is frozen when:

```text
event.start < now
```

Or:

```text
completed = true
```

---

## Frozen Events

Cannot:

* move
* remove
* recalculate

---

## Example

Now:

```text
Wednesday 14:00
```

Evento:

```text
Wednesday 10:00
```

Frozen.

---

# Phase 4 - Apply Manual Blocks

## Goal

Apply unavailability defined by the user.

---

## Supported Blocks

### Single Day

```text
18/06
18:00 → 20:00
```

---

### Recurring Weekday

```text
Every Tuesday
18:00 → 20:00
```

---

### Recurring Period

```text
Every Morning
```

---

## Result

Slots become unavailable.

---

# Phase 5 - Build Availability Pool

## Goal

Discover all eligible slots.

---

## Formula

```text
Available Slots

=
All Slots

- Occupied Slots

- Frozen Slots

- Blocked Slots
```

---

# Phase 6 - Build Task Candidates

## Goal

Create all required occurrences.

---

## Example

Task:

```text
Gym
3x week
60 minutes
```

Generates:

```text
Gym #1
Gym #2
Gym #3
```

---

## Example

Task:

```text
Drawing
5x week
90 minutes
```

Generates:

```text
Drawing #1
Drawing #2
Drawing #3
Drawing #4
Drawing #5
```

---

# Phase 7 - Apply Task Restrictions

## Goal

Remove invalid slots for each occurrence.

---

## Weekday Restrictions

Example:

```text
Blocked:
Sunday
```

---

Remove:

```text
All Sunday slots
```

---

## Period Restrictions

Example:

```text
Blocked:
Morning
```

---

Remove:

```text
Morning slots
```

---

## Date Restrictions

Example:

```text
endDate
```

---

If the task has expired:

```text
Ignore task
```

---

# Phase 8 - Previous Week Filtering

## Goal

Avoid exact repetition of the previous week.

---

## Enabled Only When

```text
shuffleEnabled = true
```

---

## Example

Previous Week

```text
Gym

Monday 18:00
Wednesday 18:00
Friday 18:00
```

---

Current Week Candidate

```text
Monday 18:00
```

---

Remove candidate.

---

Current Week Candidate

```text
Monday 19:00
```

---

Allowed.

---

## Rule

Block only:

```text
Same Day
+
Same Time
```

---

# Phase 9 - Distribution

## Goal

Distribute tasks.

---

## Distribution Strategy

First:

```text
Random Shuffle
```

of the available slots.

---

Then:

```text
Random Shuffle
```

of the occurrences.

---

## Allocation Rule

Select first valid slot.

---

## Example

```text
Gym #1
```

Candidates:

```text
Monday 18:00
Wednesday 19:00
Friday 17:00
```

Select one.

---

Remove used slots.

---

Continue.

---

## Multi Slot Allocation

### Example

Task

```text
90 minutes
```

---

Required:

```text
3 consecutive slots
```

---

Valid example:

```text
18:00
18:30
19:00
```

---

Invalid example:

```text
18:00
18:30
20:00
```

---

### Consecutive Rule

All slots must be consecutive.

---

### Same Day Multiple Occurrences

Allowed.

---

## Example

```text
Drawing
```

Can generate:

```text
Monday 10:00
Monday 20:00
```

---

# Phase 10 - Validation

## Goal

Ensure consistency.

---

## Validation Rules

### No Overlaps

Events must not overlap.

---

### No Block Violations

Events must not use blocked slots.

---

### No Occupied Violations

Events must not use occupied slots.

---

### Duration Integrity

All events must have the correct duration.

---

# Phase 11 - Allocation Failure

## Goal

Generate report.

---

## Example

```text
Could not allocate:

Gym
1 occurrence

Drawing
2 occurrences
```

---

## User Experience

Even with failures:

```text
Preview is generated
```

---

The user decides:

* accept
* adjust
* recalculate

---

# Phase 12 - Preview Generation

## Goal

Display result.

---

## Preview Properties

```ts
{
  generatedEvents: GeneratedEvent[];

  failures: AllocationFailure[];
}
```

---

# Phase 13 - Save

Executed only after confirmation.

---

## Save Flow

```text
Preview
    ↓
User Accepts
    ↓
Create Events
    ↓
Update Events
    ↓
Delete Replaced Events
    ↓
Google Calendar
```

---

# Recalculate Week

## Goal

Reorganize only the future.

---

## Protected Events

Events:

```text
start < now
```

Never change.

---

## Editable Events

Events:

```text
start >= now
```

Can be recalculated.

---

## Recalculate Flow

```text
Load Current Week
    ↓
Freeze Past
    ↓
Remove Future Generated Events
    ↓
Run Algorithm
    ↓
Generate Preview
```

---

# Future Improvements

## V2

Weighted Priorities

```text
High
Medium
Low
```

---

## V2

Preferred Hours

```text
Prefer evenings
```

---

## V2

Task Dependencies

```text
Task A before Task B
```

---

## V2

Smart Scheduling

Use of AI for distribution.
