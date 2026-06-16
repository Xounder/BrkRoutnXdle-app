import type { CalendarEvent } from "@brkroutnxdle/shared";
import { CACHE_TTL_MS } from "@brkroutnxdle/shared";

const CACHE_KEY = "brkroutnxdle:calendarCache";

interface CacheEntry {
  data: CalendarEvent[];
  expiresAt: number;
}

/**
 * Stores calendar events in localStorage with a TTL.
 */
export function setCalendarCache(events: CalendarEvent[]): void {
  const entry: CacheEntry = {
    data: events,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

/**
 * Retrieves cached calendar events if within TTL.
 * Returns null if cache is expired or missing.
 */
export function getCalendarCache(): CalendarEvent[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return entry.data;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

/**
 * Clears the calendar cache.
 */
export function clearCalendarCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * Checks if the cache is still valid.
 */
export function isCacheValid(): boolean {
  const cached = getCalendarCache();
  return cached !== null;
}
