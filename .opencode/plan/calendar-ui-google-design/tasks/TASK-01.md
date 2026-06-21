# Task Template

## Task Information

### ID

TASK-01

### Title

CalendarView.tsx — FullCalendar prop additions and hardcoded color migration

### Owner

senior-frontend

### Status

Pending

---

## Description

Update `CalendarView.tsx` to enable Google Calendar-like features by adding new FullCalendar props (`weekNumbers`, `allDaySlot`, `allDayText`, `eventTimeFormat`, `dayHeaderFormat`) and migrate all hardcoded hex colors (`#2BA8A2`, `#5DADE2`, `#14b8a6`, `#0d9488`, `#666`) to CSS class-based styling by removing `backgroundColor`/`borderColor`/`textColor` from event objects. Add the `.brk-calendar-google` class to the wrapper `<div>` so that CSS overrides in TASK-02 are properly scoped. Ensure block/recurring events explicitly set `display: 'auto'` to prevent them from rendering in the all-day slot.

---

## Acceptance Criteria

- [ ] `weekNumbers={true}` is added to `<FullCalendar>` — week numbers visible in month view
- [ ] `allDaySlot={true}` is added to `<FullCalendar>` — all-day section rendered at top of day/week views
- [ ] `allDayText="All day"` is set for the all-day slot label
- [ ] `eventTimeFormat` is set to `{ hour: '2-digit', minute: '2-digit' }` for compact time display
- [ ] `dayHeaderFormat` is set to `{ weekday: 'short', month: 'short', day: 'numeric' }` for Google-style day headers
- [ ] All `backgroundColor`, `borderColor`, and `textColor` properties are **removed** from event mapping objects (generated, external, preview, block events)
- [ ] All events continue to use `classNames` arrays (`["brk-generated"]`, `["brk-external"]`, `["brk-preview"]`, `["brk-block"]`)
- [ ] The wrapper `<div>` has `className="brk-calendar-google"` added for CSS scoping
- [ ] Recurring block events (RecurringWeekday, RecurringPeriod) explicitly set `display: 'auto'` to avoid rendering in all-day slot
- [ ] All existing interaction callbacks (`eventClick`, `select`, `eventDrop`, `eventResize`, `eventDidMount`, `eventDragStart`, `eventDragStop`, `eventAllow`, `datesSet`) remain unchanged
- [ ] All existing event mapping logic (SingleDay, RecurringWeekday, RecurringPeriod block types) remains unchanged
- [ ] Build passes with no TypeScript errors
- [ ] Lint passes with no warnings

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This task has no dependencies. It modifies only `CalendarView.tsx` and is purely additive + subtractive (adding props, removing colors). TASK-02 depends on the `.brk-calendar-google` class added here.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/CalendarView.tsx` — the sole file to modify

### Relevant Modules

- `@fullcalendar/react` — FullCalendar React wrapper
- `@fullcalendar/daygrid` — month view (week numbers)
- `@fullcalendar/timegrid` — day/week views (all-day slot)
- `@brkroutnxdle/shared` — `CalendarEvent`, `BlockedSlot`, `BlockType`, `ViewType` types

### Relevant APIs

- FullCalendar `weekNumbers` prop (boolean)
- FullCalendar `allDaySlot` prop (boolean)
- FullCalendar `allDayText` prop (string)
- FullCalendar `eventTimeFormat` prop (object)
- FullCalendar `dayHeaderFormat` prop (object)
- FullCalendar event object `classNames` property (string[])
- FullCalendar event object `backgroundColor` / `borderColor` / `textColor` properties (to remove)

### Relevant Types

- `CalendarEvent` (from `@brkroutnxdle/shared`) — has `isGenerated`, `isCompleted`, `start`, `end`, `title`, `id`
- `BlockedSlot` (from `@brkroutnxdle/shared`) — has `blockType`, `daysOfWeek`, `startTime`, `endTime`, `startDate`, `endDate`, `id`, `title`
- `BlockType` enum: `SingleDay`, `RecurringWeekday`, `RecurringPeriod`
- `ViewType` enum: `Day`, `Week`, `Month`

---

## Implementation Guidance

### Expected Changes

1. **Add CSS wrapper class**: Change the outer `<div>` from `<div style={{ padding: "8px", height: "100%" }}>` to `<div className="brk-calendar-google" style={{ padding: "8px", height: "100%" }}>`.

2. **Add FullCalendar props** inside the `<FullCalendar>` JSX:
   ```tsx
   weekNumbers={true}
   allDaySlot={true}
   allDayText="All day"
   eventTimeFormat={{ hour: '2-digit', minute: '2-digit' }}
   dayHeaderFormat={{ weekday: 'short', month: 'short', day: 'numeric' }}
   ```

3. **Remove `allDaySlot={false}`** — the old line disabling it must be replaced by the new `allDaySlot={true}` line.

4. **Remove hardcoded colors from `fcEvents` useMemo** — in the `events.map()` block:
   - Remove `backgroundColor: e.isGenerated ? "#2BA8A2" : "#5DADE2"`
   - Remove `borderColor: e.isGenerated ? "#1E8C86" : "#3498DB"`
   - Remove `textColor: "#fff"`
   
   In the `previewEvents.map()` block:
   - Remove `backgroundColor: "#14b8a6"`
   - Remove `borderColor: "#0d9488"`
   - Remove `textColor: "#fff"`

   In the `fcBlockEvents` useMemo:
   - Remove `textColor: "#666"` from the `base` object

5. **Ensure `display: "auto"` on all block events** — the `base` object in `fcBlockEvents` already has `display: "auto"`. Verify this remains after edits. For RecurringWeekday and RecurringPeriod, this prevents the event from rendering in the all-day slot when `allDaySlot={true}`.

6. **Keep all classNames** — ensure every event type has appropriate classNames:
   - Generated events: `classNames: e.isGenerated ? ["brk-generated"] : ["brk-external"]`
   - Preview events: `classNames: ["brk-preview"]`
   - Block events: `classNames: ["brk-block"]`

### Constraints

- Do NOT change any callback implementations (`handleEventClick`, `handleSelect`, `handleDatesSet`, `handleEventDragStart`, `handleEventDragStop`, `handleEventAllow`, `handleEventDidMount`)
- Do NOT change any event mapping logic for SingleDay, RecurringWeekday, RecurringPeriod
- Do NOT modify the `FCBlockEvents` useMemo's structural logic — only remove `textColor` from the `base` object
- Do NOT import or add any new dependencies
- Do NOT change `CalendarViewProps` interface
- All CSS color responsibility moves to `CalendarStyles.css` (TASK-02)

### Validation Rules

- After removing `backgroundColor`/`borderColor`, verify each event type still has a `classNames` array
- Verify `weekNumbers={true}` is placed inside the `<FullCalendar>` JSX (not on wrapper div)
- Verify `allDaySlot` is set to `true` (not `false`)
- Verify the old `allDaySlot={false}` line is removed (not duplicated)
- Confirm `display: "auto"` is present on the fcBlockEvents `base` object

---

## Testing

### Unit Tests

- [ ] No unit test changes required (CSS-level changes, no new behavior)

### Integration Tests

- [ ] No integration test changes required

### Manual Validation

- [ ] Build passes with `pnpm build` (or `run-package-command build` for `apps/web`)
- [ ] Lint passes with `pnpm lint` (or `run-package-command lint` for `apps/web`)
- [ ] Open the app and verify week numbers appear in month view
- [ ] Switch to day/week view and verify the all-day slot appears at the top
- [ ] Verify events render without visible background colors (CSS not applied yet — TASK-02 completes this)
- [ ] Verify drag-and-drop still works on events
- [ ] Verify resize still works on events
- [ ] Verify click-drag selection on empty slots still works
- [ ] Verify event click opens details
- [ ] Verify the × delete button appears on generated events
- [ ] Verify block events (all 3 types) render correctly and are NOT in the all-day slot
- [ ] Verify preview events render correctly

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Tests created or updated
- [ ] Build passes
- [ ] Lint passes
- [ ] Validation completed

---

## References

- [Approach Analysis](.opencode/plan/calendar-ui-google-design/design-docs/approach-analysis.md) — see "Key Prop Changes in CalendarView.tsx" and "Event Color Strategy" sections
- [Planning Index](.opencode/plan/calendar-ui-google-design/planning/index.md)
- [Current source: CalendarView.tsx](../../../../apps/web/src/components/CalendarView.tsx)
- [Design tokens](../../../../apps/web/src/styles/design-tokens.css)
