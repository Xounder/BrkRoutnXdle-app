import type { Settings } from "../types";

/** Base duration of a single time slot in minutes. */
export const SLOT_DURATION_MINUTES = 30;

/** Allowed task durations in minutes (multiples of SLOT_DURATION_MINUTES). */
export const ALLOWED_DURATIONS = [
  30,
  60,
  90,
  120,
  150,
  180,
  210,
  240,
  270,
  300,
  330,
  360,
  390,
  420,
  450,
  480,
] as const;

/** Cache time-to-live in milliseconds (5 minutes). */
export const CACHE_TTL_MS = 5 * 60 * 1000;

/** Default user settings. */
export const DEFAULT_SETTINGS: Settings = {
  workStartHour: 8,
  workEndHour: 18,
  workDays: [1, 2, 3, 4, 5],
  maxTasksPerDay: 5,
  defaultTaskDuration: 60,
  timezone: "UTC",
  shuffleEnabled: false,
  weekStartDay: 1,
};
