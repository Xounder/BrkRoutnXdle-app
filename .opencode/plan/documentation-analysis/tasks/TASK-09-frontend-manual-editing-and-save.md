# Task 09 — Frontend Manual Editing & Save

## Task Information

**ID:** TASK-09
**Title:** Frontend Manual Editing & Save
**Owner:** senior-frontend
**Status:** Pending

---

## Description

Enable users to fine-tune the generated preview before persisting. Implement drag-and-drop event movement, resize (30-min snap), and delete from preview. The save action computes the diff between preview and persisted state, then applies minimal changes (create/update/delete) to Google Calendar via the backend API.

---

## Acceptance Criteria

- [ ] User can drag a preview event to a new time slot and the position updates immediately
- [ ] User can drag events across different days within the same week
- [ ] User can resize a preview event by dragging its bottom edge (30-minute snap increments)
- [ ] User can delete a preview event with a confirmation dialog
- [ ] "Save" button is visible when preview is active
- [ ] Save computes diff: created events, updated events (moved/resized), deleted events
- [ ] Save sends only changed events to the backend (minimum API operations)
- [ ] New events are created in the BrkRoutnXdle Google Calendar
- [ ] Moved/resized events are updated in Google Calendar
- [ ] Deleted events are removed from Google Calendar
- [ ] User sees a progress indicator during save
- [ ] User sees a success confirmation after save completes
- [ ] If save fails, user sees an error message and can retry
- [ ] Save does not affect events in the Primary calendar
- [ ] After save, the preview is cleared and calendar shows persisted state
- [ ] "Discard" is still available before save to cancel all changes

---

## Dependencies

### Required Tasks

- TASK-08
- TASK-03

### Dependency Notes

Requires preview state (TASK-08) as the basis for editing. Requires backend event CRUD endpoints (TASK-03) for persisting changes.

---

## Technical Context

### Relevant Components

- `apps/web/src/features/preview/DragInteraction.tsx`
- `apps/web/src/features/preview/ResizeInteraction.tsx`
- `apps/web/src/features/preview/DeleteEventDialog.tsx`
- `apps/web/src/features/preview/SaveButton.tsx`
- `apps/web/src/features/preview/SaveProgressIndicator.tsx`
- `apps/web/src/hooks/useScheduleEditing.ts`
- `apps/web/src/hooks/useSaveSchedule.ts`
- `apps/web/src/services/diffCalculator.ts`

### Relevant Modules

- `apps/web`
- `packages/shared` (CalendarEvent, types)

### Relevant APIs

- `POST /api/v1/events`
- `PATCH /api/v1/events/:id`
- `DELETE /api/v1/events/:id`

### Relevant Types

- `CalendarEvent`, `DiffResult`, `SaveResult`, `EditAction`

---

## Step-by-Step Implementation — Part 1 of 2

*Continuation: `references/TASK-09-impl-guide-part2.md`*

---

### Step 1: Create `apps/web/src/services/diffCalculator.ts`

```ts
import type { GeneratedEvent } from "@brkroutnxdle/domain";
import type { CalendarEvent } from "@brkroutnxdle/shared";

export interface DiffResult {
  toCreate: Array<{
    title: string;
    start: string;
    end: string;
    taskId?: string;
  }>;
  toUpdate: Array<{
    id: string;
    title?: string;
    start?: string;
    end?: string;
  }>;
  toDelete: string[]; // event IDs
}

/**
 * Computes the diff between a preview state and the persisted calendar state.
 * Determines minimal set of create/update/delete operations needed.
 */
export function computeDiff(
  previewEvents: GeneratedEvent[],
  persistedEvents: CalendarEvent[],
): DiffResult {
  const previewMap = new Map(previewEvents.map((e) => [e.id, e]));
  const persistedMap = new Map(persistedEvents.map((e) => [e.id, e]));

  const result: DiffResult = {
    toCreate: [],
    toUpdate: [],
    toDelete: [],
  };

  // Find creates and updates
  for (const [id, preview] of previewMap) {
    const persisted = persistedMap.get(id);

    if (!persisted) {
      // New event — create
      result.toCreate.push({
        title: `Task ${preview.taskId}`,
        start: preview.start,
        end: preview.end,
        taskId: preview.taskId,
      });
    } else if (
      persisted.start !== preview.start ||
      persisted.end !== preview.end
    ) {
      // Existing event with changes — update
      result.toUpdate.push({
        id,
        start: preview.start,
        end: preview.end,
      });
    }
    // Else: unchanged — skip
  }

  // Find deletes: events in persisted but not in preview
  for (const [id] of persistedMap) {
    if (!previewMap.has(id)) {
      result.toDelete.push(id);
    }
  }

  return result;
}
```

### Step 2: Create `apps/web/src/hooks/useSaveSchedule.ts`

```ts
import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../services/api";
import { computeDiff } from "../services/diffCalculator";
import { usePreview } from "../contexts/PreviewContext";
import { useCalendar } from "../contexts/CalendarContext";
import type { CalendarEvent } from "@brkroutnxdle/shared";

interface SaveState {
  status: "idle" | "saving" | "success" | "error";
  progress: number; // 0-100
  total: number;
  completed: number;
  error: string | null;
}

export function useSaveSchedule() {
  const { previewEvents, allocationFailures, clearPreview } = usePreview();
  const { events, setEvents } = useCalendar();
  const [saveState, setSaveState] = useState<SaveState>({
    status: "idle",
    progress: 0,
    total: 0,
    completed: 0,
    error: null,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const diff = computeDiff(previewEvents, events);
      const totalOps = diff.toCreate.length + diff.toUpdate.length + diff.toDelete.length;
      setSaveState((prev) => ({ ...prev, status: "saving", total: totalOps, completed: 0 }));

      let completed = 0;

      // 1. Create new events
      for (const event of diff.toCreate) {
        await api.post<CalendarEvent>("/events", event);
        completed++;
        setSaveState((prev) => ({
          ...prev,
          completed,
          progress: Math.round((completed / totalOps) * 100),
        }));
      }

      // 2. Update changed events
      for (const event of diff.toUpdate) {
        await api.patch<CalendarEvent>(`/events/${event.id}`, {
          start: event.start,
          end: event.end,
        });
        completed++;
        setSaveState((prev) => ({
          ...prev,
          completed,
          progress: Math.round((completed / totalOps) * 100),
        }));
      }

      // 3. Delete removed events
      for (const id of diff.toDelete) {
        await api.delete(`/events/${id}`);
        completed++;
        setSaveState((prev) => ({
          ...prev,
          completed,
          progress: Math.round((completed / totalOps) * 100),
        }));
      }

      return diff;
    },
    onSuccess: () => {
      setSaveState({ status: "success", progress: 100, total: 0, completed: 0, error: null });
      clearPreview();
    },
    onError: (err: Error) => {
      setSaveState((prev) => ({
        ...prev,
        status: "error",
        error: err.message ?? "Failed to save schedule",
      }));
    },
  });

  const resetSaveState = useCallback(() => {
    setSaveState({ status: "idle", progress: 0, total: 0, completed: 0, error: null });
  }, []);

  return {
    saveState,
    save: () => saveMutation.mutate(),
    isSaving: saveState.status === "saving",
    resetSaveState,
  };
}
```

### Step 3: Create `apps/web/src/features/preview/SaveButton.tsx`

```tsx
import React from "react";

interface SaveButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSaving: boolean;
  progress: number;
}

export function SaveButton({ onClick, disabled, isSaving, progress }: SaveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isSaving}
      style={{
        padding: "10px 32px",
        background: isSaving
          ? "#ccc"
          : "linear-gradient(135deg, #27AE60, #1E8449)",
        border: "none",
        borderRadius: "9999px",
        fontWeight: 700,
        cursor: disabled || isSaving ? "not-allowed" : "pointer",
        color: "#fff",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        opacity: disabled || isSaving ? 0.7 : 1,
      }}
    >
      {isSaving ? (
        <>
          <span className="spinner" />
          Saving... {progress}%
        </>
      ) : (
        "Save to Calendar"
      )}
    </button>
  );
}
```

### Step 4: Create `apps/web/src/features/preview/DeleteEventDialog.tsx`

```tsx
import React from "react";

interface DeleteEventDialogProps {
  isOpen: boolean;
  eventTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteEventDialog({
  isOpen,
  eventTitle,
  onConfirm,
  onCancel,
}: DeleteEventDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff", borderRadius: "24px", padding: "32px",
          width: "360px", maxWidth: "90vw", textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 12px", color: "#EF6C4A" }}>Delete Event</h3>
        <p style={{ fontSize: "14px", color: "#666", margin: "0 0 24px" }}>
          Are you sure you want to delete "{eventTitle}"? This action cannot be undone until you save.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 24px",
              border: "2px solid #2BA8A2",
              borderRadius: "9999px",
              background: "transparent",
              color: "#2BA8A2",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 24px",
              background: "linear-gradient(135deg, #EF6C4A, #D45233)",
              border: "none",
              borderRadius: "9999px",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
```

*See Part 2 for wiring FullCalendar editable mode, drag/resize callbacks, and integrating the Save button into the toolbar.*

---

## Testing & Validation

See `references/TASK-09-impl-guide-part2.md` for the testing checklist, DOD, and references. The diff calculator approach and save mutation patterns are fully covered above.
