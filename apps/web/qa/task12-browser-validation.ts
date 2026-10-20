/**
 * Permanent browser QA for TASK-12. Run from repository root:
 *   node apps/web/qa/task12-browser-validation.ts
 * Requires installed Playwright Chromium and the workspace dependencies.
 * Starts and closes an isolated Vite server; all auth/API responses are mocked.
 */
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readdir, readFile } from "node:fs/promises";
import { chromium, type Browser, type Page } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";

const webRoot = fileURLToPath(new URL("../", import.meta.url));
const errorMarker = "TASK12_QA_RENDER_ERROR";

async function mockApi(page: Page, authenticated: boolean) {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/auth/google") {
      await route.fulfill({ status: 200, contentType: "text/html", body: "<title>Mock OAuth redirect reached</title>" });
      return;
    }
    if (url.pathname === "/api/v1/auth/me") {
      await route.fulfill({ status: authenticated ? 200 : 401, contentType: "application/json", body: JSON.stringify(
        authenticated
          ? { data: { id: "qa-user", email: "qa@example.test", name: "Browser QA" } }
          : { error: { code: "AUTH_REQUIRED", message: "Mock: unauthenticated" } },
      ) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
  });
}

async function checkLoginAndDev(page: Page, base: string) {
  await mockApi(page, false);
  await page.goto(base);
  await page.getByRole("button", { name: "Login with Google" }).waitFor();
  await page.getByRole("button", { name: "Configure dev mode" }).click();
  const panel = page.getByRole("dialog", { name: "Dev Mode" });
  await panel.getByRole("checkbox", { name: "Enable Dev Mode Bypass" }).check();
  await panel.getByRole("textbox", { name: "OAuth Playground Token" }).fill("qa-fake-token");
  assert.equal(await page.evaluate(() => sessionStorage.getItem("brkroutnxdle:devMode")), "true");
  assert.equal(await page.evaluate(() => sessionStorage.getItem("brkroutnxdle:devToken")), "qa-fake-token");
  await panel.getByRole("button", { name: "Recarregar e aplicar" }).click();
  await page.getByRole("button", { name: "Configure dev mode" }).waitFor();
  await page.getByRole("button", { name: "Configure dev mode" }).click();
  await panel.getByRole("checkbox", { name: "Enable Dev Mode Bypass" }).isChecked().then((checked) => assert.ok(checked));
  assert.equal(await panel.getByRole("textbox", { name: "OAuth Playground Token" }).inputValue(), "qa-fake-token");
  await page.keyboard.press("Escape");
  await panel.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Login with Google" }).click();
  await page.waitForURL("**/api/v1/auth/google");
  assert.equal(await page.title(), "Mock OAuth redirect reached");
  console.log("PASS dev token entry/storage/reopen; login navigates to mocked OAuth endpoint (not Google auth)");
}

async function checkSettings(page: Page, base: string) {
  await mockApi(page, true);
  await page.goto(base);
  await page.getByRole("button", { name: "Settings" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Settings" });
  const timezone = dialog.getByLabel("Timezone");
  assert.equal(await timezone.evaluate((element) => element.tagName), "SELECT");
  const count = await timezone.locator("option").count();
  assert.ok(count >= 400, `Expected 400+ native timezone options, found ${count}`);
  const started = Date.now();
  await timezone.focus();
  await timezone.selectOption("America/New_York");
  assert.ok(Date.now() - started < 5000, "Timezone selection took over 5 seconds");
  await dialog.getByRole("checkbox", { name: "Use 12-hour format (AM/PM)" }).check();
  await dialog.getByRole("button", { name: "Done" }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("brkroutnxdle:settings") ?? "null"));
  assert.equal(saved.timezone, "America/New_York");
  assert.equal(saved.use12h, true);
  await page.reload();
  await page.getByRole("button", { name: "Settings" }).first().click();
  assert.equal(await dialog.getByLabel("Timezone").inputValue(), "America/New_York");
  assert.ok(await dialog.getByRole("checkbox", { name: "Use 12-hour format (AM/PM)" }).isChecked());
  console.log(`PASS native timezone selection (${count} options, responsive); settings saved and persisted after reload`);
}

async function checkBoundary(page: Page, base: string) {
  await mockApi(page, false);
  // In-memory Vite response substitution makes the REAL AppContent throw on render.
  // No application source, config, or test-only production backdoor is changed.
  await page.route(/\/src\/App\.tsx(?:\?.*)?$/, async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const anchor = "function AppContent() {";
    assert.ok(body.includes(anchor), "Vite AppContent module changed; update QA injection anchor");
    await route.fulfill({ response, body: body.replace(anchor,
      `${anchor}\n  if (sessionStorage.getItem("${errorMarker}") === "1") throw new Error("INTERNAL_ERROR: ${errorMarker}");`) });
  });
  await page.goto(base);
  await page.getByRole("button", { name: "Login with Google" }).waitFor();
  await page.evaluate((key) => sessionStorage.setItem(key, "1"), errorMarker);
  await page.reload();
  const alert = page.getByRole("alert");
  await alert.getByText("Oops!").waitFor();
  await alert.getByText("Something went wrong. Please try again.").waitFor();
  // Clear the trigger immediately before the real fallback's retry callback rerenders the subtree.
  await page.evaluate((key) => {
    document.addEventListener("click", (event) => {
      if ((event.target as Element).closest("button")?.textContent?.includes("Try Again")) {
        sessionStorage.removeItem(key);
      }
    }, { capture: true, once: true });
  }, errorMarker);
  await alert.getByRole("button", { name: "Try Again" }).click();
  await page.getByRole("button", { name: "Login with Google" }).waitFor();
  assert.equal(await alert.count(), 0);
  console.log("PASS real render error caught by boundary; UI wrapper retry resets app subtree");
}

async function checkAudit(page: Page, base: string) {
  await mockApi(page, true);
  const savedEvents: Array<{ summary: string; taskId: string; start: { dateTime: string }; end: { dateTime: string } }> = [];
  await page.route("**/api/v1/events", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
      return;
    }
    const payload = route.request().postDataJSON() as (typeof savedEvents)[number];
    savedEvents.push(payload);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: {
      id: `qa-google-${savedEvents.length}`, taskId: payload.taskId, title: payload.summary,
      start: payload.start.dateTime, end: payload.end.dateTime, source: "google", isGenerated: true,
      isCompleted: false, isAllDay: false,
    } }) });
  });
  await page.goto(base);
  await page.locator(".fc-timegrid-slots").waitFor();
  for (const width of [1440, 768, 576, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250); // allow FullCalendar's resize observer to recompute column widths
    assert.equal(await page.locator("aside").count(), 1, `${width}px: expected one aside`);
    assert.equal(await page.getByText(/^Tasks \(\d+\)$/).count(), 1, `${width}px: expected one task panel`);
    const grid = await page.locator(".fc-timegrid-body").first().boundingBox();
    assert.ok(grid && grid.width > 0 && grid.height > 0 && grid.height < 5000, `${width}px: invalid calendar geometry`);
    const geometry = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      main: document.querySelector("main")?.getBoundingClientRect().width,
      host: document.querySelector(".brk-calendar-google")?.getBoundingClientRect().width,
    }));
    assert.ok(geometry.document <= width + 1, `${width}px: document overflows horizontally (${geometry.document}px)`);
    assert.ok(geometry.host && geometry.host <= width + 1, `${width}px: calendar host overflows viewport`);
    console.log(`PASS ${width}px: one aside, one task panel, grid ${grid.width.toFixed(0)}x${grid.height.toFixed(0)}, main ${geometry.main}, host ${geometry.host}, document ${geometry.document}`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const views = page.getByRole("group", { name: "Calendar view" });
  for (const [name, selector] of [["Day", ".fc-timeGridDay-view"], ["Month", ".fc-dayGridMonth-view"], ["Week", ".fc-timeGridWeek-view"]]) {
    await views.getByRole("button", { name, exact: true }).click();
    await page.locator(selector).waitFor();
  }
  await views.getByRole("button", { name: "Day", exact: true }).click();
  await page.locator(".fc-timeGridDay-view").waitFor();
  await page.getByRole("button", { name: "Next period" }).click();
  const futureDay = page.locator(".fc-timegrid-col[data-date]").first();
  const date = await futureDay.getAttribute("data-date");
  assert.ok(date && new Date(`${date}T14:00:00`).getTime() > Date.now(), `Expected a future visible day, got ${date}`);
  const slot = page.locator('.fc-timegrid-slot-lane[data-time="14:00:00"]').first();
  await slot.scrollIntoViewIfNeeded();
  const row = await slot.boundingBox();
  const column = await futureDay.boundingBox();
  assert.ok(row && column, "Future day 14:00 slot must be rendered");
  await page.mouse.click(column.x + column.width / 2, row.y + row.height / 2);
  await page.getByRole("dialog", { name: "Create in this slot" }).waitFor();
  await page.getByRole("button", { name: "Create Task", exact: true }).first().click();
  await page.locator("#task-name").fill("Audit Delete Task");
  await page.locator('button[type="submit"]:has-text("Create Task")').click();
  const event = page.locator(".fc-event").filter({ hasText: "Audit Delete Task" });
  await event.waitFor();
  assert.equal(await event.count(), 1);
  await event.getByRole("button", { name: "Delete Audit Delete Task" }).click();
  await page.getByRole("dialog", { name: "Delete Event" }).getByRole("button", { name: "Delete" }).click();
  await event.waitFor({ state: "detached" });
  console.log("PASS real Day/Month/Week switching; task creation and calendar event delete confirmation");
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: "+ New" }).click();
  const newTask = page.getByRole("dialog", { name: "New Task" });
  await newTask.locator("#task-name").fill("Drag Audit Task");
  await newTask.getByRole("button", { name: "Create", exact: true }).click();
  const card = page.locator('[data-task-drag="true"]').filter({ hasText: "Drag Audit Task" });
  await card.waitFor();
  await card.click();
  const editTask = page.getByRole("dialog", { name: "Edit Task" });
  await editTask.locator("#task-name").fill("Edited Drag Audit Task");
  await editTask.getByRole("button", { name: "Save", exact: true }).click();
  await card.getByText("Edited Drag Audit Task").waitFor();
  const dragged = page.locator(".fc-event").filter({ hasText: "Edited Drag Audit Task" });
  const beforeDrop = await dragged.count();
  const taskId = await card.getAttribute("data-task-id");
  assert.ok(taskId, "Dragged card must retain its task identity");
  const dropSlot = page.locator('.fc-timegrid-slot-lane[data-time="15:00:00"]').first();
  await dropSlot.scrollIntoViewIfNeeded();
  const targetRow = await dropSlot.boundingBox();
  const targetColumn = await futureDay.boundingBox();
  const origin = await card.boundingBox();
  assert.ok(targetRow && targetColumn && origin, "Drag source and future slot must be visible");
  await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetColumn.x + targetColumn.width / 2, targetRow.y + targetRow.height / 2, { steps: 15 });
  await page.mouse.up();
  const dropped = futureDay.locator(".fc-event").filter({ hasText: "Edited Drag Audit Task" });
  await dropped.waitFor();
  assert.ok(await dragged.count() > beforeDrop, `External task drag should add a visible occurrence (before: ${beforeDrop})`);
  assert.match(await dropped.innerText(), /15:00|3:00/, "Dragged task should occupy the chosen 15:00 future-day slot");
  assert.equal(await card.getAttribute("data-task-id"), taskId, "Dragging must not replace the source task");
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await page.getByRole("status").getByText("Schedule saved successfully!").waitFor();
  assert.ok(savedEvents.some((entry) => entry.taskId === taskId && entry.summary === "Edited Drag Audit Task" &&
    entry.start.dateTime.startsWith(date!) && entry.start.dateTime.includes("T15:")),
  "Save must send the dropped task identity and future 15:00 start to the mocked API");
  console.log(`PASS future-day task drag and mocked API save (${savedEvents.length} POST operations)`);
  await card.getByRole("button", { name: "Delete task" }).click();
  await card.waitFor({ state: "detached" });
  console.log("PASS sidebar task create/edit/delete");
  await page.getByRole("button", { name: /Calculate/i }).first().click();
  await page.getByText(/^Preview: \d+ events$/).waitFor();
  await page.getByRole("button", { name: "Discard" }).click();
  await page.getByText(/^Preview: \d+ events$/).waitFor({ state: "detached" });
  console.log("PASS schedule preview and discard");
  await page.setViewportSize({ width: 375, height: 900 });
  await page.getByRole("button", { name: "Next period" }).click();
  const mobileDay = page.locator(".fc-timegrid-col[data-date]").first();
  const mobileDate = await mobileDay.getAttribute("data-date");
  assert.ok(mobileDate && new Date(`${mobileDate}T14:00:00`).getTime() > Date.now());
  const mobileSlot = page.locator('.fc-timegrid-slot-lane[data-time="14:00:00"]').first();
  await mobileSlot.scrollIntoViewIfNeeded();
  const mobileRow = await mobileSlot.boundingBox();
  const mobileColumn = await mobileDay.boundingBox();
  assert.ok(mobileRow && mobileColumn && mobileColumn.width <= 375);
  await page.mouse.click(mobileColumn.x + mobileColumn.width / 2, mobileRow.y + mobileRow.height / 2);
  const mobileDialog = page.getByRole("dialog", { name: "Create in this slot" });
  await mobileDialog.waitFor();
  await mobileDialog.getByRole("button", { name: "Cancel" }).click();
  await mobileDialog.waitFor({ state: "detached" });
  console.log(`PASS 375px future ${mobileDate} slot creation dialog and cancellation`);
  for (const tier of ["light", "dark"]) {
    await page.locator("html").evaluate((element, value) => element.setAttribute("data-mantine-color-scheme", value), tier);
    const pairs = await page.evaluate(() => {
      const host = document.querySelector(".brk-calendar-google .fc")!;
      const probe = document.createElement("div");
      host.append(probe);
      const channel = (value: string) => {
        probe.style.backgroundColor = value;
        const computed = getComputedStyle(probe).backgroundColor;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = computed;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };
      const luminance = (c: number[]) => c.map((v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      const contrast = (a: number[], b: number[]) => {
        const x = luminance(a), y = luminance(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      const background = channel("var(--brk-bg-raised)");
      const text = channel("var(--brk-text-on-brand)");
      const rows = ["generated", "external", "preview", "blocked"].map((name) => {
        const fill = channel(`var(--brk-event-${name})`);
        return { name, fill, textRatio: contrast(fill, text), boundaryRatio: contrast(fill, background) };
      });
      const brand = channel("var(--brk-accent-brand)");
      rows.push({ name: "brand", fill: brand, textRatio: contrast(brand, text), boundaryRatio: contrast(brand, background) });
      probe.remove();
      return rows;
    });
    for (const row of pairs) {
      console.log(`${tier} ${row.name} rgb(${row.fill.join(",")}) text ${row.textRatio.toFixed(2)}:1 boundary ${row.boundaryRatio.toFixed(2)}:1`);
      assert.ok(row.textRatio >= 4.5, `${tier}/${row.name}: text below 4.5`);
      assert.ok(row.boundaryRatio >= 3, `${tier}/${row.name}: boundary below 3`);
    }
  }
}

async function checkLineCaps() {
  const roots = [new URL("../src/", import.meta.url), new URL("../../../packages/ui/src/", import.meta.url)];
  let total = 0;
  const offenders: string[] = [];
  async function walk(directory: URL) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const target = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
      if (entry.isDirectory()) await walk(target);
      else {
        const lines = (await readFile(target, "utf8")).split(/\r?\n/).length;
        total++;
        console.log(`LINES ${lines} ${fileURLToPath(target)}`);
        if (lines > 400) offenders.push(`${fileURLToPath(target)}: ${lines}`);
      }
    }
  }
  for (const root of roots) await walk(root);
  assert.deepEqual(offenders, [], `Over 400 lines: ${offenders.join("; ")}`);
  console.log(`PASS ${total} source files at or below 400 lines`);
}

let server: ViteDevServer | undefined;
let browser: Browser | undefined;
try {
  await checkLineCaps();
  server = await createServer({ root: webRoot, configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
    server: { host: "127.0.0.1", port: 0, strictPort: false } });
  await server.listen();
  const address = server.httpServer?.address();
  assert.ok(address && typeof address !== "string", "Vite did not expose a TCP port");
  const base = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ headless: true });
  for (const check of [checkLoginAndDev, checkSettings, checkBoundary, checkAudit]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    try {
      await check(await context.newPage(), base);
    } finally {
      await context.close();
    }
  }
} catch (error) {
  console.error("TASK-12 browser QA FAILED:", error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await server?.close();
}
