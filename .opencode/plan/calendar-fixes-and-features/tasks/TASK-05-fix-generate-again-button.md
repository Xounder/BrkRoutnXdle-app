# Task Template

## Task Information

### ID

TASK-05

### Title

Fix "Generate Again" button — does not regenerate the schedule

### Owner

senior-frontend

### Status

Pending

---

## Description

When the user presses "Generate Week" for the first time, a schedule is generated correctly and shown as preview events. However, pressing "Generate Again" does nothing — it keeps showing the same generated week instead of producing a new/different schedule.

**Root cause analysis:**

1. **`generateAgain` and `generateWeek` are the same function** — both point to `runSchedule` in `useScheduleGeneration.ts`. There is no differentiation between "first generation" and "re-generation."

2. **The `generateSchedule` function is pure** — calling it with the same inputs (`tasks`, `blocks`, `events`, `settings`) always produces the same output. Without passing a `previousWeek` snapshot, the shuffle engine has no basis to produce different results.

3. **The `generateSchedule` function accepts an optional `previousWeek: PreviousWeekSnapshot` parameter** for introducing variety in regeneration, but `useScheduleGeneration` never passes this parameter.

The fix should:
- Pass the previous week's generated events when calling `generateSchedule` for "Generate Again"
- Ensure the generation algorithm produces a different schedule on subsequent calls

---

## Acceptance Criteria

- [ ] Pressing "Generate Again" produces a new/different schedule (not the same as before)
- [ ] The first "Calculate Week" still works correctly
- [ ] "Generate Again" is only available when a preview is active
- [ ] Loading state (spinner) shows while generating
- [ ] New schedule replaces the previous preview events
- [ ] All existing generation functionality remains intact

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

Independent task — can run in parallel with all others.

---

## Technical Context

### Relevant Components

- `apps/web/src/hooks/useScheduleGeneration.ts` — Main generation hook
- `packages/domain/src/public/generateSchedule.ts` — Pure generation algorithm
- `packages/domain/src/internal/types.ts` — `PreviousWeekSnapshot`, `ScheduleResult` types

### Relevant Modules

- `apps/web/src/contexts/PreviewContext.tsx` — Preview state management
- `apps/web/src/features/preview/PreviewToolbar.tsx` — Contains "Generate Again" button

### Relevant APIs

- N/A (pure domain function)

### Relevant Types

- `PreviousWeekSnapshot` — `{ generatedEvents: Array<{ taskId: string; start: string; end: string }> }`
- `ScheduleResult` — `{ generatedEvents, failures, weekStart, weekEnd, generatedAt }`

---

## Implementation Guidance

### Expected Changes

In **`apps/web/src/hooks/useScheduleGeneration.ts`**:

1. **Track the last generated result** using a ref or state variable to pass as `previousWeek` on subsequent generations:

   ```typescript
   import { useRef } from "react";
   import type { PreviousWeekSnapshot } from "@brkroutnxdle/domain";

   export function useScheduleGeneration() {
     const { tasks } = useTaskContext();
     const { blocks } = useBlockContext();
     const { events } = useCalendar();
     const { settings } = useSettings();
     const { setPreview, clearPreview, setGenerating, isGenerating } = usePreview();
     const previousWeekRef = useRef<PreviousWeekSnapshot | undefined>(undefined);

     const runSchedule = useCallback(() => {
       if (isGenerating) return;
       setGenerating(true);
       try {
         const result = generateSchedule(
           tasks,
           blocks,
           events,
           settings,
           previousWeekRef.current, // Pass previous week for shuffle variety
         );
         previousWeekRef.current = {
           generatedEvents: result.generatedEvents.map((e) => ({
             taskId: e.taskId,
             start: e.start,
             end: e.end,
           })),
         };
         setPreview(result.generatedEvents, result.failures);
       } catch (err) {
         console.error("Generation failed:", err);
         setGenerating(false);
       }
     }, [tasks, blocks, events, settings, setPreview, setGenerating, isGenerating]);

     const discard = useCallback(() => {
       clearPreview();
       previousWeekRef.current = undefined; // Reset previous week on discard
     }, [clearPreview]);

     return {
       generateWeek: runSchedule,
       generateAgain: runSchedule,
       discard,
       isGenerating,
     };
   }
   ```

2. **Alternative approach** (if the above doesn't produce visible changes): Modify `runSchedule` to track whether it's a "first" or "again" generation, and adjust the algorithm's shuffle seed accordingly.

### Constraints

- Must not break the first "Calculate Week" generation
- The `PreviousWeekSnapshot` is optional in `generateSchedule` — ensure backwards compatibility
- Must handle the case where events/tasks/blocks have changed between generations
- `previousWeekRef` should be cleared when user discards the preview

### Validation Rules

- [ ] First "Calculate Week" produces a valid schedule
- [ ] "Generate Again" produces a different arrangement of events
- [ ] The new schedule is still valid (respects blocks, tasks, constraints)
- [ ] After discarding preview, "Calculate Week" works fresh

---

## Testing

### Unit Tests

- [ ] Test that `previousWeekRef` is populated after first generation
- [ ] Test that `previousWeekRef` is passed to `generateSchedule` on subsequent calls
- [ ] Test that `previousWeekRef` is cleared on discard

### Integration Tests

- [ ] Test that two consecutive "Generate Again" calls produce different events (sameness is based on positions, not event count)

### Manual Validation

- [ ] Click "Calculate Week" → verify schedule appears
- [ ] Click "Generate Again" → verify schedule changes (events are in different slots)
- [ ] Click "Generate Again" multiple times → verify each produces a different layout
- [ ] Click "Discard" → verify preview clears
- [ ] Click "Calculate Week" after discard → verify fresh generation works

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

- `apps/web/src/hooks/useScheduleGeneration.ts` (full file)
- `packages/domain/src/public/generateSchedule.ts` (lines 22-80: generation function, note `previousWeek` parameter)
- `packages/domain/src/internal/types.ts` (lines 47-54: `PreviousWeekSnapshot` type)
