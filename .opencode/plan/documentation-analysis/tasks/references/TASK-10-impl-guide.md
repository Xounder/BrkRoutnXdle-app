# TASK-10 Implementation Reference — ConflictDialog & Wiring

## ConflictDialog Component

```tsx
import React from "react";

interface ConflictDialogProps {
  isOpen: boolean;
  changedEventCount: number;
  onReload: () => void;
  onDiscardPreview: () => void;
}

export function ConflictDialog({ isOpen, changedEventCount, onReload, onDiscardPreview }: ConflictDialogProps) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1200 }} onClick={onDiscardPreview}>
      <div style={{ background: "#fff", borderRadius: "24px", padding: "32px", width: "400px", maxWidth: "90vw", border: "2px solid #FFD23F", boxShadow: "0 4px 20px rgba(255,210,63,0.40)" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 12px", color: "#E6B800" }}>Calendar Changes Detected</h3>
        <p style={{ fontSize: "14px", color: "#666", margin: "0 0 8px" }}>{changedEventCount} event(s) in your Google Calendar have changed since you generated the current preview.</p>
        <p style={{ fontSize: "14px", color: "#666", margin: "0 0 24px" }}>What would you like to do?</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button onClick={onReload} style={{ padding: "12px 24px", background: "linear-gradient(135deg, #FFD23F, #E6B800)", border: "none", borderRadius: "9999px", fontWeight: 700, cursor: "pointer", color: "#1E8C86" }}>Reload — Load latest calendar data</button>
          <button onClick={onDiscardPreview} style={{ padding: "12px 24px", border: "2px solid #EF6C4A", borderRadius: "9999px", background: "transparent", color: "#EF6C4A", cursor: "pointer", fontWeight: 600 }}>Discard Preview — Start fresh</button>
        </div>
      </div>
    </div>
  );
}
```

## Wiring in DashboardPage.tsx

Add to `apps/web/src/pages/DashboardPage.tsx`:

```tsx
import { useState } from "react";
import { useCompletion } from "../hooks/useCompletion";
import { useCalendarRefresh } from "../hooks/useCalendarRefresh";
import { RefreshButton } from "../features/completion/RefreshButton";
import { ConflictDialog } from "../features/completion/ConflictDialog";
import type { CalendarEvent } from "@brkroutnxdle/shared";

// Inside the component:
const { toggleCompletion } = useCompletion();
const calendarRefresh = useCalendarRefresh();
const [conflictState, setConflictState] = useState<{ hasConflicts: boolean; changedEvents: string[] }>({ hasConflicts: false, changedEvents: [] });

const handleEventClick = (event: CalendarEvent) => {
  if (event.isGenerated) toggleCompletion(event.id, event.isCompleted);
};

const handleRefresh = async () => {
  const conflicts = await calendarRefresh.detectConflicts();
  setConflictState(conflicts);
};

// In the header area:
<RefreshButton onClick={handleRefresh} isLoading={false} />

// At the bottom of the component:
<ConflictDialog
  isOpen={conflictState.hasConflicts}
  changedEventCount={conflictState.changedEvents.length}
  onReload={() => { calendarRefresh.refreshFromApi(); setConflictState({ hasConflicts: false, changedEvents: [] }); }}
  onDiscardPreview={() => { clearPreview(); setConflictState({ hasConflicts: false, changedEvents: [] }); }}
/>
```

## Testing Checklist

### Unit Tests
- [ ] Completion state machine (not-completed → completed → not-completed)
- [ ] Cache service (set, get, isExpired)
- [ ] Conflict detection logic (matching event IDs and timestamps)

### Integration Tests
- [ ] Mark event as complete → refresh → event still completed
- [ ] Toggle completion state
- [ ] Cache TTL: data served from cache before expiry, refetched after

### Manual Validation
- [ ] Completed events show green styling
- [ ] Refresh loads latest Google Calendar data
- [ ] External changes trigger conflict warning during active preview
- [ ] Completion persists after page refresh
