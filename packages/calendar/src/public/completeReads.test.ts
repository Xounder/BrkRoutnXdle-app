import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearCalendarIdCache, fetchEvents, fetchEventsFromCalendar } from "./operations.js";

const mocks = vi.hoisted(() => ({
  listEvents: vi.fn(),
  listCalendars: vi.fn(),
}));

vi.mock("googleapis", () => {
  class OAuth2 {
    setCredentials() { /* No network authentication in tests. */ }
  }
  return {
    google: {
      auth: { OAuth2 },
      calendar: () => ({
        events: { list: mocks.listEvents },
        calendarList: { list: mocks.listCalendars },
      }),
    },
  };
});

const TOKEN = "complete-reads-token";
const MIN = "2026-01-01T00:00:00Z";
const MAX = "2026-01-08T00:00:00Z";
const BRK_ID = "brkroutnxdle-calendar";
const occurrence = (id: string) => ({
  id,
  summary: `Occurrence ${id}`,
  start: { dateTime: "2026-01-02T10:00:00Z" },
  end: { dateTime: "2026-01-02T10:30:00Z" },
});

const reads = [
  { name: "dedicated calendar", id: BRK_ID, run: () => fetchEvents(TOKEN, MIN, MAX) },
  { name: "selected primary calendar", id: "primary", run: () => fetchEventsFromCalendar(TOKEN, "primary", MIN, MAX) },
  { name: "selected app calendar", id: BRK_ID, run: () => fetchEventsFromCalendar(TOKEN, BRK_ID, MIN, MAX) },
];

beforeEach(() => {
  clearCalendarIdCache(TOKEN);
  mocks.listEvents.mockReset();
  mocks.listCalendars.mockReset();
  mocks.listCalendars.mockResolvedValue({ data: { items: [{ id: BRK_ID, summary: "BrkRoutnXdle" }] } });
});

describe.each(reads)("complete reads: $name", ({ id, run }) => {
  it("collects every occurrence using stable options and page tokens", async () => {
    mocks.listEvents
      .mockResolvedValueOnce({ data: { items: [occurrence("one")], nextPageToken: "next" } })
      .mockResolvedValueOnce({ data: { items: [occurrence("two")] } });

    const result = await run();
    expect(result.map((event) => event.id)).toEqual(["one", "two"]);
    expect(result.map((event) => event.source)).toEqual([
      id === "primary" ? "google" : "brkroutnxdle",
      id === "primary" ? "google" : "brkroutnxdle",
    ]);
    expect(mocks.listEvents.mock.calls.map(([options]) => options)).toEqual([
      { calendarId: id, timeMin: MIN, timeMax: MAX, singleEvents: true, orderBy: "startTime" },
      { calendarId: id, timeMin: MIN, timeMax: MAX, singleEvents: true, orderBy: "startTime", pageToken: "next" },
    ]);
  });

  it.each([{ items: [] }, {}])("accepts an empty final page: %j", async (lastPage) => {
    mocks.listEvents
      .mockResolvedValueOnce({ data: { items: [occurrence("one")], nextPageToken: "next" } })
      .mockResolvedValueOnce({ data: lastPage });
    expect((await run()).map((event) => event.id)).toEqual(["one"]);
    expect(mocks.listEvents).toHaveBeenCalledTimes(2);
  });

  it("accepts a single page with absent items as an empty read", async () => {
    mocks.listEvents.mockResolvedValue({ data: {} });
    expect(await run()).toEqual([]);
  });

  it("rejects a failed second page rather than returning the first page", async () => {
    const failure = new Error("Google quota exceeded");
    mocks.listEvents
      .mockResolvedValueOnce({ data: { items: [occurrence("one")], nextPageToken: "next" } })
      .mockRejectedValueOnce(failure);
    await expect(run()).rejects.toBe(failure);
    expect(mocks.listEvents).toHaveBeenCalledTimes(2);
  });

  it.each([undefined, null, { data: null }, { data: { items: null } },
    { data: { items: {} } }, { data: { items: [null] } },
    { data: { nextPageToken: 12 } }, { data: { nextPageToken: "" } },
  ])("rejects malformed first page %j", async (page) => {
    mocks.listEvents.mockResolvedValue(page);
    await expect(run()).rejects.toThrow();
  });

  it("rejects a malformed second page without returning a prefix", async () => {
    mocks.listEvents
      .mockResolvedValueOnce({ data: { items: [occurrence("one")], nextPageToken: "next" } })
      .mockResolvedValueOnce({ data: null });
    await expect(run()).rejects.toThrow(/page data/);
  });

  it("stops a cycle even if the response contains more items", async () => {
    mocks.listEvents
      .mockResolvedValueOnce({ data: { items: [occurrence("one")], nextPageToken: "a" } })
      .mockResolvedValueOnce({ data: { items: [occurrence("two")], nextPageToken: "b" } })
      .mockResolvedValueOnce({ data: { items: [occurrence("three")], nextPageToken: "a" } });
    await expect(run()).rejects.toThrow(/Repeated.*page token/);
    expect(mocks.listEvents).toHaveBeenCalledTimes(3);
  });

  it("rejects duplicate remote IDs rather than concealing contradictory records", async () => {
    mocks.listEvents
      .mockResolvedValueOnce({ data: { items: [occurrence("one")], nextPageToken: "next" } })
      .mockResolvedValueOnce({ data: { items: [{ ...occurrence("one"), summary: "Changed" }] } });
    await expect(run()).rejects.toThrow(/duplicate Google Calendar event ID/);
  });
});

it("keeps page tokens local to concurrent reads", async () => {
  mocks.listEvents.mockImplementation(async ({ calendarId, pageToken }) => ({
    data: pageToken
      ? { items: [occurrence(`${calendarId}-last`)] }
      : { items: [occurrence(`${calendarId}-first`)], nextPageToken: `${calendarId}-next` },
  }));
  const [primary, app] = await Promise.all([
    fetchEventsFromCalendar(TOKEN, "primary", MIN, MAX),
    fetchEventsFromCalendar("other-token", BRK_ID, MIN, MAX),
  ]);
  expect(primary.map((event) => event.id)).toEqual(["primary-first", "primary-last"]);
  expect(app.map((event) => event.id)).toEqual([`${BRK_ID}-first`, `${BRK_ID}-last`]);
  expect(mocks.listEvents.mock.calls.map(([options]) => [options.calendarId, options.pageToken])).toEqual([
    ["primary", undefined], [BRK_ID, undefined],
    ["primary", "primary-next"], [BRK_ID, `${BRK_ID}-next`],
  ]);
});
