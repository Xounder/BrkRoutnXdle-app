import { test, expect } from "@playwright/test";
import type { CalendarEvent } from "@brkroutnxdle/shared";

const today = new Date();
const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11).toISOString();
const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12).toISOString();
const remote = (id: string): CalendarEvent => ({ id, title: id, start, end,
  source: "google", isGenerated: false, isCompleted: false, isAllDay: false });
const pending = { ...remote("Pending placement"), source: "brkroutnxdle" as const };

async function mockSession(page: import("@playwright/test").Page) {
  await page.route("**/api/v1/auth/me", route => route.fulfill({ status: 200,
    contentType: "application/json", body: JSON.stringify({ data: { id: "user", email: "user@example.com" } }) }));
}

test("Refresh without preview fetches viewed week, prunes deleted remote and retains pending local placement", async ({ page }) => {
  await mockSession(page);
  let gets = 0;
  const ranges: URLSearchParams[] = [];
  await page.route("**/api/v1/events?**", route => {
    gets++;
    ranges.push(new URL(route.request().url()).searchParams);
    return route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ data: gets === 1 ? [remote("Deleted remotely")] : [] }) });
  });
  await page.addInitScript(event => localStorage.setItem("brkroutnxdle:events", JSON.stringify([event])), pending);
  await page.goto("/");
  await expect(page.locator(".fc-event:has-text('Deleted remotely')")).toHaveCount(1);
  await expect(page.locator(".fc-event:has-text('Pending placement')")).toHaveCount(1);
  await page.getByRole("button", { name: /Refresh/ }).click();
  await expect(page.getByRole("status")).toContainText("refreshed successfully");
  await expect(page.locator(".fc-event:has-text('Deleted remotely')")).toHaveCount(0);
  await expect(page.locator(".fc-event:has-text('Pending placement')")).toHaveCount(1);
  expect(gets).toBeGreaterThanOrEqual(2);
  expect(ranges[1].get("timeMin")).toBe(ranges[0].get("timeMin"));
  expect(ranges[1].get("timeMax")).toBe(ranges[0].get("timeMax"));
  await page.getByRole("button", { name: "Next period" }).click();
  await page.getByRole("button", { name: /Refresh/ }).click();
  await expect(page.getByRole("status")).toContainText("refreshed successfully");
  expect(ranges.at(-1)?.get("timeMin")).not.toBe(ranges[0].get("timeMin"));
});

test("preview conflict compares the original baseline; discard keeps pending manual placement", async ({ page }) => {
  await mockSession(page);
  let gets = 0;
  await page.route("**/api/v1/events?**", route => {
    gets++;
    const changed = { ...remote("Changed remotely"), start: new Date(Date.parse(start) + 3_600_000).toISOString() };
    return route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ data: [gets === 1 ? remote("Changed remotely") : changed] }) });
  });
  await page.addInitScript(event => localStorage.setItem("brkroutnxdle:events", JSON.stringify([event])), pending);
  await page.goto("/");
  await expect(page.locator(".fc-event:has-text('Changed remotely')")).toHaveCount(1);
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByText(/Preview:/)).toBeVisible();
  await page.getByRole("button", { name: /Refresh/ }).click();
  await expect(page.getByText("Calendar Changes Detected")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("conflict with this preview");
  await page.getByRole("button", { name: /Discard Preview — Start fresh/ }).click();
  await expect(page.locator(".fc-event:has-text('Pending placement')")).toHaveCount(1);
  expect(gets).toBeGreaterThanOrEqual(2);
});

test("transport and HTTP failures show distinct guidance and Retry recovers without clearing token", async ({ page }) => {
  await mockSession(page);
  let failure = "network";
  await page.route("**/api/v1/events?**", route => {
    if (failure === "network") return route.abort("failed");
    if (failure !== "ok") {
      const status = Number(failure);
      return route.fulfill({ status, contentType: "application/json",
        body: JSON.stringify({ error: { code: status === 401 ? "AUTH_EXPIRED" : "UPSTREAM", message: "request failed" } }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
  });
  await page.addInitScript(() => sessionStorage.setItem("brkroutnxdle:devToken", "test-only"));
  await page.goto("/");
  await page.getByRole("button", { name: /Refresh/ }).click();
  await expect(page.getByRole("status")).toContainText("Cannot reach the calendar API");
  expect(await page.evaluate(() => sessionStorage.getItem("brkroutnxdle:devToken"))).toBe("test-only");
  for (const [code, message] of [["401", "Session expired"], ["403", "Google Calendar access denied"],
    ["404", "Calendar not found"], ["502", "temporarily unavailable"]] as const) {
    failure = code;
    await page.getByRole("status").getByRole("button", { name: "Retry" }).click();
    await expect(page.getByRole("status")).toContainText(message);
  }
  failure = "ok";
  await page.getByRole("status").getByRole("button", { name: "Retry" }).click();
  await expect(page.getByRole("status")).toContainText("refreshed successfully");
});

test("navigation during delayed Refresh releases loading and ignores stale results after the new range refresh", async ({ page }) => {
  await mockSession(page);
  let gets = 0;
  let releaseOld: (() => void) | undefined;
  let startedOld: (() => void) | undefined;
  let finishedOld: (() => void) | undefined;
  const oldStarted = new Promise<void>(resolve => { startedOld = resolve; });
  const holdOld = new Promise<void>(resolve => { releaseOld = resolve; });
  const oldFinished = new Promise<void>(resolve => { finishedOld = resolve; });
  await page.route("**/api/v1/events?**", async route => {
    gets++;
    if (gets === 2) {
      startedOld?.();
      await holdOld;
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ data: [remote("Stale old range")] }) });
      finishedOld?.();
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
  });
  await page.addInitScript(() => localStorage.setItem("brkroutnxdle:tasks", JSON.stringify([{
    id: "task", title: "Preview only", duration: 60, priority: "medium", frequency: 1,
    gapDays: 1, allowSameDay: false, restrictions: [], isActive: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }])));
  await page.goto("/");
  await expect(page.locator(".fc-view-harness")).toBeVisible();
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByText(/Preview:/)).toBeVisible();
  await page.getByRole("button", { name: /Refresh/ }).click();
  await oldStarted;
  await expect(page.getByRole("button", { name: "Refreshing..." })).toBeDisabled();
  await page.getByRole("button", { name: "Next period" }).click();
  await expect(page.getByRole("button", { name: /Refresh/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Calculate Week" })).toBeVisible();
  await page.getByRole("button", { name: /Refresh/ }).click();
  await expect(page.getByRole("status")).toContainText("refreshed successfully");
  releaseOld?.();
  await oldFinished;
  await page.waitForTimeout(100);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("brkroutnxdle:events") ?? "[]")
    .some((event: { id: string }) => event.id === "Stale old range"))).toBe(false);
  await expect(page.getByRole("status")).toContainText("refreshed successfully");
  await expect(page.getByRole("button", { name: "Calculate Week" })).toBeVisible();
  expect(gets).toBeGreaterThanOrEqual(3);
});
