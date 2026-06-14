# Future Features Roadmap

## Status

Planned (V2+)

---

## Purpose

Catalog features identified for post-V1 releases.

These features are documented across the architecture as future considerations, extensions, or non-goals for V1.

---

## Source Documents

- `architecture.md` — Future improvements, non-goals
- `canonical-data-model.md` — Future extensions
- `security-architecture.md` — Future considerations
- `logging-monitoring-strategy.md` — Future considerations

---

## V1.1 Features

### Task Priority And Weight

Priority levels (Low/Medium/High/Critical) that control allocation ordering.

See `task-priority-and-weight.md` for full specification.

---

## V2+ Features

### Integration & Sync

| Feature | Source | Description |
|---|---|---|
| Google Drive Sync | architecture.md | Sync configuration via Drive |
| Multi-Device Sync | architecture.md | Cross-device settings sync |
| Shared Schedules | architecture.md | Share schedules with others |

### Intelligence

| Feature | Source | Description |
|---|---|---|
| AI Assisted Scheduling | architecture.md | ML-based schedule optimization |
| Smart Recommendations | architecture.md | Suggest schedule improvements |
| Habit Tracking | architecture.md | Track and analyze habits |
| Historical Analytics | architecture.md | Schedule pattern analysis |

### Engagement

| Feature | Source | Description |
|---|---|---|
| Notifications | architecture.md | Reminders and alerts |
| Gamification | architecture.md | Rewards and achievements |
| Mobile App | architecture.md | Native mobile application |

### Domain Model Extensions

| Feature | Source | Description |
|---|---|---|
| RecurringTask | canonical-data-model.md | Task with recurrence pattern |
| FlexibleTask | canonical-data-model.md | Variable duration task |
| AdaptivePriorityTask | canonical-data-model.md | Priority that adapts over time |
| ConstraintGraph | canonical-data-model.md | Complex constraint relationships |

### Infrastructure & Security

| Feature | Source | Description |
|---|---|---|
| Token Encryption At Rest | security-architecture.md | Encrypt stored tokens |
| Audit Logging | security-architecture.md | Log sensitive operations |
| OAuth Scope Reduction | security-architecture.md | Separate read/write scopes |

### Observability

| Feature | Source | Description |
|---|---|---|
| Metrics Collection | logging-monitoring-strategy.md | Request count, error rate, response time |
| Error Tracking | logging-monitoring-strategy.md | Sentry / Logtail / DataDog |
| Active Session Monitoring | logging-monitoring-strategy.md | Real-time session tracking |
| Automated Alerting | logging-monitoring-strategy.md | Health check alerts |

---

## Non-Goals (V1)

These features are explicitly excluded from V1:

- Database
- Multiplayer
- Sharing
- Marketplace
- Chat
- Social Features
- Machine Learning
- Real Time Collaboration
- Cross Device Synchronization

---

## References

- `architecture.md` — Future improvements list
- `canonical-data-model.md` — Model extension candidates
- `security-architecture.md` — Security future work
- `logging-monitoring-strategy.md` — Observability future work
