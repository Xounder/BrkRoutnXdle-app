import { expect, test, type Page } from "@playwright/test";

const KEY = "brkroutnxdle:tasks";
const USER = { id: "tasks-tab-user", email: "tasks@example.com", name: "Tasks User", picture: "" };

async function openTasks(page: Page) {
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await expect(page.getByText(/Tasks \(\d+\)/)).toBeVisible();
}

async function createDefinition(page: Page, title: string) {
  await page.getByRole("button", { name: "+ New" }).click();
  await expect(page.getByText("New Task", { exact: true })).toBeVisible();
  await page.locator("#task-name").fill(title);
  await page.locator("#task-duration").selectOption("60");
  await page.getByRole("button", { name: "Create", exact: true }).click();
}

test.describe("Tasks tab definition creation resilience", () => {
  let writes: string[];

  test.beforeEach(async ({ page }) => {
    writes = [];
    await page.route("**/api/v1/auth/me", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: USER }) }),
    );
    await page.route("**/api/v1/events**", (route) => {
      if (route.request().method() !== "GET") writes.push(route.request().method());
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
    });
  });

  test("creates one definition without a calendar write and retains valid definitions across reload", async ({ page }) => {
    await page.goto("/");
    await openTasks(page);
    await createDefinition(page, "First definition");
    await expect(page.getByText("New Task", { exact: true })).toBeHidden();
    await expect(page.locator('[data-task-drag="true"]')).toHaveCount(1);
    await createDefinition(page, "Second definition");
    await expect(page.locator('[data-task-drag="true"]')).toHaveCount(2);
    await page.reload();
    await openTasks(page);
    await expect(page.locator('[data-task-drag="true"]:has-text("First definition")')).toHaveCount(1);
    await expect(page.locator('[data-task-drag="true"]:has-text("Second definition")')).toHaveCount(1);
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]") as { title: string }[], KEY);
    expect(stored.map((task) => task.title)).toEqual(["First definition", "Second definition"]);
    await expect(page.locator(".fc-event")).toHaveCount(0);
    expect(writes).toEqual([]);
  });

  for (const [name, payload] of [["non-array object", "{}"], ["null", "null"], ["invalid JSON", "{invalid"]] as const) {
    test(`recovers from ${name} without overwriting it before creation`, async ({ page }) => {
      await page.addInitScript(({ key, value }) => {
        if (!sessionStorage.getItem("tasks-regression-seeded")) {
          localStorage.setItem(key, value);
          sessionStorage.setItem("tasks-regression-seeded", "yes");
        }
      }, { key: KEY, value: payload });
      await page.goto("/");
      await openTasks(page);
      await expect(page.getByText("Tasks (0)")).toBeVisible();
      expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe(payload);
      await createDefinition(page, `Recovered ${name}`);
      await expect(page.locator('[data-task-drag="true"]')).toHaveCount(1);
      await page.reload();
      await openTasks(page);
      await expect(page.locator('[data-task-drag="true"]')).toHaveCount(1);
      expect(writes).toEqual([]);
    });
  }

  test("failed write leaves the form and stored state untouched; retry saves exactly once", async ({ page }) => {
    await page.addInitScript((key) => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (name === key && (window as Window & { blockTaskWrites?: boolean }).blockTaskWrites) {
          throw new DOMException("Storage full", "QuotaExceededError");
        }
        return original.call(this, name, value);
      };
    }, KEY);
    await page.goto("/");
    await openTasks(page);
    await page.evaluate(() => { (window as Window & { blockTaskWrites?: boolean }).blockTaskWrites = true; });
    await createDefinition(page, "Retry definition");
    await expect(page.getByText("New Task", { exact: true })).toBeVisible();
    await expect(page.getByText(/Could not save task to this browser/)).toBeVisible();
    await expect(page.locator('[data-task-drag="true"]')).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBeNull();
    await page.evaluate(() => { (window as Window & { blockTaskWrites?: boolean }).blockTaskWrites = false; });
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText("New Task", { exact: true })).toBeHidden();
    await expect(page.locator('[data-task-drag="true"]')).toHaveCount(1);
    await page.reload();
    await openTasks(page);
    await expect(page.locator('[data-task-drag="true"]:has-text("Retry definition")')).toHaveCount(1);
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]") as { title: string }[], KEY);
    expect(stored.map((task) => task.title)).toEqual(["Retry definition"]);
    await expect(page.locator(".fc-event")).toHaveCount(0);
    expect(writes).toEqual([]);
  });
});
