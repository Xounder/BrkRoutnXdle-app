import type { CalendarEvent } from "@brkroutnxdle/shared";

/** Raw Google Calendar API event shape (relevant fields only). */
export interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  description?: string | null;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
  status?: string;
  transparency?: string;
  visibility?: string;
}

/** Extended properties metadata for BrkRoutnXdle events. */
export interface BrkRoutnXdleMetadata {
  app: string;
  generated: string;
  pinned: string;
  completed: string;
  taskId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a new event in Google Calendar. */
export interface CreateEventPayload {
  summary: string;
  /** Manual placement marker; omitted creates an unpinned event. */
  isPinned?: boolean;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  extendedProperties?: {
    private: Record<string, string>;
  };
}

/** Payload for updating an existing event. */
export interface UpdateEventPayload {
  summary?: string;
  description?: string;
  start?: { dateTime: string; timeZone?: string };
  end?: { dateTime: string; timeZone?: string };
  extendedProperties?: {
    private: Record<string, string>;
  };
}
