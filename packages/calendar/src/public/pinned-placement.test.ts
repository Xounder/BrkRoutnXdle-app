import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearCalendarIdCache, createEvent, fetchEvents, updateEvent } from "./operations.js";
import type { GoogleCalendarEvent } from "../internal/types.js";

const mock = vi.hoisted(() => ({
  listCalendars: vi.fn(),
  insert: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
}));

vi.mock("googleapis", () => ({
  google: {
    auth: { OAuth2: class { setCredentials() {} } },
    calendar: () => ({
      calendarList: { list: mock.listCalendars },
      events: { insert: mock.insert, get: mock.get, update: mock.update, list: mock.list },
    }),
  },
}));

const token = "pinned-placement-test-token";
const start = { dateTime: "2026-10-22T09:00:00Z" };
const end = { dateTime: "2026-10-22T10:00:00Z" };

describe("persisted manual placement metadata", () => {
  let stored: GoogleCalendarEvent;

  beforeEach(() => {
    clearCalendarIdCache(token);
    vi.clearAllMocks();
    mock.listCalendars.mockResolvedValue({ data: { items: [{ id: "brk", summary: "BrkRoutnXdle" }] } });
    mock.insert.mockImplementation(async ({ requestBody }: { requestBody: GoogleCalendarEvent }) => {
      stored = { ...requestBody, id: "google-event-1" };
      return { data: stored };
    });
    mock.get.mockImplementation(async () => ({ data: stored }));
    mock.update.mockImplementation(async ({ requestBody }: { requestBody: GoogleCalendarEvent }) => {
      stored = { ...stored, ...requestBody, extendedProperties: requestBody.extendedProperties };
      return { data: stored };
    });
    mock.list.mockImplementation(async () => ({ data: { items: [stored] } }));
  });

  it("writes Google private.pinned=true, then re-reads the returned Google resource as pinned", async () => {
    const created = await createEvent(token, {
      summary: "Manual task", start, end, isPinned: true,
      extendedProperties: { private: { taskId: "task-1" } },
    });

    expect(mock.insert.mock.calls[0][0].requestBody.extendedProperties.private).toEqual(
      expect.objectContaining({ app: "BrkRoutnXdle", generated: "true", pinned: "true", taskId: "task-1" }),
    );
    expect(mock.insert.mock.calls[0][0].requestBody).not.toHaveProperty("isPinned");
    expect(created).toMatchObject({ id: "google-event-1", isGenerated: true, isPinned: true, taskId: "task-1" });

    const [reloaded] = await fetchEvents(token, start.dateTime, end.dateTime);
    expect(reloaded).toMatchObject({ id: "google-event-1", isPinned: true, taskId: "task-1" });

    const edited = await updateEvent(token, "google-event-1", { summary: "Edited task" });
    expect(mock.update.mock.calls[0][0].requestBody.extendedProperties.private.pinned).toBe("true");
    expect(mock.update.mock.calls[0][0].requestBody).not.toHaveProperty("isPinned");
    expect(edited.isPinned).toBe(true);
    expect((await fetchEvents(token, start.dateTime, end.dateTime))[0].isPinned).toBe(true);
  });

  it("defaults missing and external markers to false without inferring pinning from taskId", async () => {
    const created = await createEvent(token, {
      summary: "Auto task", start, end, extendedProperties: { private: { taskId: "task-2" } },
    });
    expect(stored.extendedProperties?.private?.pinned).toBe("false");
    expect(created.isPinned).toBe(false);

    delete stored.extendedProperties?.private?.pinned;
    expect((await fetchEvents(token, start.dateTime, end.dateTime))[0].isPinned).toBe(false);

    stored.extendedProperties = { private: { taskId: "external-task", pinned: "true" } };
    const [external] = await fetchEvents(token, start.dateTime, end.dateTime);
    expect(external).toMatchObject({ isPinned: false, taskId: undefined });
  });

  it("changes the marker only when PATCH explicitly supplies isPinned", async () => {
    await createEvent(token, { summary: "Auto task", start, end });
    expect((await updateEvent(token, "google-event-1", { isPinned: true })).isPinned).toBe(true);
    expect((await updateEvent(token, "google-event-1", { isPinned: false })).isPinned).toBe(false);
  });
});
