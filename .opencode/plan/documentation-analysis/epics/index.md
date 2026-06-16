# Epic Index — Documentation Analysis

## Overview

This analysis catalogs all features discoverable in the existing project documentation into 7 epics representing meaningful business outcomes. The project has **zero implementation** — only architecture and feature specifications exist.

**Total V1 Features**: 20 (all planned, none implemented)
**Total V2+ Features**: 17 (out of scope for initial implementation)

---

## Epic Summary

| ID | Title | Features | Priority |
|---|---|---|---|
| EPIC-01 | Google Authentication & Calendar Foundation | Google OAuth Authentication, Dedicated Calendar Setup, **Dev Mode Bypass (OAuth Playground)** | High |
| EPIC-02 | Task & Block Definition | Task Management, Task Priority & Weight, Blocked Slot Management | High |
| EPIC-03 | Calendar Navigation & Settings | Calendar Navigation & Views, Settings Management | High |
| EPIC-04 | Schedule Generation & Preview | Schedule Generation Workflow, Schedule Preview, Allocation Failure Handling | High |
| EPIC-05 | Save & Manual Calendar Editing | Save to Google Calendar, Manual Calendar Editing | High |
| EPIC-06 | Completion, Sync & Conflict Resolution | Completion Flow, Calendar Sync & Refresh, Conflict Handling | Medium |
| EPIC-07 | Production Polish | Mobile Experience, Accessibility, Error Handling & Retry, Unsaved Changes Protection, Design System Implementation | Medium |

---

## Recommended Execution Order

```text
EPIC-01 → EPIC-02 → EPIC-03 → EPIC-04 → EPIC-05 → EPIC-06 → EPIC-07
```

Each epic builds on the previous one:
- **EPIC-01**: Foundation — nothing works without auth and calendar
- **EPIC-02**: Data input — algorithm needs tasks and blocks
- **EPIC-03**: Navigation — user needs to see and configure the calendar
- **EPIC-04**: Core value — generation is the main differentiator
- **EPIC-05**: Persistence — preview is useless without save
- **EPIC-06**: Ongoing use — completion, sync, and conflict handling
- **EPIC-07**: Production quality — polish for real-world use

---

## Epic Mapping

### Scenario Map

| User Scenario | Epic |
|---|---|
| "I want to log in with Google" | EPIC-01 |
| "I want to define what to schedule" | EPIC-02 |
| "I want to say when I'm unavailable" | EPIC-02 |
| "I want to set my available hours" | EPIC-03 |
| "I want to navigate the calendar" | EPIC-03 |
| "I want to generate my weekly schedule" | EPIC-04 |
| "I want to see what was generated before saving" | EPIC-04 |
| "I want to move events around" | EPIC-05 |
| "I want to save to Google Calendar" | EPIC-05 |
| "I want to mark a task as done" | EPIC-06 |
| "I want to sync external changes" | EPIC-06 |
| "I want to use the app on my phone" | EPIC-07 |

---

## Out of Scope (V2+)

The following V2+ features are documented but excluded from the initial implementation:

- Google Drive Sync
- Shared Schedules
- Multi-Device Sync
- Notifications
- AI Assisted Scheduling
- Smart Recommendations
- Historical Analytics
- Habit Tracking
- Gamification
- RecurringTask
- FlexibleTask
- AdaptivePriorityTask
- ConstraintGraph
- Metrics & Monitoring
- Error Tracking Integration
- Token Encryption At Rest
- Audit Logging

---

## References

- Architecture: `../../../architecture/architecture.md`
- Domain Model: `../../../architecture/domain-model.md`
- UX Flows: `../../../architecture/ux-flows.md`
- Feature Index: `../../../architecture/docs/feature/index.md`
- Monorepo Structure: `../../../architecture/monorepo-structure.md`
