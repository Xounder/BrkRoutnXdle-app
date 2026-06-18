# Task Template

## Task Information

### ID

TASK-001

### Title

Settings Modal — Hour clamping, off-by-one fix, 12h/12h toggle, layout improvements & default timezone

### Owner

senior-frontend

### Status

Pending

---

## Description

Implement all Settings Modal changes from the approved plan. This includes auto-clamping work hour inputs (0–23), enforcing start ≤ end with max 24h span, fixing the off-by-one for `workEndHour` in `DashboardPage.tsx` and `useScheduleEditing.ts`, adding a 12h/12h display toggle, improving layout with side-by-side inputs, and updating the default timezone to use the browser's locale.

---

## Acceptance Criteria

- [ ] `workStartHour` and `workEndHour` inputs are clamped to 0–23 inclusive using `Math.max(0, Math.min(23, value))`
- [ ] Changing one hour auto-adjusts the other so that start ≤ end and the total span does not exceed 24 hours
- [ ] `slotMaxTime` in `DashboardPage.tsx` computes `workEndHour + 1` (capped at 24 → `"24:00:00"`) so that the calendar shows availability inclusive of the end hour
- [ ] In `useScheduleEditing.ts`, the boundary check `endHour > settings.workEndHour` is adjusted to account for the fixed off-by-one behavior (events ending exactly at the boundary are now valid)
- [ ] A checkbox/switch toggle for 12h/12h format using local UI state (not persisted to Settings); when 12h mode is enabled, inputs display AM/PM values (1–12) while stored values remain 0–23
- [ ] Start/End hour labels and inputs are displayed side-by-side in a flex container (instead of stacked vertically)
- [ ] Max Tasks Per Day and Default Task Duration labels/inputs are also displayed side-by-side
- [ ] `DEFAULT_SETTINGS.timezone` in `packages/shared/src/constants/index.ts` is changed from `"UTC"` to `Intl.DateTimeFormat().resolvedOptions().timeZone`

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This task has no dependencies. Other tasks (TASK-002, TASK-003) can proceed in parallel.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/SettingsModal.tsx` — Main settings modal with hour inputs, max tasks, default duration, timezone selector
- `apps/web/src/pages/DashboardPage.tsx` — Passes `slotMaxTime` to `CalendarView` (off-by-one fix needed)
- `apps/web/src/hooks/useScheduleEditing.ts` — Boundary check `endHour > settings.workEndHour` (adjustment needed)

### Relevant Modules

- `packages/shared/src/constants/index.ts` — `DEFAULT_SETTINGS.timezone`

### Relevant APIs

- `Intl.DateTimeFormat().resolvedOptions().timeZone` — Browser timezone detection
- `Intl.supportedValuesOf("timeZone")` — Already used for timezone dropdown options

### Relevant Types

- `Settings` from `@brkroutnxdle/shared` — `workStartHour`, `workEndHour`

---

## Implementation Guidance

### Expected Changes

1. **SettingsModal.tsx — Hour clamping (lines 78, 91):**
   - Wrap `parseInt(e.target.value, 10)` with `Math.max(0, Math.min(23, value))`
   - Example: `updateSettings({ workStartHour: Math.max(0, Math.min(23, parseInt(e.target.value, 10))) })`

2. **SettingsModal.tsx — Start ≤ end enforcement:**
   - When `workStartHour` changes and is > `workEndHour`, set `workEndHour` to `Math.min(workStartHour + 24, 23)`
   - When `workEndHour` changes and is < `workStartHour`, set `workStartHour` to `Math.max(0, workEndHour - 24)`
   - Ensure total span ≤ 24 by clamping appropriately

3. **DashboardPage.tsx (line 316):**
   - Change `slotMaxTime={`...${settings.workEndHour}...`}` to use `settings.workEndHour + 1`
   - Cap the result at 24, format as `"24:00:00"` when capped

4. **useScheduleEditing.ts (line 55):**
   - Adjust `endHour > settings.workEndHour` to `endHour > settings.workEndHour + 1` (or similar) so that events ending at the new inclusive boundary are valid

5. **SettingsModal.tsx — 12h/12h toggle:**
   - Add local `useState<boolean>(false)` for `use12hFormat`
   - Add a checkbox/switch labeled "Use 12-hour format"
   - When enabled, convert displayed values to 1..12 AM/PM while keeping stored values as 0..23
   - Use a small helper function: `const to12h = (h: number) => { const m = h % 12; return m === 0 ? 12 : m; }`
   - Display the AM/PM suffix alongside the input

6. **SettingsModal.tsx — Side-by-side layout:**
   - Wrap the two hour label/input pairs in a `<div style={{ display: "flex", gap: "16px" }}>`
   - Each inner label gets `flex: 1`
   - Same pattern for Max Tasks + Default Duration

7. **packages/shared/src/constants/index.ts — Default timezone:**
   - Change `timezone: "UTC"` to `timezone: Intl.DateTimeFormat().resolvedOptions().timeZone`
   - Note: this is a runtime value in a constants file — verify it behaves correctly at module init

### Constraints

- Do not persist 12h/12h preference to Settings — keep as local UI state only
- All stored hour values remain 0–23 regardless of display format
- The off-by-one fix must not break existing drag-and-drop validation
- The `Intl.DateTimeFormat().resolvedOptions().timeZone` change in shared constants must be safe for both server and client contexts

### Validation Rules

- Setting workEndHour=10 should now show availability up to hour 10 inclusive (previously showed up to 9)
- Clamping: entering 25 in workStartHour should result in 23; entering -5 should result in 0
- Start ≤ end: setting workStartHour=20 should auto-adjust workEndHour to at most 23 (20+3=23, but start ≤ end)
- 12h mode: workStartHour=0 displays as "12 AM", workStartHour=13 displays as "1 PM"

---

## Testing

### Unit Tests

- [ ] Verify hour clamping with boundary values (0, 23, negative, >23)
- [ ] Verify start ≤ end enforcement with various combinations
- [ ] Verify 12h conversion helper function

### Integration Tests

- [ ] Verify `slotMaxTime` passed to CalendarView is correct after the off-by-one fix
- [ ] Verify drag-and-drop validation still works with adjusted boundary

### Manual Validation

- [ ] Open Settings Modal, change start/end hours, verify clamping and auto-adjustment
- [ ] Toggle 12h/12h format and verify display changes without affecting stored values
- [ ] Verify the calendar time gutter now shows the correct range inclusive of workEndHour
- [ ] Verify the default timezone on a fresh account matches the browser's timezone

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Tests created or updated
- [ ] Build passes (`pnpm build` in `apps/web`)
- [ ] Lint passes
- [ ] Validation completed

---

## References

- `apps/web/src/components/SettingsModal.tsx`
- `apps/web/src/pages/DashboardPage.tsx`
- `apps/web/src/hooks/useScheduleEditing.ts`
- `packages/shared/src/constants/index.ts`
