import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, Priority, BlockType } from "@brkroutnxdle/shared";
import type { Task, CalendarEvent, Settings } from "@brkroutnxdle/shared";
import { generateSchedule } from "../index.js";
import { calculateAvailability } from "../internal/availabilityCalculator.js";
import { buildWeekSlots } from "../internal/slotBuilder.js";

const task = (patch: Partial<Task> = {}): Task => ({ id: "a", title: "A", duration: 60,
  priority: Priority.High, isActive: true, restrictions: [],
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", ...patch });
const settings = (patch: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS,
  timezone: "UTC", shuffleEnabled: false, workStartHour: 9, workEndHour: 11,
  workDays: [1], maxTasksPerDay: 2, ...patch });
const event = (start: string, end: string): CalendarEvent => ({ id: start, title: "Busy", start, end,
  isAllDay: false, isGenerated: false, isCompleted: false, source: "google" });

describe("viewed-week recovery", () => {
  it("uses a Sunday-start viewed week and the DST-dependent local offset", () => {
    const config = settings({ timezone: "America/New_York", weekStartDay: 0, workDays: [0],
      workStartHour: 9, workEndHour: 10 });
    const winter = generateSchedule([task({ duration: 30 })], [], [], config, undefined,
      { targetWeekStart: "2026-01-06T12:00:00Z" });
    const spring = generateSchedule([task({ duration: 30 })], [], [], config, undefined,
      { targetWeekStart: "2026-03-11T12:00:00Z" });
    expect(winter.weekStart).toBe("2026-01-04T05:00:00.000Z");
    expect(spring.weekStart).toBe("2026-03-08T05:00:00.000Z");
    expect(spring.weekEnd).toBe("2026-03-15T04:00:00.000Z");
    expect(winter.generatedEvents[0].start).toMatch(/^2026-01-04T14:/);
    expect(spring.generatedEvents[0].start).toMatch(/^2026-03-08T13:/);
  });

  it("rejects a long event that crosses the closing hour or the end of a named group", () => {
    const config = settings({ workStartHour: 11, workEndHour: 13 });
    const targetWeekStart = "2026-01-05T12:00:00Z";
    const restricted = generateSchedule([task({ duration: 90, restrictions: [
      { type: "restricted-range", ranges: [{ preset: "morning" }] },
    ] })], [], [], config, undefined, { targetWeekStart });
    expect(restricted.generatedEvents).toHaveLength(0);
    expect(restricted.outcome).toBe("infeasible");
    const closing = generateSchedule([task({ duration: 150 })], [], [], config, undefined, { targetWeekStart });
    expect(closing.generatedEvents).toHaveLength(0);
  });

  it("keeps occupied and adjacent-but-disconnected windows separate", () => {
    const config = settings({ workStartHour: 9, workEndHour: 10.5 });
    const start = "2026-01-05T00:00:00Z";
    const end = "2026-01-12T00:00:00Z";
    const slots = buildWeekSlots(start, end, config);
    slots[1].occupied = true;
    expect(calculateAvailability(slots)).toEqual([
      { start: "2026-01-05T09:00:00.000Z", end: "2026-01-05T09:30:00.000Z" },
      { start: "2026-01-05T10:00:00.000Z", end: "2026-01-05T10:30:00.000Z" },
    ]);
    const result = generateSchedule([task()], [], [event("2026-01-05T09:30:00Z", "2026-01-05T10:00:00Z")], config,
      undefined, { targetWeekStart: start });
    expect(result.generatedEvents).toHaveLength(0);
  });

  it("returns a real alternative or no-alternative instead of new IDs for the same placement", () => {
    const week = { targetWeekStart: "2026-01-05T12:00:00Z" };
    const config = settings({ workStartHour: 9, workEndHour: 10 });
    const first = generateSchedule([task({ duration: 30 })], [], [], config, undefined, week);
    const second = generateSchedule([task({ duration: 30 })], [], [], config, undefined,
      { ...week, previousResult: first });
    expect(second.outcome).toBe("alternative");
    expect(second.generatedEvents[0].start).not.toBe(first.generatedEvents[0].start);
    const narrow = settings({ workStartHour: 9, workEndHour: 9.5 });
    const only = generateSchedule([task({ duration: 30 })], [], [], narrow, undefined, week);
    const none = generateSchedule([task({ duration: 30 })], [], [], narrow, undefined,
      { ...week, previousResult: only });
    expect(none.outcome).toBe("no-alternative");
    expect(none.generatedEvents).toHaveLength(0);
    expect(none.message).toMatch(/No different allocation found/);
  });

  it("respects local blocks and the daily task limit", () => {
    const week = { targetWeekStart: "2026-01-05T12:00:00Z" };
    const config = settings({ maxTasksPerDay: 1, workStartHour: 9, workEndHour: 11 });
    const result = generateSchedule([task(), task({ id: "b" })], [{ id: "block", blockType: BlockType.SingleDay,
      startDate: "2026-01-05T00:00:00Z", isRecurring: false }], [], config, undefined, week);
    expect(result.generatedEvents).toHaveLength(0);
    expect(result.failures).toHaveLength(2);
  });

  it("counts recurring occurrences and favors high priority when daily capacity is one", () => {
    const result = generateSchedule([
      task({ id: "low", priority: Priority.Low }),
      task({ id: "high", priority: Priority.High, frequency: 2 }),
    ], [], [], settings({ workDays: [1, 3], maxTasksPerDay: 1 }), undefined,
    { targetWeekStart: "2026-01-06" });
    expect(result.generatedEvents.map(e => e.taskId)).toEqual(["high", "high"]);
    expect(result.generatedEvents[0].start.slice(0, 10)).not.toBe(result.generatedEvents[1].start.slice(0, 10));
    expect(result.failures).toEqual([expect.objectContaining({ taskId: "low", allocated: 0 })]);
  });

  it("does not allow an event spanning a repeated DST hour to pass a local-time restriction", () => {
    const result = generateSchedule([task({ duration: 60, restrictions: [
      { type: "restricted-range", ranges: [{ custom: { startHour: 1, endHour: 2 } }] },
    ] })], [], [], settings({ timezone: "America/New_York", weekStartDay: 0,
      workDays: [0], workStartHour: 1, workEndHour: 2 }), undefined,
    { targetWeekStart: "2026-11-01" });
    expect(result.generatedEvents.every(ev => ev.start >= result.weekStart && ev.end <= result.weekEnd)).toBe(true);
    expect(result.generatedEvents.every(ev =>
      ev.start !== "2026-11-01T05:30:00.000Z" || ev.end !== "2026-11-01T06:30:00.000Z")).toBe(true);
  });
});
