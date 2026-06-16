import { Router, type Router as ExpressRouter } from "express";
import type { Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import * as calendarClient from "../services/calendar-client.js";

export const eventsRouter: ExpressRouter = Router();

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

const createEventSchema = z.object({
  summary: z.string().min(1).max(200),
  description: z.string().optional(),
  start: z.object({
    dateTime: z.string().regex(ISO_DATE_REGEX, "Must be ISO 8601"),
    timeZone: z.string().optional(),
  }),
  end: z.object({
    dateTime: z.string().regex(ISO_DATE_REGEX, "Must be ISO 8601"),
    timeZone: z.string().optional(),
  }),
  taskId: z.string().optional(),
});

const updateEventSchema = z.object({
  summary: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  start: z
    .object({
      dateTime: z.string().regex(ISO_DATE_REGEX),
      timeZone: z.string().optional(),
    })
    .optional(),
  end: z
    .object({
      dateTime: z.string().regex(ISO_DATE_REGEX),
      timeZone: z.string().optional(),
    })
    .optional(),
});

/** GET /events — Fetch events in a time range. */
eventsRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const timeMin = (req.query.timeMin as string) ?? new Date().toISOString();
  const timeMax = (req.query.timeMax as string) ?? new Date(Date.now() + 7 * 86400_000).toISOString();

  const events = await calendarClient.fetchEvents(req.accessToken!, timeMin, timeMax);
  res.json({ success: true, data: events });
});

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