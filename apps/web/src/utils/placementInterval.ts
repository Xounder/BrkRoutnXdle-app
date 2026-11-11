/** Preserve FullCalendar's instant while giving both endpoints the same wire format. */
export function placementInterval(start: string, end: string): { start: string; end: string } {
  const explicitZone = /(?:Z|[+-]\d{2}:\d{2})$/i;
  const localDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;
  const zonedDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/i;
  const validCivilDate = (value: string) => {
    const civil = value.slice(0, 10);
    const parsed = new Date(`${civil}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === civil;
  };
  const startZoned = explicitZone.test(start);
  const endZoned = explicitZone.test(end);
  if (!start || !end || startZoned !== endZoned ||
      !(startZoned ? zonedDateTime.test(start) && zonedDateTime.test(end) :
        localDateTime.test(start) && localDateTime.test(end)) ||
      !validCivilDate(start) || !validCivilDate(end)) {
    throw new Error("A valid start and end in the same timezone are required");
  }
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new Error("Placement must have a valid positive interval");
  }
  // Keep legacy floating local endpoints intact for callers that already use them.
  // FullCalendar supplies offset-bearing endpoints: normalize those together to UTC.
  return startZoned
    ? { start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString() }
    : { start, end };
}

/** Day-grid fallback is a civil hour in the user's local calendar timezone. */
export function dropInterval(dateStr: string, allDay: boolean, workStartHour: number,
  durationMinutes: number): { start: string; end: string } {
  if (!Number.isSafeInteger(durationMinutes) || durationMinutes <= 0 ||
      !Number.isSafeInteger(workStartHour) || workStartHour < 0 || workStartHour > 23) {
    throw new Error("Invalid drop duration or work start hour");
  }
  let start: Date;
  if (allDay || !dateStr.includes("T")) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error("Invalid drop date");
    const [year, month, day] = dateStr.split("-").map(Number);
    start = new Date(year, month - 1, day, workStartHour);
    if (start.getFullYear() !== year || start.getMonth() !== month - 1 ||
        start.getDate() !== day || start.getHours() !== workStartHour) {
      throw new Error("Invalid local drop date or hour");
    }
  } else {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(dateStr)) {
      throw new Error("Timed drop needs an offset");
    }
    start = new Date(dateStr);
    const civil = dateStr.slice(0, 10);
    const civilDate = new Date(`${civil}T00:00:00Z`);
    if (!Number.isFinite(civilDate.getTime()) || civilDate.toISOString().slice(0, 10) !== civil) {
      throw new Error("Invalid timed drop date");
    }
  }
  const startMs = start.getTime();
  const endMs = startMs + durationMinutes * 60_000;
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) ||
      !Number.isFinite(new Date(endMs).getTime()) || endMs <= startMs) {
    throw new Error("Invalid drop interval");
  }
  return placementInterval(start.toISOString(), new Date(endMs).toISOString());
}
