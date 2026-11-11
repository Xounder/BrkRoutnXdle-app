import { beforeEach, expect, it, vi } from "vitest";
import { clearCalendarIdCache, createEvent, updateEvent } from "./operations.js";
import type { GoogleCalendarEvent } from "../internal/types.js";

const mock = vi.hoisted(() => ({ listCalendars: vi.fn(), insert: vi.fn(), get: vi.fn(), update: vi.fn() }));
vi.mock("googleapis", () => ({ google: {
  auth: { OAuth2: class { setCredentials() {} } },
  calendar: () => ({ calendarList: { list: mock.listCalendars }, events: {
    insert: mock.insert, get: mock.get, update: mock.update,
  } }),
} }));

const token = "event-interval-boundary-token";
const taskId = "abcb0d4a-aef4-425d-9752-8648afdd0431";
let stored: GoogleCalendarEvent;

beforeEach(() => {
  clearCalendarIdCache(token);
  vi.clearAllMocks();
  mock.listCalendars.mockResolvedValue({ data: { items: [{ id: "brk", summary: "BrkRoutnXdle" }] } });
  mock.insert.mockImplementation(async ({ requestBody }: { requestBody: GoogleCalendarEvent }) => {
    stored = { ...requestBody, id: "event-id" };
    return { data: stored };
  });
  mock.get.mockImplementation(async () => ({ data: stored }));
  mock.update.mockImplementation(async ({ requestBody }: { requestBody: GoogleCalendarEvent }) => {
    stored = { ...stored, ...requestBody };
    return { data: stored };
  });
});

it("transmits the route-normalized interval and task/pin metadata to Google's insert and retains metadata on update", async () => {
  const start = { dateTime: "2026-11-03T12:30:00-03:00" };
  const end = { dateTime: "2026-11-03T13:30:00-03:00" };
  const created = await createEvent(token, {
    summary: "teste", start, end, isPinned: true, extendedProperties: { private: { taskId } },
  });
  const inserted = mock.insert.mock.calls[0][0].requestBody;
  expect(inserted).toMatchObject({ summary: "teste", start, end,
    extendedProperties: { private: { taskId, pinned: "true" } },
  });
  expect(Date.parse(inserted.end.dateTime) - Date.parse(inserted.start.dateTime)).toBe(3600000);
  expect(created).toMatchObject({ title: "teste", taskId, isPinned: true });

  const newStart = { dateTime: "2026-11-03T14:30:00-03:00" };
  const newEnd = { dateTime: "2026-11-03T15:30:00-03:00" };
  const updated = await updateEvent(token, "event-id", { start: newStart, end: newEnd });
  expect(mock.update.mock.calls[0][0].requestBody).toMatchObject({ summary: "teste", start: newStart, end: newEnd,
    extendedProperties: { private: { taskId, pinned: "true" } },
  });
  expect(updated).toMatchObject({ title: "teste", taskId, isPinned: true });
});
