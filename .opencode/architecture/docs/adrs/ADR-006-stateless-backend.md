# ADR-006 - Stateless Backend

## Status

Accepted

---

## Context

The backend acts only as a BFF for Google APIs.

---

## Decision

Backend without its own persistence.

---

## Responsibilities

* OAuth
* Token Refresh
* Google Calendar Integration

---

## Non Responsibilities

* Persistence
* Business State
* Analytics

---

## Consequences

### Positive

* Simple scalability.
* Lower cost.

### Negative

* Strong dependency on Google Calendar.
