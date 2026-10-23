import { test, expect } from "@playwright/test";
import type { CalendarEvent, Task } from "@brkroutnxdle/shared";
import type { GeneratedEvent } from "@brkroutnxdle/domain";
import { DEFAULT_SETTINGS } from "@brkroutnxdle/shared";
import { generateSchedule } from "@brkroutnxdle/domain";
import { generationInputs, previewOverlay, replacementCandidates,
  sameReplacementBaseline, viewedWeek } from "../src/pages/dashboard/previewSchedule";

const range = { timeMin: "2026-11-02T00:00:00.000Z", timeMax: "2026-11-09T00:00:00.000Z" };
const event = (id: string, source: CalendarEvent["source"], start = "2026-11-03T10:00:00.000Z"):
  CalendarEvent => ({ id, taskId: "task", title: "Reading", start, end: "2026-11-03T11:00:00.000Z",
    source, isGenerated: true, isCompleted: false, isAllDay: false });
const proposal = (id: string, start = "2026-11-04T10:00:00.000Z"): GeneratedEvent => ({
  id, taskId: "task", start, end: start === "2026-11-04T10:00:00.000Z"
    ? "2026-11-04T11:00:00.000Z" : "2026-11-03T11:00:00.000Z",
  completed: false, createdAt: "", updatedAt: "",
});

test("viewed civil week resolves in selected timezone through DST and week start", () => {
  expect(viewedWeek(new Date(2026, 10, 4), "America/New_York", 0)).toEqual({
    timeMin: "2026-11-01T04:00:00.000Z", timeMax: "2026-11-08T05:00:00.000Z",
  });
  expect(viewedWeek(new Date(2026, 10, 4), "Asia/Tokyo", 1)).toEqual({
    timeMin: "2026-11-01T15:00:00.000Z", timeMax: "2026-11-08T15:00:00.000Z",
  });
});

test("preview displaces only replaceable occurrences without altering rollback base", () => {
  const original = [event("remote", "google"), event("pending", "brkroutnxdle",
    "2026-11-03T12:00:00.000Z"), { ...event("completed", "google"), isCompleted: true },
    { ...event("external", "google"), isGenerated: false }];
  const tasks = [{ id: "task", frequency: 2, isActive: true }] as Task[];
  const inputs = generationInputs(tasks, original, range, Date.parse("2026-10-01"));
  expect(inputs.base.map(e => e.id)).toEqual(["pending", "completed", "external"]);
  expect(inputs.tasks).toHaveLength(0);
  const overlay = previewOverlay(original, [proposal("first"), proposal("duplicate"),
    proposal("completed", "2026-11-03T10:00:00.000Z")], range, Date.parse("2026-10-01"));
  expect(overlay.base.map(e => e.id)).toEqual(["pending", "completed", "external"]);
  expect(overlay.proposals.map(e => e.id)).toEqual(["first"]);
  expect(original.map(e => e.id)).toEqual(["remote", "pending", "completed", "external"]);
});

test("saved pinned remote survives refresh, occupies its slot, and consumes one regeneration occurrence", () => {
  const task = { id: "task", title: "Reading", frequency: 2, duration: 60,
    priority: "medium", isActive: true, restrictions: [], gapDays: 1, allowSameDay: false,
    createdAt: "", updatedAt: "" } as Task;
  const saved = { ...event("server-pinned", "google"), isPinned: true };
  const old = event("server-auto", "google", "2026-11-04T10:00:00.000Z");
  const refreshed = [{ ...saved }, { ...old }];
  const inputs = generationInputs([task], refreshed, range, Date.parse("2026-10-01"));
  expect(inputs.base.map(item => item.id)).toEqual(["server-pinned"]);
  expect(inputs.tasks.map(item => item.frequency)).toEqual([1]);
  const generated = generateSchedule(inputs.tasks, [], inputs.base,
    { ...DEFAULT_SETTINGS, timezone: "UTC" }, undefined, { targetWeekStart: range.timeMin });
  expect(generated.generatedEvents).toHaveLength(1);
  expect(generated.generatedEvents[0].start).not.toBe(saved.start);
  const view = previewOverlay(refreshed, generated.generatedEvents, range, Date.parse("2026-10-01"));
  expect(view.base.map(item => item.id)).toEqual([saved.id]);
  expect(view.proposals).toHaveLength(1);
  expect(replacementCandidates(refreshed, range, Date.parse("2026-10-01"))
    .map(item => item.id)).toEqual([old.id]);
  expect(refreshed).toEqual([saved, old]);
});

test("replaceable baseline copies full remote identity and detects additions, moves and new pins", () => {
  const original = event("old", "google");
  const input = [original];
  const baseline = replacementCandidates(input, range, Date.parse("2026-10-01"));
  original.start = "2026-11-03T12:00:00.000Z";
  expect(baseline[0].start).toBe("2026-11-03T10:00:00.000Z");
  expect(sameReplacementBaseline(baseline, replacementCandidates(input, range,
    Date.parse("2026-10-01")))).toBe(false);
  expect(sameReplacementBaseline(baseline, replacementCandidates([event("old", "google"),
    event("new", "google")], range, Date.parse("2026-10-01")))).toBe(false);
  expect(sameReplacementBaseline(baseline, replacementCandidates([{
    ...event("old", "google"), isPinned: true,
  }], range, Date.parse("2026-10-01")))).toBe(false);
  expect(sameReplacementBaseline(baseline, replacementCandidates([event("old", "google")],
    range, Date.parse("2026-10-01")))).toBe(true);
  const refreshed = [event("old", "google"), event("new", "google")];
  const view = previewOverlay(refreshed, [proposal("suggestion")], range,
    Date.parse("2026-10-01"), baseline);
  expect(view.base.map(item => item.id)).toEqual(["new"]);
  expect(view.proposals.map(item => item.id)).toEqual(["suggestion"]);
});

test("navigating a viewed week clears preview, and no-alternative retains the prior proposals", async ({ page }) => {
  await page.route("**/api/v1/**", async route => {
    const url = route.request().url();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data:
      url.includes("/auth/me") ? { id: "user", email: "user@example.com", name: "User" } : [] }) });
  });
  await page.addInitScript(() => {
    localStorage.setItem("brkroutnxdle:tasks", JSON.stringify([{ id: "preview-task", title: "Preview reading",
      duration: 60, priority: "medium", frequency: 1, gapDays: 1, allowSameDay: false,
      restrictions: [], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]));
  });
  await page.goto("/");
  await expect(page.locator(".fc-view-harness")).toBeVisible();
  await page.getByRole("button", { name: "Next period" }).click();
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByText("Preview: 1 events")).toBeVisible();
  await expect(page.locator(".fc-event:has-text('Preview reading')")).toHaveCount(1);
  await page.getByRole("button", { name: "Generate Again" }).click();
  await expect(page.locator(".fc-event:has-text('Preview reading')")).toHaveCount(1);
  await page.getByRole("button", { name: "Next period" }).click();
  await expect(page.getByRole("button", { name: "Calculate Week" })).toBeVisible();
  await page.getByRole("button", { name: "Previous period" }).click();
  await expect(page.locator(".fc-event:has-text('Preview reading')")).toHaveCount(0);
});

test("impossible constraints report no alternative without replacing the existing preview", async ({ page }) => {
  await page.route("**/api/v1/**", async route => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data:
      route.request().url().includes("/auth/me")
        ? { id: "user", email: "user@example.com", name: "User" } : [] }) });
  });
  await page.addInitScript(() => {
    localStorage.setItem("brkroutnxdle:tasks", JSON.stringify([{ id: "impossible", title: "Impossible task",
      duration: 9000, priority: "medium", frequency: 1, restrictions: [], isActive: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]));
  });
  await page.goto("/");
  await expect(page.locator(".fc-view-harness")).toBeVisible();
  await page.getByRole("button", { name: "Next period" }).click();
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await expect(page.getByText("Preview: 0 events")).toBeVisible();
  await expect(page.getByText(/Some occurrences could not be placed/)).toBeVisible();
  await page.getByRole("button", { name: "Generate Again" }).click();
  await expect(page.getByRole("alert").getByText(/No different allocation found/)).toBeVisible();
  await expect(page.getByText("Preview: 0 events")).toBeVisible();
});
