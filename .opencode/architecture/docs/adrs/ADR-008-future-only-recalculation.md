# ADR-008 - Future Only Recalculation

## Status

Accepted

---

## Context

Recalculating past events generates unexpected behavior.

---

## Decision

Only future events can be recalculated.

---

## Protected Events

event.start < now

---

## Consequences

### Positive

* Predictability.
* History preserved.

### Negative

* Less freedom for complete reorganization.
