import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeEventInterval } from "./event-interval.js";
import express from "express";
import { createEventHandler, updateEventHandler } from "./events.js";
import { devModeMiddleware, requireAuth } from "../middleware/auth.js";
import { errorHandler } from "../middleware/errorHandler.js";
import type { AddressInfo } from "node:net";
import type { CreateEventPayload } from "@brkroutnxdle/calendar";
import type { CalendarEvent } from "@brkroutnxdle/shared";

test("reported mixed-offset request preserves the intended 60-minute civil interval", () => {
  const interval = normalizeEventInterval("2026-11-03T12:30:00-03:00", "2026-11-03T13:30:00");
  assert.deepEqual(interval, {
    start: { dateTime: "2026-11-03T12:30:00-03:00" },
    end: { dateTime: "2026-11-03T13:30:00-03:00" },
  });
  assert.equal(Date.parse(interval.end.dateTime) - Date.parse(interval.start.dateTime), 3600000);
});

test("explicit offset and named zone remain intact through midnight and DST changes", () => {
  const midnight = normalizeEventInterval(
    { dateTime: "2026-12-31T23:30:00+01:00" },
    { dateTime: "2027-01-01T00:30:00+01:00" },
  );
  assert.equal(Date.parse(midnight.end.dateTime) - Date.parse(midnight.start.dateTime), 3600000);
  const dst = normalizeEventInterval(
    { dateTime: "2026-03-08T01:30:00-05:00", timeZone: "America/New_York" },
    { dateTime: "2026-03-08T03:30:00-04:00", timeZone: "America/New_York" },
  );
  assert.equal(Date.parse(dst.end.dateTime) - Date.parse(dst.start.dateTime), 3600000);
  assert.equal(dst.end.timeZone, "America/New_York");
});

test("named zone resolves unique floating wall times without server-local assumptions", () => {
  const interval = normalizeEventInterval(
    { dateTime: "2026-11-03T12:30:00", timeZone: "America/Sao_Paulo" },
    { dateTime: "2026-11-03T13:30:00", timeZone: "America/Sao_Paulo" },
  );
  assert.equal(interval.start.dateTime, "2026-11-03T12:30:00-03:00");
  assert.equal(interval.end.dateTime, "2026-11-03T13:30:00-03:00");
});

test("invalid dates, zones, gaps, folds and nonpositive ranges fail before any write", () => {
  const bad: Array<[any, any]> = [
    ["", "2026-11-03T13:30:00Z"],
    ["2026-02-29T12:00:00Z", "2026-02-29T13:00:00Z"],
    ["2026-11-03T12:00:00+03:99", "2026-11-03T13:00:00+03:99"],
    ["2026-11-03T12:00:00Z", "2026-11-03T12:00:00Z"],
    ["2026-11-03T13:00:00Z", "2026-11-03T12:00:00Z"],
    ["2026-11-03T12:00:00", "2026-11-03T13:00:00"],
    [{ dateTime: "2026-11-03T12:00:00", timeZone: "Invalid/Zone" }, "2026-11-03T13:00:00Z"],
    [{ dateTime: "2026-03-08T02:30:00", timeZone: "America/New_York" }, "2026-03-08T04:00:00-04:00"],
    [{ dateTime: "2026-11-01T01:30:00", timeZone: "America/New_York" }, "2026-11-01T03:00:00-05:00"],
  ];
  for (const [start, end] of bad) {
    assert.throws(() => normalizeEventInterval(start, end), (error: any) => error.statusCode === 400 && error.code === "VALIDATION_ERROR");
  }
});

test("API forwards reported POST and valid PATCH, and rejects invalid intervals without writes", async () => {
  const inserts: CreateEventPayload[] = [];
  const updates: Array<{ id: string; payload: Partial<CreateEventPayload> }> = [];
  const returned = { id: "event-id", summary: "teste", taskId: "abcb0d4a-aef4-425d-9752-8648afdd0431", isPinned: true } as unknown as CalendarEvent;
  const client = {
    createEvent: async (_token: string, payload: CreateEventPayload) => { inserts.push(payload); return returned; },
    updateEvent: async (_token: string, id: string, payload: Partial<CreateEventPayload>) => {
      updates.push({ id, payload });
      return returned;
    },
  };
  const app = express();
  app.use(express.json(), devModeMiddleware);
  app.post("/api/v1/events", requireAuth, createEventHandler(client));
  app.patch("/api/v1/events/:id", requireAuth, updateEventHandler(client));
  app.use(errorHandler);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  try {
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/events`;
    const headers = { "content-type": "application/json", "x-dev-access-token": "offline-test-token" };
    const request = async (method: string, path: string, body: object) => fetch(url + path, {
      method, headers, body: JSON.stringify(body),
    });
    const created = await request("POST", "", {
      start: "2026-11-03T12:30:00-03:00", end: "2026-11-03T13:30:00", summary: "teste",
      taskId: "abcb0d4a-aef4-425d-9752-8648afdd0431", isPinned: true,
    });
    assert.equal(created.status, 201);
    assert.deepEqual(await created.json(), { success: true, data: returned });
    assert.equal(inserts.length, 1);
    assert.deepEqual(inserts[0], {
      summary: "teste", start: { dateTime: "2026-11-03T12:30:00-03:00" },
      end: { dateTime: "2026-11-03T13:30:00-03:00" }, description: undefined,
      isPinned: true, extendedProperties: { private: { taskId: "abcb0d4a-aef4-425d-9752-8648afdd0431" } },
    });
    assert.equal(Date.parse(inserts[0].end.dateTime) - Date.parse(inserts[0].start.dateTime), 3600000);
    const patched = await request("PATCH", "/event-id", {
      start: "2026-11-03T14:30:00-03:00", end: "2026-11-03T15:30:00", isPinned: false,
    });
    assert.equal(patched.status, 200);
    assert.deepEqual(await patched.json(), { success: true, data: returned });
    assert.deepEqual(updates, [{ id: "event-id", payload: {
      start: { dateTime: "2026-11-03T14:30:00-03:00" },
      end: { dateTime: "2026-11-03T15:30:00-03:00" }, isPinned: false,
    } }]);
    // No summary, description or extended properties are sent in the PATCH;
    // the calendar service can retain existing metadata on its remote merge.
    const cases = [
      { method: "POST", path: "", body: { summary: "invalid", start: "2026-11-03T12:00:00Z", end: "2026-11-03T11:00:00Z" } },
      { method: "PATCH", path: "/event-id", body: { start: "2026-11-03T12:00:00Z", end: "2026-11-03T12:00:00Z" } },
      { method: "PATCH", path: "/event-id", body: { end: "2026-11-03T12:00:00Z" } },
    ];
    for (const entry of cases) {
      const response = await request(entry.method, entry.path, entry.body);
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, "VALIDATION_ERROR");
    }
    assert.equal(inserts.length, 1, "invalid POST must not insert");
    assert.equal(updates.length, 1, "invalid PATCH must not update");
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
