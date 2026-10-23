import { test, expect } from "@playwright/test";
import type { CalendarEvent, Task } from "@brkroutnxdle/shared";
import {
  appendCalendarEventForTask,
  buildCalendarEventFromTask,
  updateCalendarEventForTask,
} from "../src/utils/createCalendarEventFromTask";

const task = {
  id: "task-definition-1",
  title: "Reading",
} as Task;

test("explicit placement has a local occurrence ID and exact selected times", () => {
  const first = buildCalendarEventFromTask(task, {
    start: "2026-10-20T14:00:00",
    end: "2026-10-20T15:00:00",
  });
  expect(first.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  expect(first.id).not.toBe(task.id);
  expect(first.taskId).toBe(task.id);
  expect(first.isPinned).toBe(true);
  expect(first.start).toBe("2026-10-20T14:00:00");
  expect(first.end).toBe("2026-10-20T15:00:00");

  const twice = appendCalendarEventForTask([first], task, {
    start: "2026-10-21T16:00:00",
    end: "2026-10-21T17:00:00",
  });
  expect(twice).toHaveLength(2);
  expect(twice[0]).toEqual(first);
  expect(twice[1].id).not.toBe(first.id);
  expect(twice[1].isPinned).toBe(true);
  expect(twice[1].start).toBe("2026-10-21T16:00:00");
  expect(twice[1].end).toBe("2026-10-21T17:00:00");
  expect(() => buildCalendarEventFromTask(task, { start: "", end: "" })).toThrow(/Explicit start and end/);
});

test("definition edits update all placements without creating or moving events", () => {
  const local = buildCalendarEventFromTask(task, {
    start: "2026-10-20T14:00:00", end: "2026-10-20T15:00:00",
  });
  const remote: CalendarEvent = {
    ...local, id: "remote-google-event", source: "google", isPinned: false,
    start: "2026-10-22T10:00:00", end: "2026-10-22T11:00:00",
  };
  const legacy: CalendarEvent = { ...local, id: task.id, isPinned: undefined };
  const unrelated: CalendarEvent = { ...local, id: "other", taskId: "other-task" };
  const changed = updateCalendarEventForTask([local, remote, legacy, unrelated], { ...task, title: "Updated reading" });
  expect(changed).toHaveLength(4);
  expect(changed[0]).toEqual({ ...local, title: "Updated reading" });
  expect(changed[1]).toEqual({ ...remote, title: "Updated reading" });
  expect(changed[2]).toEqual({ ...legacy, title: "Updated reading" });
  expect(changed[3]).toEqual(unrelated);
  expect(changed.map((event) => event.isPinned)).toEqual([true, false, undefined, true]);
  expect(updateCalendarEventForTask([], task)).toEqual([]);
});

test("panel creates definition only and slot creation places exactly one pending event", async ({ page }) => {
  const writes: string[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (url.includes("/events") && method !== "GET") writes.push(method);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: url.includes("/auth/me")
        ? { id: "test-user", email: "test@example.com", name: "Test User", picture: "" }
        : [] }),
    });
  });

  await page.goto("/");
  await page.locator('button:has-text("Tasks")').click();
  await expect(page.getByText("Tasks (0)")).toBeVisible();
  await page.locator('button:has-text("+ New")').click();
  await page.locator("#task-name").fill("Definition only");
  await page.locator('form button[type="submit"]:has-text("Create")').click();
  await expect(page.getByText("Tasks (1)")).toBeVisible();
  await expect(page.locator(".fc-event:has-text('Definition only')")).toHaveCount(0);
  expect(writes).toEqual([]);

  await page.locator('[data-task-drag="true"]:has-text("Definition only")').click();
  await expect(page.getByText("Edit Task")).toBeVisible();
  await page.locator("#task-name").fill("Edited definition");
  await page.locator('form button[type="submit"]:has-text("Save")').click();
  await expect(page.locator('[data-task-drag="true"]:has-text("Edited definition")')).toBeVisible();
  await expect(page.locator(".fc-event:has-text('Edited definition')")).toHaveCount(0);
  expect(writes).toEqual([]);

  const slot = page.locator('.fc-timegrid-slot:has-text("14:00")').first();
  if (await slot.count()) {
    await slot.click();
  } else {
    await page.locator(".fc-timegrid-body").first().click({ position: { x: 100, y: 120 } });
  }
  await expect(page.getByText("Create in this slot")).toBeVisible();
  await page.getByRole("button", { name: "Create Task" }).click();
  await page.locator("#task-name").fill("Placed by slot");
  await page.locator("#task-duration").selectOption("30");
  await page.locator('button[type="submit"]:has-text("Create Task")').click();
  await expect(page.getByText("Create in this slot")).toBeHidden();
  await expect(page.locator(".fc-event:has-text('Placed by slot')")).toHaveCount(1);
  await expect(page.locator(".fc-event:has-text('Edited definition')")).toHaveCount(0);
  expect(writes).toEqual([]);
});
