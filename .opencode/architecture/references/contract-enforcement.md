# Contract Enforcement Details

This file contains import enforcement rules, contract stability rules, versioning strategy, and enforcement strategy moved from the package contracts entry point.

---

## Import Enforcement Rule

All packages MUST enforce boundary rules using:

```text
eslint boundaries
tsconfig path restrictions
lint-staged validation
```

---

## Contract Stability Rules

### Rule 1

Public exports are immutable without version bump.

---

### Rule 2

Internal changes must not affect external behavior.

---

### Rule 3

Shared types are version-critical.

---

### Rule 4

Breaking changes require:

```text
Migration plan
Deprecation period
Documentation update
```

---

## Versioning Strategy

### Phase 1

```text
Monorepo single version
```

---

### Phase 2

```text
Package-level versioning (domain/calendar/ui)
```

---

## Contract Enforcement Strategy

### Tools

```text
TypeScript path aliases
ESLint boundaries
CI validation step
```

### CI Rule

Build fails if:

```text
cross-package violation detected
```
