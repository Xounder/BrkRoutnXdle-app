import { useEffect, useMemo, useState } from "react";
import type { Task } from "@brkroutnxdle/shared";
import { useQualifiedCalendar } from "../../hooks/useQualifiedCalendar";
import { useCalendarEvents } from "../../hooks/useCalendar";
import type { PreviewRange } from "./previewSchedule";
import { guideStep, summarizeSavedWeek } from "./savedWeekSummary";

export function useDashboardInsights(range: PreviewRange, tasks: Task[], previewActive: boolean,
  proposalCount: number, saving: boolean) {
  // The grid can request a whole month; review always requests the exact civil week.
  useCalendarEvents(range.timeMin, range.timeMax);
  const snapshot = useQualifiedCalendar(range);
  const summary = useMemo(() => summarizeSavedWeek(snapshot, range),
    [snapshot, range]);
  const key = `brkroutnxdle:guide-dismissed:${snapshot.accountId ?? "anonymous"}`;
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(key) === "true"; } catch { return false; }
  });
  useEffect(() => {
    try { setDismissed(sessionStorage.getItem(key) === "true"); } catch { setDismissed(false); }
  }, [key]);
  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(key, "true"); } catch { /* Presentation state only. */ }
  };
  const activeTasks = tasks.filter(task => task.isActive).length;
  return { snapshot, summary, step: guideStep(activeTasks, summary, previewActive, proposalCount, saving),
    dismissed, dismiss };
}
