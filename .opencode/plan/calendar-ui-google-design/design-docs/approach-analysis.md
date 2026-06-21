# Calendar UI — Google Calendar Design Approaches

## Overview

The user requests a calendar UI that visually resembles Google Calendar while maintaining the BrkRoutnXdle retro-playful design system (teal-coral-gold aesthetic). Currently, FullCalendar v6.1 renders events with default styling, and the existing CSS (`CalendarStyles.css`) provides basic event pill and grid-line customization. FullCalendar's `headerToolbar` is disabled — navigation is handled by the custom `Header` component in `MainLayout`.

Key Google Calendar visual features to target:
- Clean white background, subtle gray grid lines
- Color-coded event dots/chips with rounded corners
- Multi-day event bars spanning columns
- "All day" section at top of day/week views
- Week numbers in month view
- Minimal chrome — clean header, subtle today indicator
- Smooth transitions on view changes

**Constraints from existing code:**
- FullCalendar `allDaySlot` is currently disabled (`allDaySlot={false}`)
- Events use hardcoded background colors (`#2BA8A2`, `#5DADE2`) instead of design tokens
- Drag-and-drop, resize, select, eventClick interactions must all be preserved
- The project already has FullCalendar v6.1 fully wired through `CalendarView.tsx`

---

## Approach 1: Deep CSS Theming of FullCalendar

### Description

Override FullCalendar's internal CSS extensively to approximate Google Calendar's visual language. Uses FullCalendar's existing DOM structure and CSS variables, combined with custom classNames on events, slots, and headers. No JavaScript/React changes to the calendar library itself.

Key CSS changes:
- Override `.fc-timegrid-slots` grid lines to 1px `#e8e8e8`
- Style `.fc-event` as compact rounded pills (4px radius, small font, colored left border instead of full background)
- Enable `allDaySlot` and style it with a condensed cream background
- Enable `weekNumbers` in month view
- Override `.fc-timegrid-now-indicator` for Google's red line
- Use design system custom properties for all event colors (`--clr-primary`, `--clr-coral`, etc.)
- Subtle hover: `filter: brightness(1.05)` with `transition: all 0.15s`
- Replace FullCalendar's default event background with colored dot/chip pattern (left border accent + translucent background)
- Add `eventDidMount` logic to render custom event chips inline with Google's style

### Pros / Cons

| Pros | Cons |
|------|------|
| Zero package changes — no npm install/uninstall | Limited by FullCalendar's DOM structure — some Google features (all-day separator line, multi-day bar overlap) are hard to achieve |
| All existing interactions (drag, drop, resize, select, click) work unchanged | CSS overrides can break on FullCalendar version upgrades |
| Fastest path to production — purely CSS + minor `eventDidMount` tweaks | Cannot fully replicate Google's event chip design — FullCalendar constrains event element structure |
| Low risk — easy to roll back | Week numbers require `weekNumbers: true` prop (simple toggle) |
| Design system tokens integrate naturally via CSS custom properties | |

### Difficulty

**Medium**

Requires deep FullCalendar CSS knowledge and careful selector specificity. No React architecture changes.

### Estimated Effort

**2–3 days**

- Day 1: Grid lines, day headers, time gutter, all-day slot, week numbers, now indicator
- Day 2: Event pill restyling (left border accent, compact title, colored dot), hover states, today highlight
- Day 3: Polish, design system token integration, cross-view consistency (month, week, day)

### Design Fidelity

**Medium** (approx. 70–80% visual match)

The general layout will look Google-inspired, but FullCalendar's event rendering engine puts hard limits on things like:
- All-day event bars spanning multiple day columns
- Google's exact hover popover behavior
- The "more" link (+2 more) overflow in month view — FullCalendar has its own variant

### Compatibility

| Interaction | Status |
|-------------|--------|
| Drag-and-drop | Fully preserved |
| Resize | Fully preserved |
| Select (click-drag on empty slot) | Fully preserved |
| Event click | Fully preserved |
| Date navigation | Fully preserved (via Header) |
| View switching | Fully preserved |
| Event delete (× button) | Fully preserved |

### Maintainability

**High** — all changes are in `CalendarStyles.css`. No React component changes. CSS custom properties from the design system can be reused. FullCalendar version upgrades may require minor selector adjustments.

---

## Approach 2: Hybrid — Custom Grid Overlay + FullCalendar Interactions

### Description

Build a custom calendar grid (the visual layer — day columns, time rows, grid lines, event chips) using plain HTML/CSS/React, while keeping FullCalendar hidden in the background as an interaction engine. FullCalendar would handle drag-start, resize-start, select-start, and event coordinate calculations, while the visual layer renders everything with full control.

Architecture:
1. Render FullCalendar with `display: none` or `visibility: hidden` in a zero-height container (but interactivity still active)
2. Render a custom `<GoogleCalendarGrid />` component positioned over FullCalendar's space
3. Translate FullCalendar's event data and positions into the custom grid
4. Use `eventDragStart`/`eventDragStop` to show custom drag feedback on the visual grid
5. FullCalendar's internal `dateClick`, `select`, `eventDrop`, `eventResize` callbacks remain the source of truth

### Pros / Cons

| Pros | Cons |
|------|------|
| Complete visual control — pixel-perfect Google Calendar replica | Very high implementation complexity — two rendering layers must sync |
| No library visual constraints — can implement all-day bars, Google-style popovers, exact event chips | Hard to keep positions in sync (scroll position, view changes, resize) |
| Can use design system tokens natively without fighting FullCalendar's CSS | Double render cost — FullCalendar renders internally + custom grid renders |
| Maintains FullCalendar interaction logic (drop validation, conflict detection) | Fragile — any FullCalendar layout change can break the overlay sync logic |
| Future-proof for custom animations and interactions | Difficult to test — subtle positioning bugs are hard to catch |

### Difficulty

**Very High**

Requires deep understanding of both FullCalendar's internal event positioning system and custom DOM rendering. Intercepting FullCalendar's internal time-to-pixel calculations without public API is error-prone.

### Estimated Effort

**3–4 weeks**

- Week 1: Prototype the two-layer architecture, build custom grid HTML/CSS, sync basic positions
- Week 2: Event rendering (dots, bars, multi-day), drag ghost rendering
- Week 3: Edge cases (scroll sync, view switching, resize boundary, timezone)
- Week 4: Polish, animation, cross-browser testing

### Design Fidelity

**Very High** (95–100% visual match)

Full visual control means Google Calendar's exact pixel layout can be replicated.

### Compatibility

| Interaction | Status |
|-------------|--------|
| Drag-and-drop | Preserved — FullCalendar handles logic, custom layer shows ghost |
| Resize | Preserved — same pattern |
| Select | Preserved |
| Event click | Needs custom click handler on visual layer |
| Date navigation | Preserved |
| View switching | Needs custom view transition |
| Event delete | Needs custom button on visual layer |

### Maintainability

**Low** — two rendering systems in sync is inherently fragile. Each FullCalendar upgrade carries risk of breaking the sync layer. Debugging is difficult (position offsets, timing issues).

---

## Approach 3: Library Replacement

### Description

Replace FullCalendar with a calendar library that has a more Google Calendar-like default appearance. Primary candidates:

| Library | Version | Notes |
|---------|---------|-------|
| `react-big-calendar` | Latest | RTL support, month/week/day views, Google-like default styling. Lacks built-in drag-and-drop (needs `react-dnd` or custom) |
| `schedule-x` | Latest | Modern, customizable, built-in drag-and-drop, time grid views, Google-inspired default theme. Smaller ecosystem |
| `react-calendar-timeline` | Latest | Gantt-style, less suited for daily/weekly calendar |

**Recommended candidate: `schedule-x`** — closest to Google Calendar default, built-in drag-and-drop, good React integration, modern codebase.

### Pros / Cons

| Pros | Cons |
|------|------|
| Clean break — new library with Google-like defaults | Loses all investment in FullCalendar configuration and CSS |
| `schedule-x` supports drag-and-drop natively | All interaction wiring in `CalendarView.tsx` must be rewritten |
| No fighting library CSS — start from a better baseline | Risk: new library may have missing features or bugs |
| Could reduce overall CSS maintenance | Learning curve for the team |
| | Event deletion (× button), validation logic, block events all need re-implementation |
| | `react-big-calendar` drag-and-drop is optional/poorly maintained |

### Difficulty

**High**

Full rewrite of `CalendarView.tsx` and potentially `DashboardPage.tsx` wiring. Requires re-mapping all event types (block, recurring, preview, external).

### Estimated Effort

**2–3 weeks**

- Week 1: Evaluate and install new library, build basic calendar rendering, migrate event mapping
- Week 2: Re-implement drag-and-drop, resize, select, event click interactions
- Week 3: Polish, edge cases (all-day slot, week numbers, recurring blocks), delete button, CSS theming

### Design Fidelity

**Medium–High** (depends on chosen library)

- `schedule-x`: 80–90% visual match out of the box
- `react-big-calendar`: 60–70% visual match (needs more CSS)
- Both still require custom theming for the BrkRoutnXdle design system colors

### Compatibility

| Interaction | Status |
|-------------|--------|
| Drag-and-drop | Needs re-implementation (library-specific API) |
| Resize | Needs re-implementation |
| Select | Needs re-implementation |
| Event click | Needs re-implementation |
| Date navigation | Via Header — preserved (unrelated to library) |
| View switching | Needs re-implementation |
| Event delete | Needs re-implementation |

### Maintainability

**Medium** — depends on the chosen library's community and maintenance pace. `schedule-x` is newer but active. `react-big-calendar` is older but stable with a larger community. New dependency to track.

---

## Approach 4: Custom Calendar from Scratch

### Description

Build a fully custom calendar component with no third-party calendar library. Implement day/week/month views, grid rendering, event positioning, and all interactions (drag, resize, select, click) using plain React + HTML/CSS.

Architecture:
1. `CustomCalendar.tsx` — orchestrates state (view, date, events)
2. `DayGrid.tsx` — time grid with hour rows, 30-min slot lines
3. `MonthGrid.tsx` — month grid with day cells
4. `EventChip.tsx` — Google-style event chip component
5. `DragLayer.tsx` — drag ghost overlay for drag-and-drop
6. Use `react-dnd` or custom pointer event handling for drag-and-drop
7. Event positioning math: time-to-pixel conversion, overlap detection, multi-day bar spanning

### Pros / Cons

| Pros | Cons |
|------|------|
| Zero library constraints — exact Google Calendar visual replica | Extremely high effort — essentially building a calendar product |
| Full control over rendering, animation, performance | Must implement and maintain all interaction logic (drag snap, resize threshold, select range) |
| No version upgrade risk | Must handle all edge cases: timezone, DST, recurring events, leap years, month boundaries |
| Can deeply integrate design system tokens | Recurring event expansion logic must be reimplemented |
| Lean bundle size (no FullCalendar dependency) | Accessibility (keyboard nav, ARIA) must be built from scratch |
| | Testing complexity multiplies |

### Difficulty

**Extremely High**

Building a production-grade calendar is a well-known hard problem in frontend engineering. The number of edge cases (timezone rendering, DST transitions, multi-day event overlap, recurring event exceptions, drag boundary detection) is enormous.

### Estimated Effort

**4–8 weeks** for a minimum viable custom calendar
**8–12 weeks** for a polished, production-ready version with full interaction parity

### Design Fidelity

**Very High** (can achieve 100% visual match)

With full control, Google Calendar's exact pixel layout is achievable.

### Compatibility

| Interaction | Status |
|-------------|--------|
| Drag-and-drop | Must build from scratch (snap-to-grid, validation, ghost) |
| Resize | Must build from scratch (edge detection, min duration) |
| Select | Must build from scratch (mouse drag selection) |
| Event click | Must build from scratch |
| Date navigation | Via Header — preserved |
| View switching | Must build from scratch (month↔week↔day transition) |
| Event delete | Must build from scratch |

### Maintainability

**Low-Medium** — all code is in-house. No external dependency risk, but every new calendar feature (e.g., timezone support, print view, week number customization) must be implemented in-house. Team must maintain deep expertise in calendar rendering math.

---

## Recommendation

**Approach 1: Deep CSS Theming of FullCalendar** is the recommended approach.

### Justification

1. **Fastest time-to-value** — 2–3 days vs 2+ weeks for other approaches
2. **Zero risk to existing interactions** — drag/drop/resize/select/click all work unchanged
3. **Best return on investment** — the project already has FullCalendar fully wired through `CalendarView.tsx` with complex mapping logic (recurring blocks, preview events, block patterns). Replacing the library or building a custom calendar would require reimplementing all this mapping.
4. **Maintainability** — CSS is easy to iterate on without touching React components
5. **Design system integration** — the existing `--clr-*` CSS custom properties map naturally to calendar theming
6. **Progressive enhancement** — CSS approach can be iterated in stages. If CSS proves insufficient, Approach 2 (hybrid) can be pursued as a future phase without discarding the CSS work.

### What CSS Theming Can Achieve

| Google Feature | Feasibility with FullCalendar CSS |
|---------------|-----------------------------------|
| Clean white bg with subtle grid lines | ✅ Easy — override `.fc-timegrid-slots` border |
| Colored event left border accent | ✅ Easy — `eventDidMount` inline style or CSS |
| Compact event chip (small font, rounded) | ✅ Easy — CSS overrides |
| Red now indicator line | ✅ Already done (`border-color: #ea4335`) |
| Week numbers in month | ✅ Easy — `weekNumbers: true` prop |
| All-day slot at top | ✅ Easy — enable `allDaySlot={true}` + CSS |
| Multi-day event bars | ✅ Supported natively by FullCalendar |
| Today cell highlight | ✅ Easy — `.fc-day-today` CSS override |
| Google-like hover effect | ✅ Easy — `transition` + `box-shadow` on hover |
| Header chromeless | ✅ Already done (headerToolbar=false, custom Header) |
| Compact time gutter | ✅ Already done (11px gray labels) |
| Event dot (colored circle) instead of full bar | ⚠️ Possible via `eventDisplay: 'dot'` in month view |
| "+N more" overflow link | ✅ Built into FullCalendar's month view |

### What Would Remain Different

- FullCalendar's event element structure differs from Google's — event chips are `<a>` elements in FullCalendar vs `<div>` in Google
- Google's hover popover (showing event details) — FullCalendar has no native popover; would need a custom `eventMouseEnter` handler
- Google's exact all-day section styling — achievable but will never be pixel-identical due to different DOM structure
- Google's drag preview (transparent ghost) — FullCalendar has its own drag feedback that differs in appearance

---

## Implementation Notes

### Key Prop Changes in `CalendarView.tsx`

```tsx
<FullCalendar
  weekNumbers={true}          // Enable week numbers in month view
  allDaySlot={true}           // Enable all-day section
  allDayText="All day"        // Label
  eventDisplay="auto"         // Ensures auto-sizing for events
  eventTimeFormat={{ hour: '2-digit', minute: '2-digit' }}
  dayHeaderFormat={{ weekday: 'short', month: 'short', day: 'numeric' }}
/>
```

If `allDaySlot` is enabled, ensure block events and recurring events exclude the all-day slot by setting their `display` property appropriately.

### Event Color Strategy

Replace hardcoded hex colors (`#2BA8A2`, `#5DADE2`) in `CalendarView.tsx` with CSS class-based styling:

```tsx
// Instead of backgroundColor/borderColor, use classNames only
classNames: e.isGenerated ? ["brk-generated"] : ["brk-external"],
```

Then in `CalendarStyles.css`:

```css
.fc-event.brk-generated {
  background: var(--clr-primary);
  border-left: 4px solid var(--clr-primary-dark);
}
```

This keeps color tokens in CSS and allows the design system to be updated in one place.

### Event Pill Restyling (Google-style)

Events should look like compact chips:
- Small font (12px)
- Colored left border (4px) instead of full background fill
- Subtle translucent background tint
- Rounded corners (4px)
- 1px top/bottom margin for visual breathing room
- Truncated title with ellipsis

### CSS Override Strategy

Scope overrides under a parent container class (e.g., `.brk-calendar-google`) to avoid leaking into non-calendar FullCalendar instances:

```css
.brk-calendar-google .fc-timegrid-slots .fc-timegrid-slot {
  border-bottom: 1px solid #eee;
}
```

### All-Day Slot Styling

```css
.brk-calendar-google .fc-timegrid-all-day {
  border-bottom: 2px solid #dadce0;
  background: #f8f9fa;
}
```

### Week Number Styling

```css
.brk-calendar-google .fc-daygrid-week-number {
  font-size: 11px;
  color: #888;
  padding: 2px 4px;
}
```

### Hover Effect for Events

```css
.brk-calendar-google .fc-event {
  transition: box-shadow 0.15s ease, transform 0.1s ease;
}
.brk-calendar-google .fc-event:hover {
  box-shadow: var(--shadow-teal-glow);
  transform: translateY(-1px);
}
```

### Recurring Block Handling

Recurring blocks currently use `daysOfWeek` with `startTime`/`endTime`. When `allDaySlot` is enabled, recurring blocks must explicitly set `display: 'auto'` (not `'inverse-background'`) to render in the time grid rather than the all-day section.

### Design System Alignment

| Design Token | Calendar Usage |
|---|---|
| `--clr-primary` (#2BA8A2) | Generated events (main color) |
| `--clr-coral` (#EF6C4A) | Blocked slots |
| `--clr-accent` (#FFD23F) | Today cell highlight |
| `--clr-cream` (#FFF8E7) | All-day slot background |
| `--clr-surface` (#EFF8F7) | Calendar container background |
| `--clr-sky` (#5DADE2) | External/Google events |
| `--clr-card` (#FFFFFF) | Calendar grid background |
| `--clr-primary-dark` (#1E8C86) | Event left border accent |
| `--radius-sm` (8px) | Event chip border-radius |
| `--shadow-teal-glow` | Event hover shadow |
| `--shadow-card` | Event default shadow |
