import { expect, test } from "@playwright/test";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { viewedWeek } from "../src/pages/dashboard/previewSchedule";
import { guideStep, summarizeSavedWeek } from "../src/pages/dashboard/savedWeekSummary";
import type { RemoteConfirmation } from "../src/services/remoteConfirmation";
import { verifySavedWrites } from "../src/services/verifySavedWrites";

test("remote confirmation checks POST identity, PATCH interval and DELETE absence", () => {
  const event = (id: string, start = "2026-11-03T12:00:00.000Z"): CalendarEvent => ({
    id, title: id, start, end: "2026-11-03T13:00:00.000Z", source: "google",
    isGenerated: true, isCompleted: false, isAllDay: false,
  });
  const created = event("remote-new");
  const moved = event("remote-moved", "2026-11-03T14:00:00.000Z");
  const updates = new Map([[moved.id, { start: moved.start, end: moved.end }]]);
  const deleted = new Set(["remote-deleted"]);
  expect(verifySavedWrites([created, moved], [created], updates, deleted)).toBe(true);
  expect(verifySavedWrites([moved], [created], updates, deleted)).toBe(false);
  expect(verifySavedWrites([created, event(moved.id)], [created], updates, deleted)).toBe(false);
  expect(verifySavedWrites([created, moved, event("remote-deleted")], [created], updates, deleted)).toBe(false);
});

test("saved occurrences use remote IDs and start-owned DST civil weeks, never previews", () => {
  const range = viewedWeek(new Date(2026, 2, 10), "America/New_York", 0);
  expect((Date.parse(range.timeMax) - Date.parse(range.timeMin)) / 3_600_000).toBe(167);
  const event = (id: string, start: string, completed = false): CalendarEvent => ({
    id, title: id, start, end: new Date(Date.parse(start) + 3_600_000).toISOString(),
    isGenerated: true, isCompleted: completed, source: "google", taskId: "same-task", isAllDay: false,
  });
  const first = event("remote-1", range.timeMin, true);
  const second = { ...event("remote-2", new Date(Date.parse(range.timeMin) + 3_600_000).toISOString()), isPinned: true };
  const snapshot: RemoteConfirmation = { status: "confirmed", range, accountId: "A", confirmedAt: Date.now(), reason: null,
    events: [first, first, second, event("outside", range.timeMax),
      event("before", new Date(Date.parse(range.timeMin) - 1000).toISOString()),
      { ...event("draft", range.timeMin), source: "brkroutnxdle" },
      { ...event("block", range.timeMin), isBlock: true },
      { ...event("invalid", range.timeMin), start: "bad", title: "" },
      event("d7c6b5a4-aaaa-4444-8888-123456789abc", range.timeMin)] };
  const summary = summarizeSavedWeek(snapshot, range)!;
  expect(summary.occurrences.map(item => item.id)).toEqual(["remote-1", "remote-2", "d7c6b5a4-aaaa-4444-8888-123456789abc"]);
  expect(summary.completed).toHaveLength(1);
  expect(summary.outstanding).toHaveLength(2);
  expect(guideStep(1, summary, true, 5, false)).toBe("success");
  expect(guideStep(0, summary, true, 5, false)).toBe("create");
  expect(guideStep(1, summary, true, 0, true)).toBe("calculate");
  expect(guideStep(1, null, true, 0, false)).toBe("preview");
  expect(summarizeSavedWeek({ ...snapshot, status: "unconfirmed", events: [], reason: "expired" }, range)).toBeNull();
  const monday = viewedWeek(new Date(2026, 10, 1), "America/New_York", 1);
  expect((Date.parse(monday.timeMax) - Date.parse(monday.timeMin)) / 3_600_000).toBe(169);
});

test("dashboard separates confirmed empty saved week from proposed plan and dismisses guide only in session", async ({ page }) => {
  const writes: string[] = [];
  await page.route("**/api/v1/**", async route => {
    if (route.request().method() !== "GET") writes.push(route.request().url());
    await route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ data: route.request().url().includes("/auth/me") ?
        { id: "guide-account", email: "guide@example.com" } : [] }) });
  });
  await page.goto("/");
  await expect(page.getByLabel("Saved weekly review")).toContainText("No saved generated occurrences");
  await expect(page.getByLabel("First-use guide")).toContainText("Create a task");
  await page.getByLabel("First-use guide").getByRole("button", { name: "Add first task" }).click();
  await expect(page.getByText("New Task")).toBeVisible();
  await page.getByPlaceholder("e.g., Exercise, Reading, Practice").fill("Guide task");
  await page.getByRole("dialog").getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByLabel("First-use guide")).toContainText("Calculate this week");
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByLabel("Proposed plan")).toBeVisible();
  await expect(page.getByLabel("First-use guide")).toContainText("Inspect the proposed plan");
  await expect(page.getByLabel("Saved weekly review")).toContainText("No saved generated occurrences");
  expect(writes).toEqual([]);
  await page.getByRole("button", { name: "Dismiss guide" }).click();
  await page.reload();
  await expect(page.getByLabel("First-use guide")).toHaveCount(0);
});

test("guide success requires this account's fresh saved occurrence, and failed refresh removes it", async ({ page }) => {
  let account = "A";
  let fail = false;
  const start = new Date();
  start.setHours(11, 0, 0, 0);
  await page.addInitScript(() => localStorage.setItem("brkroutnxdle:tasks", JSON.stringify([{
    id: "active", title: "Active", duration: 60, frequency: 1, priority: "medium",
    restrictions: [], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }])));
  await page.route("**/api/v1/auth/me", route => route.fulfill({ status: 200, contentType: "application/json",
    body: JSON.stringify({ data: { id: account, email: `${account}@example.com` } }) }));
  await page.route("**/api/v1/events?**", route => route.fulfill({ status: fail ? 502 : 200,
    contentType: "application/json", body: JSON.stringify(fail ? { error: { code: "UPSTREAM", message: "unavailable" } } :
      { data: account === "A" ? [{ id: "A-only", title: "A-only", start: start.toISOString(),
        end: new Date(start.getTime() + 3_600_000).toISOString(), isGenerated: true,
        isCompleted: true, source: "brkroutnxdle" }] : [] }) }));
  await page.goto("/");
  await expect(page.getByLabel("First-use guide")).toContainText("Saved schedule confirmed");
  await expect(page.getByLabel("Saved weekly review")).toContainText("1 of 1 saved generated occurrences completed");
  fail = true;
  await page.getByRole("button", { name: "Check saved week" }).click();
  await expect(page.getByLabel("Saved weekly review")).toContainText("Not confirmed");
  await expect(page.getByLabel("First-use guide")).toContainText("Calculate this week");
  fail = false;
  account = "B";
  await page.reload();
  await expect(page.getByLabel("Saved weekly review")).toContainText("No saved generated occurrences");
  await expect(page.getByLabel("Saved weekly review")).not.toContainText("A-only");
  await expect(page.getByLabel("First-use guide")).toContainText("Calculate this week");
});

test("a changed week during queued generation never leaves Calculate Week disabled", async ({ page }) => {
  await page.route("**/api/v1/**", route => route.fulfill({ status: 200, contentType: "application/json",
    body: JSON.stringify({ data: route.request().url().includes("/auth/me") ?
      { id: "race", email: "race@example.com" } : [] }) }));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Calculate Week" })).toBeEnabled();
  await page.evaluate(() => {
    (Array.from(document.querySelectorAll("button")).find(button => button.textContent?.includes("Calculate Week")) as HTMLButtonElement).click();
    (document.querySelector('button[aria-label="Next period"]') as HTMLButtonElement).click();
  });
  await expect(page.getByRole("button", { name: "Calculate Week" })).toBeEnabled();
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByText(/Preview:/)).toBeVisible();
});

test("mounted review expires after five minutes and recovers only after a new GET", async ({ page }) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(11, 0, 0, 0);
  let reads = 0;
  await page.clock.install({ time: now });
  await page.route("**/api/v1/auth/me", route => route.fulfill({ status: 200, contentType: "application/json",
    body: JSON.stringify({ data: { id: "expiry", email: "expiry@example.com" } }) }));
  await page.route("**/api/v1/events?**", route => {
    reads++;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{
      id: "expiry-event", title: "Expires", start: start.toISOString(),
      end: new Date(start.getTime() + 3_600_000).toISOString(), source: "brkroutnxdle",
      isGenerated: true, isCompleted: false,
    }] }) });
  });
  await page.goto("/");
  await expect(page.getByLabel("Saved weekly review")).toContainText("0 of 1 saved generated occurrences completed");
  const prior = reads;
  await page.clock.fastForward(300_002);
  await expect(page.getByLabel("Saved weekly review")).toContainText("Not confirmed");
  expect(reads).toBe(prior);
  await page.getByRole("button", { name: "Check saved week" }).click();
  await expect(page.getByLabel("Saved weekly review")).toContainText("0 of 1 saved generated occurrences completed");
  expect(reads).toBeGreaterThan(prior);
});

for (const succeeds of [true, false]) {
  test(`saved occurrence completion ${succeeds ? "reconfirms from GET" : "fails closed on PATCH error"}`, async ({ page }) => {
    const start = new Date();
    start.setHours(11, 0, 0, 0);
    let completed = false;
    let patches = 0;
    const occurrence = () => ({ id: "remote-completion", title: "Review occurrence", start: start.toISOString(),
      end: new Date(start.getTime() + 3_600_000).toISOString(), source: "brkroutnxdle",
      isGenerated: true, isCompleted: completed, isAllDay: false, isPinned: true });
    await page.route("**/api/v1/auth/me", route => route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ data: { id: "completion-user", email: "complete@example.com" } }) }));
    await page.route("**/api/v1/events**", route => {
      if (route.request().method() === "PATCH") {
        patches++;
        if (succeeds) completed = true;
        return route.fulfill({ status: succeeds ? 200 : 502, contentType: "application/json",
          body: JSON.stringify(succeeds ? { data: occurrence() } :
            { error: { code: "UPSTREAM", message: "unavailable" } }) });
      }
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ data: [occurrence()] }) });
    });
    await page.goto("/");
    await expect(page.getByLabel("Saved weekly review")).toContainText("0 of 1 saved generated occurrences completed");
    await page.locator(".fc-event:has-text('Review occurrence')").click();
    await expect(page.getByRole("dialog", { name: "Saved occurrence" })).toBeVisible();
    await page.getByRole("dialog", { name: "Saved occurrence" }).getByRole("button", { name: "Complete", exact: true }).click();
    if (succeeds) {
      await expect(page.getByLabel("Saved weekly review")).toContainText("1 of 1 saved generated occurrences completed");
      await expect(page.getByRole("dialog", { name: "Saved occurrence" })).toContainText("Completed");
    } else {
      await expect(page.getByLabel("Saved weekly review")).toContainText("Not confirmed");
      await expect(page.getByLabel("Saved weekly review")).not.toContainText("1 of 1 saved generated occurrences completed");
    }
    expect(patches).toBe(1);
  });
}
