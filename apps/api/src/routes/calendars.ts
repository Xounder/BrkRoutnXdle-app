import { Router, type Router as ExpressRouter } from "express";
import type { Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getCalendarClient } from "../services/google-oauth.js";
import { AppError } from "../middleware/errorHandler.js";

export const calendarsRouter: ExpressRouter = Router();
const BRKROUTNXDL_E_CALENDAR_NAME = "BrkRoutnXdle";

calendarsRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const calendar = getCalendarClient(req.accessToken!);
  const { data } = await calendar.calendarList.list();
  res.json({ success: true, data: data.items });
});

calendarsRouter.post("/ensure", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const calendar = getCalendarClient(req.accessToken!);
  const { data: list } = await calendar.calendarList.list();
  const existing = list.items?.find((cal) => cal.summary === BRKROUTNXDL_E_CALENDAR_NAME);
  if (existing) {
    res.json({ success: true, data: { id: existing.id, summary: existing.summary, created: false } });
    return;
  }
  const { data: created } = await calendar.calendars.insert({
    requestBody: {
      summary: BRKROUTNXDL_E_CALENDAR_NAME,
      description: "Calendar managed by BrkRoutnXdle for generated schedule events",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
  res.status(201).json({ success: true, data: { id: created.id, summary: created.summary, created: true } });
});

calendarsRouter.get("/brkroutnxdle", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const calendar = getCalendarClient(req.accessToken!);
  const { data: list } = await calendar.calendarList.list();
  const brkCal = list.items?.find((cal) => cal.summary === BRKROUTNXDL_E_CALENDAR_NAME);
  if (!brkCal) {
    throw new AppError(404, "CALENDAR_NOT_FOUND", "BrkRoutnXdle calendar not found. Create it first via POST /calendars/ensure.");
  }
  res.json({ success: true, data: brkCal });
});