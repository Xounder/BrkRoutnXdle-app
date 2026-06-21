# Task Template

## Task Information

### ID

TASK-03

### Title

Fix Save to Calendar payload — field mapping and error handling

### Owner

senior-frontend

### Status

Pending

---

## Description

The "Save to Calendar" flow sends calendar events to `POST /api/v1/events` with an incorrect payload format:

**Current (broken) payload:**
```json
{
  "title": "Task 555ed492-1492-4afe-8460-b0805b01139d",
  "start": "2026-06-19T03:30:00.000Z",
  "end": "2026-06-19T04:00:00.000Z",
  "taskId": "555ed492-1492-4afe-8460-b0805b01139d"
}
```

**Problems:**
1. `title` field — the API Zod schema expects `summary` (Google Calendar convention)
2. `start`/`end` as ISO strings — the API expects objects `{ dateTime: string, timeZone?: string }`
3. No error handling for failed API calls — if the API returns 400, the user sees a cryptic error

**Fix the frontend to send the correct payload format** and improve error handling so users get clear feedback when something goes wrong.

---

## Acceptance Criteria

- [ ] `diffCalculator.ts` sends `summary` instead of `title` in the `toCreate` payload
- [ ] `diffCalculator.ts` wraps `start`/`end` values in `{ dateTime }` objects (matching the API's `CreateEventPayload` type)
- [ ] The `useSaveSchedule.ts` hook catches API errors gracefully and surfaces a user-friendly message
- [ ] After saving, the error state displays a clear message (not "Unexpected end of JSON input")
- [ ] The `apiFetch` function in `api.ts` handles empty/unparseable JSON responses without crashing
- [ ] Build passes without TypeScript errors

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This task can run in parallel with TASK-01 (backend). The TASK-01 backend change will accept both the old and new payload formats for backward compatibility, so there is no strict ordering requirement. However, this task should be validated together with TASK-01 to ensure end-to-end correctness.

No dependency on TASK-02 (these are independent frontend concerns).

---

## Technical Context

### Relevant Components

- `apps/web/src/services/diffCalculator.ts` — generates `toCreate` payload with `{ title, start, end, taskId }`
- `apps/web/src/hooks/useSaveSchedule.ts` — iterates over diff and calls `api.post("/events", event)`
- `apps/web/src/services/api.ts` — `apiFetch` base function that calls `response.json()`
- `apps/web/src/pages/DashboardPage.tsx` — renders save error state

### Relevant Modules

- `packages/calendar/src/internal/types.ts` — `CreateEventPayload` type (target format)

### Relevant APIs

- `POST /api/v1/events` — create calendar event

### Relevant Types

- `DiffResult.toCreate` (in `diffCalculator.ts`) — currently `{ title, start, end, taskId }`
- `CreateEventPayload` (in `packages/calendar`) — `{ summary, start: { dateTime }, end: { dateTime } }`

---

## Implementation Guidance

### Expected Changes

#### 1. Fix `diffCalculator.ts` — change payload format

Update the `toCreate` item type and the `computeDiff` function to send:

```typescript
// In DiffResult, change toCreate from:
{ title: string; start: string; end: string; taskId?: string }

// To:
{ summary: string; start: { dateTime: string }; end: { dateTime: string }; taskId?: string }
```

In the `computeDiff` function (around line 43):

```typescript
result.toCreate.push({
  summary: `Task ${preview.taskId}`,
  start: { dateTime: preview.start },
  end: { dateTime: preview.end },
  taskId: preview.taskId,
});
```

**Alternative approach (if backward compatibility is desired):**
Keep the `DiffResult` type flexible and do the transformation in `useSaveSchedule.ts` before calling the API. But the cleanest fix is to change `diffCalculator.ts` to produce the correct format directly.

#### 2. Fix `useSaveSchedule.ts` — add error context

The `saveMutation.onError` already catches errors, but the error message might be cryptic. Improve it:

```typescript
onError: (err: Error) => {
  let message = "Failed to save schedule";
  if (err instanceof ApiError) {
    message = `Save failed: ${err.message} (${err.status})`;
    if (err.details?.fieldErrors) {
      const fields = Object.keys(err.details.fieldErrors).join(", ");
      message += ` — Invalid fields: ${fields}`;
    }
  } else if (err.message) {
    message = err.message;
  }
  setSaveState((prev) => ({
    ...prev,
    status: "error",
    error: message,
  }));
},
```

Note: The `ApiError` class and the `apiFetch` function are in `apps/web/src/services/api.ts`. The `ApiError` constructor is: `ApiError(code, message, status)`. You may need to pass additional details from the response.

#### 3. Fix `api.ts` — handle empty/unparseable JSON responses

In `apiFetch`, the current code does:
```typescript
const json = await response.json();
```

If the response has no body (e.g., from an unhandled async error), this throws `"Unexpected end of JSON input"`. Wrap in a try/catch:

```typescript
let json: any;
try {
  json = await response.json();
} catch {
  if (!response.ok) {
    throw new ApiError(
      "HTTP_ERROR",
      `Request failed with status ${response.status} (no response body)`,
      response.status,
    );
  }
  throw new ApiError("PARSE_ERROR", "Failed to parse response as JSON", response.status);
}
```

This way, even if the backend has a bug (like the uncaught async error), the frontend shows a meaningful message instead of a cryptic JSON parse error.

#### 4. Update type imports

Update `diffCalculator.ts` to import the correct types and ensure the `DiffResult` interface is updated to reflect the new shape.

### Constraints

- The `packages/shared` `CalendarEvent` type uses `title` and `start`/`end` as strings — this is the **normalized** (read) type. The **write** payload (sent to POST /events) is a different shape. Do NOT change the shared `CalendarEvent` type.
- The transformation should happen at the boundary where data is sent to the API (in `diffCalculator.ts` or `useSaveSchedule.ts`), not in the components.

### Validation Rules

- After fix, sending a save creates events without JSON parse error
- The network tab should show POST to `/api/v1/events` with `summary` field and `start`/`end` as `{ dateTime }` objects
- If the API returns an error, the UI shows a clear error message (not "Unexpected end of JSON input")

---

## Testing

### Unit Tests

- [ ] Test `computeDiff` produces `summary` instead of `title`
- [ ] Test `computeDiff` wraps `start`/`end` in `{ dateTime }` objects
- [ ] Test `apiFetch` handles empty response without throwing JSON parse error

### Integration Tests

- [ ] Test full save flow: generate schedule → preview → save → verify API receives correct payload

### Manual Validation

- [ ] Open the app, generate a schedule
- [ ] Click "Save to Calendar" — verify no JSON parse error
- [ ] Check browser DevTools Network tab for correct POST payload format
- [ ] Temporarily break the API (stop the server) and verify a clear error message appears

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Tests created or updated
- [ ] Build passes (`pnpm build` on `apps/web`)
- [ ] Lint passes
- [ ] Validation completed

---

## References

- `apps/web/src/services/diffCalculator.ts` — lines 6–10 (DiffResult type), lines 43–48 (toCreate push)
- `apps/web/src/hooks/useSaveSchedule.ts` — lines 37–45 (POST call), lines 78–84 (error handling)
- `apps/web/src/services/api.ts` — lines 41 (response.json()), lines 54–62 (ApiError class)
- `apps/web/src/pages/DashboardPage.tsx` — lines 253–285 (error display UI)
- `packages/calendar/src/internal/types.ts` — `CreateEventPayload` target format
