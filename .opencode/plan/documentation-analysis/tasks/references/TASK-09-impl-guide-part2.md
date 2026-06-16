# TASK-09 Implementation Guide — Part 2

FullCalendar editable mode, drag/resize wiring, and UI integration.

---

### Step 5: Create `apps/web/src/hooks/useScheduleEditing.ts`

```ts
import { useState, useCallback } from "react";
import { usePreview } from "../contexts/PreviewContext";
import { useCalendar } from "../contexts/CalendarContext";
import { useSettings } from "../contexts/SettingsContext";
import type { CalendarEvent } from "@brkroutnxdle/shared";

interface EditingState {
  isDragging: boolean;
  isResizing: boolean;
  deleteTarget: { id: string; title: string } | null;
}

export function useScheduleEditing() {
  const { previewEvents, setPreview, allocationFailures } = usePreview();
  const { events } = useCalendar();
  const { settings } = useSettings();
  const [editing, setEditing] = useState<EditingState>({
    isDragging: false,
    isResizing: false,
    deleteTarget: null,
  });

  /** Handle event drop (drag-and-drop). */
  const handleEventDrop = useCallback(
    (info: { event: { id: string; startStr: string; endStr: string } }) => {
      const updatedEvents = previewEvents.map((e) => {
        if (e.id === info.event.id) {
          return {
            ...e,
            start: info.event.startStr,
            end: info.event.endStr,
            updatedAt: new Date().toISOString(),
          };
        }
        return e;
      });
      setPreview(updatedEvents, allocationFailures);
    },
    [previewEvents, allocationFailures, setPreview],
  );

  /** Handle event resize. */
  const handleEventResize = useCallback(
    (info: { event: { id: string; startStr: string; endStr: string } }) => {
      const newDuration =
        (new Date(info.event.endStr).getTime() - new Date(info.event.startStr).getTime()) /
        60000;

      // Validate 30-min snap
      if (newDuration % 30 !== 0 || newDuration < 30) {
        info.event.revert(); // Revert to previous state
        return;
      }

      const updatedEvents = previewEvents.map((e) => {
        if (e.id === info.event.id) {
          return {
            ...e,
            start: info.event.startStr,
            end: info.event.endStr,
            updatedAt: new Date().toISOString(),
          };
        }
        return e;
      });
      setPreview(updatedEvents, allocationFailures);
    },
    [previewEvents, allocationFailures, setPreview],
  );

  /** Handle event delete. */
  const requestDelete = useCallback((id: string, title: string) => {
    setEditing((prev) => ({ ...prev, deleteTarget: { id, title } }));
  }, []);

  const confirmDelete = useCallback(() => {
    if (!editing.deleteTarget) return;
    const updatedEvents = previewEvents.filter(
      (e) => e.id !== editing.deleteTarget!.id,
    );
    setPreview(updatedEvents, allocationFailures);
    setEditing((prev) => ({ ...prev, deleteTarget: null }));
  }, [editing.deleteTarget, previewEvents, allocationFailures, setPreview]);

  const cancelDelete = useCallback(() => {
    setEditing((prev) => ({ ...prev, deleteTarget: null }));
  }, []);

  /** Validate drop position. */
  const canDropAt = useCallback(
    (startStr: string, endStr: string): boolean => {
      const startHour = new Date(startStr).getUTCHours();
      const endHour = new Date(endStr).getUTCHours();

      // Must be within available hours
      if (startHour < settings.workStartHour || endHour > settings.workEndHour) {
        return false;
      }

      // Must not overlap existing events
      const newStart = new Date(startStr).getTime();
      const newEnd = new Date(endStr).getTime();
      for (const ev of events) {
        const evStart = new Date(ev.start).getTime();
        const evEnd = new Date(ev.end).getTime();
        if (newStart < evEnd && newEnd > evStart) {
          return false;
        }
      }

      return true;
    },
    [events, settings],
  );

  return {
    ...editing,
    handleEventDrop,
    handleEventResize,
    requestDelete,
    confirmDelete,
    cancelDelete,
    canDropAt,
  };
}
```

### Step 6: Update `apps/web/src/components/CalendarView.tsx` — Add editable mode for preview

Add the following to the FullCalendar configuration when preview is active:

```tsx
// Add these props to FullCalendar when previewEvents.length > 0:
editable={true}
eventDrop={(info) => onEventDrop?.(info)}
eventResize={(info) => onEventResize?.(info)}
eventDragStart={() => {}}
eventDragStop={() => {}}
```

Update the CalendarView interface to accept editing callbacks:

```tsx
interface CalendarViewProps {
  // ... existing props
  editable?: boolean;
  onEventDrop?: (info: any) => void;
  onEventResize?: (info: any) => void;
  onDeleteRequest?: (id: string, title: string) => void;
}
```

### Step 7: Update `apps/web/src/features/preview/PreviewToolbar.tsx` — Add Save button

```tsx
import { SaveButton } from "./SaveButton";

// Inside PreviewToolbar, add:
<SaveButton
  onClick={onSave}
  disabled={isLoading}
  isSaving={saveState.status === "saving"}
  progress={saveState.progress}
/>

// Update the interface to include:
interface PreviewToolbarProps {
  // ... existing props
  onSave: () => void;
  saveState: { status: string; progress: number };
}
```

### Step 8: Update `apps/web/src/pages/DashboardPage.tsx` — Wire editing and save

```tsx
import { useScheduleEditing } from "./hooks/useScheduleEditing";
import { useSaveSchedule } from "./hooks/useSaveSchedule";
import { DeleteEventDialog } from "./features/preview/DeleteEventDialog";

// Inside DashboardPage:
const editing = useScheduleEditing();
const { saveState, save } = useSaveSchedule();

// Pass to CalendarView:
<CalendarView
  // ... existing props
  editable={isPreviewActive}
  onEventDrop={editing.handleEventDrop}
  onEventResize={editing.handleEventResize}
  onDeleteRequest={editing.requestDelete}
/>

// Pass to PreviewToolbar:
<PreviewToolbar
  // ... existing props
  onSave={save}
  saveState={saveState}
/>

// Add delete dialog:
<DeleteEventDialog
  isOpen={editing.deleteTarget !== null}
  eventTitle={editing.deleteTarget?.title ?? ""}
  onConfirm={editing.confirmDelete}
  onCancel={editing.cancelDelete}
/>

// Show save progress/error:
{saveState.status === "success" && (
  <div style={{ /* success banner */ }}>
    Schedule saved successfully!
  </div>
)}
{saveState.status === "error" && (
  <div style={{ /* error banner */ }}>
    Error: {saveState.error}
    <button onClick={save}>Retry</button>
  </div>
)}
```

### Files Created Summary

| File | Purpose |
|------|---------|
| `apps/web/src/services/diffCalculator.ts` | Computes minimal create/update/delete diff |
| `apps/web/src/hooks/useSaveSchedule.ts` | Save mutation with progress tracking |
| `apps/web/src/features/preview/SaveButton.tsx` | Save button with progress indicator |
| `apps/web/src/features/preview/DeleteEventDialog.tsx` | Confirmation dialog before delete |
| `apps/web/src/hooks/useScheduleEditing.ts` | Drag, resize, and delete event handlers |
