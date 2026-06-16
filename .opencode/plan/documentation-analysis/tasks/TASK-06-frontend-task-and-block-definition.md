# Task 06 — Frontend Task & Block Definition

## Task Information

### ID

TASK-06

### Title

Frontend Task & Block Definition

### Owner

senior-frontend

### Status

Pending

---

## Description

Implement the task and blocked slot management UI. Users can create, edit, and delete tasks with properties (name, duration, priority, day restrictions, date range), and define blocked slots of three types (single-day, recurring-weekday, recurring-period). All data persists in localStorage.

---

## Acceptance Criteria

- [ ] TaskPanel in sidebar lists all tasks with name, duration, and priority
- [ ] User can open TaskModal to create a new task
- [ ] TaskModal form includes: name (text), duration (select: 30-180min in 30min steps), occurrences per week (number), priority (low/medium/high/critical), day-of-week checkboxes, time-period start/end, optional date range start/end
- [ ] User can edit any property of an existing task
- [ ] User can delete a task with confirmation
- [ ] BlockPanel in sidebar lists all blocked slots with type and date info
- [ ] User can open BlockModal to create a new blocked slot
- [ ] BlockModal has type selector: single-day, recurring-weekday, recurring-period
- [ ] Single-day block: date picker + start/end time
- [ ] Recurring-weekday block: day-of-week checkboxes + start/end time + optional date range
- [ ] Recurring-period block: start date, end date, start time, end time
- [ ] User can select a date range directly on the calendar to create a block (quick-create)
- [ ] User can edit and delete blocked slots
- [ ] Form validation: duration must be multiple of 30, occurrences > 0, name non-empty
- [ ] Tasks and blocks persist in localStorage across page refreshes
- [ ] TaskContext provides `tasks`, `createTask`, `updateTask`, `deleteTask`
- [ ] BlockContext provides `blocks`, `createBlock`, `updateBlock`, `deleteBlock`
- [ ] Old tasks without priority default to "medium" on load

---

## Dependencies

### Required Tasks

- TASK-04

### Dependency Notes

Requires the application shell (auth context, main layout) from TASK-04. Tasks and blocks are localStorage-only and do not require backend API.

---

## Technical Context

### Relevant Components

- `apps/web/src/features/tasks/TaskPanel.tsx`
- `apps/web/src/features/tasks/TaskModal.tsx`
- `apps/web/src/features/tasks/TaskCard.tsx`
- `apps/web/src/features/blocks/BlockPanel.tsx`
- `apps/web/src/features/blocks/BlockModal.tsx`
- `apps/web/src/features/blocks/BlockCard.tsx`
- `apps/web/src/contexts/TaskContext.tsx`
- `apps/web/src/contexts/BlockContext.tsx`
- `apps/web/src/hooks/useTasks.ts`
- `apps/web/src/hooks/useBlocks.ts`
- `apps/web/src/services/localStorage.ts`

### Relevant Modules

- `apps/web`
- `packages/shared` (Task, BlockedSlot types)

### Relevant Types

- `Task`, `BlockedSlot`, `Priority`, `BlockType`, `TaskFormData`, `BlockFormData`

---

## Step-by-Step Implementation — Part 1 of 2

*Continuation file: `references/TASK-06-impl-guide-part2.md`*

---

### Step 1: Create `apps/web/src/services/localStorage.ts`

```ts
/**
 * Typed localStorage wrapper with JSON serialization.
 */
export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },
};
```

### Step 2: Create `apps/web/src/contexts/TaskContext.tsx`

```tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import type { Task, Priority } from "@brkroutnxdle/shared";
import { Priority as PriorityEnum } from "@brkroutnxdle/shared";
import { storage } from "../services/localStorage";

const STORAGE_KEY = "brkroutnxdle:tasks";

function generateId(): string {
  return crypto.randomUUID();
}

function loadTasks(): Task[] {
  const tasks = storage.get<Task[]>(STORAGE_KEY, []);
  // Migrate: default priority to "medium" if missing
  return tasks.map((t) => ({
    ...t,
    priority: t.priority ?? PriorityEnum.Medium,
  }));
}

interface TaskContextValue {
  tasks: Task[];
  createTask: (partial: Omit<Task, "id" | "createdAt" | "updatedAt">) => Task;
  updateTask: (id: string, partial: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTask: (id: string) => Task | undefined;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  const persist = useCallback((next: Task[]) => {
    setTasks(next);
    storage.set(STORAGE_KEY, next);
  }, []);

  const createTask = useCallback(
    (partial: Omit<Task, "id" | "createdAt" | "updatedAt">): Task => {
      const now = new Date().toISOString();
      const task: Task = {
        ...partial,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      persist([...tasks, task]);
      return task;
    },
    [tasks, persist],
  );

  const updateTask = useCallback(
    (id: string, partial: Partial<Task>) => {
      const next = tasks.map((t) =>
        t.id === id ? { ...t, ...partial, updatedAt: new Date().toISOString() } : t,
      );
      persist(next);
    },
    [tasks, persist],
  );

  const deleteTask = useCallback(
    (id: string) => {
      persist(tasks.filter((t) => t.id !== id));
    },
    [tasks, persist],
  );

  const getTask = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
    [tasks],
  );

  return (
    <TaskContext.Provider value={{ tasks, createTask, updateTask, deleteTask, getTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTaskContext must be used within TaskProvider");
  return ctx;
}
```

### Step 3: Create `apps/web/src/contexts/BlockContext.tsx`

```tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import type { BlockedSlot, BlockType } from "@brkroutnxdle/shared";
import { BlockType as BlockTypeEnum } from "@brkroutnxdle/shared";
import { storage } from "../services/localStorage";

const STORAGE_KEY = "brkroutnxdle:blocks";

function generateId(): string {
  return crypto.randomUUID();
}

function loadBlocks(): BlockedSlot[] {
  return storage.get<BlockedSlot[]>(STORAGE_KEY, []);
}

interface BlockContextValue {
  blocks: BlockedSlot[];
  createBlock: (partial: Omit<BlockedSlot, "id" | "isRecurring">) => BlockedSlot;
  updateBlock: (id: string, partial: Partial<BlockedSlot>) => void;
  deleteBlock: (id: string) => void;
  getBlock: (id: string) => BlockedSlot | undefined;
}

const BlockContext = createContext<BlockContextValue | null>(null);

export function BlockProvider({ children }: { children: React.ReactNode }) {
  const [blocks, setBlocks] = useState<BlockedSlot[]>(loadBlocks);

  const persist = useCallback((next: BlockedSlot[]) => {
    setBlocks(next);
    storage.set(STORAGE_KEY, next);
  }, []);

  const createBlock = useCallback(
    (partial: Omit<BlockedSlot, "id" | "isRecurring">): BlockedSlot => {
      const block: BlockedSlot = {
        ...partial,
        id: generateId(),
        isRecurring: partial.blockType !== BlockTypeEnum.SingleDay,
      };
      persist([...blocks, block]);
      return block;
    },
    [blocks, persist],
  );

  const updateBlock = useCallback(
    (id: string, partial: Partial<BlockedSlot>) => {
      const next = blocks.map((b) => (b.id === id ? { ...b, ...partial } : b));
      persist(next);
    },
    [blocks, persist],
  );

  const deleteBlock = useCallback(
    (id: string) => {
      persist(blocks.filter((b) => b.id !== id));
    },
    [blocks, persist],
  );

  const getBlock = useCallback(
    (id: string) => blocks.find((b) => b.id === id),
    [blocks],
  );

  return (
    <BlockContext.Provider value={{ blocks, createBlock, updateBlock, deleteBlock, getBlock }}>
      {children}
    </BlockContext.Provider>
  );
}

export function useBlockContext(): BlockContextValue {
  const ctx = useContext(BlockContext);
  if (!ctx) throw new Error("useBlockContext must be used within BlockProvider");
  return ctx;
}
```

### Step 4: Create `apps/web/src/hooks/useTasks.ts`

```ts
import { useTaskContext } from "../contexts/TaskContext";

export function useTasks() {
  return useTaskContext();
}
```

### Step 5: Create `apps/web/src/hooks/useBlocks.ts`

```ts
import { useBlockContext } from "../contexts/BlockContext";

export function useBlocks() {
  return useBlockContext();
}
```

*See Part 2 for TaskPanel, TaskModal, TaskCard, BlockPanel, BlockModal, BlockCard, and side panel wiring.*

---

## Testing

### Unit Tests

- [ ] localStorage service (get, set, remove, migrate)
- [ ] Task form validation (valid/invalid inputs)
- [ ] Block form validation (all three types)
- [ ] Task CRUD operations via context
- [ ] Block CRUD operations via context

### Integration Tests

- [ ] Create task → appears in list → persists after refresh
- [ ] Create block → appears in list → persists after refresh
- [ ] Edit task → changes reflected in list
- [ ] Delete task → removed from list

### Manual Validation

- [ ] Task form rejects invalid inputs with clear messages
- [ ] Block type selector shows correct form fields
- [ ] Calendar range selection creates a blocked slot

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Tests created or updated
- [ ] Build passes
- [ ] Lint passes
- [ ] Validation completed

---

## References

- `architecture/domain-model.md` — Task and BlockedSlot entities, invariants
- `architecture/docs/feature/task-management.md` — Feature spec
- `architecture/docs/feature/task-priority-and-weight.md` — Feature spec
- `architecture/docs/feature/blocked-slot-management.md` — Feature spec
- `architecture/ux-flows.md` — Task management flow, blocked slot flow
- `plan/documentation-analysis/epics/EPIC-02-task-and-block-definition.md`
