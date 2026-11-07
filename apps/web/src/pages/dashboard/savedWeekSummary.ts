import type { CalendarEvent } from "@brkroutnxdle/shared";
import type { RemoteConfirmation } from "../../services/remoteConfirmation";
import type { PreviewRange } from "./previewSchedule";

export interface WeeklySummary {
  occurrences: CalendarEvent[];
  completed: CalendarEvent[];
  outstanding: CalendarEvent[];
}

/** Only a complete remote GET owns saved occurrence facts. Never count local UUID proposals. */
export function summarizeSavedWeek(snapshot: RemoteConfirmation, range: PreviewRange): WeeklySummary | null {
  if (snapshot.status !== "confirmed" || snapshot.range.timeMin !== range.timeMin ||
    snapshot.range.timeMax !== range.timeMax) return null;
  const seen = new Set<string>();
  const from = Date.parse(range.timeMin);
  const until = Date.parse(range.timeMax);
  const occurrences = snapshot.events.filter(event => {
    if (!event.isGenerated || event.isBlock || event.source !== "google" ||
      typeof event.id !== "string" || !event.id.trim() ||
      seen.has(event.id) || !Number.isFinite(Date.parse(event.start)) ||
      !Number.isFinite(Date.parse(event.end)) || Date.parse(event.end) <= Date.parse(event.start) ||
      Date.parse(event.start) < from || Date.parse(event.start) >= until) return false;
    seen.add(event.id);
    return true;
  });
  return { occurrences, completed: occurrences.filter(event => event.isCompleted),
    outstanding: occurrences.filter(event => !event.isCompleted) };
}

export type GuideStep = "create" | "calculate" | "preview" | "success";
export function guideStep(activeTasks: number, summary: WeeklySummary | null,
  previewActive: boolean, proposalCount: number, saving: boolean): GuideStep {
  if (!activeTasks) return "create";
  if (saving) return "calculate";
  if (summary?.occurrences.length) return "success";
  if (previewActive) return "preview"; // Includes zero proposals with actionable shortfalls.
  return "calculate";
}
