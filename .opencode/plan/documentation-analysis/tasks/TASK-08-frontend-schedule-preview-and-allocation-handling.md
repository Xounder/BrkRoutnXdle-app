# Task 08 — Frontend Schedule Preview & Allocation Handling

## Task Information

### ID

TASK-08

### Title

Frontend Schedule Preview & Allocation Handling

### Owner

senior-frontend

### Status

Pending

---

## Description

Implement the schedule preview experience: a "Calculate Week" button that runs the generation algorithm and displays the proposed schedule as a visual diff overlay on the calendar. Users can generate multiple versions, discard previews, and handle allocation failures (partial allocation reports with retry options).

---

## Acceptance Criteria

- [ ] "Calculate Week" button is visible in the header and triggers schedule generation
- [ ] Generated preview events appear on the calendar with distinct visual styling (teal/green, different from saved events)
- [ ] Preview events do not conflict with existing Google Calendar events (validated by the algorithm)
- [ ] Preview events respect blocked slots, task restrictions, and available hours
- [ ] "Generate Again" button produces a different distribution (when shuffle is enabled) and replaces the current preview
- [ ] "Discard" button removes the preview and restores the calendar to the persisted state
- [ ] Allocation failures are displayed in a clear UI panel showing: task name, required occurrences, allocated count
- [ ] User can accept partial allocation after seeing the failure report
- [ ] Preview state is maintained in PreviewContext with `previewEvents` and `isPreviewActive`
- [ ] No events are saved to Google Calendar during preview (preview is client-side only)
- [ ] Preview events are read-only at this stage (no drag/resize/delete in this task)
- [ ] Loading state is shown during generation (spinner on Calculate Week button)
- [ ] Generation completes within 1 second for typical workloads

---

## Dependencies

### Required Tasks

- TASK-05
- TASK-06
- TASK-07

### Dependency Notes

Requires calendar view (TASK-05) for rendering preview events, task/block data (TASK-06) as algorithm input, and the generation algorithm (TASK-07) from `packages/domain`.

---

## Technical Context

### Relevant Components

- `apps/web/src/features/preview/CalculateWeekButton.tsx`
- `apps/web/src/features/preview/PreviewToolbar.tsx`
- `apps/web/src/features/preview/AllocationFailurePanel.tsx`
- `apps/web/src/contexts/PreviewContext.tsx`
- `apps/web/src/hooks/useScheduleGeneration.ts`

### Relevant Modules

- `apps/web`
- `packages/domain` (`generateSchedule`)
- `packages/shared` (types)

### Relevant APIs

- N/A (generation runs client-side in packages/domain)

### Relevant Types

- `ScheduleResult`, `GeneratedEvent`, `AllocationFailure`, `PreviewState`

---

## Step-by-Step Implementation

---

### Step 1: Create `apps/web/src/contexts/PreviewContext.tsx`

```tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import type { GeneratedEvent, AllocationFailure } from "@brkroutnxdle/domain";
// Note: GeneratedEvent and AllocationFailure are re-exported from domain package

interface PreviewState {
  previewEvents: GeneratedEvent[];
  isPreviewActive: boolean;
  allocationFailures: AllocationFailure[];
  isGenerating: boolean;
}

interface PreviewContextValue extends PreviewState {
  setPreview: (events: GeneratedEvent[], failures: AllocationFailure[]) => void;
  clearPreview: () => void;
  setGenerating: (generating: boolean) => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PreviewState>({
    previewEvents: [],
    isPreviewActive: false,
    allocationFailures: [],
    isGenerating: false,
  });

  const setPreview = useCallback(
    (events: GeneratedEvent[], failures: AllocationFailure[]) => {
      setState({
        previewEvents: events,
        isPreviewActive: true,
        allocationFailures: failures,
        isGenerating: false,
      });
    },
    [],
  );

  const clearPreview = useCallback(() => {
    setState({
      previewEvents: [],
      isPreviewActive: false,
      allocationFailures: [],
      isGenerating: false,
    });
  }, []);

  const setGenerating = useCallback((generating: boolean) => {
    setState((prev) => ({ ...prev, isGenerating: generating }));
  }, []);

  return (
    <PreviewContext.Provider value={{ ...state, setPreview, clearPreview, setGenerating }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error("usePreview must be used within PreviewProvider");
  return ctx;
}
```

### Step 2: Create `apps/web/src/hooks/useScheduleGeneration.ts`

```ts
import { useCallback } from "react";
import { generateSchedule } from "@brkroutnxdle/domain";
import { useTaskContext } from "../contexts/TaskContext";
import { useBlockContext } from "../contexts/BlockContext";
import { useCalendar } from "../contexts/CalendarContext";
import { useSettings } from "../contexts/SettingsContext";
import { usePreview } from "../contexts/PreviewContext";

export function useScheduleGeneration() {
  const { tasks } = useTaskContext();
  const { blocks } = useBlockContext();
  const { events } = useCalendar();
  const { settings } = useSettings();
  const { setPreview, clearPreview, setGenerating, isGenerating } = usePreview();

  const runSchedule = useCallback(() => {
    if (isGenerating) return;
    setGenerating(true);
    try {
      const result = generateSchedule(tasks, blocks, events, settings);
      setPreview(result.generatedEvents, result.failures);
    } catch (err) { console.error("Generation failed:", err); setGenerating(false); }
  }, [tasks, blocks, events, settings, setPreview, setGenerating, isGenerating]);

  const discard = useCallback(() => {
    clearPreview();
  }, [clearPreview]);

  return {
    generateWeek: runSchedule,
    generateAgain: runSchedule,
    discard,
    isGenerating,
  };
}
```

### Step 3: Create `apps/web/src/features/preview/CalculateWeekButton.tsx`

```tsx
import React from "react";

interface CalculateWeekButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}

export function CalculateWeekButton({ onClick, disabled, isLoading }: CalculateWeekButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled || isLoading}
      style={{ padding: "10px 24px", background: isLoading ? "#ccc" : "linear-gradient(135deg, #FFD23F, #E6B800)", border: "none", borderRadius: "9999px", fontWeight: 700, cursor: disabled || isLoading ? "not-allowed" : "pointer", color: "#1E8C86", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", opacity: disabled || isLoading ? 0.7 : 1 }}>
      {isLoading ? <><span className="spinner" /> Generating...</> : "Calculate Week"}
    </button>
  );
}
```

### Step 4: Create `apps/web/src/features/preview/PreviewToolbar.tsx`

```tsx
import React from "react";

interface PreviewToolbarProps {
  onGenerateAgain: () => void;
  onDiscard: () => void;
  isLoading: boolean;
  eventCount: number;
}

export function PreviewToolbar({
  onGenerateAgain,
  onDiscard,
  isLoading,
  eventCount,
}: PreviewToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "8px 16px",
        background: "#E8F6F5",
        borderRadius: "12px",
        border: "2px solid #14b8a6",
      }}
    >
      <span style={{ fontSize: "14px", fontWeight: 600, color: "#1E8C86" }}>
        Preview: {eventCount} events
      </span>

      <button
        onClick={onGenerateAgain}
        disabled={isLoading}
        style={toolbarButtonStyle}
      >
        Generate Again
      </button>

      <button
        onClick={onDiscard}
        style={{
          ...toolbarButtonStyle,
          borderColor: "#EF6C4A",
          color: "#EF6C4A",
        }}
      >
        Discard
      </button>
    </div>
  );
}

const toolbarButtonStyle: React.CSSProperties = {
  padding: "6px 16px",
  border: "2px solid #2BA8A2",
  borderRadius: "9999px",
  background: "transparent",
  color: "#2BA8A2",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "13px",
};
```

### Step 5: Create `apps/web/src/features/preview/AllocationFailurePanel.tsx`

```tsx
import React from "react";
import type { AllocationFailure } from "@brkroutnxdle/domain";

interface AllocationFailurePanelProps {
  failures: AllocationFailure[];
  onDismiss: () => void;
}

export function AllocationFailurePanel({ failures, onDismiss }: AllocationFailurePanelProps) {
  if (failures.length === 0) return null;

  return (
    <div
      style={{
        padding: "16px",
        background: "#FFF5F0",
        borderRadius: "16px",
        border: "2px solid #EF6C4A",
        boxShadow: "0 4px 20px rgba(239,108,74,0.35)",
        margin: "12px 0",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h4 style={{ margin: 0, color: "#D45233", fontSize: "15px" }}>
          ⚠ Allocation Warning
        </h4>
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#D45233" }}
        >
          ×
        </button>
      </div>

      <p style={{ fontSize: "13px", color: "#666", margin: "0 0 12px" }}>
        Some tasks could not be fully allocated. You can still save the partial schedule or adjust tasks and regenerate.
      </p>

      {failures.map((f) => (
        <div
          key={f.taskId}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "#fff",
            borderRadius: "8px",
            marginBottom: "6px",
            fontSize: "13px",
          }}
        >
          <span style={{ fontWeight: 600, color: "#333" }}>{f.taskName}</span>
          <span style={{ color: "#EF6C4A" }}>
            {f.allocated}/{f.required} allocated
          </span>
        </div>
      ))}

      <p style={{ fontSize: "12px", color: "#999", margin: "8px 0 0", textAlign: "center" }}>
        You can accept this partial allocation or adjust your tasks and try again.
      </p>
    </div>
  );
}
```

### Step 6: Wire into the app

Wrap the provider tree with `PreviewProvider` and add the Calculate Week button to the header area. See the complete wiring pattern:

```tsx
// apps/web/src/main.tsx — add PreviewProvider:
import { PreviewProvider } from "./contexts/PreviewContext";
<PreviewProvider>{/* existing providers */}</PreviewProvider>

// apps/web/src/pages/DashboardPage.tsx — add to header:
import { useScheduleGeneration } from "./hooks/useScheduleGeneration";
import { usePreview } from "./contexts/PreviewContext";
import { CalculateWeekButton } from "./features/preview/CalculateWeekButton";
import { PreviewToolbar } from "./features/preview/PreviewToolbar";
import { AllocationFailurePanel } from "./features/preview/AllocationFailurePanel";

const { generateWeek, generateAgain, discard, isGenerating } = useScheduleGeneration();
const { isPreviewActive, previewEvents, allocationFailures } = usePreview();
```

### Step 7: Update CalendarView to show preview events

The CalendarView already supports `previewEvents` — ensure the component renders them with `backgroundColor: "#14b8a6"` and dashed border as shown in TASK-05.

---

## Testing & Validation

See `index.md` for the full testing checklist. Validate: preview events render in teal, Discard removes them, allocation failures show in the warning panel.
