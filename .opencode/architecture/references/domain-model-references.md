# Domain Model References

Detailed rules, examples, and enumerations for the BrkRoutnXdle domain model.

---

# Task Priority

Every task contains a priority level.

Supported values:

- low
- medium
- high
- critical

Priority influences schedule generation order.

Higher priority tasks are allocated first.

---

# Task Rules

## Name

Required.

Cannot be empty.

---

## Duration

Required.

Must be a multiple of 30.

Allowed:

```text
30
60
90
120
150
...
```

---

## Times Per Week

Required.

Defines how many times the task should be inserted into the week.

Example:

```text
Gym
3x week
```

---

## Blocked Week Days

Optional.

Prevents the task from being generated on specific days.

Example:

```text
Gym

Blocked:
- Sunday
```

---

## Blocked Periods

Optional.

Prevents the task from being generated during certain periods.

Example:

```text
Running

Blocked:
- Morning
```

---

## Start Date

Optional.

Minimum date for participating in the calculation.

---

## End Date

Optional.

After this date the task no longer participates in the calculation.

---

# Generated Event Rules

## Completed

Represents completion of the activity.

Persisted in Google Calendar via:

```json
{
  "completed": "true"
}
```

---

## CompletedAt

Optional timestamp.

Represents when the completion occurred.

---

# Generated Event Example

```text
Task
Gym
3x week
```

generates:

```text
Monday 18:00
Wednesday 19:00
Friday 17:00
```

---

# Block Types

## Single Day Block

One-time block.

Example:

```text
07/18/2026

18:00 → 22:00
```

---

## Recurring Weekday Block

Recurring weekly block.

Example:

```text
Every Tuesday

18:00 → 22:00
```

---

## Recurring Period Block

Block by period.

Example:

```text
Every Morning
```

---

# Settings Rules

## Shuffle Enabled

When active:

```text
Random distribution
```

When disabled:

```text
Predictable distribution
```

prioritizing consistency.

---

## Week Starts On

Controls:

* Visualization
* Weekly calculation
* Navigation

---

## Available Hours

Defines usable range.

Example:

```text
07:00 → 22:00
```

The algorithm must never generate events outside this range.

---

# Week Rules

The week is determined by the setting:

```text
Monday → Sunday
```

or

```text
Sunday → Saturday
```

---

# Week Slot Rules

Every slot has:

```text
30 minutes
```

Example:

```text
07:00 → 07:30
07:30 → 08:00
08:00 → 08:30
```

---

# Availability Window Example

```text
19:00 → 22:00
```

---

# Period

```ts
type Period =
  | "morning"
  | "afternoon"
  | "evening"
  | "night";
```

## Suggested Mapping

```text
Morning
06:00 → 11:59

Afternoon
12:00 → 17:59

Evening
18:00 → 21:59

Night
22:00 → 05:59
```

---

# WeekDay

```ts
type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";
```
