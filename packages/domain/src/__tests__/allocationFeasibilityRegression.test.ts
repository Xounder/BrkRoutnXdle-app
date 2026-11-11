import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BlockType, Priority } from "@brkroutnxdle/shared";
import type { BlockedSlot, CalendarEvent, Settings, Task } from "@brkroutnxdle/shared";
import { generateSchedule } from "../public/generateSchedule.js";
import { localDay, localParts, localWeekday } from "../internal/localTime.js";

const NOW = "2026-11-02T10:15:00.000Z";
const FUTURE_MONDAY = "2027-01-04";
const TITLES = ["treinar", "correr", "estudar", "Ler", "g", "rrfrf", "asd0of1allocations"];

const config = (overrides: Partial<Settings> = {}): Settings => ({
  timezone: "UTC", weekStartDay: 1, workDays: [1, 2, 3, 4, 5],
  workStartHour: 9, workEndHour: 17, maxTasksPerDay: 10,
  defaultTaskDuration: 60, shuffleEnabled: false, use12h: false,
  ...overrides,
});
const task = (id: string, title: string, overrides: Partial<Task> = {}): Task => ({
  id, title, duration: 60, frequency: 1, priority: Priority.Medium,
  isActive: true, restrictions: [], createdAt: NOW, updatedAt: NOW,
  ...overrides,
});
const busy = (start: string, end: string): CalendarEvent => ({
  id: "busy", title: "Busy", start, end, isAllDay: false,
  isGenerated: false, isCompleted: false, source: "google",
});
const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) =>
  Date.parse(a.start) < Date.parse(b.end) && Date.parse(a.end) > Date.parse(b.start);

describe("allocation feasibility with explicit viewed weeks", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(NOW)); });
  afterEach(() => { vi.useRealTimers(); });

  it("places all seven independent one-occurrence tasks in a genuinely free future week", () => {
    const settings = config();
    const tasks = TITLES.map((title, index) => task(`task-${index}`, title));
    const result = generateSchedule(tasks, [], [], settings, undefined, { targetWeekStart: FUTURE_MONDAY });

    expect(result.weekStart).toBe("2027-01-04T00:00:00.000Z");
    expect(result.outcome).toBe("generated");
    expect(result.failures).toEqual([]);
    expect(result.generatedEvents).toHaveLength(7);
    expect(result.generatedEvents.map(event => event.taskId).sort()).toEqual(tasks.map(t => t.id).sort());
    for (const [index, event] of result.generatedEvents.entries()) {
      const start = localParts(event.start, settings.timezone);
      const end = localParts(event.end, settings.timezone);
      expect(Date.parse(event.start)).toBeGreaterThan(Date.parse(NOW));
      expect(event.start >= result.weekStart && event.end <= result.weekEnd).toBe(true);
      expect(settings.workDays).toContain(localWeekday(event.start, settings.timezone));
      expect(start.hour + start.minute / 60).toBeGreaterThanOrEqual(settings.workStartHour);
      expect(end.hour + end.minute / 60).toBeLessThanOrEqual(settings.workEndHour);
      expect(Date.parse(event.end) - Date.parse(event.start)).toBe(60 * 60_000);
      for (const other of result.generatedEvents.slice(index + 1)) expect(overlaps(event, other)).toBe(false);
    }
    const counts = result.generatedEvents.reduce((acc, event) => {
      const day = localDay(event.start, settings.timezone);
      acc.set(day, (acc.get(day) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());
    for (const count of counts.values()) expect(count).toBeLessThanOrEqual(settings.maxTasksPerDay);
  });

  it("places a restricted task in the sole free New York slot across a DST-change week", () => {
    const settings = config({ timezone: "America/New_York", weekStartDay: 0,
      workDays: [0], workStartHour: 9, workEndHour: 10.5 });
    const blocks: BlockedSlot[] = [{ id: "early", blockType: BlockType.RecurringWeekday,
      startDate: "2027-03-01T00:00:00.000Z", daysOfWeek: [0],
      startTime: "09:00", endTime: "09:30", isRecurring: true }];
    const events = [busy("2027-03-14T13:30:00.000Z", "2027-03-14T14:00:00.000Z")];
    const restricted = task("restricted", "Study", { duration: 30,
      restrictions: [{ type: "restricted-range", ranges: [{ custom: { startHour: 10, endHour: 10.5 } }] }] });
    const result = generateSchedule([restricted], blocks, events, settings, undefined,
      { targetWeekStart: "2027-03-14" });

    expect(result.weekStart).toBe("2027-03-14T05:00:00.000Z");
    expect(result.weekEnd).toBe("2027-03-21T04:00:00.000Z");
    expect(result.failures).toEqual([]);
    expect(result.generatedEvents).toHaveLength(1);
    expect(result.generatedEvents[0]).toMatchObject({ taskId: "restricted",
      start: "2027-03-14T14:00:00.000Z", end: "2027-03-14T14:30:00.000Z" });
    expect(events.some(event => overlaps(event, result.generatedEvents[0]))).toBe(false);
  });

  it("freezes started slots in the current week yet uses a later unoccupied slot", () => {
    const settings = config({ workDays: [1], workStartHour: 9, workEndHour: 12 });
    const events = [busy("2026-11-02T10:30:00.000Z", "2026-11-02T11:00:00.000Z")];
    const result = generateSchedule([task("later", "Later")], [], events, settings,
      undefined, { targetWeekStart: "2026-11-02" });

    expect(result.failures).toEqual([]);
    expect(result.generatedEvents).toHaveLength(1);
    expect(result.generatedEvents[0]).toMatchObject({ taskId: "later",
      start: "2026-11-02T11:00:00.000Z", end: "2026-11-02T12:00:00.000Z" });
    expect(Date.parse(result.generatedEvents[0].start)).toBeGreaterThan(Date.parse(NOW));
    expect(events.some(event => overlaps(event, result.generatedEvents[0]))).toBe(false);
  });

  it("reports factual 0 of 1 per ID when the only future workday is fully blocked", () => {
    const tasks = TITLES.map((title, index) => task(`task-${index}`, title));
    const blocks: BlockedSlot[] = [{ id: "closed", blockType: BlockType.SingleDay,
      startDate: FUTURE_MONDAY, isRecurring: false }];
    const result = generateSchedule(tasks, blocks, [], config({ workDays: [1] }),
      undefined, { targetWeekStart: FUTURE_MONDAY });

    expect(result.outcome).toBe("infeasible");
    expect(result.generatedEvents).toEqual([]);
    expect(result.failures).toHaveLength(7);
    expect(result.failures.map(({ taskId, taskName, required, allocated }) =>
      ({ taskId, taskName, required, allocated })).sort((a, b) => a.taskId.localeCompare(b.taskId)))
      .toEqual(tasks.map(t => ({ taskId: t.id, taskName: t.title, required: 1, allocated: 0 })));
  });

  it("never allocates an entirely elapsed work window in the current week", () => {
    const result = generateSchedule([task("elapsed", "Elapsed", { duration: 30 })], [], [],
      config({ workDays: [1], workStartHour: 9, workEndHour: 10 }),
      undefined, { targetWeekStart: "2026-11-02" });
    expect(result.generatedEvents).toEqual([]);
    expect(result.failures).toEqual([{ taskId: "elapsed", taskName: "Elapsed", required: 1, allocated: 0 }]);
  });
});
