# Task 10 — Frontend Completion, Sync & Conflict

## Task Information

### ID

TASK-10

### Title

Frontend Completion, Sync & Conflict

### Owner

senior-frontend

### Status

Pending

---

## Description

Enable ongoing use of the system: users can mark events as completed (protecting them from recalculation), manually refresh calendar data, and handle conflicts when external Google Calendar changes invalidate the current preview.

---

## Acceptance Criteria

- [ ] User can click a generated event and mark it as completed (context menu or event click)
- [ ] Completed events show visual distinction (green color or checkmark overlay)
- [ ] Completed events are never moved during recalculation (algorithm respects `completed` flag)
- [ ] User can undo completion (mark as incomplete)
- [ ] Completion status persists in Google Calendar (via extended properties) and survives page refresh
- [ ] "Refresh" button in the header reloads calendar data from Google Calendar
- [ ] Calendar data loads automatically on app startup
- [ ] Calendar cache expires after 5 minutes and triggers automatic refetch
- [ ] If external changes occurred while viewing a preview, user sees a warning dialog
- [ ] Warning dialog offers options: "Reload" (discard preview, load latest) or "Discard Preview" (regenerate)
- [ ] Cache layer is implemented in localStorage with TTL expiry

---

## Dependencies

### Required Tasks

- TASK-09

### Dependency Notes

Requires events to be persisted in the calendar (TASK-09) before completion and sync operations have meaning.

---

## Technical Context

### Relevant Components

- `apps/web/src/features/completion/CompletionAction.tsx`
- `apps/web/src/features/completion/RefreshButton.tsx`
- `apps/web/src/features/completion/ConflictDialog.tsx`
- `apps/web/src/services/calendarCache.ts`
- `apps/web/src/hooks/useCompletion.ts`
- `apps/web/src/hooks/useCalendarRefresh.ts`

### Relevant Modules

- `apps/web`
- `packages/shared` (types)

### Relevant APIs

- `PATCH /api/v1/events/:id/complete`
- `PATCH /api/v1/events/:id/incomplete`
- `GET /api/v1/events`

### Relevant Types

- `CalendarEvent`, `CompletionStatus`, `ConflictState`, `CacheEntry`

---

## Step-by-Step Implementation

---

### Step 1: Create `apps/web/src/services/calendarCache.ts`

```ts
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { CACHE_TTL_MS } from "@brkroutnxdle/shared";

const CACHE_KEY = "brkroutnxdle:calendarCache";

interface CacheEntry {
  data: CalendarEvent[];
  expiresAt: number;
}

/**
 * Stores calendar events in localStorage with a TTL.
 */
export function setCalendarCache(events: CalendarEvent[]): void {
  const entry: CacheEntry = {
    data: events,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

/**
 * Retrieves cached calendar events if within TTL.
 * Returns null if cache is expired or missing.
 */
export function getCalendarCache(): CalendarEvent[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return entry.data;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

/**
 * Clears the calendar cache.
 */
export function clearCalendarCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Checks if the cache is still valid.
 */
export function isCacheValid(): boolean {
  const cached = getCalendarCache();
  return cached !== null;
}
```

### Step 2: Create `apps/web/src/hooks/useCompletion.ts`

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { useCalendar } from "../contexts/CalendarContext";
import type { CalendarEvent } from "@brkroutnxdle/shared";

export function useCompletion() {
  const queryClient = useQueryClient();
  const { events, setEvents } = useCalendar();

  const completeMutation = useMutation({
    mutationFn: async ({
      eventId,
      completed,
    }: {
      eventId: string;
      completed: boolean;
    }) => {
      const endpoint = completed
        ? `/events/${eventId}/complete`
        : `/events/${eventId}/incomplete`;
      return api.patch<CalendarEvent>(endpoint);
    },
    onSuccess: (updatedEvent, variables) => {
      // Update local state immediately
      const updated = events.map((e) =>
        e.id === variables.eventId
          ? { ...e, isCompleted: variables.completed }
          : e,
      );
      setEvents(updated);
      // Invalidate queries to refetch from backend
      queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
    },
  });

  const toggleCompletion = (eventId: string, currentCompleted: boolean) => {
    completeMutation.mutate({ eventId, completed: !currentCompleted });
  };

  return {
    toggleCompletion,
    isToggling: completeMutation.isPending,
  };
}
```

### Step 3: Create `apps/web/src/features/completion/CompletionAction.tsx`

```tsx
import React from "react";

interface CompletionActionProps {
  eventId: string;
  isCompleted: boolean;
  isGenerated: boolean;
  onToggle: (eventId: string, isCompleted: boolean) => void;
}

export function CompletionAction({
  eventId,
  isCompleted,
  isGenerated,
  onToggle,
}: CompletionActionProps) {
  if (!isGenerated) return null; // Only BrkRoutnXdle events can be completed

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(eventId, isCompleted);
      }}
      style={{
        padding: "4px 12px",
        borderRadius: "9999px",
        border: "none",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 700,
        background: isCompleted
          ? "linear-gradient(135deg, #27AE60, #1E8449)"
          : "transparent",
        color: isCompleted ? "#fff" : "#27AE60",
        outline: isCompleted ? "none" : "2px solid #27AE60",
      }}
      title={isCompleted ? "Mark as incomplete" : "Mark as completed"}
    >
      {isCompleted ? "✓ Done" : "Complete"}
    </button>
  );
}
```

### Step 4: Create `apps/web/src/features/completion/RefreshButton.tsx`

```tsx
import React from "react";

interface RefreshButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function RefreshButton({ onClick, isLoading }: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        padding: "8px 20px",
        border: "2px solid #5DADE2",
        borderRadius: "9999px",
        background: isLoading ? "#E8F6F5" : "transparent",
        color: "#5DADE2",
        cursor: isLoading ? "not-allowed" : "pointer",
        fontWeight: 600,
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      <span
        style={{
          display: "inline-block",
          transition: "transform 0.3s",
          ...(isLoading ? { animation: "spin 1s linear infinite" } : {}),
        }}
      >
        ↻
      </span>
      {isLoading ? "Refreshing..." : "Refresh"}
    </button>
  );
}
```

### Step 5: Create `apps/web/src/hooks/useCalendarRefresh.ts`

```ts
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCalendar } from "../contexts/CalendarContext";
import { usePreview } from "../contexts/PreviewContext";
import { getCalendarCache, setCalendarCache, clearCalendarCache } from "../services/calendarCache";
import { api } from "../services/api";
import type { CalendarEvent } from "@brkroutnxdle/shared";

export function useCalendarRefresh() {
  const queryClient = useQueryClient();
  const { events, setEvents } = useCalendar();
  const { isPreviewActive } = usePreview();

  /** Fetches fresh data from the API and updates cache + context. */
  const refreshFromApi = useCallback(async () => {
    const timeMin = new Date(Date.now() - 7 * 86400_000).toISOString();
    const timeMax = new Date(Date.now() + 14 * 86400_000).toISOString();

    const freshEvents = await api.get<CalendarEvent[]>("/events", {
      timeMin,
      timeMax,
    });

    setCalendarCache(freshEvents);
    setEvents(freshEvents);
    return freshEvents;
  }, [setEvents]);

  /** Detects conflicts between preview state and latest API data. */
  const detectConflicts = useCallback(
    async (): Promise<{ hasConflicts: boolean; changedEvents: string[] }> => {
      if (!isPreviewActive) return { hasConflicts: false, changedEvents: [] };

      const freshEvents = await refreshFromApi();
      const changedEvents: string[] = [];

      for (const fresh of freshEvents) {
        const local = events.find((e) => e.id === fresh.id);
        if (local && (local.start !== fresh.start || local.end !== fresh.end)) {
          changedEvents.push(fresh.id);
        }
      }

      return {
        hasConflicts: changedEvents.length > 0,
        changedEvents,
      };
    },
    [events, isPreviewActive, refreshFromApi],
  );

  /** Loads from cache first, then fetches fresh data in background. */
  const loadWithCache = useCallback(() => {
    const cached = getCalendarCache();
    if (cached) {
      setEvents(cached);
    }
    // Always fetch fresh data in background
    refreshFromApi().catch(console.error);
  }, [setEvents, refreshFromApi]);

  return {
    refreshFromApi,
    detectConflicts,
    loadWithCache,
    clearCache: clearCalendarCache,
  };
}
```

### Step 6: Create `apps/web/src/features/completion/ConflictDialog.tsx`

See `references/TASK-10-impl-guide.md` for the full ConflictDialog component and wiring instructions. The dialog shows when external calendar changes are detected and offers "Reload" or "Discard Preview" options.

### Step 7: Wire into the app

Add `useCompletion`, `useCalendarRefresh`, `CompletionAction`, `RefreshButton`, and `ConflictDialog` to `DashboardPage.tsx`. See the reference file for the exact wiring code.

### Files Created in This Task

| File | Purpose |
|------|---------|
| `apps/web/src/services/calendarCache.ts` | localStorage cache with TTL |
| `apps/web/src/hooks/useCompletion.ts` | Completion toggle mutation |
| `apps/web/src/features/completion/CompletionAction.tsx` | Complete/incomplete button |
| `apps/web/src/features/completion/RefreshButton.tsx` | Manual refresh button |
| `apps/web/src/hooks/useCalendarRefresh.ts` | Cache-first loading + conflict detection |
| `apps/web/src/features/completion/ConflictDialog.tsx` | External change warning dialog |


---

## Testing & Validation

See `references/TASK-10-impl-guide.md` for the complete testing checklist, including unit tests for the cache service and conflict detection, integration tests for completion toggle and cache TTL, and manual validation steps.
