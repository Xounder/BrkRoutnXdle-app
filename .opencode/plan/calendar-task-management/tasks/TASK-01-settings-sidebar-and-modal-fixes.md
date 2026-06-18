# Task Template

## Task Information

### ID

TASK-01

### Title

Settings Sidebar Wiring + Modal Fixes (Start/End Hour + Timezone)

### Owner

senior-frontend

### Status

Pending

---

## Description

Wire the Sidebar Settings button so it opens the SettingsModal. Fix the Available Start/End Hour inputs to bind to CalendarView's `slotMinTime`/`slotMaxTime`. Replace the Timezone free-text input with a `<select>` of IANA timezone options.

### Sub-tasks

1. **Sidebar wiring**: The Sidebar already has a "Settings" section but its content is a placeholder `<p>` tag. Replace the section content so clicking it (or the entire button area) triggers the SettingsModal via a callback prop.
2. **Add `onSettingsClick` to Sidebar** — the `Sidebar` component needs an `onSettingsClick` prop (already exists in `MainLayout` → `DashboardPage`). Wire the Settings section click to invoke this prop.
3. **Start/End Hour binding**: Currently `CalendarView` hardcodes `slotMinTime="06:00:00"` and `slotMaxTime="22:00:00"`. Read `settings.workStartHour` and `settings.workEndHour` (via a new prop or from context) and apply them dynamically.
4. **Timezone `<select>`**: Replace the `<input type="text">` in `SettingsModal` with a `<select>` populated from `Intl.supportedValuesOf('timeZone')` or a curated IANA list. Persist the selected value via existing `updateSettings`.

---

## Acceptance Criteria

- [ ] Sidebar Settings button opens SettingsModal (not placeholder content)
- [ ] Changing Available Start/End Hour in SettingsModal updates the calendar's visible hour range
- [ ] Timezone input is a `<select>` with valid IANA timezone options
- [ ] Selected timezone persists correctly in localStorage
- [ ] No regression on other SettingsModal fields (maxTasksPerDay, workDays, etc.)

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

No dependencies — Phase 1 is fully independent of Phases 2 and 3.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/components/SettingsModal.tsx`
- `apps/web/src/components/CalendarView.tsx`
- `apps/web/src/pages/DashboardPage.tsx`
- `apps/web/src/contexts/SettingsContext.tsx`

### Relevant Modules

- `packages/shared/src/types/index.ts` (`Settings` interface)
- `packages/shared/src/constants/index.ts` (`DEFAULT_SETTINGS`)

### Relevant Types

- `Settings` (workStartHour, workEndHour, timezone fields)
- `CalendarViewProps` (needs new props for slotMinTime/slotMaxTime)

---

## Implementation Guidance

### Expected Changes

1. **Sidebar.tsx**: Accept `onSettingsClick` prop. Update the Settings section button to call `onSettingsClick` instead of rendering placeholder content.
2. **DashboardPage.tsx**: Pass the existing `onSettingsClick` from `MainLayout` down to `Sidebar`. Currently `MainLayout` already has `onSettingsClick` → `DashboardPage` sets `settingsOpen` state. Ensure `Sidebar` receives this.
3. **CalendarView.tsx**: Add `slotMinTime` and `slotMaxTime` props (strings in `"HH:mm:ss"` format). Use them instead of hardcoded values. Default to `"06:00:00"` / `"22:00:00"` if not provided.
4. **DashboardPage.tsx**: Derive `slotMinTime` and `slotMaxTime` from `settings.workStartHour` and `settings.workEndHour` and pass to `CalendarView`.
5. **SettingsModal.tsx**: Replace the timezone text input with a `<select>`. Use `Intl.supportedValuesOf('timeZone')` to generate options. Format as `Region/City`. Keep the same `updateSettings({ timezone: value })` contract.

### Constraints

- Timezone list should be generated from `Intl.supportedValuesOf('timeZone')` for correctness (available in modern browsers).
- Start/End Hour values are 0-23 integers; convert to `"HH:mm:ss"` format (e.g., 8 → `"08:00:00"`, 18 → `"18:00:00"`).
- The Settings modal already works via `settingsOpen` state in DashboardPage — only the Sidebar trigger is missing.

### Validation Rules

- Changing workStartHour to 8 should show calendar starting at 08:00
- Changing workEndHour to 20 should show calendar ending at 20:00
- Timezone select should show at least 100+ IANA options
- Selected timezone should survive page reload

---

## Testing

### Unit Tests

- [ ] CalendarView renders with correct slotMinTime/slotMaxTime from props
- [ ] SettingsModal timezone select contains options from Intl API

### Integration Tests

- [ ] Sidebar → Settings click → SettingsModal opens
- [ ] Changing timezone → SettingsContext updates → value persists in localStorage

### Manual Validation

- [ ] Open app, click Settings in sidebar → SettingsModal appears
- [ ] Change Start Hour to 9 → calendar shows 09:00 as earliest time
- [ ] Change End Hour to 17 → calendar shows 17:00 as latest time
- [ ] Open timezone dropdown → dozens of IANA zones listed
- [ ] Select "America/New_York" → save → reload → still "America/New_York"

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

- [Planning Index](.opencode/plan/calendar-task-management/planning/index.md)
- [Impact Analysis](.opencode/plan/calendar-task-management/planning/impact-analysis.md)
