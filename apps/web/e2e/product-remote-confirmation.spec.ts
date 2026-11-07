import { test, expect } from "@playwright/test";
import { api } from "../src/services/api";
import { getRemoteConfirmation, invalidateRemoteConfirmation, readRemoteCalendar,
  setRemoteAccount, beginRemoteMutation, CONFIRMATION_TTL_MS } from "../src/services/remoteConfirmation";

test("qualified snapshot expires, rejects invalid payload and ignores stale mutation/account reads", async () => {
  const originalGet = api.get;
  const originalNow = Date.now;
  const range = { timeMin: "2026-11-02T00:00:00.000Z", timeMax: "2026-11-09T00:00:00.000Z" };
  let clock = originalNow();
  let release: ((value: unknown) => void) | undefined;
  try {
    Date.now = () => clock;
    setRemoteAccount("unit-A");
    expect(getRemoteConfirmation(range).status).toBe("unconfirmed");
    api.get = async <T>() => [] as T;
    await readRemoteCalendar(range, "unit-A");
    expect(getRemoteConfirmation(range)).toMatchObject({ status: "confirmed", events: [], accountId: "unit-A" });
    clock += CONFIRMATION_TTL_MS + 1;
    expect(getRemoteConfirmation(range)).toMatchObject({ status: "unconfirmed", reason: "expired", events: [] });
    api.get = async <T>() => [{ id: "invalid", start: "not-a-date", end: "2026-11-03T00:00:00Z",
      source: "google" }] as T;
    await expect(readRemoteCalendar(range, "unit-A")).rejects.toThrow("invalid event interval");
    expect(getRemoteConfirmation(range)).toMatchObject({ status: "unconfirmed", reason: "failed", events: [] });
    api.get = async <T>() => ({ incomplete: true }) as T;
    await expect(readRemoteCalendar(range, "unit-A")).rejects.toThrow("invalid event list");
    const endMutation = beginRemoteMutation();
    api.get = async <T>() => [event("During write")] as T;
    expect(await readRemoteCalendar(range, "unit-A")).toBeNull();
    expect(getRemoteConfirmation(range).reason).toBe("mutation");
    endMutation();
    await readRemoteCalendar(range, "unit-A");
    expect(getRemoteConfirmation(range)).toMatchObject({ status: "confirmed", events: [event("During write")] });
    api.get = async <T>() => new Promise<T>(resolve => { release = resolve as (value: unknown) => void; });
    const old = readRemoteCalendar(range, "unit-A");
    invalidateRemoteConfirmation();
    release?.([event("Old read")]);
    expect(await old).toBeNull();
    expect(getRemoteConfirmation(range).status).toBe("unconfirmed");
    const accountRead = readRemoteCalendar(range, "unit-A");
    setRemoteAccount("unit-B");
    release?.([event("A secret")]);
    expect(await accountRead).toBeNull();
    expect(getRemoteConfirmation(range)).toMatchObject({ status: "unconfirmed", accountId: "unit-B", events: [] });
  } finally {
    api.get = originalGet;
    Date.now = originalNow;
    setRemoteAccount(null);
  }
});

const start = new Date();
start.setHours(11, 0, 0, 0);
const end = new Date(start.getTime() + 3_600_000);
const event = (id: string) => ({ id, title: id, start: start.toISOString(), end: end.toISOString(),
  source: "google", isGenerated: false, isCompleted: false, isAllDay: false });

test("account switch isolates stored events and ignores a delayed previous-account read", async ({ page }) => {
  let account = "A";
  let release: (() => void) | undefined;
  let started: (() => void) | undefined;
  const pending = new Promise<void>(resolve => { started = resolve; });
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/v1/auth/me", route => route.fulfill({ status: 200,
    contentType: "application/json", body: JSON.stringify({ data: { id: account, email: `${account}@example.com` } }) }));
  await page.route("**/api/v1/events?**", async route => {
    const requestAccount = account;
    if (requestAccount === "A") { started?.(); await held; }
    await route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ data: [event(requestAccount === "A" ? "A private event" : "B event")] }) });
  });
  await page.goto("/");
  await pending;
  account = "B";
  await page.reload();
  await expect(page.locator(".fc-event:has-text('B event')")).toHaveCount(1);
  release?.();
  await expect(page.locator(".fc-event:has-text('A private event')")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("brkroutnxdle:events:A"))).toBeNull();
});

test("invalid stored events fail closed, while a valid empty GET and failed refresh preserve local account scope", async ({ page }) => {
  let failed = false;
  let gets = 0;
  await page.addInitScript(() => {
    localStorage.setItem("brkroutnxdle:events:other", JSON.stringify([{
      id: "Other private event", title: "Other private event", start: new Date().toISOString(),
      end: new Date(Date.now() + 3_600_000).toISOString(), source: "google",
    }]));
    localStorage.setItem("brkroutnxdle:events:current", "not json");
  });
  await page.route("**/api/v1/auth/me", route => route.fulfill({ status: 200,
    contentType: "application/json", body: JSON.stringify({ data: { id: "current", email: "current@example.com" } }) }));
  await page.route("**/api/v1/events?**", route => {
    gets++;
    return route.fulfill({ status: failed ? 502 : 200, contentType: "application/json",
      body: JSON.stringify(failed ? { error: { code: "UPSTREAM", message: "unavailable" } } : { data: [] }) });
  });
  await page.goto("/");
  await expect(page.locator(".fc-view-harness")).toBeVisible();
  expect(gets).toBeGreaterThan(0);
  await expect(page.locator(".fc-event:has-text('Other private event')")).toHaveCount(0);
  failed = true;
  await page.getByRole("button", { name: /Refresh/ }).click();
  await expect(page.getByRole("status")).toContainText("temporarily unavailable");
  expect(gets).toBeGreaterThan(1);
});

test("partial save keeps its POST retry journal when the follow-up GET fails", async ({ page }) => {
  let gets = 0;
  let posts = 0;
  let remoteVisible = false;
  let created: Record<string, unknown> | null = null;
  await page.route("**/api/v1/auth/me", route => route.fulfill({ status: 200,
    contentType: "application/json", body: JSON.stringify({ data: { id: "retry-user", email: "retry@example.com" } }) }));
  await page.route("**/api/v1/events**", route => {
    const method = route.request().method();
    if (method === "GET") {
      gets++;
      return route.fulfill({ status: gets === 3 ? 502 : 200, contentType: "application/json",
        body: JSON.stringify(gets === 3 ? { error: { code: "UPSTREAM", message: "unavailable" } } :
          { data: remoteVisible && created ? [created] : [] }) });
    }
    if (method === "POST") {
      posts++;
      const payload = route.request().postDataJSON();
      created = { ...payload, id: "remote-post-id", source: "google", isGenerated: true,
        start: payload.start.dateTime, end: payload.end.dateTime };
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ data: created }) });
    }
    return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { message: "Unexpected write" } }) });
  });
  await page.goto("/");
  await expect(page.locator(".fc-timegrid-slots")).toBeVisible();
  const grid = page.locator(".fc-timegrid-body").first();
  await grid.click({ position: { x: 100, y: 8 * 60 + 30 } });
  await expect(page.getByText("Create in this slot")).toBeVisible();
  await page.getByRole("button", { name: "Create Task" }).click();
  await page.locator("#task-name").fill("Retry placement");
  await page.locator("#task-duration").selectOption("60");
  await page.locator('button[type="submit"]:has-text("Create Task")').click();
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByText(/Preview:/)).toBeVisible();
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect(page.getByText(/Partially saved \(1 writes\)/)).toBeVisible();
  expect(posts).toBe(1);
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect(page.getByText(/pending remote confirmation/)).toBeVisible();
  await expect(page.getByText(/Preview:/)).toBeVisible();
  await expect(page.getByLabel("Saved weekly review")).toContainText("Not confirmed");
  expect(posts).toBe(1);
  remoteVisible = true;
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect(page.getByText("Schedule saved successfully!")).toBeVisible();
  expect(posts).toBe(1);
  expect(gets).toBeGreaterThanOrEqual(5);
});

test("delayed account A POST cannot publish save success or invalidate B", async ({ page }) => {
  let account = "A";
  let release!: () => void;
  let started!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; });
  const posted = new Promise<void>(resolve => { started = resolve; });
  await page.route("**/api/v1/auth/me", route => route.fulfill({ status: 200, contentType: "application/json",
    body: JSON.stringify({ data: { id: account, email: `${account}@example.com` } }) }));
  await page.route("**/api/v1/events**", async route => {
    if (route.request().method() === "POST") {
      started();
      await hold;
      const payload = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ data: { ...payload, id: "A-remote", source: "google", isGenerated: true } }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
  });
  await page.goto("/");
  await page.locator(".fc-timegrid-body").first().click({ position: { x: 100, y: 8 * 60 + 30 } });
  await page.getByRole("button", { name: "Create Task", exact: true }).click();
  await page.locator("#task-name").fill("A pending placement");
  await page.locator('button[type="submit"]:has-text("Create Task")').click();
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await posted;
  account = "B";
  await page.reload();
  await expect(page.getByLabel("Saved weekly review")).toContainText("No saved generated occurrences");
  release();
  await expect(page.getByLabel("Saved weekly review")).toContainText("No saved generated occurrences");
  await expect(page.getByText("Schedule saved successfully!")).toHaveCount(0);
  await expect(page.getByLabel("Saved weekly review")).not.toContainText("A-remote");
});

test("confirmed manual POST releases its original local journal key before a later remote deletion", async ({ page }) => {
  let posts = 0;
  const created: Record<string, unknown>[] = [];
  let served: Record<string, unknown>[] = [];
  await page.route("**/api/v1/auth/me", route => route.fulfill({ status: 200,
    contentType: "application/json", body: JSON.stringify({ data: { id: "manual-retry", email: "manual@example.com" } }) }));
  await page.route("**/api/v1/events**", route => {
    if (route.request().method() === "GET") return route.fulfill({ status: 200,
      contentType: "application/json", body: JSON.stringify({ data: served }) });
    if (route.request().method() === "POST") {
      posts++;
      const payload = route.request().postDataJSON();
      const event = { ...payload, id: `confirmed-${posts}`,
        title: posts === 1 ? "First manual placement" : "Second manual placement",
        source: "google", isGenerated: true,
        isCompleted: false, start: payload.start.dateTime, end: payload.end.dateTime };
      created.push(event);
      if (posts === 2) served = [event];
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: event }) });
    }
    return route.fulfill({ status: 500, contentType: "application/json",
      body: JSON.stringify({ error: { message: "Unexpected write" } }) });
  });
  await page.goto("/");
  await expect(page.locator(".fc-timegrid-body")).toBeVisible();
  const grid = page.locator(".fc-timegrid-body").first();
  await grid.click({ position: { x: 100, y: 8 * 60 + 30 } });
  await page.getByRole("button", { name: "Create Task", exact: true }).click();
  await page.locator("#task-name").fill("First manual placement");
  await page.locator('button[type="submit"]:has-text("Create Task")').click();
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect(page.getByText(/pending remote confirmation/)).toBeVisible();
  expect(posts).toBe(1);
  served = [created[0]];
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect(page.getByText("Schedule saved successfully!")).toBeVisible();
  expect(posts).toBe(1);
  served = []; // The previously confirmed occurrence is deleted remotely.
  await page.getByRole("button", { name: /Refresh/ }).click();
  await expect(page.getByLabel("Saved weekly review")).toContainText("No saved generated occurrences");
  await grid.click({ position: { x: 100, y: 7 * 60 + 30 } });
  await page.getByRole("button", { name: "Create Task", exact: true }).click();
  await page.locator("#task-name").fill("Second manual placement");
  await page.locator('button[type="submit"]:has-text("Create Task")').click();
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect(page.getByLabel("Saved weekly review")).toContainText("Second manual placement");
  await expect(page.getByLabel("Saved weekly review")).toContainText("0 of 1 saved generated occurrences completed");
  await expect(page.getByLabel("Saved weekly review")).not.toContainText("First manual placement");
  await expect(page.getByText(/pending remote confirmation/)).toHaveCount(0);
  expect(posts).toBe(2);
  expect(created.map(event => event.id)).toEqual(["confirmed-1", "confirmed-2"]);
});
