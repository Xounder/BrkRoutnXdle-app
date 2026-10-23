import { Router, type Router as ExpressRouter, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import * as calendarClient from "../services/calendar-client.js";

export const eventsRouter: ExpressRouter = Router();

// ── Async handler wrapper ──────────────────────────────────────────

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ── Schemas ────────────────────────────────────────────────────────

const dateTimeObjectSchema = z.object({
  dateTime: z.string(),
  timeZone: z.string().optional(),
});

const flexibleDateTimeSchema = z.union([z.string(), dateTimeObjectSchema]);

const createEventSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    summary: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    start: flexibleDateTimeSchema,
    end: flexibleDateTimeSchema,
    taskId: z.string().optional(),
    isPinned: z.boolean().optional(),
  })
  .refine((data) => data.title || data.summary, {
    message: "Either 'title' or 'summary' must be provided",
    path: ["title"],
  });

const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  start: flexibleDateTimeSchema.optional(),
  end: flexibleDateTimeSchema.optional(),
  isPinned: z.boolean().optional(),
});

/** GET /events — Fetch events in a time range. */
eventsRouter.get("/", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const timeMin = (authReq.query.timeMin as string) ?? new Date().toISOString();
  const timeMax = (authReq.query.timeMax as string) ?? new Date(Date.now() + 7 * 86400_000).toISOString();

  const events = await calendarClient.fetchEvents(authReq.accessToken!, timeMin, timeMax);
  res.json({ success: true, data: events });
}));

/** GET /events/week — Fetch events for a given week (Mon-Sun by default). */
eventsRouter.get("/week", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const weekStart = (authReq.query.weekStart as string) ?? getMonday(new Date()).toISOString();
  const weekEnd = new Date(new Date(weekStart).getTime() + 7 * 86400_000).toISOString();

  const events = await calendarClient.fetchEvents(authReq.accessToken!, weekStart, weekEnd);
  res.json({ success: true, data: events });
}));

/** GET /events/generated — Fetch only BrkRoutnXdle-generated events. */
eventsRouter.get("/generated", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const timeMin = (authReq.query.timeMin as string) ?? new Date().toISOString();
  const timeMax = (authReq.query.timeMax as string) ?? new Date(Date.now() + 7 * 86400_000).toISOString();

  const events = await calendarClient.fetchEvents(authReq.accessToken!, timeMin, timeMax);
  const generated = events.filter((e) => e.isGenerated);
  res.json({ success: true, data: generated });
}));

/** POST /events — Create a new event in the BrkRoutnXdle calendar. */
eventsRouter.post("/", requireAuth, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  const parsed = createEventSchema.safeParse(authReq.body);
  if (!parsed.success) {
    return next(new AppError(400, "VALIDATION_ERROR", "Invalid event data", parsed.error.flatten()));
  }

  const summary = parsed.data.title ?? parsed.data.summary!;
  const start = typeof parsed.data.start === "string"
    ? { dateTime: parsed.data.start }
    : parsed.data.start;
  const end = typeof parsed.data.end === "string"
    ? { dateTime: parsed.data.end }
    : parsed.data.end;

  const event = await calendarClient.createEvent(authReq.accessToken!, {
    summary,
    description: parsed.data.description,
    start,
    end,
    isPinned: parsed.data.isPinned ?? false,
    extendedProperties: {
      private: {
        taskId: parsed.data.taskId ?? "",
      },
    },
  });

  res.status(201).json({ success: true, data: event });
}));

/** PATCH /events/:id — Update an existing event. */
eventsRouter.patch("/:id", requireAuth, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = authReq.params;
  const parsed = updateEventSchema.safeParse(authReq.body);
  if (!parsed.success) {
    return next(new AppError(400, "VALIDATION_ERROR", "Invalid event data", parsed.error.flatten()));
  }

  const d = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (d.title || d.summary) updateData.summary = d.title ?? d.summary;
  if (d.description !== undefined) updateData.description = d.description;
  if (d.start) {
    updateData.start = typeof d.start === "string" ? { dateTime: d.start } : d.start;
  }
  if (d.end) {
    updateData.end = typeof d.end === "string" ? { dateTime: d.end } : d.end;
  }
  if (d.isPinned !== undefined) updateData.isPinned = d.isPinned;

  const event = await calendarClient.updateEvent(authReq.accessToken!, id, updateData);
  res.json({ success: true, data: event });
}));

/** DELETE /events/:id — Delete an event. */
eventsRouter.delete("/:id", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = authReq.params;
  await calendarClient.deleteEvent(authReq.accessToken!, id);
  res.json({ success: true, data: null });
}));

/** PATCH /events/:id/complete — Mark event as completed. */
eventsRouter.patch("/:id/complete", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = authReq.params;
  const event = await calendarClient.completeEvent(authReq.accessToken!, id, true);
  res.json({ success: true, data: event });
}));

/** PATCH /events/:id/incomplete — Mark event as not completed. */
eventsRouter.patch("/:id/incomplete", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = authReq.params;
  const event = await calendarClient.completeEvent(authReq.accessToken!, id, false);
  res.json({ success: true, data: event });
}));

/** Helper: get Monday of the current week. */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
