import { describe, it, expect } from "vitest";
import type { Task, Settings } from "@brkroutnxdle/shared";
import { Priority } from "@brkroutnxdle/shared";
import type { AvailabilityWindow } from "../internal/types.js";
import { distributeTasks } from "../internal/taskDistributor.js";

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

const TARGET_WEEK = "2026-01-05T00:00:00.000Z";

function makeTask(partial: Partial<Task>): Task {
  return {
    id: "task-1",
    title: "Test Task",
    duration: 60,
    priority: Priority.Medium,
    restrictions: [],
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function window(start: string, end: string): AvailabilityWindow {
  return { start, end };
}

describe("distributeTasks window-boundary enforcement", () => {
  it("rejects a task whose duration would span an occupied gap between two windows", () => {
    // Window A has a single slot (09:00-09:30), Window B a single slot
    // (10:00-10:30). The 09:30-10:00 range between them is an occupied gap.
    // A 60-minute task needs 2 consecutive slots: neither window alone has
    // enough, and starting at window A's slot would span into window B.
    const windows = [
      window("2026-01-05T09:00:00.000Z", "2026-01-05T09:30:00.000Z"),
      window("2026-01-05T10:00:00.000Z", "2026-01-05T10:30:00.000Z"),
    ];
    const task = makeTask({ id: "task-span", duration: 60 });

    const result = distributeTasks([task], windows, SETTINGS, undefined, TARGET_WEEK);

    expect(result.generatedEvents).toHaveLength(0);
    const failure = result.failures.find((f) => f.taskId === "task-span");
    expect(failure).toBeDefined();
    expect(failure?.allocated).toBe(0);
  });

  it("allocates a task fully inside a single contiguous window of sufficient length", () => {
    // One 09:00-10:00 window (2 slots) is enough for a 60-minute task.
    const windows = [window("2026-01-05T09:00:00.000Z", "2026-01-05T10:00:00.000Z")];
    const task = makeTask({ id: "task-fit", duration: 60 });

    const result = distributeTasks([task], windows, SETTINGS, undefined, TARGET_WEEK);

    expect(result.failures.filter((f) => f.taskId === "task-fit")).toHaveLength(0);
    expect(result.generatedEvents).toHaveLength(1);
    const event = result.generatedEvents[0];
    expect(event.taskId).toBe("task-fit");
    expect(event.start).toBe("2026-01-05T09:00:00.000Z");
    expect(event.end).toBe("2026-01-05T10:00:00.000Z");
  });

  it("keeps re-indexing correct so a second task allocates after the first consumes slots", () => {
    // One 09:00-11:00 window (4 slots). Two 60-minute tasks each need 2
    // consecutive slots. After the first consumes its slots, the second must
    // still find 2 remaining contiguous slots in the same window (correct
    // index remapping, no off-by-one) and must not overlap the first.
    const windows = [window("2026-01-05T09:00:00.000Z", "2026-01-05T11:00:00.000Z")];
    const taskA = makeTask({
      id: "task-a",
      title: "Task A",
      priority: Priority.High,
      duration: 60,
    });
    const taskB = makeTask({
      id: "task-b",
      title: "Task B",
      priority: Priority.Low,
      duration: 60,
    });

    const result = distributeTasks([taskA, taskB], windows, SETTINGS, undefined, TARGET_WEEK);

    const eventsA = result.generatedEvents.filter((e) => e.taskId === "task-a");
    const eventsB = result.generatedEvents.filter((e) => e.taskId === "task-b");
    expect(eventsA).toHaveLength(1);
    expect(eventsB).toHaveLength(1);
    expect(result.failures.filter((f) => f.taskId === "task-a" || f.taskId === "task-b"))
      .toHaveLength(0);

    // Both events must fall within the single window and must not overlap.
    const eA = eventsA[0];
    const eB = eventsB[0];
    const winStart = new Date("2026-01-05T09:00:00.000Z").getTime();
    const winEnd = new Date("2026-01-05T11:00:00.000Z").getTime();
    for (const e of [eA, eB]) {
      expect(new Date(e.start).getTime()).toBeGreaterThanOrEqual(winStart);
      expect(new Date(e.end).getTime()).toBeLessThanOrEqual(winEnd);
    }
    const aStart = new Date(eA.start).getTime();
    const aEnd = new Date(eA.end).getTime();
    const bStart = new Date(eB.start).getTime();
    const bEnd = new Date(eB.end).getTime();
    expect(aEnd <= bStart || bEnd <= aStart).toBe(true);
  });

  it("fails a task longer than any single window rather than spanning the gap", () => {
    // Two single-slot windows separated by a gap, task needs 3 slots (90 min).
    // No single window has enough; spanning across the gap must be rejected.
    const windows = [
      window("2026-01-05T09:00:00.000Z", "2026-01-05T09:30:00.000Z"),
      window("2026-01-05T10:00:00.000Z", "2026-01-05T11:00:00.000Z"),
    ];
    const task = makeTask({ id: "task-long", duration: 90 });

    const result = distributeTasks([task], windows, SETTINGS, undefined, TARGET_WEEK);

    expect(result.generatedEvents).toHaveLength(0);
    const failure = result.failures.find((f) => f.taskId === "task-long");
    expect(failure).toBeDefined();
    expect(failure?.allocated).toBe(0);
  });

  it("single-slot tasks still allocate even when windows are separated by a gap", () => {
    // A 30-minute task needs only one slot, so the boundary check is a no-op
    // and it must still place inside one of the windows.
    const windows = [
      window("2026-01-05T09:00:00.000Z", "2026-01-05T09:30:00.000Z"),
      window("2026-01-05T10:00:00.000Z", "2026-01-05T10:30:00.000Z"),
    ];
    const task = makeTask({ id: "task-single", duration: 30 });

    const result = distributeTasks([task], windows, SETTINGS, undefined, TARGET_WEEK);

    expect(result.failures.filter((f) => f.taskId === "task-single")).toHaveLength(0);
    expect(result.generatedEvents).toHaveLength(1);
    const event = result.generatedEvents[0];
    expect(event.end).toBe("2026-01-05T09:30:00.000Z");
  });
});
