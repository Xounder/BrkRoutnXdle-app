# Task Template

## Task Information

### ID

TASK-06

### Title

TaskModal UI for New Restriction Fields (Time Groups, Frequency, Gap Days, Same Day)

### Owner

senior-frontend

### Status

Pending

---

## Description

Add new UI controls to TaskModal for the restriction fields defined in TASK-05: time group selection (morning/afternoon/evening/night + custom ranges), frequency (times per week), gap days (minimum days between occurrences), and allow same day toggle.

### Sub-tasks

1. **Time group selector**: Replace or augment the existing restriction UI. Add a section in TaskModal where users can:
   - Select from 4 preset time groups (morning 6-12, afternoon 12-18, evening 18-0, night 0-6) via radio buttons or checkboxes
   - Add custom hour ranges (start hour, end hour sliders or number inputs)
2. **Frequency input**: Add a number input for `frequency` (1-7, how many times per week)
3. **Gap days input**: Add a number input for `gapDays` (0-6, minimum days between occurrences)
4. **Allow same day toggle**: Add a checkbox for `allowSameDay`
5. **Restriction serialization**: When saving, serialize the new UI state into the `TaskRestriction[]` array and the new `Task` fields. When editing, deserialize back to UI state.
6. **Existing restriction compatibility**: Keep existing restriction types (morning-only, afternoon-only, no-weekends, etc.) working. The new fields are additive.

---

## Acceptance Criteria

- [ ] TaskModal shows a "Time Groups" section with 4 preset radio/checkboxes (morning, afternoon, evening, night)
- [ ] TaskModal allows adding custom hour ranges with start/end hour inputs
- [ ] Frequency input (1-7) is present and functional
- [ ] Gap days input (0-6) is present and functional
- [ ] Allow same day checkbox is present and functional
- [ ] Saving a task persists the new restriction fields to TaskContext/localStorage
- [ ] Editing a task correctly loads the saved restriction values
- [ ] Existing restriction fields (no-weekends, weekdays-only, specific-days) continue to work

---

## Dependencies

### Required Tasks

- TASK-05

### Dependency Notes

TASK-05 must be completed first because the shared types must define the new fields before the UI can reference them.

---

## Technical Context

### Relevant Components

- `apps/web/src/features/tasks/TaskModal.tsx`
- `apps/web/src/features/tasks/TaskPanel.tsx`

### Relevant Contexts

- `apps/web/src/contexts/TaskContext.tsx`

### Relevant Modules

- `packages/shared/src/types/index.ts` (Task, TaskRestriction, RestrictedRange, CustomRange, TimeGroupPreset)
- `packages/shared/src/constants/index.ts` (TIME_GROUP_PRESETS)

---

## Implementation Guidance

### Expected Changes

1. **TaskModal.tsx**: Add new state variables:
   - `selectedTimeGroups: TimeGroupPreset[]`
   - `customRanges: CustomRange[]`
   - `frequency: number` (default 1)
   - `gapDays: number` (default 1)
   - `allowSameDay: boolean` (default false)
2. **UI layout** (inside the existing form):
   - "Time Groups" section: 4 checkboxes labeled "Morning (6-12)", "Afternoon (12-18)", "Evening (18-0)", "Night (0-6)"
   - "Custom Ranges" section: button to add a range, each range has startHour input (0-23) and endHour input (0-23), with a remove button
   - "Frequency" section: number input 1-7
   - "Gap Days" section: number input 0-6
   - "Allow Same Day" section: checkbox
3. **Save logic**: In `handleSubmit`:
   - Build `restrictions` array: add `{ type: "restricted-range", ranges: [...] }` if any time groups or custom ranges are selected
   - Add `frequency`, `gapDays`, `allowSameDay` to the task payload
4. **Load logic**: In the `useState` initialization:
   - Parse existing `restrictions` to find `restricted-range` entries and extract time groups/custom ranges
   - Load `frequency`, `gapDays`, `allowSameDay` from the task object
5. **TaskPanel.tsx**: Update the task display to show new restriction info (optional — nice to have).

### Constraints

- If no time groups and no custom ranges are selected, do NOT add a `restricted-range` restriction
- Frequency should be clamped to 1-7
- Gap days should be clamped to 0-6
- Allow same day only makes sense when frequency > 1 — but keep it independently settable
- Use the same styling conventions as the existing modal (inputStyle, label layout)

### Validation Rules

- Select "Morning" + "Afternoon" + frequency=3 → saved task has restricted-range with 2 presets and frequency=3
- Edit the same task → "Morning" and "Afternoon" are checked, frequency shows 3
- Add custom range 20:00-22:00 → saved task has both preset and custom ranges in restriction
- Setting allowSameDay=true with gapDays=0 → task can be scheduled multiple times per day, no gap required

---

## Testing

### Unit Tests

- [ ] Restriction serialization (UI state → TaskRestriction[])
- [ ] Restriction deserialization (Task → UI state)
- [ ] Frequency/gapDays/allowSameDay default values

### Integration Tests

- [ ] Create task with time groups → saved to TaskContext
- [ ] Edit task → all restriction fields pre-filled correctly

### Manual Validation

- [ ] Open TaskModal → see new restriction section
- [ ] Check "Morning" and "Afternoon" → save → edit → both are still checked
- [ ] Set frequency=5 → save → edit → frequency shows 5
- [ ] Set gapDays=2 → save → edit → gapDays shows 2
- [ ] Check "Allow Same Day" → save → edit → checkbox is still checked
- [ ] Add custom range 20:00-22:00 → save → edit → custom range is shown

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
