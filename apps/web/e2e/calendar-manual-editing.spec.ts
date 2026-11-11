import { test, expect } from "@playwright/test";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import type { GeneratedEvent } from "@brkroutnxdle/domain";
import { computeDiff } from "../src/services/diffCalculator";
import { canEditOccurrence } from "../src/hooks/useScheduleEditing";

// Keep the fixture's tomorrow inside the browser's initially viewed week.
// setFixedTime changes Date but leaves FullCalendar drag timers running normally.
const fixtureNow = new Date("2030-11-05T08:00:00");
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(fixtureNow);
});

const tomorrow = () => {
  const day = new Date(fixtureNow);
  day.setDate(day.getDate() + 1);
  day.setHours(10, 0, 0, 0);
  return day;
};
const occurrence = (id: string, source: CalendarEvent["source"], hour = 10): CalendarEvent => {
  const start = tomorrow();
  start.setHours(hour);
  const end = new Date(start.getTime() + 60 * 60_000);
  return { id, source, taskId: "task", title: "Reading", start: start.toISOString(),
    end: end.toISOString(), isGenerated: true, isCompleted: false, isAllDay: false, isPinned: true };
};

test("manual diff deletes just selected saved occurrence and never PATCHes a pending UUID", () => {
  const first = occurrence("google-one", "google");
  const second = occurrence("google-two", "google", 12);
  const pending = occurrence("pending-uuid", "brkroutnxdle", 14);
  const desired: GeneratedEvent[] = [{ id: pending.id, taskId: "task", start: pending.start,
    end: pending.end, completed: false, createdAt: "", updatedAt: "" },
  { id: second.id, taskId: "task", start: second.start, end: second.end,
    completed: false, createdAt: "", updatedAt: "" }];
  const diff = computeDiff(desired, [first, second], [], { explicitDeleteIds: new Set([first.id]) });
  expect(diff.toDelete).toEqual([first.id]);
  expect(diff.toUpdate).toEqual([]);
  expect(diff.toCreate).toHaveLength(1);
  expect(diff.toCreate[0].start.dateTime).toBe(pending.start);
});

test("protected and invalid intervals are not eligible, but a future pinned occurrence is", () => {
  const future = occurrence("saved", "google");
  expect(canEditOccurrence(future, false)).toBe(true);
  expect(canEditOccurrence({ ...future, isCompleted: true }, false)).toBe(false);
  expect(canEditOccurrence({ ...future, isGenerated: false }, false)).toBe(false);
  expect(canEditOccurrence({ ...future, end: "" }, false)).toBe(false);
  expect(canEditOccurrence({ ...future, start: "invalid" }, false)).toBe(false);
  expect(canEditOccurrence(future, true)).toBe(false);
});

test("deleting a pending occurrence only removes that UUID, never sends DELETE", async ({ page }) => {
  const pending = occurrence("pending-uuid", "brkroutnxdle");
  let deletes = 0;
  await page.addInitScript(event => {
    localStorage.setItem("brkroutnxdle:events:manual-user", JSON.stringify([event]));
  }, pending);
  await page.route("**/api/v1/**", async route => {
    if (route.request().method() === "DELETE") deletes++;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data:
      route.request().url().includes("/auth/me")
        ? { id: "manual-user", email: "user@example.com", name: "User" } : [] }) });
  });
  await page.goto("/");
  await expect(page.locator(".fc-event").filter({ hasText: "Reading" })).toHaveCount(1);
  await page.getByRole("button", { name: "Delete Reading" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.locator(".fc-event").filter({ hasText: "Reading" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save to Calendar" })).toBeEnabled();
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect(page.getByText("Schedule saved successfully!")).toBeVisible();
  expect(deletes).toBe(0);
});

test("account-scoped deletion journal survives reload and rejects storage failure without losing intent", async ({ page }) => {
  const saved = occurrence("selected", "google");
  await page.goto("/");
  const state = await page.evaluate(async event => {
    const { manualEdits, changeManualEdit } = await import("../src/services/manualEditJournal");
    changeManualEdit("account-A", event.id, { original: event, desired: null, written: false });
    const otherAccount = manualEdits("account-B").size;
    const previous = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("Quota exceeded"); };
    let failed = false;
    try { changeManualEdit("account-A", event.id, null); } catch { failed = true; }
    Storage.prototype.setItem = previous;
    return { otherAccount, failed, retained: manualEdits("account-A").has(event.id) };
  }, saved);
  expect(state).toEqual({ otherAccount: 0, failed: true, retained: true });
  await page.reload();
  const persisted = await page.evaluate(async () => {
    const { manualEdits } = await import("../src/services/manualEditJournal");
    return { a: [...manualEdits("account-A").keys()], b: [...manualEdits("account-B").keys()] };
  });
  expect(persisted).toEqual({ a: [saved.id], b: [] });
});

test("failed DELETE cannot claim success and retry targets only the selected occurrence", async ({ page }) => {
  const saved = occurrence("selected", "google");
  const sibling = occurrence("sibling", "google", 14);
  let remote = [saved, sibling];
  const attempted: string[] = [];
  let fail = true;
  await page.route("**/api/v1/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    let status = 200;
    let data: unknown = [];
    if (url.pathname.endsWith("/auth/me")) data = { id: "manual-user", email: "user@example.com", name: "User" };
    if (url.pathname.endsWith("/events") && request.method() === "GET") data = remote;
    if (request.method() === "DELETE") {
      attempted.push(decodeURIComponent(url.pathname.split("/").at(-1)!));
      if (fail) status = 503;
      else remote = remote.filter(event => event.id !== attempted.at(-1));
    }
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ data }) });
  });
  await page.goto("/");
  await expect(page.locator(".fc-event").filter({ hasText: "Reading" })).toHaveCount(2);
  await page.getByRole("button", { name: "Delete Reading" }).first().click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect.poll(() => attempted).toEqual([saved.id]);
  await expect(page.getByRole("status").getByText(/Error:/)).toBeVisible();
  await expect(page.getByText("Schedule saved successfully!")).toHaveCount(0);
  fail = false;
  await page.getByRole("status").getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("Schedule saved successfully!")).toBeVisible();
  expect(attempted).toEqual([saved.id, saved.id]);
  expect(remote.map(event => event.id)).toEqual([sibling.id]);
});

for (const method of ["PATCH", "DELETE"] as const) {
  test(`${method} acknowledgement storage failure survives reload and confirms without repeating remote write`, async ({ page }) => {
    const saved = occurrence("selected", "google");
    const sibling = occurrence("sibling", "google", 14);
    const moved = { start: new Date(Date.parse(saved.start) + 30 * 60_000).toISOString(),
      end: new Date(Date.parse(saved.end) + 30 * 60_000).toISOString() };
    let remote = [saved, sibling];
    const writes: string[] = [];
    await page.route("**/api/v1/**", async route => {
      const request = route.request();
      const url = new URL(request.url());
      let data: unknown = [];
      if (url.pathname.endsWith("/auth/me")) data = { id: "manual-user", email: "user@example.com", name: "User" };
      if (url.pathname.endsWith("/events") && request.method() === "GET") data = remote;
      if (url.pathname.includes("/events/") && (request.method() === "PATCH" || request.method() === "DELETE")) {
        writes.push(`${request.method()}:${decodeURIComponent(url.pathname.split("/").at(-1)!)}`);
        if (request.method() === "DELETE") remote = remote.filter(event => event.id !== saved.id);
        else remote = remote.map(event => event.id === saved.id ? { ...event, ...moved } : event);
        data = { id: saved.id };
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data }) });
    });
    if (method === "PATCH") await page.addInitScript(({ event, desired }) => {
      if (!localStorage.getItem("brkroutnxdle:manual-edits:manual-user"))
        localStorage.setItem("brkroutnxdle:manual-edits:manual-user", JSON.stringify([
          [event.id, { original: event, desired, written: false }],
        ]));
    }, { event: saved, desired: moved });
    await page.goto("/");
    await expect(page.locator(".fc-event").filter({ hasText: "Reading" })).toHaveCount(2);
    if (method === "DELETE") {
      await page.getByRole("button", { name: "Delete Reading" }).first().click();
      await page.getByRole("button", { name: "Delete", exact: true }).click();
    }
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key === "brkroutnxdle:manual-edits:manual-user" &&
          (JSON.parse(value) as Array<[string, { written: boolean }]>).some(([, edit]) => edit.written)) {
          throw new Error("Quota exceeded after remote write");
        }
        return original.call(this, key, value);
      };
    });
    await page.getByRole("button", { name: "Save to Calendar" }).click();
    await expect.poll(() => writes).toEqual([`${method}:${saved.id}`]);
    await expect(page.getByText(/browser storage failed/i)).toBeVisible();
    await expect(page.getByText("Schedule saved successfully!")).toHaveCount(0);
    const staged = await page.evaluate(() => JSON.parse(localStorage.getItem("brkroutnxdle:manual-edits:manual-user")!));
    expect(staged[0][1]).toMatchObject({ attempted: true, written: false });
    await page.reload();
    await expect(page.getByRole("button", { name: "Save to Calendar" })).toBeEnabled();
    await page.getByRole("button", { name: "Save to Calendar" }).click();
    await expect(page.getByText("Schedule saved successfully!")).toBeVisible();
    expect(writes).toEqual([`${method}:${saved.id}`]);
    expect(remote.map(event => event.id)).toEqual(method === "DELETE" ? [sibling.id] : [saved.id, sibling.id]);
  });
}

for (const action of ["drag", "resize"] as const) {
  test(`${action} storage failure reverts FullCalendar and Retry storage permits a new edit`, async ({ page }) => {
    const saved = occurrence("selected", "google");
    await page.route("**/api/v1/**", async route => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data:
        route.request().url().includes("/auth/me")
          ? { id: "manual-user", email: "user@example.com", name: "User" } : [saved] }) });
    });
    await page.goto("/");
    const event = page.locator(".fc-event").filter({ hasText: "Reading" });
    await expect(event).toBeVisible();
    const originalTime = await event.locator(".brk-event-time").innerText();
    const originalBox = await event.boundingBox();
    const grid = page.locator(".fc-timegrid-body");
    const originalGrid = await grid.boundingBox();
    if (!originalBox || !originalGrid) throw new Error("Missing event geometry");
    await page.evaluate(() => {
      const previous = Storage.prototype.setItem;
      (window as unknown as { restoreJournalStorage: () => void }).restoreJournalStorage = () => {
        Storage.prototype.setItem = previous;
      };
      Storage.prototype.setItem = function(key, value) {
        if (key === "brkroutnxdle:manual-edits:manual-user") throw new Error("Quota exceeded");
        return previous.call(this, key, value);
      };
    });
    const gesture = async () => {
      if (action === "resize") await event.hover();
      const target = action === "resize" ? event.locator(".fc-event-resizer-end") : event;
      const box = await target.boundingBox();
      if (!box) throw new Error("Missing interaction target");
      const x = box.x + box.width / 2;
      const y = action === "resize" ? box.y + box.height / 2 : box.y + Math.min(12, box.height / 3);
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y + (action === "resize" ? 26 : 50), { steps: 12 });
      await page.mouse.up();
    };
    await gesture();
    await expect(page.getByText(/Could not persist manual edit/)).toBeVisible();
    await expect(event.locator(".brk-event-time")).toHaveText(originalTime);
    const revertedBox = await event.boundingBox();
    const revertedGrid = await grid.boundingBox();
    expect(revertedBox!.y - revertedGrid!.y).toBeCloseTo(originalBox.y - originalGrid.y, 0);
    await expect(page.getByRole("button", { name: "Save to Calendar" })).toBeDisabled();
    await page.getByRole("button", { name: "Retry storage" }).click();
    await expect(page.getByText(/Could not persist manual edit/)).toBeVisible();
    await page.evaluate(() => (window as unknown as { restoreJournalStorage: () => void }).restoreJournalStorage());
    await page.getByRole("button", { name: "Retry storage" }).click();
    await expect(page.getByText(/Could not persist manual edit/)).toHaveCount(0);
    await gesture();
    await expect(page.getByRole("button", { name: "Save to Calendar" })).toBeEnabled();
  });
}

test("drag and resize saved occurrence, confirm both PATCHes, delete only that ID after stale GET", async ({ page }) => {
  const first = occurrence("remote-first", "google");
  const sibling = occurrence("remote-sibling", "google", 14);
  let remote = [first, sibling];
  let deletedSnapshot: CalendarEvent | undefined;
  const patches: string[] = [];
  const deletes: string[] = [];
  let staleDeletion = false;
  await page.route("**/api/v1/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    let data: unknown = [];
    if (url.pathname.endsWith("/auth/me")) data = { id: "manual-user", email: "user@example.com", name: "User" };
    if (url.pathname.endsWith("/events") && request.method() === "GET") data = staleDeletion ? [deletedSnapshot!, ...remote] : remote;
    if (url.pathname.includes("/events/") && request.method() === "PATCH") {
      patches.push(decodeURIComponent(url.pathname.split("/").at(-1)!));
      const body = request.postDataJSON() as { start: string; end: string };
      remote = remote.map(event => event.id === patches.at(-1) ? { ...event, ...body } : event);
      data = remote.find(event => event.id === patches.at(-1));
    }
    if (url.pathname.includes("/events/") && request.method() === "DELETE") {
      deletes.push(decodeURIComponent(url.pathname.split("/").at(-1)!));
      deletedSnapshot = remote.find(event => event.id === deletes.at(-1));
      remote = remote.filter(event => event.id !== deletes.at(-1));
      staleDeletion = true;
      data = { id: deletes.at(-1) };
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data }) });
  });
  await page.addInitScript(() => {
    localStorage.setItem("brkroutnxdle:tasks", JSON.stringify([{ id: "task", title: "Reading",
      duration: 60, priority: "medium", frequency: 2, gapDays: 1, allowSameDay: false,
      restrictions: [], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]));
  });
  await page.goto("/");
  await expect(page.locator(".fc-view-harness")).toBeVisible();
  const firstEvent = page.locator(".fc-event").filter({ hasText: "Reading" }).first();
  await expect(firstEvent).toBeVisible();
  const box = await firstEvent.boundingBox();
  if (!box) throw new Error("Event has no drag target");
  await page.mouse.move(box.x + box.width / 2, box.y + Math.min(12, box.height / 3));
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + Math.min(12, box.height / 3) + 50, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Save to Calendar" })).toBeEnabled();
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect.poll(() => patches).toEqual([first.id]);
  await expect(page.getByRole("button", { name: "Save to Calendar" })).toBeDisabled();
  const moved = remote.find(event => event.id === first.id)!;
  expect(moved.start).not.toBe(first.start);
  expect(moved.end).not.toBe(first.end);
  await page.reload();
  await expect(firstEvent).toBeVisible();
  await firstEvent.hover();
  const resize = firstEvent.locator(".fc-event-resizer-end");
  await expect(resize).toBeVisible();
  const handle = await resize.boundingBox();
  if (!handle) throw new Error("Event has no resize handle");
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 + 26, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByRole("button", { name: "Save to Calendar" })).toBeEnabled();
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect.poll(() => patches).toEqual([first.id, first.id]);
  const resized = remote.find(event => event.id === first.id)!;
  expect(resized.start).toBe(moved.start);
  expect(resized.end).not.toBe(moved.end);
  await expect(page.getByRole("button", { name: "Save to Calendar" })).toBeDisabled();
  await firstEvent.getByRole("button", { name: "Delete Reading" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save to Calendar" })).toBeEnabled();
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect.poll(() => deletes).toEqual([first.id]);
  await expect(page.getByText(/pending remote confirmation/i)).toBeVisible();
  staleDeletion = false;
  await page.getByRole("status").getByRole("button", { name: "Retry" }).click();
  await expect.poll(() => deletes).toEqual([first.id]);
  await expect(page.getByRole("button", { name: "Save to Calendar" })).toBeDisabled();
  await page.reload();
  await expect(page.locator(".fc-event").filter({ hasText: "Reading" })).toHaveCount(1);
  expect(remote.map(event => event.id)).toEqual([sibling.id]);
});
