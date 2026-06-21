# Impact Analysis

## Affected Areas

| Area | Impact | Notes |
|------|--------|-------|
| Frontend | Low | 5 isolated CSS/React changes; no structural refactoring |
| Backend | None | All changes are client-side |
| Database | None | No schema or data changes |
| Infrastructure | None | No config or deployment changes |
| Testing | Low | Each fix warrants a visual or unit test; no new test infrastructure needed |

## Expected Changes

### Issue 1 — Font Color

**Files:** `CalendarStyles.css`

**Change:** Add `color: #333` to `.brk-preview .fc-event-title` selector.

### Issue 2 — Slot Modal

**Files:** Calendar component files (TBD), likely a new modal sub-component.

**Change:** Create inline form with Name (text input) and Duration (number/select). On submit call `createTask` and place event at selected calendar position.

### Issue 3 — Home Scroll

**Files:** Home page layout CSS, Calendar wrapper CSS.

**Change:** Add `overflow: hidden` to `<main>` container. Make calendar wrapper scrollable.

### Issue 4 — AM/PM Setting

**Files:** `Settings` type definition, `SettingsContext`, `CalendarView`.

**Change:** Add `use12h: boolean` property. Persist in context. Pass as `hour12` in `eventTimeFormat` to FullCalendar.

### Issue 5 — Timezone UTC Offset

**Files:** Timezone picker component.

**Change:** Use `Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })` to compute offset and append to option labels (e.g. "America/New_York (UTC-5)").

## Dependencies

- **Issue 2** depends on the existing `createTask` API function being available in the frontend
- **Issue 4** depends on `SettingsContext` already being wired to persist state
- No cross-dependencies between issues

## Breaking Changes

None
