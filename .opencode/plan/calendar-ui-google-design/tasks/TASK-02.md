# Task Template

## Task Information

### ID

TASK-02

### Title

CalendarStyles.css — Comprehensive Google Calendar-like restyle

### Owner

senior-frontend

### Status

Pending

---

## Description

Comprehensively restyle `CalendarStyles.css` to make the FullCalendar grid, events, indicators, and interactive states visually resemble Google Calendar while using the BrkRoutnXdle design system tokens (`--clr-*`, `--radius-*`, `--shadow-*`). All styles must be scoped under the `.brk-calendar-google` parent class (added in TASK-01) to avoid leaking. Follow the existing `!important` pattern for FullCalendar internal CSS overrides.

Key visual targets: clean white grid with subtle gray lines, compact event chips with colored left border accent (teal/coral/sky), all-day section at top, week numbers in month view, red now-indicator line, gold today-cell highlight, smooth hover effects, and a compact time gutter.

---

## Acceptance Criteria

- [ ] Calendar grid uses clean white background with subtle gray (`#e8e8e8` / `#f0f0f0`) grid lines
- [ ] Events display as compact rounded chips (4px radius, 12px font) with a colored left border accent instead of full background fill
- [ ] Generated events use teal (`--clr-primary`) styling with teal left border
- [ ] Blocked slot events use coral (`--clr-coral`) diagonal stripe pattern with coral left border
- [ ] External events use sky blue (`--clr-sky`) styling with sky left border
- [ ] Preview events use translucent teal dashed border styling
- [ ] Completed events show checkmark and reduced opacity
- [ ] All-day slot enabled at top with cream background (`--clr-cream`), subtle bottom border
- [ ] Week numbers visible in month view with small gray styling
- [ ] Google-style red now indicator line (`#ea4335`) — maintained from existing CSS, verify styling
- [ ] Today cell highlighted with gold accent (`--clr-accent`)
- [ ] Smooth hover effects on events (teal glow shadow via `--shadow-teal-glow`, slight upward lift via `transform: translateY(-1px)`)
- [ ] Compact time gutter with gray (`#888`) 11px labels — maintained from existing CSS
- [ ] Weekend columns have subtle tint (`--clr-surface` or `#fafafa`)
- [ ] All colors use CSS custom properties (`--clr-*`, `--shadow-*`, `--radius-*`) from `design-tokens.css`
- [ ] All overrides scoped under `.brk-calendar-google` parent class
- [ ] Existing `!important` override pattern preserved
- [ ] Day headers styled compactly (12px, medium weight, no underline)
- [ ] Block slots remain non-interactive (`pointer-events: none`)
- [ ] File does not exceed 400 lines

---

## Dependencies

### Required Tasks

- TASK-01

### Dependency Notes

TASK-01 adds the `.brk-calendar-google` class to the wrapper `<div>` in `CalendarView.tsx`. Without this class, the CSS rules in this task will have no effect. TASK-01 must be completed and merged first. All CSS selectors in this task must be prefixed with `.brk-calendar-google`.

---

## Technical Context

### Relevant Components

- `apps/web/src/styles/CalendarStyles.css` — the sole file to modify
- `apps/web/src/styles/design-tokens.css` — source of all CSS custom properties (`--clr-*`, `--shadow-*`, `--radius-*`)

### Relevant Modules

- `@fullcalendar/core` — internal CSS classes used by FullCalendar (`.fc-timegrid-slots`, `.fc-event`, `.fc-day-today`, `.fc-timegrid-now-indicator-line`, `.fc-col-header-cell`, `.fc-timegrid-slot-label`, `.fc-daygrid-week-number`, `.fc-timegrid-all-day`, etc.)
- `@fullcalendar/daygrid` — month view specific classes
- `@fullcalendar/timegrid` — day/week view specific classes

### Relevant Types

- FullCalendar DOM class structure (no TypeScript types involved — pure CSS)

---

## Implementation Guidance

### Expected Changes

The following is the complete expected CSS structure. Use the existing file's `!important` pattern. Scope every rule under `.brk-calendar-google`.

#### 1. Wrapper / container (no extra style needed — calendar uses FullCalendar's own container)

#### 2. Calendar grid — clean white background, subtle grid lines
```css
.brk-calendar-google .fc .fc-timegrid-slots .fc-timegrid-slot {
  border-bottom: 1px solid #e8e8e8 !important;
}

.brk-calendar-google .fc .fc-timegrid-slot-lane {
  background: var(--clr-card) !important;
}
```

#### 3. Day headers — compact text
```css
.brk-calendar-google .fc .fc-col-header-cell-cushion {
  font-size: 12px !important;
  font-weight: 500 !important;
  text-decoration: none !important;
  text-transform: uppercase !important;
  letter-spacing: 0.03em !important;
  color: #555 !important;
}
```

#### 4. Time gutter — compact gray labels
```css
.brk-calendar-google .fc .fc-timegrid-slot-label-cushion {
  font-size: 11px !important;
  color: #888 !important;
}
```

#### 5. Today cell — gold accent
```css
.brk-calendar-google .fc .fc-day-today {
  background: color-mix(in srgb, var(--clr-accent) 8%, transparent) !important;
}

.brk-calendar-google .fc .fc-day-today .fc-col-header-cell-cushion {
  color: var(--clr-accent-dark) !important;
  font-weight: 700 !important;
}
```

#### 6. Now indicator — Google red line
```css
.brk-calendar-google .fc .fc-timegrid-now-indicator-line {
  border-color: #ea4335 !important;
  border-width: 2px !important;
}

.brk-calendar-google .fc .fc-timegrid-now-indicator-arrow {
  color: #ea4335 !important;
  border-color: #ea4335 !important;
}
```

#### 7. Weekend tint
```css
.brk-calendar-google .fc .fc-day-sat,
.brk-calendar-google .fc .fc-day-sun {
  background-color: var(--clr-surface) !important;
}
```

#### 8. All-day slot
```css
.brk-calendar-google .fc .fc-timegrid-all-day {
  background: var(--clr-cream) !important;
  border-bottom: 2px solid #dadce0 !important;
}

.brk-calendar-google .fc .fc-timegrid-all-day .fc-daygrid-event {
  border-radius: var(--radius-sm) !important;
  font-size: 12px !important;
}
```

#### 9. Week numbers (month view)
```css
.brk-calendar-google .fc .fc-daygrid-week-number {
  font-size: 11px !important;
  color: #999 !important;
  padding: 2px 4px !important;
  font-weight: 400 !important;
}
```

#### 10. Events — compact chip with colored left border
```css
.brk-calendar-google .fc .fc-event {
  border-radius: 4px !important;
  border: none !important;
  font-size: 12px !important;
  padding: 2px 4px !important;
  margin: 1px 0 !important;
  transition: box-shadow 0.15s ease, transform 0.1s ease !important;
}

.brk-calendar-google .fc .fc-event:hover {
  box-shadow: var(--shadow-teal-glow) !important;
  transform: translateY(-1px) !important;
}

/* Event title truncation */
.brk-calendar-google .fc .fc-event .fc-event-title {
  font-weight: 500 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
```

#### 11. Generated events — teal chip with teal left border
```css
.brk-calendar-google .fc-event.brk-generated {
  background: color-mix(in srgb, var(--clr-primary) 15%, var(--clr-card)) !important;
  border-left: 4px solid var(--clr-primary-dark) !important;
  color: #333 !important;
}

.brk-calendar-google .fc-event.brk-generated:hover {
  background: color-mix(in srgb, var(--clr-primary) 25%, var(--clr-card)) !important;
}

.brk-calendar-google .fc-event.brk-generated .fc-event-title {
  color: var(--clr-primary-dark) !important;
}
```

#### 12. External events — sky blue chip with sky left border
```css
.brk-calendar-google .fc-event.brk-external {
  background: color-mix(in srgb, var(--clr-sky) 15%, var(--clr-card)) !important;
  border-left: 4px solid var(--clr-sky) !important;
  color: #333 !important;
}

.brk-calendar-google .fc-event.brk-external:hover {
  background: color-mix(in srgb, var(--clr-sky) 25%, var(--clr-card)) !important;
}

.brk-calendar-google .fc-event.brk-external .fc-event-title {
  color: #2b6b9e !important;
}
```

#### 13. Blocked slots — coral diagonal stripe with coral left border
```css
.brk-calendar-google .fc-event.brk-block {
  background: repeating-linear-gradient(
    45deg,
    color-mix(in srgb, var(--clr-coral) 12%, var(--clr-card)),
    color-mix(in srgb, var(--clr-coral) 12%, var(--clr-card)) 4px,
    color-mix(in srgb, var(--clr-coral) 8%, var(--clr-card)) 4px,
    color-mix(in srgb, var(--clr-coral) 8%, var(--clr-card)) 8px
  ) !important;
  border-left: 4px solid var(--clr-coral) !important;
  border-top: none !important;
  border-right: none !important;
  border-bottom: none !important;
  border-radius: 4px !important;
  color: #888 !important;
  font-size: 12px !important;
  opacity: 0.85;
  pointer-events: none;
}

.brk-calendar-google .fc-event.brk-block .fc-event-title {
  font-weight: 500 !important;
}
```

#### 14. Preview events — translucent teal dashed border
```css
.brk-calendar-google .fc-event.brk-preview {
  background: color-mix(in srgb, var(--clr-primary) 10%, var(--clr-card)) !important;
  border: 2px dashed var(--clr-primary) !important;
  border-left: 4px solid var(--clr-primary-dark) !important;
  border-radius: 4px !important;
  opacity: 0.9 !important;
}
```

#### 15. Completed events
```css
.brk-calendar-google .fc-event.brk-completed {
  opacity: 0.6 !important;
}

.brk-calendar-google .fc-event.brk-completed::after {
  content: " ✓";
  color: var(--clr-success);
}
```

#### 16. Event delete button styling (preserve existing, add minor polish)
The delete button is injected by `eventDidMount` — no CSS changes needed for positioning, but ensure it inherits proper sizing in the new compact events.

### Constraints

- Every CSS rule must be prefixed with `.brk-calendar-google` (except `@keyframes` if any)
- Use `!important` consistently for all FullCalendar internal overrides
- ALL colors must reference CSS custom properties (`--clr-*`) where a design token exists. Only use hardcoded hex for colors that have no token (e.g., `#ea4335` for now-indicator, `#e8e8e8` for grid lines, `#dadce0` for all-day border, `#999` for week numbers, `#555` for header text)
- Use `color-mix()` for translucent backgrounds to avoid adding new colors. If `color-mix()` is not supported in your PostCSS config, use `rgba()` fallbacks with the hex-to-rgb converted values
- Do NOT modify `design-tokens.css` — all tokens are already defined
- File must not exceed 400 lines
- Do NOT remove existing selectors that are still valid — only refactor them under `.brk-calendar-google` and update their colors to use design tokens

### Validation Rules

- Verify every selector is scoped under `.brk-calendar-google`
- Verify all `--clr-*` references match actual tokens in `design-tokens.css` (primary, primary-dark, primary-bg, accent, accent-dark, coral, coral-light, sky, cream, surface, card, success)
- Verify `border-left: 4px solid` is present on `.brk-generated`, `.brk-external`, `.brk-block`, and `.brk-preview` event classes
- Verify `.fc-event` has `transition` and `hover` states
- Verify `.fc-day-today` uses `var(--clr-accent)`-based background
- Verify no hardcoded colors for teal/coral/sky — these must use `--clr-*` tokens
- Verify `color-mix()` or equivalent `rgba()` fallback is used for translucent backgrounds

---

## Testing

### Unit Tests

- [ ] No unit test changes required (pure CSS changes)

### Integration Tests

- [ ] No integration test changes required

### Manual Validation

- [ ] Build passes with `run-package-command build apps/web`
- [ ] Lint passes with `run-package-command lint apps/web`
- [ ] Open the app and visually inspect month view: grid lines, day headers, week numbers, today highlight
- [ ] Switch to week view: verify time grid lines, time gutter labels, all-day slot at top, now indicator line
- [ ] Switch to day view: same checks as week view
- [ ] Verify generated events have teal left border + translucent teal background + no full teal fill
- [ ] Verify external events have sky left border + translucent sky background
- [ ] Verify blocked slots have coral left border + coral diagonal stripe + are non-interactive
- [ ] Verify preview events have teal dashed border + teal left border
- [ ] Verify completed events show checkmark suffix + reduced opacity
- [ ] Hover over an event: verify teal glow shadow and slight upward movement
- [ ] Verify today cell has gold tint
- [ ] Verify drag-and-drop, resize, select, click all work as before
- [ ] Verify the × delete button appears on generated events in their new compact form

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

- [Approach Analysis](.opencode/plan/calendar-ui-google-design/design-docs/approach-analysis.md) — see "Event Pill Restyling", "CSS Override Strategy", "All-Day Slot Styling", "Week Number Styling", "Hover Effect", "Design System Alignment" sections
- [Planning Index](.opencode/plan/calendar-ui-google-design/planning/index.md)
- [Current source: CalendarStyles.css](../../../../apps/web/src/styles/CalendarStyles.css)
- [Design tokens](../../../../apps/web/src/styles/design-tokens.css)
- [TASK-01](./TASK-01.md) — prerequisite that adds `.brk-calendar-google` wrapper class
