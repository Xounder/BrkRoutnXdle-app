# Task Template

## Task Information

### ID

TASK-05

### Title

Extend Shared Types: TaskRestriction, Task Interfaces

### Owner

senior-frontend

### Status

Pending

---

## Description

Extend the `TaskRestriction` union type and `Task` interface in `packages/shared/src/types/index.ts` with new constraint fields: `frequency`, `gapDays`, `allowSameDay`, and `restrictedRanges` (time groups + custom hour ranges). All new fields are optional with sensible defaults to maintain backward compatibility with existing localStorage data.

### Sub-tasks

1. **Define `RestrictedRange` type**: A discriminated union or interface supporting:
   - Preset time groups: `morning` (6-12), `afternoon` (12-18), `evening` (18-0), `night` (0-6)
   - Custom ranges: `{ startHour: number; endHour: number }` (0-23)
2. **Extend `TaskRestriction` union**: Add members:
   - `{ type: "restricted-range"; ranges: RestrictedRange[] }` — restricts scheduling to specific time ranges
   - New fields should be separate from existing restriction types (morning-only, afternoon-only, etc.) for clarity
3. **Add task-level scheduling fields to `Task` interface**:
   - `frequency?: number` — How many times per week (default: 1)
   - `gapDays?: number` — Minimum days between occurrences (default: 1)
   - `allowSameDay?: boolean` — Allow multiple occurrences on same day (default: false)
4. **Add defaults/constants**: Update `packages/shared/src/constants/index.ts` if needed.

---

## Acceptance Criteria

- [ ] `RestrictedRange` type supports 4 named time groups (morning/afternoon/evening/night)
- [ ] `RestrictedRange` type supports custom hour ranges (startHour, endHour)
- [ ] `TaskRestriction` union includes `{ type: "restricted-range"; ranges: RestrictedRange[] }`
- [ ] `Task` interface has optional `frequency`, `gapDays`, `allowSameDay` fields
- [ ] All new fields default to backward-compatible values (frequency=1, gapDays=1, allowSameDay=false, restrictedRanges=[])
- [ ] Existing code compiles without errors (no breaking changes)
- [ ] Types are exported from `packages/shared/src/index.ts`

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

TASK-05 is a prerequisite for TASK-06 (UI) and TASK-07 (domain algorithm). Both depend on the shared types being defined first.

---

## Technical Context

### Relevant Modules

- `packages/shared/src/types/index.ts`
- `packages/shared/src/constants/index.ts`
- `packages/shared/src/index.ts` (exports)

### Relevant Types

- `TaskRestriction` (current union)
- `Task` (current interface)

---

## Implementation Guidance

### Expected Changes

1. **Add to `packages/shared/src/types/index.ts`**:

   ```typescript
   export interface CustomRange {
     startHour: number; // 0-23
     endHour: number;   // 0-23
   }

   export type TimeGroupPreset = "morning" | "afternoon" | "evening" | "night";

   export type RestrictedRange =
     | { preset: TimeGroupPreset }
     | { custom: CustomRange };

   // Add to TaskRestriction union:
   // | { type: "restricted-range"; ranges: RestrictedRange[] }

   // Add to Task interface:
   // frequency?: number;
   // gapDays?: number;
   // allowSameDay?: boolean;
   ```

2. **Add preset range constants** in `packages/shared/src/constants/index.ts`:
   ```typescript
   export const TIME_GROUP_PRESETS: Record<TimeGroupPreset, CustomRange> = {
     morning: { startHour: 6, endHour: 12 },
     afternoon: { startHour: 12, endHour: 18 },
     evening: { startHour: 18, endHour: 0 },
     night: { startHour: 0, endHour: 6 },
   };
   ```

3. **Export new types** from `packages/shared/src/index.ts`.

### Constraints

- Do NOT modify existing `TaskRestriction` members — only add new ones
- `frequency=1` means "schedule this task once per week"
- `gapDays=1` means "at least 1 day between occurrences"
- `allowSameDay=false` means "only one occurrence per day"
- All new fields must be optional (`?`) with defaults applied at the UI/domain level, not in the type

### Validation Rules

- TypeScript compilation succeeds across all packages
- New types are importable from `@brkroutnxdle/shared`
- Existing Task objects (without new fields) still type-check

---

## Testing

### Unit Tests

- [ ] New types compile correctly
- [ ] Default values are applied correctly by consuming code
- [ ] Time group presets map to correct hour ranges

### Integration Tests

- [ ] Shared package builds without errors

### Manual Validation

- [ ] `npm run build -- --filter=@brkroutnxdle/shared` passes
- [ ] Importing new types in apps/web compiles without errors

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
