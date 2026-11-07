import { expect, test } from "@playwright/test";

test("preview reports factual shortfalls for duplicate names without saving", async ({ page }) => {
  const writes: string[] = [];
  await page.route("**/api/v1/**", async route => {
    if (route.request().method() !== "GET") writes.push(route.request().url());
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data:
      route.request().url().includes("/auth/me")
        ? { id: "user", email: "user@example.com", name: "User" } : [] }) });
  });
  await page.addInitScript(() => {
    localStorage.setItem("brkroutnxdle:tasks", JSON.stringify(["first", "second"].map(id => ({
      id, title: "Same title", duration: 9000, priority: "medium", frequency: 1,
      restrictions: [], isActive: true, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))));
  });

  await page.goto("/");
  await expect(page.locator(".fc-view-harness")).toBeVisible();
  await page.getByRole("button", { name: "Next period" }).click();
  await page.getByRole("button", { name: "Calculate Week" }).click();

  await expect(page.getByText("Same title (task ID: first)")).toBeVisible();
  await expect(page.getByText("Same title (task ID: second)")).toBeVisible();
  await expect(page.getByText("0 of 1 occurrences allocated; 1 not placed.")).toHaveCount(2);
  await expect(page.getByText(/precise cause is unknown from these counts/)).toBeVisible();
  await expect(page.getByText(/saving to your calendar requires an explicit action/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit task Same title (ID: first)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit task Same title (ID: second)" })).toBeVisible();
  for (const name of ["Review or edit blocks", "Open settings", "Regenerate preview"]) {
    await expect(page.getByRole("button", { name })).toBeVisible();
  }
  expect(writes).toEqual([]);

  await page.setViewportSize({ width: 760, height: 700 });
  await page.getByRole("button", { name: "Review or edit blocks" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Review blocked slots" })).toContainText("No blocked slots yet");
  await expect(page.getByRole("dialog", { name: "Review blocked slots" }).getByRole("button", { name: "+ Block" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Regenerate preview" }).click();
  await expect(page.getByText(/No different allocation found/)).toBeVisible();
  expect(writes).toEqual([]);

  await page.getByRole("button", { name: "Dismiss allocation warning" }).click();
  await expect(page.getByText(/precise cause is unknown from these counts/)).toHaveCount(0);
  expect(writes).toEqual([]);
});

test("task-ID edit invalidates stale shortfalls without writing a calendar event", async ({ page }) => {
  const writes: string[] = [];
  await page.route("**/api/v1/**", route => {
    if (route.request().method() !== "GET") writes.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data:
      route.request().url().includes("/auth/me") ? { id: "shortfall", email: "shortfall@example.com" } : [] }) });
  });
  await page.addInitScript(() => localStorage.setItem("brkroutnxdle:tasks", JSON.stringify([{
    id: "target", title: "Specific task", duration: 9000, priority: "medium", frequency: 1,
    restrictions: [], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }])));
  await page.goto("/");
  await page.getByRole("button", { name: "Next period" }).click();
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByRole("button", { name: "Edit task Specific task (ID: target)" })).toBeVisible();
  await page.getByRole("button", { name: "Edit task Specific task (ID: target)" }).click();
  await expect(page.getByRole("dialog", { name: "Edit Task" })).toBeVisible();
  await page.locator("#task-name").fill("Revised task");
  await page.locator("#task-duration").selectOption("60");
  await page.getByRole("dialog", { name: "Edit Task" }).getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Specific task (task ID: target)")).toHaveCount(0);
  await expect(page.getByLabel("Proposed plan")).toHaveCount(0);
  await expect(page.getByLabel("First-use guide")).toContainText("Calculate this week");
  expect(writes).toEqual([]);
});
