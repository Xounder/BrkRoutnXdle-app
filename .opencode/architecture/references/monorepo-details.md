# Monorepo Details

This file contains detailed package responsibilities, layer descriptions, versioning strategy, and test tooling specifics moved from the entry point.

---

## packages/shared — Expanded Details

### Contains

```text
Types
Interfaces
Constants
Utility functions
```

### Example

```ts
export type TaskPriority = "low" | "medium" | "high" | "critical";
```

---

## packages/domain — Expanded Details

### Contains

```text
Task model logic
Scheduling rules
Priority rules
Validation logic
```

### Important Rule

❌ Must not depend on React  
❌ Must not depend on API  
✔ Only pure logic

---

## packages/calendar — Expanded Details

### Contains

```text
Event mapping
Calendar normalization
Time slot conversion
Conflict detection
```

### Responsibilities

- Transform Google events into internal model
- Normalize time slots
- Handle calendar differences
- Provide unified calendar interface

---

## packages/ui — Expanded Details

### Contains

```text
Button
Modal
Input
Calendar components (visual only)
Cards
Sidebar components
```

### Rule

✔ No business logic  
✔ No API calls  
✔ Pure UI only

---

## Docs Layer — Expanded Details

### docs/architecture

Contains:

```text
System design
Monorepo structure
Backend/frontend split
Data flow architecture
```

### docs/adrs

Contains architectural decisions:

```text
Google Calendar as source of truth
No database
Stateless backend
Preview-first workflow
```

### docs/algorithms

Contains:

```text
Schedule generation
Priority system
Slot allocation
Penalty system
Optimization rules
```

### docs/ux

Contains:

```text
User flows
UI interactions
Calendar behavior
Task management flows
```

---

## Versioning Strategy

### Monorepo Versioning

```text
Single version for entire repo (V1)
```

Future:

```text
Independent package versioning (V2+)
```

---

## Testing Strategy — Expanded Details

### apps/web

```text
Component tests
E2E tests
```

### apps/api

```text
Integration tests
API tests
```

### packages/domain

```text
Unit tests (critical)
```

### packages/calendar

```text
Integration tests (Google mocks)
```
