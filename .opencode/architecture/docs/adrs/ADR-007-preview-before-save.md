# ADR-007 - Preview Before Save

## Status

Accepted

---

## Context

The algorithm generates schedules automatically.

Automatic changes may be unexpected for the user.

---

## Decision

No changes will be saved immediately.

There will always be a preview.

---

## Flow

Calculate Week
↓
Preview
↓
User Review
↓
Save

---

## Consequences

### Positive

* User control.
* Less frustration.

### Negative

* An additional step in the experience.
