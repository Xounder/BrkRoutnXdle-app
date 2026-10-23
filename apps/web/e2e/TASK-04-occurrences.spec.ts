import { test, expect } from "@playwright/test";
import { computeDiff } from "../src/services/diffCalculator";
import { confirmRemoteEvent, confirmRemoteEvents, reconcileCalendarEvents } from "../src/services/calendarReconciliation";
import { previewSavePlan, assertPreviewBaseline } from "../src/services/previewSavePlan";
import { generationInputs, isReplaceable, replacementCandidates } from "../src/pages/dashboard/previewSchedule";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import type { GeneratedEvent } from "@brkroutnxdle/domain";

const slot = "2026-10-19T10:00:00.000Z";
const end = "2026-10-19T11:00:00.000Z";
const range = { timeMin: "2026-10-18T00:00:00.000Z", timeMax: "2026-10-25T00:00:00.000Z" };
const remote = (id: string, start = slot, taskId = "task"): CalendarEvent => ({
  id, start, end, taskId, title: "Task", source: "google", isGenerated: true,
  isAllDay: false, isCompleted: false,
});
const desired = (id: string, start = slot): GeneratedEvent => ({
  id, start, end, taskId: "task", completed: false, createdAt: "", updatedAt: "",
});

test("repeated task occurrences match by ID or exact slot, never by task ID alone", () => {
  const one = remote("remote-1");
  const two = remote("remote-2", "2026-10-20T10:00:00.000Z");
  const result = computeDiff([
    desired("remote-1", "2026-10-19T12:00:00.000Z"),
    desired("new-preview-id", two.start),
  ], [one, two], [], { replaceableIds: new Set([one.id, two.id]) });
  expect(result.toCreate).toHaveLength(0);
  expect(result.toUpdate).toEqual([{ id: one.id, start: "2026-10-19T12:00:00.000Z", end }]);
  expect(result.toDelete).toEqual([]);
});

test("pending UUID and unrelated occurrence cannot become a remote update or delete", () => {
  const pending = { ...remote("00000000-0000-4000-8000-000000000001"), source: "brkroutnxdle" as const };
  const unrelated = remote("outside", "2026-11-19T10:00:00.000Z");
  const result = computeDiff([desired(pending.id)], [pending, unrelated], [], {
    replaceableIds: new Set(),
  });
  expect(result.toCreate).toHaveLength(1);
  expect(result.toUpdate).toEqual([]);
  expect(result.toDelete).toEqual([]);
});

test("empty preview deletes only explicitly replaceable remote occurrences", () => {
  const result = computeDiff([], [remote("replace"), remote("unrelated")], [], {
    replaceableIds: new Set(["replace"]),
  });
  expect(result.toDelete).toEqual(["replace"]);
});

test("authoritative empty GET removes known deleted remote while retaining pending and out-of-range", () => {
  const pending = { ...remote("local"), source: "brkroutnxdle" as const };
  const outside = remote("outside", "2026-11-19T10:00:00.000Z");
  expect(reconcileCalendarEvents([remote("deleted"), pending, outside], [], range,
    new Set(["deleted", "outside"]))).toEqual([pending, outside]);
  expect(() => confirmRemoteEvents(undefined)).toThrow(/invalid event list/);
  expect(confirmRemoteEvents([])).toEqual([]);
});

test("partial POST success reconciles by occurrence, not shared task ID", () => {
  const first = desired("local-one");
  const second = desired("local-two", "2026-10-20T10:00:00.000Z");
  const created = remote("created-first");
  const retry = computeDiff([{ ...first, id: created.id }, second], [created], [], { noDelete: true });
  expect(retry.toCreate).toHaveLength(1);
  expect(retry.toCreate[0].start.dateTime).toBe(second.start);
  expect(reconcileCalendarEvents([
    { ...remote(first.id), source: "brkroutnxdle" },
    { ...remote(second.id, second.start), source: "brkroutnxdle" },
  ], [created], range, new Set(), new Set([first.id])).map((event) => event.id))
    .toEqual([second.id, created.id]);
});

test("preview saves pinned manual occurrence alongside proposals without duplicating their slot", () => {
  const pinned = { ...remote("local-pinned"), source: "brkroutnxdle" as const };
  const proposal = desired("proposal", "2026-10-20T10:00:00.000Z");
  const duplicateProposal = desired("duplicate", pinned.start);
  const unrelated = remote("unrelated", "2026-10-21T10:00:00.000Z", "other-task");
  const plan = previewSavePlan([duplicateProposal, proposal], [pinned], [unrelated], range, 0);
  const diff = computeDiff(plan.desired, plan.candidates, [], {
    replaceableIds: plan.replaceableIds, matchableIds: plan.matchableIds,
  });
  expect(plan.desired.map((event) => event.id)).toEqual([pinned.id, proposal.id]);
  expect(diff.toCreate.map((event) => event.start.dateTime)).toEqual([pinned.start, proposal.start]);
  expect(diff.toDelete).toEqual([]);
  expect(plan.savedLocalIds.size).toBe(0);
});

test("preview retry matches pinned slot on confirmed GET and retains its real remote ID", () => {
  const pinned = { ...remote("local-pinned"), source: "brkroutnxdle" as const };
  const confirmed = remote("google-pinned");
  const other = remote("unrelated", "2026-10-21T10:00:00.000Z", "other-task");
  const plan = previewSavePlan([desired("generated", "2026-10-20T10:00:00.000Z")],
    [pinned], [confirmed, other], range, 0);
  const diff = computeDiff(plan.desired, plan.candidates, [], {
    replaceableIds: plan.replaceableIds, matchableIds: plan.matchableIds,
  });
  expect(diff.toCreate).toHaveLength(1);
  expect(diff.toCreate[0].start.dateTime).toBe("2026-10-20T10:00:00.000Z");
  expect(diff.toDelete).toEqual([]);
  expect(plan.savedLocalIds.has(pinned.id)).toBe(true);
  expect(reconcileCalendarEvents([pinned, other], [confirmed, other], range,
    new Set(), plan.savedLocalIds).map((event) => event.id)).toEqual([confirmed.id, other.id]);
});

test("persisted manual pin survives reload and a subsequent empty preview without DELETE or MOVE", () => {
  const local = { ...remote("local-pin"), source: "brkroutnxdle" as const, isPinned: true };
  const saved = { ...local, id: "remote-pin", source: "google" as const };
  const afterReload = confirmRemoteEvents([saved]);
  expect(afterReload[0].isPinned).toBe(true);
  expect(isReplaceable(afterReload[0], range, 0)).toBe(false);
  const plan = previewSavePlan([], afterReload, afterReload, range, 0, new Set());
  const diff = computeDiff(plan.desired, plan.candidates, [], { replaceableIds: plan.replaceableIds });
  expect(diff).toEqual({ toCreate: [], toUpdate: [], toDelete: [] });
  expect(reconcileCalendarEvents([local], afterReload, range, new Set(), new Set([local.id])))
    .toEqual([saved]);
});

test("real app-calendar source becomes confirmed only at API boundary; pending UUID stays local", () => {
  // fetchEvents(..., isBrkCalendar=true) returns this source even for persisted events.
  const appRemote = { ...remote("persisted-generated"), source: "brkroutnxdle" as const,
    isPinned: false };
  const localPending = { ...remote("00000000-0000-4000-8000-000000000001"),
    start: "2026-10-20T10:00:00.000Z", end: "2026-10-20T11:00:00.000Z",
    source: "brkroutnxdle" as const, isPinned: true };
  const [confirmed] = confirmRemoteEvents([appRemote]);
  expect(confirmed.source).toBe("google");
  expect(confirmed.isGenerated).toBe(true);
  expect(isReplaceable(confirmed, range, 0)).toBe(true);
  expect(localPending.source).toBe("brkroutnxdle");
  expect(isReplaceable(localPending, range, 0)).toBe(false);
  expect(generationInputs([], [confirmed, localPending], range, 0).base.map((event) => event.id))
    .toEqual([localPending.id]);
  const snapshot = replacementCandidates([confirmed, localPending], range, 0);
  assertPreviewBaseline(snapshot, confirmRemoteEvents([appRemote]), range,
    { createdIds: new Set(), updated: new Map(), deletedIds: new Set() }, 0);
  const plan = previewSavePlan([], [confirmed, localPending], [confirmed], range, 0,
    new Set(snapshot.map((event) => event.id)));
  const diff = computeDiff(plan.desired, plan.candidates, [], { replaceableIds: plan.replaceableIds });
  expect(diff.toCreate).toHaveLength(1);
  expect(diff.toCreate[0].start.dateTime).toBe(localPending.start);
  expect(diff.toDelete).toEqual([confirmed.id]);
  expect(confirmRemoteEvent({ ...appRemote, id: "post-confirmed", isPinned: true }).isPinned).toBe(true);
  expect(confirmRemoteEvent({ id: "older-post", taskId: "task", summary: "Task",
    start: { dateTime: slot }, end: { dateTime: end } }, "post").start).toBe(slot);
  expect(() => confirmRemoteEvents([{ ...appRemote, start: { dateTime: slot } }]))
    .toThrow(/invalid remote event/);
});

test("authoritative pre-write check rejects added, moved, deleted or pinned remote occurrences", () => {
  const original = remote("original");
  const journal = { createdIds: new Set<string>(), updated: new Map<string, { start: string; end: string }>(),
    deletedIds: new Set<string>() };
  const verify = (fresh: CalendarEvent[]) => assertPreviewBaseline([original], fresh, range, journal, 0);
  expect(() => verify([original])).not.toThrow();
  for (const changed of [
    [original, remote("late", "2026-10-20T10:00:00.000Z")],
    [{ ...original, start: "2026-10-20T10:00:00.000Z" }],
    [{ ...original, isPinned: true }],
    [],
  ]) {
    expect(() => verify(changed)).toThrow(/Calendar changed since preview/);
  }
  expect(replacementCandidates([original], range, 0).map((event) => event.id)).toEqual([original.id]);
});

test("partial writes are journalled, so retry accepts own POST, PATCH and DELETE but rejects third-party writes", () => {
  const first = remote("original");
  const removed = remote("removed", "2026-10-20T10:00:00.000Z");
  const created = remote("created", "2026-10-21T10:00:00.000Z");
  const moved = { ...first, start: "2026-10-22T10:00:00.000Z" };
  const journal = { createdIds: new Set([created.id]),
    updated: new Map([[first.id, { start: moved.start, end: moved.end }]]),
    deletedIds: new Set([removed.id]) };
  expect(() => assertPreviewBaseline([first, removed], [moved, created], range, journal, 0)).not.toThrow();
  expect(() => assertPreviewBaseline([first, removed], [moved, created, remote("external")],
    range, journal, 0)).toThrow(/Calendar changed since preview/);
});

test("failed authoritative save GET never writes even with a pending manual placement", async ({ page }) => {
  let eventGets = 0;
  let writes = 0;
  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/auth/me")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        data: { id: "user", email: "user@example.com", name: "User" },
      }) });
      return;
    }
    if (url.includes("/events")) {
      if (route.request().method() !== "GET") writes++;
      else eventGets++;
      await route.fulfill({ status: eventGets > 1 ? 503 : 200,
        contentType: "application/json", body: eventGets > 1
          ? JSON.stringify({ error: { code: "UNAVAILABLE", message: "Calendar unavailable" } })
          : JSON.stringify({ data: [] }),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
  });
  await page.goto("/");
  await expect(page.locator(".fc-view-harness")).toBeVisible();
  await page.locator(".fc-timegrid-body").first().click({ position: { x: 100, y: 8 * 60 + 30 } });
  await page.getByRole("button", { name: "Create Task" }).click();
  await page.locator("#task-name").fill("Pending occurrence");
  await page.locator("#task-duration").selectOption("60");
  await page.locator('button[type="submit"]:has-text("Create Task")').click();
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect(page.getByText(/Calendar unavailable/)).toBeVisible();
  expect(eventGets).toBeGreaterThan(1);
  expect(writes).toBe(0);
});

test("manual pin POST survives fresh GET, reload, generation and next preview save", async ({ page }) => {
  const saved: CalendarEvent[] = [];
  const writes: string[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/auth/me")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        data: { id: "user", email: "user@example.com", name: "User" },
      }) });
      return;
    }
    if (url.includes("/events")) {
      const method = route.request().method();
      if (method === "POST") {
        const body = route.request().postDataJSON();
        writes.push(`POST:${String(body.isPinned)}`);
        saved.push({ id: "google-pin", title: body.summary, taskId: body.taskId,
          start: body.start.dateTime, end: body.end.dateTime, isPinned: body.isPinned,
          source: "brkroutnxdle", isAllDay: false, isGenerated: true, isCompleted: false });
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: saved[0] }) });
        return;
      }
      if (method !== "GET") writes.push(`${method}:${url}`);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        data: method === "GET" ? saved : { success: true },
      }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
  });
  await page.goto("/");
  await expect(page.locator(".fc-view-harness")).toBeVisible();
  await page.locator(".fc-timegrid-body").first().click({ position: { x: 100, y: 8 * 60 + 30 } });
  await page.getByRole("button", { name: "Create Task" }).click();
  await page.locator("#task-name").fill("Manual pin");
  await page.locator("#task-duration").selectOption("60");
  await page.locator('button[type="submit"]:has-text("Create Task")').click();
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect(page.getByText("Schedule saved successfully!")).toBeVisible();
  expect(saved).toHaveLength(1);
  expect(saved[0].isPinned).toBe(true);
  await page.reload();
  await expect(page.locator(".fc-view-harness")).toBeVisible();
  await expect(page.locator(".fc-event:has-text('Manual pin')")).toBeVisible();
  await page.getByRole("button", { name: "Calculate Week" }).click();
  await page.getByRole("button", { name: "Save to Calendar" }).click();
  await expect(page.getByText("Schedule saved successfully!")).toBeVisible();
  expect(writes).toEqual(["POST:true"]);
  expect(saved.map((event) => event.id)).toEqual(["google-pin"]);
});
