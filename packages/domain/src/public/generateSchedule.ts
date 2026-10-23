import type { Task, BlockedSlot, CalendarEvent, Settings } from "@brkroutnxdle/shared";
import type { ScheduleResult, ScheduleOptions, PreviousWeekSnapshot } from "../internal/types.js";
import { buildWeekSlots } from "../internal/slotBuilder.js";
import { calculateAvailability } from "../internal/availabilityCalculator.js";
import { distributeTasks } from "../internal/taskDistributor.js";
import { validateSchedule } from "../internal/validator.js";
import { reportAllocationFailures } from "../internal/allocationReporter.js";
import { weekBounds, localDay, localParts } from "../internal/localTime.js";

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
  options: ScheduleOptions = {},
): ScheduleResult {
  const now = new Date();
  const bounds = weekBounds(options.targetWeekStart ?? now.toISOString(), settings.timezone, settings.weekStartDay);
  const targetWeekStart = bounds.start;
  const targetWeekEnd = bounds.end;

  // Phase 1-2: Build week slots and mark occupied/frozen
  const slots = buildWeekSlots(targetWeekStart, targetWeekEnd, settings);
  // Never propose a slot that has already begun, even when no calendar event occupies it.
  if (Date.parse(targetWeekStart) <= now.getTime() && now.getTime() < Date.parse(targetWeekEnd)) {
    for (const slot of slots) {
      if (Date.parse(slot.start) < now.getTime()) slot.frozen = true;
    }
  }

  // Phase 3: Mark occupied from existing events
  const nowISO = now.toISOString();
  for (const event of events) {
    markSlotsOccupied(slots, event, nowISO);
  }

  // Phase 4: Apply blocks
  applyBlocks(slots, blocks, settings.timezone);

  // Phase 5: Build availability pool
  const availableSlots = calculateAvailability(slots);

  // Phase 6-9: Distribute tasks
  const run = (exclude?: { taskId: string; occurrence: number; start: string }) => distributeTasks(
    tasks, availableSlots, settings, previousWeek, targetWeekStart, exclude, options.generationAttempt ?? 0,
  );
  let { generatedEvents, failures } = run();
  let outcome: ScheduleResult["outcome"] = failures.length ? "infeasible" : "generated";
  let message: string | undefined;
  const previous = options.previousResult;
  if (previous && previous.weekStart === targetWeekStart) {
    const signature = (evs: typeof generatedEvents) => evs.map(ev => `${ev.taskId}:${ev.start}:${ev.end}`).sort().join("|");
    const old = signature(previous.generatedEvents);
    if (old === signature(generatedEvents)) {
      // Try excluding each prior occurrence individually, retaining at least as many placements.
      const grouped = new Map<string, typeof previous.generatedEvents>();
      for (const ev of previous.generatedEvents) grouped.set(ev.taskId, [...(grouped.get(ev.taskId) ?? []), ev]);
      for (const [taskId, occurrences] of grouped) {
        for (let i = 0; i < occurrences.length; i++) {
          const candidate = run({ taskId, occurrence: i, start: occurrences[i].start });
          if (candidate.failures.length <= failures.length && candidate.generatedEvents.length >= generatedEvents.length &&
              signature(candidate.generatedEvents) !== old) {
            generatedEvents = candidate.generatedEvents;
            failures = candidate.failures;
            outcome = "alternative";
            break;
          }
        }
        if (outcome === "alternative") break;
      }
      if (outcome !== "alternative") {
        outcome = "no-alternative";
        message = failures.length ? "No different allocation found under the current constraints; some occurrences could not be placed." :
          "No different allocation found under the current constraints.";
        generatedEvents = [];
      }
    } else if (generatedEvents.length >= previous.generatedEvents.length) outcome = "alternative";
  }
  if (outcome === "infeasible") message = "Some occurrences could not be placed within the available time and task constraints.";

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
    outcome,
    message,
  };
}

export function markSlotsOccupied(
  slots: import("../internal/types.js").WeekSlot[],
  event: CalendarEvent,
  now: string,
): void {
  const eventStart = new Date(event.start).getTime();
  const eventEnd = event.end ? new Date(event.end).getTime() : eventStart + 30 * 60_000;

  for (const slot of slots) {
    const slotStart = new Date(slot.start).getTime();
    const slotEnd = new Date(slot.end).getTime();

    // Mark occupied if event overlaps this slot
    if (slotStart < eventEnd && slotEnd > eventStart) {
      slot.occupied = true;
      // Freeze only overlapping slots when the event is in the past or completed
      if (eventEnd < Date.parse(now) || event.isCompleted) {
        slot.frozen = true;
      }
    }
  }
}

function applyBlocks(
  slots: import("../internal/types.js").WeekSlot[],
  blocks: BlockedSlot[],
  timezone: string,
): void {
  for (const block of blocks) {
    const blockStart = new Date(block.startDate).getTime();
    const blockEnd = block.endDate ? new Date(block.endDate).getTime() : Number.POSITIVE_INFINITY;

    for (const slot of slots) {
      const slotStartMs = new Date(slot.start).getTime();
      const slotEndMs = Date.parse(slot.end);

      // Single day: block the exact day
      if (block.blockType === "single-day") {
        if (localDay(slot.start, timezone) === (/^\d{4}-\d{2}-\d{2}$/.test(block.startDate)
          ? block.startDate : localDay(block.startDate, timezone))) {
          slot.blocked = true;
        }
      }

      // Recurring weekday: block specific weekdays
      if (block.blockType === "recurring-weekday" && block.daysOfWeek) {
        if (
          slotStartMs < blockEnd &&
          slotEndMs > blockStart &&
          block.daysOfWeek.includes(slot.dayOfWeek)
        ) {
          if (block.startTime && block.endTime) {
            const start = localParts(slot.start, timezone);
            const end = localParts(slot.end, timezone);
            const localStart = start.hour * 60 + start.minute;
            const localEnd = end.hour * 60 + end.minute;
            const [startHour, startMinute] = block.startTime.split(":").map(Number);
            const [endHour, endMinute] = block.endTime.split(":").map(Number);
            const rangeStart = startHour * 60 + startMinute;
            const rangeEnd = endHour * 60 + endMinute;
            const overlaps = rangeStart < rangeEnd
              ? localStart < rangeEnd && localEnd > rangeStart
              : localStart < rangeEnd || localEnd > rangeStart;
            // At a DST jump, wall-clock endpoints alone misrepresent the minutes
            // actually occupied by this physical half-hour slot.
            const crossesOffsetChange = (localEnd - localStart + 1440) % 1440 !== 30;
            const overlapsDstSlot = crossesOffsetChange && Array.from({ length: 30 }, (_, minute) => {
              const p = localParts(slotStartMs + minute * 60_000, timezone);
              const time = p.hour * 60 + p.minute;
              return rangeStart < rangeEnd
                ? time >= rangeStart && time < rangeEnd
                : time >= rangeStart || time < rangeEnd;
            }).some(Boolean);
            if (crossesOffsetChange ? overlapsDstSlot : overlaps) {
              slot.blocked = true;
            }
          } else {
            slot.blocked = true;
          }
        }
      }

      // Recurring period: block the entire date range
      if (block.blockType === "recurring-period") {
        if (slotStartMs < blockEnd && Date.parse(slot.end) > blockStart) {
          slot.blocked = true;
        }
      }
    }
  }
}
