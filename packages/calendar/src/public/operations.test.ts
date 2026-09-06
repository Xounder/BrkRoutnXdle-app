import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchEvents, fetchEventsFromCalendar } from "./operations.js";

// Shared mock fns created via vi.hoisted so the hoisted vi.mock factory can use them.
const mocks = vi.hoisted(() => ({
  listEvents: vi.fn(),
  listCalendars: vi.fn(),
  createCalendarClient: vi.fn(),
}));

vi.mock("googleapis", () => {
  class OAuth2 {
    setCredentials() {
      // The fake client performs no real auth.
    }
  }

  const client = {
    events: { list: mocks.listEvents },
    calendarList: { list: mocks.listCalendars },
    calendars: { insert: vi.fn() },
  };

  mocks.createCalendarClient.mockReturnValue(client);

  return {
    google: {
      auth: { OAuth2 },
      calendar: mocks.createCalendarClient,
    },
  };
});

const TIME_MIN = "2026-01-01T00:00:00.000Z";
const TIME_MAX = "2026-02-01T00:00:00.000Z";
const BRK_CALENDAR_ID = "brkroutnxdle-calendar-id";

describe("calendar events.list calls", () => {
  beforeEach(() => {
    mocks.listEvents.mockReset();
    mocks.listCalendars.mockReset();
    mocks.createCalendarClient.mockClear();
    mocks.listCalendars.mockResolvedValue({
      data: {
        items: [{ id: BRK_CALENDAR_ID, summary: "BrkRoutnXdle" }],
      },
    });
    mocks.listEvents.mockResolvedValue({ data: { items: [] } });
  });

  it("fetchEvents calls events.list with Google-valid orderBy startTime plus its preconditions", async () => {
    const events = await fetchEvents("test-token-a", TIME_MIN, TIME_MAX);

    expect(events).toEqual([]);
    expect(mocks.listEvents).toHaveBeenCalledTimes(1);
    expect(mocks.listEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: BRK_CALENDAR_ID,
        timeMin: TIME_MIN,
        timeMax: TIME_MAX,
        singleEvents: true,
        orderBy: "startTime",
      }),
    );
    // Guard against reintroducing the invalid value rejected by the Google API.
    expect(mocks.listEvents).not.toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: "start" }),
    );
  });

  it("fetchEventsFromCalendar calls events.list with Google-valid orderBy startTime for any calendar id", async () => {
    const calendarId = "primary";
    const events = await fetchEventsFromCalendar(
      "test-token-b",
      calendarId,
      TIME_MIN,
      TIME_MAX,
    );

    expect(events).toEqual([]);
    expect(mocks.listEvents).toHaveBeenCalledTimes(1);
    expect(mocks.listEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId,
        timeMin: TIME_MIN,
        timeMax: TIME_MAX,
        singleEvents: true,
        orderBy: "startTime",
      }),
    );
    expect(mocks.listEvents).not.toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: "start" }),
    );
  });
});