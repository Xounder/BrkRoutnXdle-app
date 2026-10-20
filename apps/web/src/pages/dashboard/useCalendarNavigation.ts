import { useState } from "react";
import type { ViewType } from "@brkroutnxdle/shared";
import type { DashboardCalendarNav } from "./dashboardTypes";

/**
 * Owns calendar view/date navigation for the dashboard.
 *
 * The day/week/month-aware stepping is moved verbatim from `DashboardPage`.
 */
export function useCalendarNavigation(): DashboardCalendarNav {
  const [currentView, setCurrentView] = useState<ViewType>("week" as ViewType);
  const [currentDate, setCurrentDate] = useState(new Date());

  const onPrev = () => {
    const d = new Date(currentDate);
    if (currentView === "day") d.setDate(d.getDate() - 1);
    else if (currentView === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const onNext = () => {
    const d = new Date(currentDate);
    if (currentView === "day") d.setDate(d.getDate() + 1);
    else if (currentView === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const onToday = () => setCurrentDate(new Date());

  return {
    currentView,
    currentDate,
    onPrev,
    onNext,
    onToday,
    setCurrentView,
    setCurrentDate,
  };
}
