import { expect, test, type Page } from "@playwright/test";

const user = { id: "sidebar-drag-user", email: "drag@example.com" };
const title = "Sidebar physical drag";

async function dragToTime(page: Page, time: string) {
  const source = page.locator('[data-task-drag="true"]');
  const lane = page.locator(`.fc-timegrid-slot-lane[data-time="${time}:00"]`);
  await lane.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await lane.boundingBox();
  const column = await page.locator(".fc-timegrid-col[data-date]").first().boundingBox();
  expect(from).not.toBeNull();
  expect(to).not.toBeNull();
  expect(column).not.toBeNull();
  await page.mouse.move(from!.x + from!.width / 3, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(column!.x + column!.width / 2, to!.y + to!.height / 2, { steps: 18 });
  await page.mouse.up();
}

test("first task and reopened sidebar physically place distinct pending occurrences; save confirms remote", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-08T08:00:00") });
  const writes: Array<{ method: string; body: Record<string, any> | null }> = [];
  const remote: Record<string, unknown>[] = [];
  await page.route("**/api/v1/auth/me", route => route.fulfill({ json: { data: user } }));
  await page.route("**/api/v1/events**", route => {
    const method = route.request().method();
    if (method === "GET") return route.fulfill({ json: { data: remote } });
    const body = route.request().postDataJSON();
    writes.push({ method, body });
    if (method === "POST") {
      const event = { id: `remote-${writes.length}`, title: body.summary, taskId: body.taskId,
        start: body.start.dateTime, end: body.end.dateTime, source: "google", isGenerated: true,
        isPinned: true, isCompleted: false, isAllDay: false };
      remote.push(event);
      return route.fulfill({ json: { data: event } });
    }
    return route.fulfill({ json: { data: {} } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await expect(page.getByText("Tasks (0)")).toBeVisible();
  await page.getByRole("button", { name: "+ New" }).click();
  await page.locator("#task-name").fill(title);
  await page.locator("#task-duration").selectOption("60");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  const source = page.locator('[data-task-drag="true"]');
  await expect(source).toHaveCount(1);
  const taskId = await source.getAttribute("data-task-id");
  await page.getByRole("group", { name: "Calendar view" }).getByRole("button", { name: "Day" }).click();
  await page.getByRole("button", { name: "Next period" }).click();
  await expect(page.locator(".fc-timegrid-col[data-date='2026-11-09']")).toBeVisible();
  await dragToTime(page, "10:00");
  await expect(page.locator(`.fc-event:has-text("${title}")`)).toHaveCount(1);
  await expect(page.getByRole("alert").filter({ hasText: "unavailable" })).toHaveCount(0);
  await expect(page.getByText("Unsaved changes")).toBeVisible();
  expect(writes).toEqual([]);
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await dragToTime(page, "12:00");
  await expect(page.locator(`.fc-event:has-text("${title}")`)).toHaveCount(2);
  await expect(page.getByRole("alert").filter({ hasText: "unavailable" })).toHaveCount(0);
  expect(writes).toEqual([]);
  expect(await source.count()).toBe(1);
  expect(await source.getAttribute("data-task-id")).toBe(taskId);
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect(page.getByText("Schedule saved successfully!")).toBeVisible();
  expect(writes.map(w => w.method)).toEqual(["POST", "POST"]);
  for (const [index, hour] of [10, 12].entries()) {
    expect(writes[index].body).toMatchObject({ taskId, summary: title, isPinned: true });
    const start = new Date(writes[index].body!.start.dateTime as string);
    const end = new Date(writes[index].body!.end.dateTime as string);
    expect(start.getDate()).toBe(9);
    expect(start.getHours()).toBe(hour);
    expect(end.getTime() - start.getTime()).toBe(3_600_000);
  }
  expect(remote.map(event => event.id)).toEqual(["remote-1", "remote-2"]);
  await page.reload();
  await page.getByRole("group", { name: "Calendar view" }).getByRole("button", { name: "Day" }).click();
  await page.getByRole("button", { name: "Next period" }).click();
  await expect(page.locator(".fc-timegrid-col[data-date='2026-11-09']")).toBeVisible();
  await expect(page.locator(`.fc-event:has-text("${title}")`)).toHaveCount(2);
  expect(writes.map(w => w.method)).toEqual(["POST", "POST"]);
});

test("physical drop onto occupied time rejects with feedback and without writes", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-08T08:00:00") });
  const writes: string[] = [];
  await page.route("**/api/v1/auth/me", route => route.fulfill({ json: { data: user } }));
  await page.route("**/api/v1/events**", route => {
    if (route.request().method() !== "GET") writes.push(route.request().method());
    return route.fulfill({ json: { data: [] } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: "+ New" }).click();
  await page.locator("#task-name").fill(title);
  await page.locator("#task-duration").selectOption("60");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.locator('[data-task-drag="true"]')).toHaveCount(1);
  await page.getByRole("group", { name: "Calendar view" }).getByRole("button", { name: "Day" }).click();
  await page.getByRole("button", { name: "Next period" }).click();
  await expect(page.locator(".fc-timegrid-col[data-date='2026-11-09']")).toBeVisible();
  await dragToTime(page, "10:00");
  await expect(page.locator(`.fc-event:has-text("${title}")`)).toHaveCount(1);
  await dragToTime(page, "09:30");
  await expect(page.getByRole("alert").filter({ hasText: "unavailable" })).toBeVisible();
  await expect(page.locator(`.fc-event:has-text("${title}")`)).toHaveCount(1);
  expect(writes).toEqual([]);
});

test("month-cell pointer drop uses the civil date and configured work-start hour", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-08T08:00:00") });
  const writes: Record<string, any>[] = [];
  const remote: Record<string, unknown>[] = [];
  await page.route("**/api/v1/auth/me", route => route.fulfill({ json: { data: user } }));
  await page.route("**/api/v1/events**", route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { data: remote } });
    const body = route.request().postDataJSON();
    writes.push(body);
    const event = { id: "month-remote", title: body.summary, taskId: body.taskId,
      start: body.start.dateTime, end: body.end.dateTime, source: "google", isGenerated: true,
      isPinned: true, isCompleted: false, isAllDay: false };
    remote.push(event);
    return route.fulfill({ json: { data: event } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: "+ New" }).click();
  await page.locator("#task-name").fill(title);
  await page.locator("#task-duration").selectOption("60");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  const source = page.locator('[data-task-drag="true"]');
  await expect(source).toHaveCount(1);
  const taskId = await source.getAttribute("data-task-id");
  await page.getByRole("group", { name: "Calendar view" }).getByRole("button", { name: "Month" }).click();
  await page.getByRole("button", { name: "Next period" }).click();
  const cell = page.locator('.fc-daygrid-day[data-date="2026-12-10"]');
  await expect(cell).toBeVisible();
  const from = await source.boundingBox();
  const to = await cell.boundingBox();
  expect(from).not.toBeNull();
  expect(to).not.toBeNull();
  await page.mouse.move(from!.x + from!.width / 3, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 18 });
  await page.mouse.up();
  await expect(page.locator(`.fc-event:has-text("${title}")`)).toHaveCount(1);
  expect(writes).toHaveLength(0);
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect(page.getByText("Schedule saved successfully!")).toBeVisible();
  expect(writes).toHaveLength(1);
  expect(writes[0]).toMatchObject({ taskId, summary: title, isPinned: true });
  const start = new Date(writes[0].start.dateTime as string);
  const end = new Date(writes[0].end.dateTime as string);
  expect([start.getFullYear(), start.getMonth(), start.getDate(), start.getHours()]).toEqual([2026, 11, 10, 8]);
  expect(end.getTime() - start.getTime()).toBe(3_600_000);
});
