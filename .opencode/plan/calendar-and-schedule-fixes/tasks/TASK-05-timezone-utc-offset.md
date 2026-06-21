# Task Template

## Task Information

### ID

TASK-05

### Title

Timezone UTC Offset Display

### Owner

senior-frontend

### Status

Pending

---

## Description

The timezone dropdown in SettingsModal shows only IANA timezone names (e.g., "America/New_York", "Europe/London") without any UTC offset information. Users cannot easily identify which timezone corresponds to their location.

The fix computes the current UTC offset for each timezone using `Intl.DateTimeFormat` and appends it to the option label (e.g., "America/New_York (UTC-5)", "Europe/London (UTC+1)").

---

## Acceptance Criteria

- [ ] Each timezone option in the dropdown displays its UTC offset appended to the name
- [ ] Format follows: `"America/New_York (UTC-5)"` or `"Asia/Kolkata (UTC+5:30)"`
- [ ] The UTC offset is computed dynamically using `Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })`
- [ ] Options without a computable offset still display the IANA name (graceful fallback)
- [ ] The `value` attribute of each `<option>` remains the IANA name (not the label)
- [ ] Performance is acceptable — offset computation happens once (in `useMemo`)

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

N/A

---

## Technical Context

### Relevant Components

- `apps/web/src/components/SettingsModal.tsx`

### Relevant Modules

- `apps/web/src/components/SettingsModal.tsx`

### Relevant APIs

- `Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })`

### Relevant Types

- None

---

## Implementation Guidance

### Expected Changes

1. **In `apps/web/src/components/SettingsModal.tsx`:**
   - Modify the `timezoneOptions` useMemo to compute and append UTC offsets
   - Create a helper function or inline logic:
     ```ts
     function getTimezoneOffset(tz: string): string {
       try {
         const formatter = new Intl.DateTimeFormat('en', {
           timeZone: tz,
           timeZoneName: 'shortOffset',
         });
         const parts = formatter.formatToParts(new Date());
         const offsetPart = parts.find(p => p.type === 'timeZoneName');
         return offsetPart ? offsetPart.value : '';
       } catch {
         return '';
       }
     }
     ```
   - Map `timezoneOptions` to an array of `{ value: string, label: string }` — keep the `value` as the IANA name, set `label` to `"$tz ($offset)"`
   - Render options using `opt.value` / `opt.label` instead of direct `tz` string

### Constraints

- Must use `formatToParts` or `format` to extract the offset string
- Must handle browsers where `timeZoneName: 'shortOffset'` is not supported (graceful fallback to IANA name only)
- The `value` attribute must remain the IANA name for correct form submission

### Validation Rules

- Verify offset text appears correctly for several timezones
- Verify form submission/update still works with the timezone value
- Verify the selected value persists correctly (the `value` attribute must match `settings.timezone`)

---

## Testing

### Unit Tests

- [ ] Test `getTimezoneOffset` returns correct offset for known timezones
- [ ] Test graceful fallback when `Intl.DateTimeFormat` fails

### Integration Tests

- [ ] Test that selecting a timezone with offset label still updates settings correctly

### Manual Validation

- [ ] Open Settings → scroll to timezone dropdown
- [ ] Verify each option shows "TimezoneName (UTC+/-X[:XX])" format
- [ ] Select a timezone → close and reopen → verify selection persists
- [ ] Test in multiple browsers if possible

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
- `apps/web/src/components/SettingsModal.tsx`
