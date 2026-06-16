import type { Settings } from "@brkroutnxdle/shared";
import { SLOT_DURATION_MINUTES } from "@brkroutnxdle/shared";
import type { WeekSlot } from "./types.js";

/**
 * Generates all 30-minute time slots for the target week,
 * constrained by the user's available hours from settings.
 */
export function buildWeekSlots(
  weekStart: string,
  weekEnd: string,
  settings: Settings,
): WeekSlot[] {
  const slots: WeekSlot[] = [];
  const startMs = new Date(weekStart).getTime();
  const endMs = new Date(weekEnd).getTime();
  const slotMs = SLOT_DURATION_MINUTES * 60 * 1000;

  let current = startMs;
  while (current + slotMs <= endMs) {
    const date = new Date(current);
    const hour = date.getUTCHours();

    // Only generate slots within available hours
    if (hour >= settings.workStartHour && hour < settings.workEndHour) {
      // Only generate slots on work days
      if (settings.workDays.includes(date.getUTCDay())) {
        slots.push({
          start: date.toISOString(),
          end: new Date(current + slotMs).toISOString(),
          dayOfWeek: date.getUTCDay(),
          occupied: false,
          blocked: false,
          frozen: false,
        });
      }
    }

    current += slotMs;
  }

  return slots;
}

/**
 * Generates week slots for a specific weekday range (for testing).
 */
export function buildSlotsForRange(
  startDate: string,
  endDate: string,
  workStartHour: number,
  workEndHour: number,
  workDays: number[],
): WeekSlot[] {
  return buildWeekSlots(startDate, endDate, {
    workStartHour,
    workEndHour,
    workDays,
    maxTasksPerDay: 10,
    defaultTaskDuration: 60,
    timezone: "UTC",
    shuffleEnabled: false,
    weekStartDay: 1,
  });
}