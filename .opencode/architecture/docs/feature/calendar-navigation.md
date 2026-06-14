# Calendar Navigation And Views

## Status

Planned (V1)

---

## Purpose

Allow the user to navigate through time and switch between calendar views.

The calendar is the central element of the experience — everything revolves around it.

---

## Source Documents

- `ux-flows.md` — Calendar navigation flow, views, layout
- `component-architecture.md` — CalendarView, FullCalendar integration

---

## Navigation Actions

```text
Next Week
Previous Week
Today (jump to current week)
```

---

## Available Views

| View | Description |
|---|---|
| Day | Single day detailed view |
| Week | Full week overview (default) |
| Month | Monthly calendar view |

---

## Layout

```text
┌──────────────────────────────────────────┐
│ Header (Calculate, Save, Refresh, etc.)  │
├───────────────┬──────────────────────────┤
│ Sidebar       │ Calendar                 │
│               │                          │
│ Tasks         │                          │
│ Blocks        │                          │
│ Settings      │                          │
│               │                          │
│ Calculate     │                          │
│ Save          │                          │
│               │                          │
└───────────────┴──────────────────────────┘
```

---

## Single Screen Principle

The entire application works through a single screen. No page navigation is required.

---

## UI Components

- FullCalendar integration for rendering
- Header navigation controls
- View switcher (Day/Week/Month)

---

## Success Criteria

1. User can navigate to next/previous week.
2. User can jump to the current week.
3. User can switch between Day, Week, and Month views.
4. Calendar is always the central element.
5. Everything is accessible from a single screen.

---

## References

- `ux-flows.md` — Full UX flow specification
- `component-architecture.md` — CalendarView component
