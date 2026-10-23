import type { Settings } from "@brkroutnxdle/shared";
import { SLOT_DURATION_MINUTES } from "@brkroutnxdle/shared";
import type { WeekSlot } from "./types.js";
import { localParts, localWeekday } from "./localTime.js";

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
    const local = localParts(current, settings.timezone);
    const hour = local.hour + local.minute / 60;
    const endLocal = localParts(current + slotMs - 1, settings.timezone);

    // Only generate slots within available hours
    if (hour >= settings.workStartHour && hour < settings.workEndHour &&
        endLocal.hour + endLocal.minute / 60 < settings.workEndHour) {
      // Only generate slots on work days
      if (settings.workDays.includes(localWeekday(current, settings.timezone))) {
        slots.push({
          start: new Date(current).toISOString(),
          end: new Date(current + slotMs).toISOString(),
          dayOfWeek: localWeekday(current, settings.timezone),
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
    use12h: false,
  });
}
