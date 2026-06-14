# ADR-009 - Google Calendar Wins Conflicts

## Status

Accepted

---

## Context

The user can modify events directly in Google Calendar.

---

## Decision

Google Calendar changes have maximum priority.

---

## Rule

Google Calendar
↓
BrkRoutnXdle

Never:

BrkRoutnXdle
↓
Overwrite user changes

---

## Consequences

### Positive

* Intuitive behavior.
* User maintains control.

### Negative

* Need for frequent synchronization.
