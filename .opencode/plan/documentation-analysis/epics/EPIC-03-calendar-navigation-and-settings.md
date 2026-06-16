# Epic 03 — Calendar Navigation & Settings

## Epic Information

### ID

EPIC-03

### Title

Calendar Navigation & Settings

### Priority

High

### Status

Pending

---

## Objective

Provide the user with a full calendar interface to navigate through time (day/week/month views) and configure global preferences that control how the schedule is generated.

---

## User Value

### Problem

The user needs to see their existing Google Calendar events and navigate through different weeks, days, or months to understand their availability. They also need to configure global settings like available hours, week start day, and shuffle mode that affect how the algorithm distributes tasks.

### Expected Outcome

The user sees a full calendar as the central interface element, can navigate freely through time, switch between day/week/month views, and adjust global settings through a settings modal. Everything is accessible from a single screen without page navigation.

### Success Criteria

- Calendar displays events from both the Primary calendar (read-only) and BrkRoutnXdle calendar
- User can navigate to next/previous week
- User can jump to the current week
- User can switch between Day, Week, and Month views
- User can configure available start/end hours
- User can toggle shuffle mode on/off
- User can choose week start day (Monday or Sunday)
- All settings persist across page refreshes
- The entire application works through a single screen

---

## Scope

### Included

- FullCalendar integration as the central calendar component
- Week view as the default view
- Day and Month views as alternatives
- Navigation controls: next, previous, today
- View switcher (Day/Week/Month)
- Collapsible sidebar with Tasks, Blocks, and Settings sections
- Settings modal with global preference controls
- Available hours configuration with start/end time pickers
- Shuffle toggle
- Week start day selector (Monday/Sunday)
- localStorage persistence for settings
- Single-screen layout with header, sidebar, and calendar

### Excluded

- Custom calendar view types beyond Day/Week/Month
- Multiple calendar selection or color customization
- Timezone configuration (assumes user's Google Calendar timezone)

---

## Deliverables

- FullCalendar-based calendar component with navigation controls
- View switcher (day/week/month)
- Collapsible sidebar layout
- Settings modal with all global preference controls
- localStorage persistence for settings

---

## Acceptance Criteria

- [ ] Calendar renders events from Google Calendar
- [ ] User can click "Next Week" and see the following week
- [ ] User can click "Previous Week" and see the previous week
- [ ] User can click "Today" and jump to the current week
- [ ] User can switch to Day view and see a single day
- [ ] User can switch to Month view and see the monthly overview
- [ ] Sidebar can be expanded and collapsed
- [ ] User can open settings modal and change available hours
- [ ] User can toggle shuffle mode on and off
- [ ] User can change week start day
- [ ] Settings persist after page refresh and reappear correctly
- [ ] All functionality is accessible from a single screen

---

## Dependencies

### Required

- EPIC-01 (Google Authentication & Calendar Foundation)

### Blocks

- EPIC-04 (Schedule Generation & Preview)

---

## Risks

- FullCalendar library integration complexity with Google Calendar data format
- Performance with large numbers of events in month view

---

## Notes

The calendar is the visual centerpiece of the application. Getting navigation and rendering right is critical for user trust and adoption.

---

## References

- `architecture/ux-flows.md` — Calendar navigation, layout, single-screen principle
- `architecture/docs/feature/calendar-navigation.md` — Feature spec
- `architecture/docs/feature/settings-management.md` — Feature spec
- `architecture/docs/frontend/component-architecture.md` — CalendarView component
- `architecture/architecture.md` — ADR-007 (preview before save), ADR-003 (localStorage settings)
