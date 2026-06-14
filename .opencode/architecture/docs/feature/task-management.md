# Task Management

## Status

Planned (V1)

---

## Purpose

Allow the user to create, edit, and delete task definitions.

A Task is a generation rule — it defines what activity should be scheduled, how long it takes, how often it occurs, and any constraints.

---

## Source Documents

- `domain-model.md` — Task entity, properties, invariants
- `canonical-data-model.md` — Task canonical model
- `ux-flows.md` — Task management flow
- `component-architecture.md` — TaskPanel, TaskModal, TaskContext
- `event-classification.md` — Task event type

---

## Task Model

```ts
type Task = {
  id: string;
  name: string;
  durationMinutes: number;
  occurrencesPerWeek: number;
  priority: TaskPriority;
  blockedWeekDays: WeekDay[];
  blockedPeriods: Period[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## Priority Levels

| Level | Weight | Behavior |
|---|---|---|
| Critical | 100 | Must always be scheduled |
| High | 75 | Avoid removing |
| Medium | 50 | Normal behavior (default) |
| Low | 25 | First candidate for removal |

---

## UX Flow

### Create Task

Opens a modal with form: name, duration, frequency, constraints, date range, priority.

### Edit Task

Select a task, modify values in the same modal form.

### Delete Task

Select a task, confirm deletion, it is removed.

---

## UI Components

- Sidebar TaskPanel — lists all tasks
- TaskModal — create/edit form
- Task cards with priority badge

---

## Business Rules

| Rule | Description |
|---|---|
| INV-001 | Duration must be multiple of 30 |
| INV-002 | Duration must be greater than zero |
| INV-003 | occurrencesPerWeek must be greater than zero |
| INV-004 | Name cannot be empty |

---

## Data Storage

Tasks are stored in localStorage under `tasks` key.

---

## Success Criteria

1. User can create a task with all required properties.
2. User can edit any property of an existing task.
3. User can delete a task.
4. Tasks persist across page refreshes.
5. Old tasks without priority default to "medium".

---

## References

- `task-priority-and-weight.md` — Detailed priority specification
- `domain-model.md` — Full task model and invariants
- `component-architecture.md` — Frontend task components
