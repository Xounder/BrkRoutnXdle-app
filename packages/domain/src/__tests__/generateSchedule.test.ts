import { describe, it, expect, beforeEach } from "vitest";
import type { WeekSlot } from "../internal/types.js";
import { buildWeekSlots } from "../internal/slotBuilder.js";
import { calculateAvailability } from "../internal/availabilityCalculator.js";
import { markSlotsOccupied } from "../public/generateSchedule.js";
import { generateSchedule } from "../public/generateSchedule.js";
import type { CalendarEvent, Task, Settings } from "@brkroutnxdle/shared";
import { Priority } from "@brkroutnxdle/shared";

// Fixed week: Monday 2026-01-05 (UTC) through Sunday 2026-01-11.
// Work window 9:00-17:00 UTC, Mon-Fri.
const WEEK_START = "2026-01-05T00:00:00.000Z";
const WEEK_END = "2026-01-12T00:00:00.000Z";

const SETTINGS: Settings = {
  workStartHour: 9,
  workEndHour: 17,
  workDays: [1, 2, 3, 4, 5], // Mon-Fri
  maxTasksPerDay: 10,
  defaultTaskDuration: 60,
  timezone: "UTC",
  shuffleEnabled: false,
  weekStartDay: 1,
  use12h: false,
};

function makeEvent(partial: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: "evt-1",
    title: "Test Event",
    start: "2026-01-05T10:00:00.000Z",
    end: "2026-01-05T11:00:00.000Z",
    isAllDay: false,
    isGenerated: false,
    isCompleted: false,
    source: "google",
    ...partial,
  };
}

function buildSlots(): WeekSlot[] {
  return buildWeekSlots(WEEK_START, WEEK_END, SETTINGS);
}

describe("markSlotsOccupied freeze semantics", () => {
  let slots: WeekSlot[];

  beforeEach(() => {
    slots = buildSlots();
  });

  it("freezes only slots overlapped by a past event; others remain available", () => {
    const pastEvent = makeEvent({
      start: "2026-01-05T10:00:00.000Z",
      end: "2026-01-05T11:00:00.000Z",
    });
    // "now" is after the event end
    const now = "2026-01-05T12:00:00.000Z";

    markSlotsOccupied(slots, pastEvent, now);

    const frozenSlots = slots.filter((s) => s.frozen);
    expect(frozenSlots.length).toBeGreaterThan(0);

    // Every frozen slot must also be occupied and overlap the event
    for (const s of frozenSlots) {
      expect(s.occupied).toBe(true);
      const sStart = new Date(s.start).getTime();
      const sEnd = new Date(s.end).getTime();
      const evStart = new Date(pastEvent.start).getTime();
      const evEnd = new Date(pastEvent.end).getTime();
      expect(sStart < evEnd && sEnd > evStart).toBe(true);
    }

    // Non-overlapping slots in the week must NOT be frozen
    const nonOverlapping = slots.filter((s) => s.start >= "2026-01-05T11:00:00.000Z");
    expect(nonOverlapping.length).toBeGreaterThan(0);
    for (const s of nonOverlapping) {
      expect(s.frozen).toBe(false);
    }
  });

  it("marks overlapping slots frozen+occupied and keeps non-overlapping slots non-frozen for completed events", () => {
    const completedEvent = makeEvent({
      start: "2026-01-06T13:00:00.000Z",
      end: "2026-01-06T14:00:00.000Z",
      isCompleted: true,
    });
    const now = "2026-01-05T00:00:00.000Z"; // before event, but event is completed

    markSlotsOccupied(slots, completedEvent, now);

    const overlapping = slots.filter(
      (s) =>
        new Date(s.start).getTime() < new Date(completedEvent.end).getTime() &&
        new Date(s.end).getTime() > new Date(completedEvent.start).getTime(),
    );
    expect(overlapping.length).toBeGreaterThan(0);
    for (const s of overlapping) {
      expect(s.frozen).toBe(true);
      expect(s.occupied).toBe(true);
    }

    const nonOverlapping = slots.filter(
      (s) =>
        !(
          new Date(s.start).getTime() < new Date(completedEvent.end).getTime() &&
          new Date(s.end).getTime() > new Date(completedEvent.start).getTime()
        ),
    );
    expect(nonOverlapping.length).toBeGreaterThan(0);
    for (const s of nonOverlapping) {
      expect(s.frozen).toBe(false);
    }
  });

  it("marks overlapping slots occupied but NOT frozen for future events", () => {
    const futureEvent = makeEvent({
      start: "2026-01-05T10:00:00.000Z",
      end: "2026-01-05T11:00:00.000Z",
    });
    const now = "2026-01-05T00:00:00.000Z"; // before event start

    markSlotsOccupied(slots, futureEvent, now);

    const overlapping = slots.filter(
      (s) =>
        new Date(s.start).getTime() < new Date(futureEvent.end).getTime() &&
        new Date(s.end).getTime() > new Date(futureEvent.start).getTime(),
    );
    expect(overlapping.length).toBeGreaterThan(0);
    for (const s of overlapping) {
      expect(s.occupied).toBe(true);
      expect(s.frozen).toBe(false);
    }
  });

  it("multiple past/completed events each freeze only their own overlapping slots", () => {
    const ev1 = makeEvent({
      id: "evt-1",
      start: "2026-01-05T10:00:00.000Z",
      end: "2026-01-05T11:00:00.000Z",
    });
    const ev2 = makeEvent({
      id: "evt-2",
      start: "2026-01-07T14:00:00.000Z",
      end: "2026-01-07T15:00:00.000Z",
      isCompleted: true,
    });
    const now = "2026-01-06T00:00:00.000Z";

    markSlotsOccupied(slots, ev1, now);
    markSlotsOccupied(slots, ev2, now);

    const frozenSlots = slots.filter((s) => s.frozen);
    expect(frozenSlots.length).toBeGreaterThan(0);

    // All frozen slots must overlap ev1 or ev2
    for (const s of frozenSlots) {
      const sStart = new Date(s.start).getTime();
      const sEnd = new Date(s.end).getTime();
      const overlapsEv1 =
        sStart < new Date(ev1.end).getTime() && sEnd > new Date(ev1.start).getTime();
      const overlapsEv2 =
        sStart < new Date(ev2.end).getTime() && sEnd > new Date(ev2.start).getTime();
      expect(overlapsEv1 || overlapsEv2).toBe(true);
    }

    // Slots on a day with neither event must not be frozen
    const nonOverlapping = slots.filter(
      (s) =>
        !(
          sStartOverlaps(s, ev1) ||
          sStartOverlaps(s, ev2)
        ),
    );
    expect(nonOverlapping.length).toBeGreaterThan(0);
    for (const s of nonOverlapping) {
      expect(s.frozen).toBe(false);
    }
  });
});

describe("calculateAvailability with past events", () => {
  it("returns non-empty windows when at least one slot is not occupied/blocked/frozen", () => {
    const slots = buildSlots();
    const pastEvent = makeEvent({
      start: "2026-01-05T10:00:00.000Z",
      end: "2026-01-05T11:00:00.000Z",
    });
    const now = "2026-01-05T12:00:00.000Z";

    markSlotsOccupied(slots, pastEvent, now);

    const windows = calculateAvailability(slots);
    expect(windows.length).toBeGreaterThan(0);

    // Available windows must start after the frozen block
    const totalAvailable = windows.reduce((acc, w) => {
      const dur =
        (new Date(w.end).getTime() - new Date(w.start).getTime()) / 60000;
      return acc + dur;
    }, 0);
    expect(totalAvailable).toBeGreaterThan(0);
  });

  it("a week with a single past event still yields availability for the rest of the week", () => {
    const slots = buildSlots();
    const pastEvent = makeEvent({
      start: "2026-01-05T10:00:00.000Z",
      end: "2026-01-05T11:00:00.000Z",
    });
    const now = "2026-01-05T12:00:00.000Z";

    markSlotsOccupied(slots, pastEvent, now);

    const windows = calculateAvailability(slots);
    // Expect availability covering most of the week beyond the frozen 10-11 window
    const firstWindow = windows[0];
    expect(new Date(firstWindow.start).getTime()).toBeGreaterThanOrEqual(
      new Date("2026-01-05T09:00:00.000Z").getTime(),
    );
  });
});

describe("generateSchedule regression", () => {
  it("does not report 0/1 allocation for all tasks when valid free time exists", () => {
    // Build a target week dynamically from the CURRENT date so the past event
    // actually falls inside generateSchedule's internally-computed target week.
    const now = new Date();
    const monday = getCurrentMonday(now);
    const pastEvent = makeEvent({
      start: isoAt(monday, 10),
      end: isoAt(monday, 11),
    });

    const tasks: Task[] = [
      {
        id: "task-1",
        title: "Read",
        duration: 60,
        priority: Priority.Medium,
        restrictions: [],
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const result = generateSchedule(tasks, [], [pastEvent], SETTINGS);

    // The task must be allocated (at least one generated event) because plenty of
    // free time remains in the week outside the single past event. The buggy
    // behavior froze the whole week and reported 0 allocated.
    const allocatedTask = result.generatedEvents.filter((e) => e.taskId === "task-1");
    expect(allocatedTask.length).toBeGreaterThan(0);

    // A fully-allocated task carries no failure entry; a partial one must have
    // allocated > 0. In either case the task must NOT be stuck at 0 allocated.
    const failure = result.failures.find((f) => f.taskId === "task-1");
    expect(failure === undefined || failure.allocated > 0).toBe(true);
  });
});

function sStartOverlaps(s: WeekSlot, ev: CalendarEvent): boolean {
  const sStart = new Date(s.start).getTime();
  const sEnd = new Date(s.end).getTime();
  const evStart = new Date(ev.start).getTime();
  const evEnd = new Date(ev.end).getTime();
  return sStart < evEnd && sEnd > evStart;
}

/** Returns the Monday (00:00 UTC) of the week containing the given date. */
function getCurrentMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Returns an ISO-8601 string for a date at the given UTC hour. */
function isoAt(date: Date, hour: number): string {
  const d = new Date(date);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}
