# Generation-Algorithm.md

# BrkRoutnXdle Generation Algorithm

# Purpose

This document defines the algorithm responsible for generating and recalculating weekly schedules.

The algorithm is the system's main differentiator.

Its goals are:

* Discover availability
* Apply restrictions
* Distribute tasks
* Avoid conflicts
* Avoid repeating the previous week
* Produce a valid schedule

---

# Goals

The algorithm must:

* Respect existing events
* Respect blocks
* Respect settings
* Respect task restrictions
* Distribute tasks throughout the week
* Avoid repeating the previous week exactly
* Produce different results when shuffle is active

---

# Constraints

## Restriction Implementation Parity

Every `TaskRestriction` variant defined in `packages/shared/src/types/` MUST have a parallel implementation in **both** the scorer (`scoreSlot` in `taskDistributor.ts`) and the validator (`validateSchedule` in `validator.ts`). Parity between type definition and runtime enforcement is required to prevent silent acceptance of invalid schedules.

# Non Goals

The algorithm MUST NOT:

* Move past events
* Change completed events
* Change started events
* Create conflicts
* Persist data

---

# Inputs

## User Settings

```ts
Settings
```

---

## Tasks

```ts
Task[]
```

---

## Blocked Slots

```ts
BlockedSlot[]
```

---

## Current Week Events

Primary calendar events.

---

## BrkRoutnXdle Events

Events created by the system.

---

## Previous Week Snapshot

Events generated in the previous week.

---

## Current Time

```ts
Date.now()
```

---

# Output

```ts
GeneratedEvent[]
```

---

# High Level Flow
```
Load Inputs
    ↓
Normalize Tasks
    ↓
Sort Tasks By Priority
    ↓
Build Week Slots
    ↓
Mark Occupied Slots
    ↓
Apply Blocked Slots
    ↓
Apply Task Restrictions
    ↓
Build Previous Week Memory
    ↓
Distribute Tasks
    ↓
Validate Schedule
    ↓
Generate Preview
```

---

# Task Priority Ordering

Before task allocation starts, tasks must be sorted.

Priority Order:
```
Critical
↓
High
↓
Medium
↓
Low
```

---

# Previous Week Influence (Memory Model)

Instead of removing previous week matches, the system builds a memory layer.

This memory is used as a penalty factor during allocation.

---

# Allocation Strategy Overview

Each slot evaluation considers:

```
slotScore =
    priorityWeight
    - previousWeekPenalty
    - restrictionPenalty
    + randomnessBonus
```

---

# Phase Summaries

## Phase 1 - Build Week

Build the week in memory using 30-minute slots between the user's availableStartHour and availableEndHour.

## Phase 2 - Mark Occupied Slots

Discover unavailability from both the Primary calendar (read-only) and the BrkRoutnXdle calendar (read/write). Every occupied slot is marked as unavailable.

## Phase 3 - Freeze Existing Events

Protect events that cannot be changed — those where event.start < now or completed = true. Frozen events cannot move, be removed, or be recalculated.

## Phase 4 - Apply Manual Blocks

Apply user-defined unavailability including single day blocks, recurring weekday blocks, and recurring period blocks. These slots become unavailable.

## Phase 5 - Build Availability Pool

Eligible slots = All Slots - Occupied Slots - Frozen Slots - Blocked Slots.

## Phase 6 - Build Task Candidates

Create all required occurrences for each task based on its occurrencesPerWeek and duration.

## Phase 7 - Apply Task Restrictions

Remove invalid slots for each occurrence based on weekday restrictions, period restrictions, and date restrictions (endDate expiry).

## Phase 8 - Previous Week Filtering

Avoid exact repetition of the previous week (same day + same time) when shuffleEnabled = true.

## Phase 9 - Distribution

Shuffle available slots and occurrences randomly, then select the first valid slot for each occurrence.

## Phase 10 - Validation

Ensure consistency: no overlaps, no block violations, no occupied violations, and correct duration integrity.

## Phase 11 - Allocation Failure

Generate a report of any occurrences that could not be allocated. Preview is still generated; the user decides to accept, adjust, or recalculate.

## Phase 12 - Preview Generation

Display the result with generatedEvents and failures arrays.

## Phase 13 - Save

Executed only after user confirmation. Creates, updates, and deletes events in Google Calendar, replacing the previous schedule.

---

# Complexity Considerations

## Expected Scale

Typical user:

```text
5 - 30 tasks
```

Occurrences:

```text
20 - 100 generated events
```

Weekly slots:

```text
~300 slots
```

---

# Performance Goal

Full generation:

```text
< 1 second
```

in a common environment.

---

# Success Criteria

The algorithm is considered valid when:

1. No conflict is generated.
2. No blocked time slot is used.
3. Past events are not changed.
4. Completed events are not changed.
5. The previous week is not repeated exactly.
6. The greatest possible number of tasks is distributed.
7. The user can view a preview before persistence.

---

# References

Detailed phase descriptions, internal weight mapping, tie breakers, examples, multi-slot allocation, save flow, recalculate week details, allocation failure details, and future improvements are available in:

- [references/algorithm-phases.md](references/algorithm-phases.md)
