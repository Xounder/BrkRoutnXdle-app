# Task Template

## Task Information

### ID

TASK-01

### Title

Fix events API validation — accept flexible payload and fix async error handling

### Owner

senior-backend

### Status

Pending

---

## Description

The POST `/api/v1/events` endpoint currently rejects valid frontend requests because:

1. **Field name mismatch**: The Zod schema expects `summary` (Google Calendar API convention) but the frontend sends `title` (internal `CalendarEvent` convention).
2. **Start/End format mismatch**: The Zod schema expects `start` and `end` as objects `{ dateTime: string, timeZone?: string }` but the frontend sends ISO 8601 strings.
3. **Missing async error handling**: The async route handler uses `throw` to report validation errors, but Express 4 does not automatically catch rejected promises. This causes the error to be swallowed, the response is never sent, and the frontend receives an empty response body → `"Unexpected end of JSON input"`.

Fix all three issues so the API gracefully accepts the frontend payload format and returns proper JSON error responses when validation fails.

---

## Acceptance Criteria

- [ ] POST `/api/v1/events` accepts `title` field and maps it to `summary`
- [ ] POST `/api/v1/events` accepts `start` and `end` as ISO 8601 strings (coerces to `{ dateTime, timeZone }` objects)
- [ ] POST `/api/v1/events` still accepts the original format (`summary` and `{ dateTime, timeZone }` objects) for backward compatibility
- [ ] Validation errors return a proper JSON body with `success: false` and error details (not an empty response)
- [ ] PATCH `/api/v1/events/:id` is also fixed (same async error handling issue)
- [ ] All existing tests and builds pass
- [ ] The Google Calendar API integration continues to work (the `CreateEventPayload` type in `packages/calendar` still expects the correct format after transformation)

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This task has no dependencies and can run in parallel with TASK-02 and TASK-03.

---

## Technical Context

### Relevant Components

- `apps/api/src/routes/events.ts` — POST `/events` route handler and Zod schemas
- `apps/api/src/middleware/errorHandler.ts` — Express error handler (already outputs proper JSON)
- `apps/api/src/index.ts` — Express app setup (might need async error wrapper)

### Relevant Modules

- `packages/calendar/src/internal/types.ts` — `CreateEventPayload` type (target format after transformation)

### Relevant APIs

- `POST /api/v1/events` — create calendar event
- `PATCH /api/v1/events/:id` — update calendar event

### Relevant Types

- `CreateEventPayload` (packages/calendar) — `{ summary, start: { dateTime, timeZone? }, end: { dateTime, timeZone? } }`

---

## Implementation Guidance

### Expected Changes

#### 1. Fix async error handling (critical — root cause of "Unexpected end of JSON input")

In `apps/api/src/routes/events.ts`, replace all `throw new AppError(...)` with `next(new AppError(...))` in async handlers.

Alternatively, wrap route handlers with a higher-order function that catches rejected promises:

```typescript
import type { Request, Response, NextFunction } from "express";

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

Apply this wrapper to all async route handlers in `events.ts`.

#### 2. Update `createEventSchema` to accept flexible payload

Modify the Zod schema in `apps/api/src/routes/events.ts`:

```typescript
const createEventSchema = z.object({
  // Accept either 'title' or 'summary', with 'summary' mapped from 'title' if missing
  title: z.string().min(1).max(200).optional(),
  summary: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  start: z.union([
    z.string(),  // ISO string from frontend
    z.object({
      dateTime: z.string(),
      timeZone: z.string().optional(),
    }),
  ]),
  end: z.union([
    z.string(),  // ISO string from frontend
    z.object({
      dateTime: z.string(),
      timeZone: z.string().optional(),
    }),
  ]),
  taskId: z.string().optional(),
});
```

Use `.transform()` or a pre-processing step to normalize the payload before using it:

```typescript
// After safeParse, normalize:
const normalized = {
  summary: parsed.data.title ?? parsed.data.summary,
  description: parsed.data.description,
  start: typeof parsed.data.start === "string"
    ? { dateTime: parsed.data.start }
    : parsed.data.start,
  end: typeof parsed.data.end === "string"
    ? { dateTime: parsed.data.end }
    : parsed.data.end,
  taskId: parsed.data.taskId,
};
```

Alternatively, use Zod's `.transform()` on the schema itself.

#### 3. Update `updateEventSchema` (for PATCH endpoint)

Apply the same flexible field handling to the update schema.

#### 4. Verify the `CreateEventPayload` type compatibility

The normalized payload must still match `CreateEventPayload` from `packages/calendar/src/internal/types.ts`. The normalization step should produce exactly `{ summary, start: { dateTime, timeZone? }, end: { dateTime, timeZone? } }`.

#### 5. Update route handlers to call `next` on error

Replace:
```typescript
throw new AppError(400, "VALIDATION_ERROR", "Invalid event data", flattened);
```
With:
```typescript
next(new AppError(400, "VALIDATION_ERROR", "Invalid event data", flattened));
```

### Constraints

- Do NOT remove the existing `summary`/`{ dateTime, timeZone }` support — must be backward compatible
- The `calendarClient.createEvent()` call must receive a proper `CreateEventPayload`
- The `packages/calendar` types should remain unchanged unless absolutely necessary

### Validation Rules

- Send `{ title: "Test", start: "2026-06-19T03:30:00.000Z", end: "2026-06-19T04:00:00.000Z" }` → expect 201
- Send `{ summary: "Test", start: { dateTime: "2026-06-19T03:30:00.000Z" }, end: { dateTime: "2026-06-19T04:00:00.000Z" } }` → expect 201
- Send `{ title: "Test" }` (missing start/end) → expect 400 with JSON error body
- Send invalid body → expect 400 with `success: false` and error details

---

## Testing

### Unit Tests

- [ ] Test that `title` maps to `summary` in the normalized payload
- [ ] Test that ISO string `start` converts to `{ dateTime }` object
- [ ] Test backward compatibility with original object format

### Integration Tests

- [ ] Test POST `/api/v1/events` with the frontend payload format returns 201
- [ ] Test POST `/api/v1/events` with invalid data returns 400 with JSON body
- [ ] Test PATCH `/api/v1/events/:id` with flexible format

### Manual Validation

- [ ] Start the API, send a POST request with `title`/ISO string fields
- [ ] Send an invalid POST and verify the response has a JSON body
- [ ] Run `pnpm build` on `apps/api` to confirm no TypeScript errors

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Tests created or updated
- [ ] Build passes (`pnpm build` on `apps/api`)
- [ ] Lint passes
- [ ] Validation completed

---

## References

- `apps/api/src/routes/events.ts` — main file to modify
- `apps/api/src/middleware/errorHandler.ts` — error handler (already correct)
- `packages/calendar/src/internal/types.ts` — `CreateEventPayload` type
- `packages/calendar/src/public/operations.ts` — where `createEvent` is called
