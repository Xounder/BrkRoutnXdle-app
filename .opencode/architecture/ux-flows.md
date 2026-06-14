# UX-Flows.md

# BrkRoutnXdle User Experience Flows

# Purpose

This document describes all user interaction flows.

The goal is to define:

* Main journeys
* Interface states
* Success flows
* Error flows
* Expected behaviors

This document does not define technical implementation.

---

# Design Language

The visual identity follows the BrkRoutnXdle Design System (see `docs/design-system.md`). All UI components must conform to the design system tokens and animation guidelines.

---

# UX Principles

## Single Screen First

The entire application must primarily work through a single screen. The user should not need to navigate between multiple pages.

---

## Calendar First

The calendar is the central element of the experience. Everything revolves around it.

---

## Preview Before Save

No structural change should be persisted immediately. The user must always preview the result before saving.

---

## User Control

The algorithm suggests. The user decides.

---

## Manual Override

Every algorithm suggestion can be manually modified.

---

# Application Entry Flow

## First Access

```text
Open App
    ↓
Login With Google
    ↓
Grant Permissions
    ↓
Create Dedicated Calendar
    ↓
Load Calendars
    ↓
Load Events
    ↓
Open Dashboard
```

---

## Returning User

```text
Open App
    ↓
Validate Session
    ↓
Load Calendars
    ↓
Load Events
    ↓
Open Dashboard
```

---

# Main Screen

## Layout

```text
┌──────────────────────────────────────────────────────────┐
│ Header                                                   │
├───────────────┬──────────────────────────────────────────┤
│ Sidebar       │ Calendar                                 │
│               │                                          │
│ Tasks         │                                          │
│ Blocks        │                                          │
│ Settings      │                                          │
│               │                                          │
│ Calculate     │                                          │
│ Save          │                                          │
│               │                                          │
└───────────────┴──────────────────────────────────────────┘
```

---

# Header Actions

```text
Calculate Week
Save
Refresh
Settings
Logout
```

---

# Sidebar Flow

## Goal

Manage settings without leaving the main screen.

## Sections

```text
Tasks
Blocked Slots
Settings
```

## Visibility

```text
Expanded
```
or
```text
Collapsed
```

---

# Task Management Flow

## Create Task

Create a new generation rule. Opens a modal with a form for name, duration, frequency, constraints, and date range.

## Edit Task

Select a task and modify its values in the same modal form.

## Delete Task

Select a task, confirm deletion, and it is removed.

---

# Blocked Slot Flow

## Create Block

Create unavailability blocks. Select type, fill values, and save.

## Supported Types

```text
Single Day
Recurring Weekday
Recurring Period
```

## Calendar Block Creation

Allow visual creation by selecting a calendar range.

---

# Calendar Navigation Flow

## Actions

```text
Next Week
Previous Week
Today
```

## Views

```text
Day
Week
Month
```

---

# Calculate Week Flow

Generate schedule automatically. Loads current data, runs the algorithm, and displays a preview. If allocation fails, the user can retry.

---

# Recalculate Flow

Generate a new distribution when not satisfied with the preview. Nothing is saved during this process.

---

# Save Flow

Persist changes to Google Calendar after reviewing the preview.

---

# Manual Calendar Editing

## Drag And Drop

Move events by selecting, dragging, and dropping. Preview is updated.

## Resize Event

Change duration by selecting and resizing. Preview is updated.

## Delete Event

Remove an occurrence. Confirmation is required.

---

# Completion Flow

Mark a task as completed by selecting the event and confirming.

---

# Refresh Flow

Synchronize with Google Calendar by reloading calendars, events, and rebuilding availability.

---

# External Change Flow

Handle changes made directly in Google Calendar. When the user returns to BrkRoutnXdle, a refresh loads the updated events.

---

# Settings Flow

## Open Settings

Opens a modal with global configuration options.

## Available Settings

```text
Shuffle: Enabled / Disabled
Week Start: Monday / Sunday
Available Hours: Start Hour / End Hour
```

---

# Mobile Experience

## Goal

Maintain minimum functionality.

## Sidebar

```text
Collapsed By Default
```

## Calendar

```text
Priority Component
```

## Actions

Available through:

```text
Floating Action Button
```

or

```text
Bottom Sheet
```

---

# Accessibility Goals

## Keyboard Navigation

Mandatory.

## Screen Reader Support

Mandatory.

## Color Independence

No functionality should rely solely on colors.

---

# Success Criteria

The UX is considered complete when the user can:

1. Log in.
2. Create tasks.
3. Create blocks.
4. Navigate the calendar.
5. Generate a schedule.
6. Regenerate a schedule.
7. View preview.
8. Edit events manually.
9. Save changes.
10. Synchronize with Google Calendar.
11. Manage everything through a single screen.

---

# References

Detailed content is split into reference files:

- **States & Messages**: See `references/ux-states.md` for empty states, loading states, error states, unsaved changes flow, logout flow, and all specific message texts and detailed flow sub-steps.
