import type { WeekSlot, AvailabilityWindow } from "./types.js";
import { SLOT_DURATION_MINUTES } from "@brkroutnxdle/shared";

/**
 * Filters out occupied, blocked, or frozen slots and returns
 * only the available slots as continuous windows.
 */
export function calculateAvailability(slots: WeekSlot[]): AvailabilityWindow[] {
  const windows: AvailabilityWindow[] = [];
  let currentWindowStart: string | null = null;
  const slotMs = SLOT_DURATION_MINUTES * 60 * 1000;

  for (const slot of slots) {
    if (!slot.occupied && !slot.blocked && !slot.frozen) {
      if (currentWindowStart === null) {
        currentWindowStart = slot.start;
      }
    } else {
      if (currentWindowStart !== null) {
        // Close the window (end is the slot before this occupied one)
        const prevEnd = new Date(new Date(slot.start).getTime() - slotMs).toISOString();
        windows.push({ start: currentWindowStart, end: prevEnd });
        currentWindowStart = null;
      }
    }
  }

  // Close the last window if still open
  if (currentWindowStart !== null && slots.length > 0) {
    windows.push({ start: currentWindowStart, end: slots[slots.length - 1].end });
  }

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