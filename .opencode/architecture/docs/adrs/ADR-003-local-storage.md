# ADR-003 - Local Storage For Configuration

## Status

Accepted

---

## Context

Task definitions and Settings need to be stored.

---

## Decision

Use localStorage.

---

## Stored Data

* Tasks
* Blocked Slots
* Settings
* Calendar Cache

---

## Consequences

### Positive

* Simple.
* No backend state.
* No database.

### Negative

* Does not sync across devices.
* Can be lost when clearing browser.

---

## Future Consideration

Possible synchronization via Google Drive.
