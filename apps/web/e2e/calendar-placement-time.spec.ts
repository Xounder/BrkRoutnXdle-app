import { test, expect } from "@playwright/test";
import type { Task } from "@brkroutnxdle/shared";
import { dropInterval, placementInterval } from "../src/utils/placementInterval";
import { appendCalendarEventForTask } from "../src/utils/createCalendarEventFromTask";
import { computeDiff } from "../src/services/diffCalculator";

test("offset-bearing drop keeps the selected instant and exact duration in the POST contract", () => {
  const interval = dropInterval("2026-11-03T12:30:00-03:00", false, 9, 60);
  expect(interval).toEqual({ start: "2026-11-03T15:30:00.000Z", end: "2026-11-03T16:30:00.000Z" });
  expect(new Date(interval.end).getTime() - new Date(interval.start).getTime()).toBe(3_600_000);
  const task = { id: "definition", title: "Manually placed" } as Task;
  const occurrences = appendCalendarEventForTask([], task, interval);
  const again = appendCalendarEventForTask(occurrences, task, interval);
  expect(again).toHaveLength(2);
  expect(again[0].id).not.toBe(again[1].id);
  expect(again.every(event => event.isPinned && event.taskId === task.id)).toBe(true);
  expect(task).toEqual({ id: "definition", title: "Manually placed" });
  const payload = computeDiff([{ id: again[0].id, taskId: task.id, start: again[0].start,
    end: again[0].end, completed: false, createdAt: "", updatedAt: "" }], [], [task]).toCreate[0];
  expect(payload).toMatchObject({ summary: task.title, start: { dateTime: interval.start },
    end: { dateTime: interval.end } });
});

test("day-grid work hour and cross-boundary drops preserve positive instants", () => {
  const day = dropInterval("2026-11-03", true, 9, 60);
  expect(new Date(day.start).getHours()).toBe(9);
  expect(new Date(day.end).getTime() - new Date(day.start).getTime()).toBe(3_600_000);
  const midnight = dropInterval("2026-12-31T23:30:00+02:00", false, 9, 120);
  expect(midnight).toEqual({ start: "2026-12-31T21:30:00.000Z", end: "2026-12-31T23:30:00.000Z" });
  const dst = dropInterval("2026-11-01T01:30:00-04:00", false, 9, 120);
  expect(dst).toEqual({ start: "2026-11-01T05:30:00.000Z", end: "2026-11-01T07:30:00.000Z" });
});

test("malformed, missing, mixed-zone, nonpositive and out-of-bounds placements are rejected", () => {
  for (const duration of [undefined, 0, -1, NaN, Infinity, 1e300]) {
    expect(() => dropInterval("2026-11-03T12:30:00-03:00", false, 9, duration as number)).toThrow();
  }
  for (const date of ["", "invalid", "2026-02-30", "2026-11-03T12:30:00+99:00"]) {
    expect(() => dropInterval(date, !date.includes("T"), 9, 60)).toThrow();
  }
  expect(() => placementInterval("2026-11-03T12:30:00-03:00", "2026-11-03T13:30:00")).toThrow();
  expect(() => placementInterval("2026-11-03T12:30:00Z", "2026-11-03T12:30:00Z")).toThrow();
  expect(() => placementInterval("2026-11-03T12:30:00Z", "2026-11-03T11:30:00Z")).toThrow();
});

test("slot creation saves selected endpoints, not the task definition duration", async ({ page }) => {
  const posts: Array<{ start: { dateTime: string }; end: { dateTime: string } }> = [];
  const remote: Record<string, unknown>[] = [];
  await page.route("**/api/v1/auth/me", route => route.fulfill({ status: 200,
    contentType: "application/json", body: JSON.stringify({ data: { id: "placement-user", email: "placement@example.com" } }) }));
  await page.route("**/api/v1/events**", route => {
    if (route.request().method() === "POST") {
      const payload = route.request().postDataJSON();
      posts.push(payload);
      const event = { id: `remote-${posts.length}`, title: payload.summary, taskId: payload.taskId,
        start: payload.start.dateTime, end: payload.end.dateTime, source: "google", isGenerated: true,
        isCompleted: false, isAllDay: false };
      remote.push(event);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: event }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: remote }) });
  });
  await page.goto("/");
  await expect(page.locator(".fc-timegrid-body")).toBeVisible();
  await page.locator(".fc-timegrid-body").first().click({ position: { x: 100, y: 8 * 60 + 30 } });
  await expect(page.getByText("Create in this slot")).toBeVisible();
  await page.getByRole("button", { name: "Create Task", exact: true }).click();
  await page.locator("#task-name").fill("Selected slot placement");
  await page.locator("#task-duration").selectOption("120");
  await page.locator('button[type="submit"]:has-text("Create Task")').click();
  await expect(page.locator(".fc-event:has-text('Selected slot placement')")).toHaveCount(1);
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect(page.getByText("Schedule saved successfully!")).toBeVisible();
  expect(posts).toHaveLength(1);
  expect(posts[0].start.dateTime).toMatch(/(?:Z|[+-]\d{2}:\d{2})$/i);
  expect(posts[0].end.dateTime).toMatch(/(?:Z|[+-]\d{2}:\d{2})$/i);
  expect(new Date(posts[0].end.dateTime).getTime() - new Date(posts[0].start.dateTime).getTime()).toBe(30 * 60_000);
});
