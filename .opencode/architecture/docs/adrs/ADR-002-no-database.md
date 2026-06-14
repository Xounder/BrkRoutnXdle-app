# ADR-002 - No Database

## Status

Accepted

---

## Context

The project is an automation layer on top of Google Calendar.

Persisting data in a database would create information duplication.

---

## Decision

Do not use a database in V1.

---

## Consequences

### Positive

* Minimal infrastructure.
* Simple deployment.
* Lower operational cost.

### Negative

* No cross-device synchronization for local settings.
* Lower analytical capability.

---

## Related Decisions

* ADR-001
* ADR-003
