# Task Template

## Task Information

### ID

TASK-04

### Title

AM/PM Setting Sync

### Owner

senior-frontend

### Status

Pending

---

## Description

The Settings modal has an "Use 12-hour format (AM/PM)" checkbox, but it uses local React state (`useState(false)`) instead of the persisted `Settings` context. As a result:
- The checkbox value is not persisted across sessions
- The setting is not propagated to `CalendarView`
- The calendar always uses the browser's default locale for time format (24h or 12h based on locale, not user preference)

The fix involves:
1. Adding `use12h: boolean` to the `Settings` type in the shared package
2. Adding `use12h: false` to `DEFAULT_SETTINGS`
3. Updating `SettingsModal` to read/write `use12h` from/to `SettingsContext` instead of local state
4. Passing `use12h` from `DashboardPage` (via `settings`) to `CalendarView`
5. Using `hour12` in FullCalendar's `eventTimeFormat` based on the `use12h` setting

---

## Acceptance Criteria

- [ ] The "Use 12-hour format (AM/PM)" checkbox is driven by `Settings.use12h` from `SettingsContext`
- [ ] Toggling the checkbox persists to localStorage and survives page reload
- [ ] The calendar's event titles display in 12h format (e.g., "9:00 AM – 10:00 AM") when `use12h` is true
- [ ] The calendar's event titles display in 24h format (e.g., "09:00 – 10:00") when `use12h` is false
- [ ] The setting is propagated to all calendar views (day, week, month)
- [ ] The work hour start/end AMPM labels in SettingsModal continue to work correctly with the new setting

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

N/A

---

## Technical Context

### Relevant Components

- `packages/shared/src/types/index.ts` — `Settings` interface
- `packages/shared/src/constants/index.ts` — `DEFAULT_SETTINGS`
- `apps/web/src/components/SettingsModal.tsx` — settings UI
- `apps/web/src/components/CalendarView.tsx` — FullCalendar `eventTimeFormat`
- `apps/web/src/pages/DashboardPage.tsx` — passes settings to CalendarView
- `apps/web/src/contexts/SettingsContext.tsx` — settings persistence (no changes needed)

### Relevant Modules

- `packages/shared` — types and constants
- `apps/web` — React components

### Relevant APIs

- FullCalendar `eventTimeFormat` prop

### Relevant Types

- `Settings` from `@brkroutnxdle/shared`

---

## Implementation Guidance

### Expected Changes

1. **In `packages/shared/src/types/index.ts`:**
   - Add `use12h: boolean` to the `Settings` interface

2. **In `packages/shared/src/constants/index.ts`:**
   - Add `use12h: false` to `DEFAULT_SETTINGS`

3. **In `apps/web/src/components/SettingsModal.tsx`:**
   - Remove the local `const [use12h, setUse12h] = useState(false)`
   - Use `settings.use12h` and `updateSettings({ use12h: ... })` instead
   - Update the checkbox `checked` and `onChange` to use context

4. **In `apps/web/src/components/CalendarView.tsx`:**
   - Accept a new optional prop `use12h?: boolean` (default `false`)
   - Update the `eventTimeFormat` to use `hour12: use12h`:
     ```tsx
     eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: use12h }}
     ```

5. **In `apps/web/src/pages/DashboardPage.tsx`:**
   - Pass `settings.use12h` to `CalendarView`:
     ```tsx
     <CalendarView ... use12h={settings.use12h} />
     ```

### Constraints

- The `eventTimeFormat` change must work correctly in all FullCalendar view types (timeGridDay, timeGridWeek, dayGridMonth)
- Must keep backward compatibility (default to 24h when prop is not provided)

### Validation Rules

- Toggle AM/PM setting → calendar event times should switch format immediately
- Refresh page → setting should persist
- Verify in day, week, and month views

---

## Testing

### Unit Tests

- [ ] Test that `Settings.use12h` defaults to `false`
- [ ] Test that `SettingsModal` reads from context (not local state)

### Integration Tests

- [ ] Test that calendar event times change between 12h/24h when toggling setting

### Manual Validation

- [ ] Open Settings → toggle AM/PM → close → calendar should reflect change
- [ ] Refresh page → open Settings → AM/PM checkbox should match previous state
- [ ] View events in day, week, month → all should show correct format

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

- `.opencode/plan/calendar-and-schedule-fixes/planning/impact-analysis.md`
- `.opencode/plan/calendar-and-schedule-fixes/planning/risks.md`
- `packages/shared/src/types/index.ts`
- `packages/shared/src/constants/index.ts`
- `apps/web/src/components/SettingsModal.tsx`
- `apps/web/src/components/CalendarView.tsx`
- `apps/web/src/pages/DashboardPage.tsx`
- `apps/web/src/contexts/SettingsContext.tsx`
