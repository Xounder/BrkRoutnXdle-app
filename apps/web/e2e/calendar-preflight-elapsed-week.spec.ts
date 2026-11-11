import { expect, test } from "@playwright/test";
import { apiFetch, ApiError } from "../src/services/api";

const sunday = new Date("2026-11-08T19:16:00Z");

async function setup(page: import("@playwright/test").Page,
  respond: (url: URL) => "fail" | "empty" | "occupied" | "transport",
  options?: { settings?: Record<string, unknown>; stale?: boolean }) {
  const traffic: { url: string; method: string; status: number }[] = [];
  await page.clock.setFixedTime(sunday);
  await page.addInitScript(({ settings, stale }) => {
    localStorage.setItem("brkroutnxdle:tasks", JSON.stringify([{
      id: "weekly", title: "Weekly focus", duration: 60, priority: "medium", frequency: 1,
      restrictions: [], isActive: true, createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z",
    }]));
    localStorage.setItem("brkroutnxdle:settings", JSON.stringify({ timezone: "UTC", weekStartDay: 1,
      workDays: [1, 2, 3, 4, 5], workStartHour: 9, workEndHour: 17,
      maxTasksPerDay: 4, shuffleEnabled: false, ...settings }));
    if (stale) localStorage.setItem("brkroutnxdle:events:preflight", JSON.stringify([{
      id: "stale-remote", title: "Old remote occupancy", start: "2026-11-09T09:00:00Z",
      end: "2026-11-09T17:00:00Z", source: "google", isGenerated: false,
    }, {
      id: "pending-draft", title: "Pending placement", start: "2026-11-10T14:00:00Z",
      end: "2026-11-10T15:00:00Z", source: "brkroutnxdle", isGenerated: false,
    }]));
  }, options ?? {});
  await page.route("**/api/v1/**", route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET") throw new Error(`Unexpected calendar write: ${request.url()}`);
    const result = url.pathname.endsWith("/auth/me") ? "auth" : respond(url);
    if (result === "transport") {
      traffic.push({ url: request.url(), method: request.method(), status: 0 });
      return route.abort("failed");
    }
    const status = result === "fail" ? 502 : 200;
    traffic.push({ url: request.url(), method: request.method(), status });
    const data = result === "auth" ? { id: "preflight", email: "preflight@example.com" } :
      result === "occupied" ? [{ id: "occupied", title: "Remote occupancy", source: "google",
        start: "2026-11-09T09:00:00Z", end: "2026-11-09T17:00:00Z", isAllDay: false }] : [];
    return route.fulfill({ status, contentType: "application/json",
      body: JSON.stringify(status === 502 ? { error: { code: "UPSTREAM", message: "upstream unavailable" } } : { data }) });
  });
  return traffic;
}

test("failed GET cannot create a preview; confirmed empty recovery and elapsed-week navigation stay explicit", async ({ page }) => {
  let mode: "fail" | "empty" | "occupied" = "fail";
  const traffic = await setup(page, () => mode);
  await page.goto("/");
  await expect(page.getByRole("note")).toContainText("no configured working hours remain");
  await expect(page.getByRole("note")).toContainText("Viewed week of 2 Nov 2026");
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Could not verify calendar occupancy" })).toBeVisible();
  await expect(page.getByLabel("Proposed plan")).toHaveCount(0);
  expect(traffic.some(entry => entry.url.includes("/auth/me") && entry.status === 200)).toBeTruthy();
  expect(traffic.some(entry => entry.url.includes("/events?timeMin=2026-11-02T00") && entry.status === 502)).toBeTruthy();
  mode = "empty";
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByLabel("Proposed plan")).toBeVisible();
  await page.getByRole("button", { name: "View next week" }).click();
  await expect(page.getByRole("note")).toHaveCount(0);
  expect(traffic.every(entry => entry.method === "GET")).toBeTruthy();
});

test("failed remote re-read keeps an existing proposal; Generate again recovers after retry", async ({ page }) => {
  let mode: "fail" | "empty" | "occupied" = "empty";
  const traffic = await setup(page, () => mode);
  await page.goto("/");
  await page.getByRole("button", { name: "View next week" }).click();
  await page.getByRole("button", { name: "Calculate Week" }).click();
  const plan = page.getByLabel("Proposed plan");
  await expect(plan).toBeVisible();
  const before = await plan.innerText();
  mode = "fail";
  await page.getByRole("button", { name: /Refresh/ }).click();
  await expect(page.getByRole("status")).toContainText("unavailable");
  await page.getByRole("button", { name: "Generate again" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Could not verify calendar occupancy" })).toBeVisible();
  await expect(plan).toHaveText(before);
  mode = "occupied";
  await page.getByRole("button", { name: "Generate again" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Could not verify calendar occupancy" })).toHaveCount(0);
  await expect(page.locator('.fc-event:has-text("Remote occupancy")')).toHaveCount(1);
  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByLabel("Proposed plan")).toContainText("1 proposed placements · 0 unmet task requests");
  await expect(page.locator('.fc-event:has-text("Remote occupancy")')).toHaveCount(1);
  expect(traffic.some(entry => entry.url.includes("/events?timeMin=2026-11-09T00") && entry.status === 502)).toBeTruthy();
  expect(traffic.every(entry => entry.method === "GET")).toBeTruthy();
});

test("a confirmed empty GET discards stale in-range remote occupancy but retains pending placements", async ({ page }) => {
  const traffic = await setup(page, () => "empty", { stale: true });
  await page.goto("/");
  await page.getByRole("button", { name: "View next week" }).click();
  await expect(page.locator('.fc-event:has-text("Pending placement")')).toHaveCount(1);
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByLabel("Proposed plan")).toBeVisible();
  await expect(page.locator('.fc-event:has-text("Old remote occupancy")')).toHaveCount(0);
  await expect(page.locator('.fc-event:has-text("Pending placement")')).toHaveCount(1);
  expect(traffic.some(entry => entry.url.includes("/events?timeMin=2026-11-09T00") && entry.status === 200)).toBeTruthy();
  expect(traffic.every(entry => entry.method === "GET")).toBeTruthy();
});

test("transport rejection recovers without reload; remaining Sunday work hours do not show elapsed warning", async ({ page }) => {
  let mode: "transport" | "empty" = "transport";
  const traffic = await setup(page, () => mode, { settings: { workDays: [0], workStartHour: 18, workEndHour: 21 } });
  await page.goto("/");
  await expect(page.getByRole("note")).toHaveCount(0);
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Could not verify calendar occupancy" })).toContainText("Cannot reach the calendar API");
  await expect(page.getByLabel("Proposed plan")).toHaveCount(0);
  mode = "empty";
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByLabel("Proposed plan")).toBeVisible();
  expect(traffic.some(entry => entry.url.includes("/events?timeMin=2026-11-02T00") && entry.status === 0)).toBeTruthy();
});

test("a stalled response body times out as a network error instead of hanging after headers", async () => {
  const previousFetch = globalThis.fetch;
  const previousTimeout = globalThis.setTimeout;
  let aborted = false;
  try {
    // Accelerate only the API's 15-second timer in this isolated Playwright worker.
    globalThis.setTimeout = ((callback: TimerHandler, delay?: number, ...args: unknown[]) =>
      previousTimeout(callback, delay === 15_000 ? 20 : delay, ...args)) as typeof setTimeout;
    globalThis.fetch = (async (_url, init) => {
      const signal = init?.signal;
      return { ok: true, status: 200, json: () => new Promise((_resolve, reject) => {
        signal?.addEventListener("abort", () => { aborted = true; reject(new DOMException("Aborted", "AbortError")); });
      }) } as Response;
    }) as typeof fetch;
    await expect(apiFetch("/events")).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 } satisfies Partial<ApiError>);
    expect(aborted).toBe(true);
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.setTimeout = previousTimeout;
  }
});

test("a delayed exact-week GET cannot publish into another viewed week", async ({ page }) => {
  let hold = false;
  let release!: () => void;
  let started!: () => void;
  const pending = new Promise<void>(resolve => { started = resolve; });
  const gate = new Promise<void>(resolve => { release = resolve; });
  const traffic = await setup(page, () => "fail");
  await page.route("**/api/v1/events?**", async route => {
    if (hold && route.request().url().includes("2026-11-02T00")) {
      started();
      await gate;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
    }
    return route.fulfill({ status: 502, contentType: "application/json",
      body: JSON.stringify({ error: { code: "UPSTREAM", message: "unavailable" } }) });
  });
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("unavailable");
  hold = true;
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await pending;
  await page.getByRole("button", { name: "View next week" }).click();
  release();
  await expect(page.getByLabel("Proposed plan")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Calculate Week" })).toBeEnabled();
  expect(traffic.some(entry => entry.url.includes("/auth/me") && entry.status === 200)).toBeTruthy();
});

test("an expired confirmation needs a fresh GET; changing settings during that read cancels publication", async ({ page }) => {
  let mode: "empty" | "fail" | "hold" = "empty";
  let release!: () => void;
  let started!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const pending = new Promise<void>(resolve => { started = resolve; });
  const traffic = await setup(page, () => mode === "hold" ? "fail" : mode);
  await page.route("**/api/v1/events?**", async route => {
    if (mode === "hold") {
      started();
      await gate;
    }
    return route.fulfill({ status: mode === "fail" ? 502 : 200, contentType: "application/json",
      body: JSON.stringify(mode === "fail" ? { error: { message: "unavailable" } } : { data: [] }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "View next week" }).click();
  await page.getByRole("button", { name: "Calculate Week" }).click();
  const plan = page.getByLabel("Proposed plan");
  await expect(plan).toBeVisible();
  const before = await plan.innerText();
  await page.clock.setFixedTime(new Date(sunday.getTime() + 300_001));
  mode = "fail";
  await page.getByRole("button", { name: "Generate again" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Could not verify calendar occupancy" })).toBeVisible();
  await expect(plan).toHaveText(before);
  mode = "hold";
  await page.getByRole("button", { name: "Generate again" }).click();
  await pending;
  await page.getByRole("button", { name: "Settings", exact: true }).first().click();
  await page.getByRole("dialog", { name: "Settings" }).getByLabel("Max Tasks Per Day").fill("3");
  await page.getByRole("button", { name: "Done" }).click();
  release();
  await expect(page.getByLabel("Proposed plan")).toHaveCount(0);
  mode = "empty";
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByLabel("Proposed plan")).toBeVisible();
  expect(traffic.some(entry => entry.url.includes("/auth/me") && entry.status === 200)).toBeTruthy();
});

test("a delayed account A generation GET cannot certify B or publish A's preview; B recovers with its own GET", async ({ page }) => {
  let account = "A";
  let holding = false;
  let release!: () => void;
  let started!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const pending = new Promise<void>(resolve => { started = resolve; });
  const range = { timeMin: "2026-11-09T00:00:00.000Z", timeMax: "2026-11-16T00:00:00.000Z" };
  const requests: { account: string; range: string }[] = [];
  await page.clock.setFixedTime(sunday);
  await page.addInitScript(() => {
    localStorage.setItem("brkroutnxdle:settings", JSON.stringify({ timezone: "UTC", weekStartDay: 1,
      workDays: [1, 2, 3, 4, 5], workStartHour: 9, workEndHour: 17,
      maxTasksPerDay: 4, shuffleEnabled: false }));
    localStorage.setItem("brkroutnxdle:tasks", JSON.stringify([{
      id: "weekly", title: "Weekly focus", duration: 60, priority: "medium", frequency: 1,
      restrictions: [], isActive: true, createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z",
    }]));
  });
  await page.route("**/api/v1/auth/me", route => route.fulfill({ status: 200,
    contentType: "application/json", body: JSON.stringify({ data: { id: account, email: `${account}@example.com` } }) }));
  await page.route("**/api/v1/events?**", async route => {
    const requestedAccount = account;
    const url = new URL(route.request().url());
    requests.push({ account: requestedAccount, range: url.searchParams.get("timeMin") ?? "" });
    if (requestedAccount === "A" && holding && url.searchParams.get("timeMin") === range.timeMin) {
      started();
      await gate;
    }
    const occupied = requestedAccount === "B" && url.searchParams.get("timeMin") === range.timeMin;
    const data = occupied ? [1, 2, 3, 4, 5].map((day) => ({ id: `B-${day}`,
      title: `B occupied ${day}`, source: "google", isGenerated: false, isAllDay: false,
      start: `2026-11-${String(8 + day).padStart(2, "0")}T09:00:00Z`,
      end: `2026-11-${String(8 + day).padStart(2, "0")}T17:00:00Z` })) : [];
    return route.fulfill({ status: requestedAccount === "A" && !holding ? 502 : 200,
      contentType: "application/json", body: JSON.stringify(requestedAccount === "A" && !holding
        ? { error: { code: "UPSTREAM", message: "unavailable" } } : { data }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "View next week" }).click();
  await expect(page.getByRole("status")).toContainText("unavailable");
  holding = true;
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await pending;
  const activeBefore = await page.evaluate(async () => {
    const url = "/src/services/remoteConfirmation.ts";
    const { activeRemoteAccount } = await import(/* @vite-ignore */ url);
    return activeRemoteAccount();
  });
  expect(activeBefore).toBe("A");
  // Exercise the real account-scoped confirmation boundary while A's GET is pending;
  // the next auth/me resolves B and remounts B's providers on reload.
  await page.evaluate(async () => {
    const url = "/src/services/remoteConfirmation.ts";
    const { setRemoteAccount } = await import(/* @vite-ignore */ url);
    setRemoteAccount("B");
  });
  const oldResponse = page.waitForResponse(response => response.url().includes("/api/v1/events?") &&
    new URL(response.url()).searchParams.get("timeMin") === range.timeMin && response.status() === 200);
  release();
  await oldResponse;
  await expect(page.getByRole("button", { name: "Calculate Week" })).toBeEnabled();
  await expect(page.getByLabel("Proposed plan")).toHaveCount(0);
  const snapshot = await page.evaluate(async (week) => {
    const url = "/src/services/remoteConfirmation.ts";
    const { getRemoteConfirmation } = await import(/* @vite-ignore */ url);
    const confirmed = getRemoteConfirmation(week);
    return { accountId: confirmed.accountId, status: confirmed.status, events: confirmed.events.length };
  }, range);
  expect(snapshot).toMatchObject({ accountId: "B", status: "unconfirmed", events: 0 });
  account = "B";
  await page.reload();
  await page.getByRole("button", { name: "View next week" }).click();
  await expect(page.locator('.fc-event:has-text("B occupied")')).toHaveCount(5);
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByLabel("Proposed plan")).toContainText("0 proposed placements · 1 unmet task requests");
  expect(requests.some(request => request.account === "A" && request.range === range.timeMin)).toBe(true);
  expect(requests.some(request => request.account === "B" && request.range === range.timeMin)).toBe(true);
});
