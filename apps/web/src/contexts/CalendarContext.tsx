import React, { createContext, useContext, useState, useCallback } from "react";
import { CalendarEvent, ViewType } from "@brkroutnxdle/shared";

interface CalendarContextValue {
  events: CalendarEvent[];
  previewEvents: CalendarEvent[];
  currentView: ViewType;
  currentDate: Date;
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  setPreviewEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  setCurrentView: (view: ViewType) => void;
  setCurrentDate: (date: Date) => void;
  refreshCalendar: () => void;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [previewEvents, setPreviewEvents] = useState<CalendarEvent[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.Week);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshCalendar = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <CalendarContext.Provider
      value={{
        events,
        previewEvents,
        currentView,
        currentDate,
        setEvents,
        setPreviewEvents,
        setCurrentView,
        setCurrentDate,
        refreshCalendar,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): CalendarContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
}