# Monorepo-Structure.md

# BrkRoutnXdle Monorepo Structure

## Purpose

This document defines the official monorepo structure.

It serves as the foundation for scalability, separation of responsibilities, and system maintainability over time.

---

# High Level Structure

```text
apps/
├── web/
└── api/

packages/
├── shared/
├── domain/
├── calendar/
├── ui/

docs/
├── architecture/
├── adrs/
├── algorithms/
└── ux/
```

---

# Design Principles

## Separation of Concerns

Each layer has a single responsibility:

```text
apps → entry points
packages → reusable logic
docs → system definition
```

---

## Dependency Direction

Mandatory rule:

```text
apps → packages
packages → packages (only allowed via shared/domain rules)
docs → no runtime dependency
```

---

## No Circular Dependencies

```text
❌ ui → domain → ui
❌ calendar → domain → calendar
```

---

# Apps Layer

## apps/web

Application frontend.

### Responsibilities

- React App
- Calendar UI
- Task Management UI
- Schedule Preview
- User Interaction Layer

### Stack

```text
React
TypeScript
React Query
React Hook Form
FullCalendar
```

---

## apps/api

Backend BFF (Backend For Frontend).

### Responsibilities

- OAuth Google
- Token management
- Google Calendar integration
- Event CRUD proxy
- Session handling

### Stack

```text
Node.js
Express
TypeScript
Google APIs
```

---

# Packages Layer

## packages/shared

Code shared between frontend and backend. Contains: Types, Interfaces, Constants, Utility functions.

Must not depend on any other package.

---

## packages/domain

Pure domain rules. Contains: Task model logic, Scheduling rules, Priority rules, Validation logic.

❌ Must not depend on React — ❌ Must not depend on API — ✔ Only pure logic

---

## packages/calendar

Google Calendar abstraction. Contains: Event mapping, Calendar normalization, Time slot conversion, Conflict detection.

Responsibilities: Transform Google events into internal model, Normalize time slots, Handle calendar differences, Provide unified calendar interface.

---

## packages/ui

Reusable design system. Contains: Button, Modal, Input, Calendar components (visual only), Cards, Sidebar components.

✔ No business logic — ✔ No API calls — ✔ Pure UI only

---

# Docs Layer

## docs/architecture
System design, Monorepo structure, Backend/frontend split, Data flow architecture

## docs/adrs
Architectural decisions: Google Calendar as source of truth, No database, Stateless backend, Preview-first workflow

## docs/algorithms
Schedule generation, Priority system, Slot allocation, Penalty system, Optimization rules

## docs/ux
User flows, UI interactions, Calendar behavior, Task management flows

---

# Dependency Rules

## Allowed Imports

```text
apps/web → packages/*
apps/api → packages/shared, packages/domain, packages/calendar
packages/calendar → packages/shared
packages/domain → packages/shared
packages/ui → packages/shared
```

---

## Forbidden Imports

```text
packages/domain → apps/*
packages/shared → apps/*
packages/ui → packages/api
```

---

# Data Flow Architecture

## Runtime Flow

```text
apps/web
    ↓
apps/api
    ↓
packages/calendar
    ↓
Google Calendar API
```

---

## Scheduling Flow

```text
apps/web
    ↓
packages/domain (algorithm)
    ↓
apps/web (preview state)
    ↓
apps/api (save diff)
    ↓
Google Calendar
```

---

# Build Strategy

## Apps

Built independently:

```text
web → Vite/Next
api → Node build
```

---

## Packages

Built as shared libraries:

```text
domain → pure TS
calendar → TS lib
shared → TS lib
ui → component library
```

---

# Testing Strategy

## apps/web

```text
Component tests
E2E tests
```

---

## apps/api

```text
Integration tests
API tests
```

---

## packages/domain

```text
Unit tests (critical)
```

---

## packages/calendar

```text
Integration tests (Google mocks)
```

---

# Scaling Strategy

## Phase 1 (MVP)

```text
Minimal packages
Light separation
```

---

## Phase 2

```text
Domain extraction
Calendar abstraction
UI system stabilization
```

---

## Phase 3

```text
Plugin-based scheduling engine
Advanced optimization
```

---

# Critical Rule

The system must always maintain:

```text
Domain logic independent of framework
```

---

# Success Criteria

The monorepo structure is considered correct when:

1. UI does not contain generation logic.
2. Domain does not depend on React or API.
3. Calendar is isolated as its own layer.
4. API is only a BFF.
5. Apps are consumers of packages.
6. Docs reflect exactly the real structure.
7. There are no circular dependencies.
8. The system can scale without structural rewrite.

---

# References

For detailed package responsibilities, expanded layer descriptions, versioning strategy, and testing tooling specifics, see [`references/monorepo-details.md`](references/monorepo-details.md).
