import type { Task, BlockedSlot, CalendarEvent, Settings } from "@brkroutnxdle/shared";
import { SLOT_DURATION_MINUTES } from "@brkroutnxdle/shared";
import type { ScheduleResult, ScheduleInput, PreviousWeekSnapshot } from "../internal/types.js";
import { buildWeekSlots } from "../internal/slotBuilder.js";
import { calculateAvailability } from "../internal/availabilityCalculator.js";
import { distributeTasks } from "../internal/taskDistributor.js";
import { validateSchedule } from "../internal/validator.js";
import { reportAllocationFailures } from "../internal/allocationReporter.js";

/**
 * Generates an optimized weekly schedule from tasks, blocks, events, and settings.
 *
 * Pure function — no side effects, no async, no API calls.
 *
 * @param tasks - User-defined task definitions
 * @param blocks - User-defined blocked time slots
 * @param events - Existing calendar events (both primary and BrkRoutnXdle)
 * @param settings - User settings (available hours, shuffle, etc.)
 * @param previousWeek - Optional snapshot of last week's schedule (for shuffle variety)
 * @returns A ScheduleResult with generated events and allocation failures
 */
export function generateSchedule(
  tasks: Task[],
  blocks: BlockedSlot[],
  events: CalendarEvent[],
  settings: Settings,
  previousWeek?: PreviousWeekSnapshot,
): ScheduleResult {
  const now = new Date();
  const targetWeekStart = getMonday(now).toISOString();
  const targetWeekEnd = new Date(getMonday(now).getTime() + 7 * 86400_000).toISOString();

  const input: ScheduleInput = {
    tasks,
    blocks,
    events,
    settings,
    previousWeek,
    targetWeekStart,
  };

  // Phase 1-2: Build week slots and mark occupied/frozen
  const slots = buildWeekSlots(targetWeekStart, targetWeekEnd, settings);

  // Phase 3: Mark occupied from existing events
  const nowISO = now.toISOString();
  for (const event of events) {
    markSlotsOccupied(slots, event, nowISO);
  }

  // Phase 4: Apply blocks
  applyBlocks(slots, blocks, targetWeekStart, targetWeekEnd);

  // Phase 5: Build availability pool
  const availableSlots = calculateAvailability(slots);

  // Phase 6-9: Distribute tasks
  const { generatedEvents, failures } = distributeTasks(
    tasks,
    availableSlots,
    settings,
    previousWeek,
    targetWeekStart,
  );

  // Phase 10: Validate
  const validationErrors = validateSchedule(generatedEvents, tasks, blocks, events, settings);
  if (validationErrors.length > 0) {
    console.warn("Schedule validation warnings:", validationErrors);
  }

  // Phase 11-12: Report and return
  return {
    weekStart: targetWeekStart,
    weekEnd: targetWeekEnd,
    generatedEvents,
    failures: reportAllocationFailures(tasks, failures),
    generatedAt: nowISO,
  };
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function markSlotsOccupied(
  slots: import("../internal/types.js").WeekSlot[],
  event: CalendarEvent,
  now: string,
): void {
  const eventStart = new Date(event.start).getTime();
  const eventEnd = new Date(event.end).getTime();

  for (const slot of slots) {
    const slotStart = new Date(slot.start).getTime();
    const slotEnd = new Date(slot.end).getTime();

    // Mark occupied if event overlaps this slot
    if (slotStart < eventEnd && slotEnd > eventStart) {
      slot.occupied = true;
      // Freeze only overlapping slots when the event is in the past or completed
      if (event.end < now || event.isCompleted) {
        slot.frozen = true;
      }
    }
  }
}

function applyBlocks(
  slots: import("../internal/types.js").WeekSlot[],
  blocks: BlockedSlot[],
  weekStart: string,
  weekEnd: string,
): void {
  const weekStartMs = new Date(weekStart).getTime();
  const weekEndMs = new Date(weekEnd).getTime();

  for (const block of blocks) {
    const blockStart = new Date(block.startDate).getTime();
    const blockEnd = block.endDate ? new Date(block.endDate).getTime() : blockStart + 86400_000;

    // Skip if block is outside the target week
    if (blockEnd < weekStartMs || blockStart > weekEndMs) continue;

    for (const slot of slots) {
      const slotStartMs = new Date(slot.start).getTime();

      // Single day: block the exact day
      if (block.blockType === "single-day") {
        if (isSameDay(slotStartMs, blockStart)) {
          slot.blocked = true;
        }
      }

      // Recurring weekday: block specific weekdays
      if (block.blockType === "recurring-weekday" && block.daysOfWeek) {
        if (
          slotStartMs >= blockStart &&
          slotStartMs < blockEnd &&
          block.daysOfWeek.includes(slot.dayOfWeek)
        ) {
          if (block.startTime && block.endTime) {
            const slotTime = slot.start.split("T")[1];
            if (slotTime >= block.startTime && slotTime < block.endTime) {
              slot.blocked = true;
            }
          } else {
            slot.blocked = true;
          }
        }
      }

      // Recurring period: block the entire date range
      if (block.blockType === "recurring-period") {
        if (slotStartMs >= blockStart && slotStartMs < blockEnd) {
          slot.blocked = true;
        }
      }
    }
  }
}

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}