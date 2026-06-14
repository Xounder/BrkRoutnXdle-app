# Component-Architecture.md

# BrkRoutnXdle Frontend Component Architecture

## Purpose

This document defines the frontend component architecture. All visual components must follow the BrkRoutnXdle Design System tokens (see `docs/design-system.md`).

Objectives:

- Clear separation of responsibilities
- Reusable components
- Facilitate maintenance
- Facilitate testing
- Minimize coupling
- Scale without rewrites

---

# Technology Stack

```text
React
TypeScript
React Query
React Hook Form
Context API
FullCalendar
```

---

# Architectural Principles

## Smart vs Dumb Components

Whenever possible:

```text
Smart Components
↓
Dumb Components
```

### Smart Components

Responsible for: Hooks, API Calls, State Management, Context.

### Dumb Components

Responsible only for: Rendering, UI Events.

---

# Folder Structure

```text
src/
│
├── app/
├── pages/
├── layouts/
├── components/
├── features/
├── contexts/
├── hooks/
├── services/
├── types/
├── utils/
└── styles/
```

---

# High Level Component Tree

```text
App
│
└── MainLayout
    │
    ├── Header
    │
    ├── Sidebar
    │   │
    │   ├── TaskPanel
    │   ├── BlockPanel
    │   └── SettingsPanel
    │
    ├── CalendarView
    │
    ├── TaskModal
    │
    ├── BlockModal
    │
    ├── SettingsModal
    │
    └── ConfirmModal
```

---

# Component Overview

## App

Application bootstrap. Handles providers, routing, and global initialization.

```tsx
<App />
```

## Providers

Centralizes all context providers:

```tsx
<QueryClientProvider>
    <AuthProvider>
        <TaskProvider>
            <CalendarProvider>
                <SettingsProvider>
                    <App />
                </SettingsProvider>
            </CalendarProvider>
        </TaskProvider>
    </AuthProvider>
</QueryClientProvider>
```

## MainLayout

Main application structure with Header, Sidebar, and Calendar.

## Header

Global actions: Calculate Week, Save, Refresh, Settings, Logout.

## Sidebar

Data management via sections: Tasks, Blocked Slots, Settings. Supports expanded/collapsed states.

## CalendarView

Main view based on FullCalendar. Features: drag and drop, resize, week/month/day views, event click, range selection.

---

# Context Architecture

## AuthContext

### Responsibility

User session.

### State

```ts
type AuthState = {
  user: User | null;
  authenticated: boolean;
};
```

---

## TaskContext

### Responsibility

Manage tasks.

### State

```ts
type TaskState = {
  tasks: Task[];
};
```

---

## BlockContext

### Responsibility

Manage blocks.

### State

```ts
type BlockState = {
  blocks: BlockedSlot[];
};
```

---

## CalendarContext

### Responsibility

Manage calendar state.

### State

```ts
type CalendarState = {
  events: CalendarEvent[];
  previewEvents: CalendarEvent[];
};
```

---

## SettingsContext

### Responsibility

Global settings.

### State

```ts
type SettingsState = {
  shuffleEnabled: boolean;
  weekStartsOn: string;
  availableStartHour: string;
  availableEndHour: string;
};
```

---

# Custom Hooks

## useTasks

```ts
const {
  tasks,
  createTask,
  updateTask,
  deleteTask
} = useTasks();
```

---

## useBlocks

```ts
const {
  blocks,
  createBlock,
  updateBlock,
  deleteBlock
} = useBlocks();
```

---

## useCalendar

```ts
const {
  events,
  previewEvents,
  refreshCalendar
} = useCalendar();
```

---

## useScheduleGeneration

### Responsibility

Orchestrate generation.

### Methods

```ts
generateWeek()
generateAgain()
saveSchedule()
discardSchedule()
```

---

# React Query Architecture

## Queries

```text
calendar.list
calendar.events
calendar.availability
```

## Mutations

```text
schedule.save
event.create
event.update
event.delete
```

---

# Local State vs Server State

## React Query

Responsible for: Google Calendar Data, OAuth Data, Backend Responses.

## Context API

Responsible for: Tasks, Settings, Blocks, Preview State.

---

# Modal Management

## Recommendation

Centralize.

## Structure

```ts
type ModalState =
  | "task"
  | "block"
  | "settings"
  | "confirm"
  | null;
```

---

# Performance Considerations

## Memoization

Apply to: TaskCard, BlockCard, CalendarEvent.

## Virtualization

Not needed initially.

## Re-render Control

Use: React.memo, useMemo, useCallback where needed.

---

# Accessibility

All components must have:

```text
Keyboard Navigation
Focus States
ARIA Labels
Screen Reader Support
```

---

# Success Criteria

The architecture is considered valid when:

1. Each component has a single responsibility.
2. The calendar is decoupled from business rules.
3. Contexts do not have circular dependencies.
4. Modals are reusable.
5. Hooks encapsulate business logic.
6. React Query controls remote state.
7. Context API controls local state.
8. Visual components can be reused.
9. The application remains organized as new features are added.

---

# References

Detailed content is split into reference files:

- **Component Specs**: See `references/component-specs.md` for detailed component specifications, design system components list, and complete component hierarchy descriptions.
- **Design System**: See `docs/design-system.md` for tokens (color, typography, spacing), component tokens, and animation guidelines.
