# TASK-03 Implementation Guide — Part 3

Remaining event routes and calendar package finalization.

---

### Step 8a: Append to `apps/api/src/routes/events.ts` — More event routes

Add these additional routes after the `GET /events` handler:

```ts
/** GET /events/week — Fetch events for a given week (Mon-Sun by default). */
eventsRouter.get("/week", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const weekStart = (req.query.weekStart as string) ?? getMonday(new Date()).toISOString();
  const weekEnd = new Date(new Date(weekStart).getTime() + 7 * 86400_000).toISOString();

  const events = await calendarClient.fetchEvents(req.accessToken!, weekStart, weekEnd);
  res.json({ success: true, data: events });
});

/** GET /events/generated — Fetch only BrkRoutnXdle-generated events. */
eventsRouter.get("/generated", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const timeMin = (req.query.timeMin as string) ?? new Date().toISOString();
  const timeMax = (req.query.timeMax as string) ?? new Date(Date.now() + 7 * 86400_000).toISOString();

  const events = await calendarClient.fetchEvents(req.accessToken!, timeMin, timeMax);
  const generated = events.filter((e) => e.isGenerated);
  res.json({ success: true, data: generated });
});

/** POST /events — Create a new event in the BrkRoutnXdle calendar. */
eventsRouter.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid event data", parsed.error.flatten());
  }

  const event = await calendarClient.createEvent(req.accessToken!, {
    summary: parsed.data.summary,
    description: parsed.data.description,
    start: parsed.data.start,
    end: parsed.data.end,
    extendedProperties: {
      private: {
        taskId: parsed.data.taskId ?? "",
      },
    },
  });

  res.status(201).json({ success: true, data: event });
});

/** PATCH /events/:id — Update an existing event. */
eventsRouter.patch("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const parsed = updateEventSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid event data", parsed.error.flatten());
  }

  const event = await calendarClient.updateEvent(req.accessToken!, id, parsed.data);
  res.json({ success: true, data: event });
});

/** DELETE /events/:id — Delete an event. */
eventsRouter.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await calendarClient.deleteEvent(req.accessToken!, id);
  res.json({ success: true, data: null });
});

/** PATCH /events/:id/complete — Mark event as completed. */
eventsRouter.patch("/:id/complete", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const event = await calendarClient.completeEvent(req.accessToken!, id, true);
  res.json({ success: true, data: event });
});

/** PATCH /events/:id/incomplete — Mark event as not completed. */
eventsRouter.patch("/:id/incomplete", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const event = await calendarClient.completeEvent(req.accessToken!, id, false);
  res.json({ success: true, data: event });
});

/** Helper: get Monday of the current week. */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
```

### Step 9: Wire event routes in `apps/api/src/index.ts`

Add the following import and middleware mount:

```ts
import { eventsRouter } from "./routes/events.js";

// Add after the calendar routes:
app.use("/api/v1/events", eventsRouter);
```

### Step 10: Verify the `packages/calendar/src/public/operations.ts` imports

Make sure `normalizeEvent` is imported at the top:

```ts
import { normalizeEvent } from "../internal/normalizer.js";
```

### Files Created Summary

| File | Purpose |
|------|---------|
| `packages/calendar/src/internal/types.ts` | Internal Google Calendar types |
| `packages/calendar/src/internal/metadata.ts` | Extended properties helpers |
| `packages/calendar/src/internal/normalizer.ts` | Google Event → CalendarEvent conversion |
| `packages/calendar/src/public/operations.ts` | CRUD operations for calendar |
| `packages/calendar/src/public/index.ts` | Public API re-exports |
| `packages/calendar/src/index.ts` | Package entry point |
| `apps/api/src/services/calendar-client.ts` | API-level calendar service with error handling |
| `apps/api/src/routes/events.ts` | Event routes (CRUD + completion) |

### Validation

```powershell
pnpm build   # Must compile without errors
pnpm -F @brkroutnxdle/api dev   # Server starts on :3001
```
