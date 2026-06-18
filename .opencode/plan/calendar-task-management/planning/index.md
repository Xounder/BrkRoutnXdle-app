# Planning — Calendar, Settings & Task Restrictions

## Objective

Overhaul the calendar to match Google Calendar UX, implement Settings sidebar, fix Settings modal (Available Start/End Hour binding, Timezone selector), and add advanced Task restrictions (time ranges, frequency, gap between days, same-day check).

## Scope

- **Frontend**: CalendarView, SettingsModal, Sidebar, TaskModal, BlockModal, CalendarContext, TaskContext, BlockContext, SettingsContext
- **Backend**: None (all changes are frontend + local storage + domain algorithm)
- **Shared**: Types (TaskRestriction, Task, UserSettings)
- **Domain**: Schedule generation algorithm (taskDistributor, availabilityCalculator)
- **Calendar package**: Block representation

## Recommendation

**Phased Approach** (Phase 1 → Phase 2 → Phase 3), each independently testable.

---

## User-Approved Decisions

| Decision | Choice |
|---|---|
| Approach | Phased (Phase 1 → Phase 2 → Phase 3) |
| Blocks behavior | Full drag-drop + delete on calendar |
| Time range groups | 4 groups: morning (6-12), afternoon (12-18), evening (18-0), night (0-6) + custom ranges |
| Task model | Keep current restrictions, add frequency/gapDays/allowSameDay as separate fields |
