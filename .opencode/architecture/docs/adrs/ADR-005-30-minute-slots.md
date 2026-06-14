# ADR-005 - 30 Minute Slot Model

## Status

Accepted

---

## Context

The algorithm needs a minimum time unit.

---

## Decision

Use 30-minute slots.

---

## Examples

Valid:

* 30
* 60
* 90
* 120

Invalid:

* 15
* 45
* 75

---

## Consequences

### Positive

* Simple algorithm.
* Consistent visual.
* Lower complexity.

### Negative

* Less flexibility for unusual durations.
