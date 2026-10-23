import type { WeekSlot, AvailabilityWindow } from "./types.js";

/**
 * Filters out occupied, blocked, or frozen slots and returns
 * only the available slots as continuous windows.
 */
export function calculateAvailability(slots: WeekSlot[]): AvailabilityWindow[] {
  const windows: AvailabilityWindow[] = [];
  let currentWindowStart: string | null = null;
  let previousEnd: string | null = null;
  const close = () => {
    if (currentWindowStart !== null && previousEnd !== null) {
      windows.push({ start: currentWindowStart, end: previousEnd });
      currentWindowStart = null;
    }
  };

  for (const slot of slots) {
    if (!slot.occupied && !slot.blocked && !slot.frozen) {
      if (currentWindowStart !== null && previousEnd !== slot.start) close();
      if (currentWindowStart === null) {
        currentWindowStart = slot.start;
      }
      previousEnd = slot.end;
    } else {
      close();
    }
  }

  // Close the last window if still open
  close();

  return windows;
}

/**
 * Returns slots that are available (not occupied, blocked, or frozen).
 */
export function getAvailableSlots(slots: WeekSlot[]): WeekSlot[] {
  return slots.filter((s) => !s.occupied && !s.blocked && !s.frozen);
}

/**
 * Returns the count of available 30-min slots in the week.
 */
export function countAvailableSlots(slots: WeekSlot[]): number {
  return slots.filter((s) => !s.occupied && !s.blocked && !s.frozen).length;
}
