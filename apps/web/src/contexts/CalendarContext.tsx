import React, { createContext, useContext, useState, useCallback } from "react";
import { ViewType } from "@brkroutnxdle/shared";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { storage } from "../services/localStorage";
import { useAuth } from "./AuthContext";
import { activeRemoteAccount, remoteIdentityVersion } from "../services/remoteConfirmation";

const storageKey = (id: string) => `brkroutnxdle:events:${encodeURIComponent(id)}`;

function loadEvents(id: string): CalendarEvent[] {
  const value = storage.get<unknown>(storageKey(id), []);
  return Array.isArray(value) ? value.filter((event): event is CalendarEvent =>
    !!event && typeof event === "object" && typeof event.id === "string" &&
    typeof event.start === "string" && typeof event.end === "string" &&
    Number.isFinite(Date.parse(event.start)) && Number.isFinite(Date.parse(event.end)) &&
    Date.parse(event.end) > Date.parse(event.start) &&
    (event.source === "google" || event.source === "brkroutnxdle")) : [];
}

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
  const { user, loading } = useAuth();
  const id = !loading && user ? user.id : null;
  return <ScopedCalendarProvider key={id ?? "anonymous"} accountId={id}>{children}</ScopedCalendarProvider>;
}

function ScopedCalendarProvider({ children, accountId }: { children: React.ReactNode; accountId: string | null }) {
  const mountedEpoch = React.useRef(remoteIdentityVersion());
  const [events, setEvents] = useState<CalendarEvent[]>(() => accountId ? loadEvents(accountId) : []);
  const [previewEvents, setPreviewEvents] = useState<CalendarEvent[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.Week);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const persistEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>> = useCallback(
    (action) => {
      if (!accountId || activeRemoteAccount() !== accountId || remoteIdentityVersion() !== mountedEpoch.current) return;
      setEvents((prev) => {
        const next =
          typeof action === "function"
            ? (action as (prev: CalendarEvent[]) => CalendarEvent[])(prev)
            : action;
        try {
          storage.set(storageKey(accountId), next);
        } catch (e) {
          console.warn("Failed to persist events to localStorage:", e);
        }
        return next;
      });
    },
    [setEvents, accountId],
  );

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
        setEvents: persistEvents,
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
