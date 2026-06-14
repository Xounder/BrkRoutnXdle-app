# Package-Contracts.md

# BrkRoutnXdle Package Contracts

## Purpose

This document defines the official contracts between the monorepo packages.

It ensures:

- Clear separation of responsibilities
- Prevents accidental coupling
- Defines import boundaries
- Stabilizes the system architecture

---

# Core Rule

Each package must expose only what is explicitly public.

```text
No implicit dependencies
No cross-boundary leakage
No internal imports outside package
```

---

# Package Visibility Model

Each package has 3 internal layers:

```text
/public
/internal
/private
```

## Public

Can be imported by any other package.

## Internal

Use only within the same package.

## Private

Must never be imported externally.

---

# Package Contracts Overview

```text
apps/web
apps/api

packages/shared
packages/domain
packages/calendar
packages/ui
```

---

# apps/web Contract

| | |
|---|---|
| **Allowed Imports** | packages/shared, packages/domain, packages/calendar, packages/ui |
| **Forbidden Imports** | apps/api, internal files of any package |
| **Responsibilities** | UI Rendering, User Interaction, State orchestration, Scheduling preview, Calendar visualization |

---

# apps/api Contract

| | |
|---|---|
| **Allowed Imports** | packages/shared, packages/domain, packages/calendar |
| **Forbidden Imports** | packages/ui, apps/web |
| **Responsibilities** | Authentication, Google OAuth, Calendar proxy, Event CRUD, Token management |

---

# packages/shared Contract

| | |
|---|---|
| **Allowed Imports** | NONE (must be dependency-free) |
| **Export Rules** | `export type`, `export interface`, `export const`, `export function` (pure only) |
| **Forbidden** | No React, No API calls, No domain logic, No calendar logic |

---

# packages/domain Contract

| | |
|---|---|
| **Allowed Imports** | packages/shared |
| **Responsibilities** | Task prioritization, Scheduling algorithm, Constraints evaluation, Slot scoring, Conflict resolution logic |
| **Forbidden** | No React, No Google API, No UI logic, No persistence logic |
| **Export Rules** | `export function generateSchedule()`, `export function rankTasks()`, `export function evaluateSlot()` |

---

# packages/calendar Contract

| | |
|---|---|
| **Allowed Imports** | packages/shared |
| **Responsibilities** | Normalize events, Convert time slots, Map Google events → internal model, Handle calendar IO, Detect external changes |
| **Forbidden** | No UI logic, No scheduling logic, No task logic |
| **Export Rules** | `export function fetchEvents()`, `export function createEvent()`, `export function updateEvent()`, `export function deleteEvent()`, `export function normalizeEvents()` |

---

# packages/ui Contract

| | |
|---|---|
| **Allowed Imports** | packages/shared |
| **Responsibilities** | Buttons, Modals, Inputs, Cards, Calendar UI components, Sidebar UI components |
| **Forbidden** | No business logic, No API calls, No scheduling logic |
| **Export Rules** | export components only, export hooks only (UI hooks only) |

---

# Dependency Matrix

## Allowed Dependencies

```text
web → shared, domain, calendar, ui
api → shared, domain, calendar
domain → shared
calendar → shared
ui → shared
```

---

## Forbidden Dependencies

```text
shared → any
domain → ui, api, web
calendar → domain, ui
ui → domain, api, calendar
```

---

# Data Flow Contract

## Runtime Flow

```text
apps/web
    ↓
packages/domain (schedule generation)
    ↓
apps/web (preview state)
    ↓
apps/api (persist diff)
    ↓
packages/calendar
    ↓
Google Calendar API
```

---

# State Ownership Rules

## Frontend owns:

```text
Tasks
Blocks
Settings
Preview State
```

---

## Backend owns:

```text
Auth session
Tokens
Calendar sync state
```

---

## Domain owns:

```text
Scheduling rules
Priority logic
Allocation logic
Scoring system
```

---

# Anti-Patterns

## Forbidden

```text
Importing internal files directly
Using domain inside UI
Using UI inside API
Mixing scheduling logic in web
```

## Example of wrong usage

```ts
import { internalScheduleHelper } from "domain/internal";
```

## Correct usage

```ts
import { generateSchedule } from "domain";
```

---

# Success Criteria

The system is properly decoupled when:

1. Each package can be tested in isolation
2. No package accesses another package's internal folders
3. Domain does not depend on UI or API
4. Shared depends on nothing
5. Web and API depend only on public contracts
6. Violations are detected in CI
7. Changes in one package do not unexpectedly break others

---

# References

For contract stability rules, versioning strategy, import enforcement details, and CI enforcement strategy, see [`references/contract-enforcement.md`](references/contract-enforcement.md).
