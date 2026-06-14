# Testing Strategy

## Purpose

Define testing approach, scope, and responsibilities per package.

Testing complements domain validation rules (see `domain-model.md` and `generation-algorithm.md`) by verifying correctness at each layer.

---

## Layer Breakdown

### packages/domain

Unit tests (critical).

| Area | What to test |
|---|---|
| Task prioritization | Sorting, weight mapping, tie-breakers |
| Scheduling algorithm | Slot allocation, constraint evaluation, scoring |
| Previous week memory | Penalty calculation, repetition avoidance |
| Validation | INV-001 through INV-010 (see `domain-model.md`) |
| Allocation failure | Partial allocation, failure report generation |

Pure logic — no mocks required.

---

### packages/shared

Unit tests for utility functions.

No domain logic tests belong here.

---

### packages/calendar

Integration tests with Google Calendar mocks.

| Area | What to test |
|---|---|
| Event normalization | Google event → internal Event mapping |
| Calendar CRUD | Create, read, update, delete operations |
| Extended properties | Metadata read/write round-trip |
| Error mapping | Google API errors → internal error codes |

---

### packages/ui

Component tests for design system.

No business logic tests.

---

### apps/web

| Type | Scope |
|---|---|
| Component tests | Smart components, contexts, hooks |
| Integration tests | FullCalendar interaction, preview flow |
| E2E tests | Critical user paths (login, generate, save) |

---

### apps/api

| Type | Scope |
|---|---|
| Integration tests | OAuth flow, event endpoints, session management |
| API contract tests | Request/response format validation, error codes |

---

## Test Tooling (Recommended)

```text
Vitest — unit + integration (frontend)
Jest — unit + integration (backend)
Playwright — E2E (frontend)
```

---

## CI Rules

1. `packages/domain` tests run first — fastest feedback
2. All packages must pass before app-level tests
3. E2E tests run only after all other layers pass
4. Coverage minimum: domain 90%, others 70%

---

## What Not To Test

- FullCalendar internals (third-party)
- Google Calendar API behavior (mock only)
- React component rendering details (test behavior, not markup)
- TypeScript types (trust the compiler)

---

## References

- `monorepo-structure.md` — testing strategy per package
- `domain-model.md` — domain invariants
- `generation-algorithm.md` — algorithm success criteria
- `package-contracts.md` — package boundaries and isolation
