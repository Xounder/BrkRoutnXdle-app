import { afterEach, describe, expect, it, vi } from "vitest";
import { BlockType, DEFAULT_SETTINGS, Priority } from "@brkroutnxdle/shared";
import type { Settings, Task } from "@brkroutnxdle/shared";
import { generateSchedule } from "../index.js";

const week = { targetWeekStart: "2026-01-05" };
const settings = (patch: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS,
  timezone: "UTC", workDays: [1], workStartHour: 9, workEndHour: 10,
  shuffleEnabled: false, maxTasksPerDay: 3, ...patch });
const task = (patch: Partial<Task> = {}): Task => ({
  id: "one", title: "One", duration: 30, frequency: 1, priority: Priority.High,
  restrictions: [], isActive: true, createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z", ...patch,
});

afterEach(() => vi.useRealTimers());

describe("scheduling correction regressions", () => {
  it("blocks every half-hour slot touched by a partial recurring-weekday range, but not an adjacent slot", () => {
    const block = { id: "partial", blockType: BlockType.RecurringWeekday,
      startDate: "2026-01-01T00:00:00Z", daysOfWeek: [1],
      startTime: "09:15", endTime: "09:45", isRecurring: true };
    const result = generateSchedule([task()], [block], [], settings(), undefined, week);
    expect(result.generatedEvents).toHaveLength(0);
    expect(result.failures).toEqual([expect.objectContaining({ taskId: "one", allocated: 0 })]);

    const adjacent = generateSchedule([task()], [{ ...block, startTime: "09:30", endTime: "10:00" }],
      [], settings(), undefined, week);
    expect(adjacent.generatedEvents.map(e => [e.start, e.end])).toEqual([
      ["2026-01-05T09:00:00.000Z", "2026-01-05T09:30:00.000Z"],
    ]);
  });

  it("allocates two nonoverlapping occurrences on one day when allowSameDay is true with the default gap", () => {
    const result = generateSchedule([task({ frequency: 2, allowSameDay: true })], [], [], settings(), undefined, week);
    expect(result.failures).toHaveLength(0);
    expect(result.generatedEvents.map(e => e.start).sort()).toEqual([
      "2026-01-05T09:00:00.000Z", "2026-01-05T09:30:00.000Z",
    ]);
    const prohibited = generateSchedule([task({ frequency: 2 })], [], [], settings(), undefined, week);
    expect(prohibited.generatedEvents).toHaveLength(1);
    expect(prohibited.failures).toEqual([expect.objectContaining({ allocated: 1, required: 2 })]);
  });

  it("applies a partial recurring weekday block by local clock across the spring DST week", () => {
    const result = generateSchedule([task()], [{
      id: "ny-partial", blockType: BlockType.RecurringWeekday, isRecurring: true,
      startDate: "2026-03-01T00:00:00Z", daysOfWeek: [1],
      startTime: "09:15", endTime: "09:45",
    }], [], settings({ timezone: "America/New_York" }), undefined,
    { targetWeekStart: "2026-03-09" });
    expect(result.generatedEvents).toHaveLength(0);
    expect(result.weekStart).toBe("2026-03-09T04:00:00.000Z");
  });

  it("does not schedule elapsed or in-progress slots in the currently viewed workday or regenerate them", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T09:45:00Z"));
    const config = settings({ workEndHour: 11 });
    const first = generateSchedule([task({ duration: 60 })], [], [], config, undefined, week);
    expect(first.generatedEvents.map(e => [e.start, e.end])).toEqual([
      ["2026-01-05T10:00:00.000Z", "2026-01-05T11:00:00.000Z"],
    ]);
    const next = generateSchedule([task({ duration: 60 })], [], [], config, undefined,
      { ...week, previousResult: first });
    expect(next.outcome).toBe("no-alternative");
    expect(next.generatedEvents).toHaveLength(0);

    vi.setSystemTime(new Date("2026-01-05T10:45:00Z"));
    const unavailable = generateSchedule([task({ duration: 30 })], [], [], config, undefined, week);
    expect(unavailable.outcome).toBe("infeasible");
    expect(unavailable.generatedEvents).toHaveLength(0);
  });

  it("excludes elapsed slots using the configured local timezone, not the host clock's wall hour", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T14:45:00Z")); // 09:45 in New York
    const result = generateSchedule([task({ duration: 30, frequency: 2, allowSameDay: true })],
      [], [], settings({ timezone: "America/New_York", workEndHour: 11 }), undefined,
      { targetWeekStart: "2026-01-05" });
    expect(result.generatedEvents.map(e => e.start).sort()).toEqual([
      "2026-01-05T15:00:00.000Z", "2026-01-05T15:30:00.000Z",
    ]);
  });
});
