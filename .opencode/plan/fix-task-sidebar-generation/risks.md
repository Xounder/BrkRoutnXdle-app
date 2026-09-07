# Risk Assessment — fix-task-sidebar-generation

## Risk Table

| Risk | Likelihood | Impact | Mitigation |
|--------|--------|--------|--------|
| Pending events are excluded from sync and also dropped from the local events list | Low | High | Filtering only affects the remote-sync input; persisted `events` array is untouched |
| `computeDiff` still matches a pending event in some edge path | Medium | Medium | Centralize filtering where `computeDiff` is invoked; cover with targeted tests |
| Sidebar-created events get created multiple times (duplicate calendar entries) | Low | Medium | Single event-creation path shared by sidebar and generate-week flows |
| Google Calendar sync of newly created events races with task creation | Low | Low | Keep creation local first; sync only events eligible after save flow filtering |
| Regression in existing save/sync behavior for already-synced events | Low | Medium | Existing tests must continue to pass; new tests assert synced events remain PATCHable |

---

## Technical Risks

- Over-filtering: a filter that excludes local-UUID events may also skip legitimately synced events if eligibility is based on ID shape alone. Mitigation: base eligibility on explicit sync state/reference presence, not ID guesswork.
- Duplicate `CalendarEvent` entries if sidebar creation and the save flow both add an event. Mitigation: single creation path with idempotent save semantics.

## Delivery Risks

- Save flow and sidebar creation are two separate code paths; coordinating both changes requires a single task scope to keep behavior consistent.
- Test updates are mandatory — existing tests represent verified acceptance criteria and must not be modified to force a pass.

## Operational Risks

- Temporary behavior change after deploy: tasks saved before the fix may still exist with local UUID ids. Mitigation: filter applies on save going forward; no background migration required.
- Monitoring: watch sync errors (404 rate) after deploy to confirm the fix eliminates the failure class.