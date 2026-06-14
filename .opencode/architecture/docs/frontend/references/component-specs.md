# Component Specs — Reference

# Detailed Component Specifications

## CalendarToolbar

### Responsibility

Calendar controls.

### Actions

```text
Today
Next
Previous
Week
Month
Day
```

### Component

```tsx
<CalendarToolbar />
```

---

## CalendarEvent

### Responsibility

Event rendering.

### Displays

```text
Title
Duration
Completed State
```

### Component

```tsx
<CalendarEvent />
```

---

## TaskPanel

### Responsibility

Task listing.

### Features

```text
Create
Edit
Delete
Search
```

### Component

```tsx
<TaskPanel />
```

---

## TaskCard

### Responsibility

Visual representation of a Task.

### Displays

```text
Name
Duration
Times Per Week
```

### Actions

```text
Edit
Delete
```

### Component

```tsx
<TaskCard />
```

---

## TaskModal

### Responsibility

Task creation and editing.

### Technology

```text
React Hook Form
```

### Fields

```text
Name
Duration
Times PerWeek
Blocked Days
Blocked Periods
Start Date
End Date
```

### Component

```tsx
<TaskModal />
```

---

## BlockPanel

### Responsibility

Block listing.

### Features

```text
Create
Edit
Delete
```

### Component

```tsx
<BlockPanel />
```

---

## BlockCard

### Responsibility

Block display.

### Component

```tsx
<BlockCard />
```

---

## BlockModal

### Responsibility

Create and edit blocks.

### Supported Types

```text
Single Day
Recurring Weekday
Recurring Period
```

### Component

```tsx
<BlockModal />
```

---

## SettingsPanel

### Responsibility

Settings summary.

### Component

```tsx
<SettingsPanel />
```

---

## SettingsModal

### Responsibility

Edit global settings.

### Fields

```text
Shuffle Enabled
Week Start
Available Hours
```

### Component

```tsx
<SettingsModal />
```

---

## ScheduleGenerationModal

### Responsibility

Display generation result.

### Displays

```text
Generated Events
Allocation Failures
```

### Actions

```text
Accept
Discard
Generate Again
```

### Component

```tsx
<ScheduleGenerationModal />
```

---

## AllocationFailurePanel

### Responsibility

Show unallocated tasks.

### Example

```text
Gym
1 occurrence missing

Drawing
2 occurrences missing
```

### Component

```tsx
<AllocationFailurePanel />
```

---

## ConfirmModal

### Responsibility

Confirmations.

### Examples

```text
Delete Task
Delete Block
Discard Changes
Logout
```

### Component

```tsx
<ConfirmModal />
```

---

## LoadingOverlay

### Responsibility

Block interaction during processes.

### Examples

```text
Loading Calendar
Generating Schedule
Saving Changes
```

### Component

```tsx
<LoadingOverlay />
```

---

## ErrorBoundary

### Responsibility

Capture unexpected errors.

### Component

```tsx
<ErrorBoundary />
```

---

# Design System Components

For design token values (colors, typography, spacing), see `docs/design-system.md`.

## Base Components

```text
Button
IconButton
Input
Select
Checkbox
Switch
Modal
Drawer
Tooltip
Badge
Card
```

## Calendar Components

```text
CalendarView
CalendarToolbar
CalendarEvent
```

## Feature Components

```text
TaskPanel
BlockPanel
SettingsPanel
```
