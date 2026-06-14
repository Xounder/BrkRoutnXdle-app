# ADR-001 - Google Calendar As Source Of Truth

## Status

Accepted

---

## Context

The system needs to store events, availability, and task state.

There were two alternatives:

1. Own database.
2. Google Calendar as the main source.

---

## Decision

Google Calendar will be the single source of truth for events.

The system will not maintain a persistent copy of events.

---

## Consequences

### Positive

* Lower complexity.
* No duplicate synchronization.
* Less infrastructure.
* Lower cost.

### Negative

* Dependency on Google API.
* Dependency on Google Calendar availability.

---

## Related Decisions

* ADR-002
* ADR-004
