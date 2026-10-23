const formatters = new Map<string, Intl.DateTimeFormat>();

export function localParts(instant: string | number, timezone: string) {
  let formatter = formatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    });
    formatters.set(timezone, formatter);
  }
  const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(p => [p.type, Number(p.value)]));
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute };
}

export function localDay(instant: string | number, timezone: string): string {
  const p = localParts(instant, timezone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function localWeekday(instant: string | number, timezone: string): number {
  return new Date(`${localDay(instant, timezone)}T00:00:00Z`).getUTCDay();
}

export function addDays(day: string, count: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + count * 86400_000).toISOString().slice(0, 10);
}

/** Resolve local midnight to an instant, including weeks containing DST transitions. */
export function localMidnight(day: string, timezone: string): string {
  const desired = Date.parse(`${day}T00:00:00Z`);
  let instant = desired;
  for (let i = 0; i < 4; i++) {
    const p = localParts(instant, timezone);
    const observed = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    if (observed === desired) break;
    instant += desired - observed;
  }
  return new Date(instant).toISOString();
}

export function weekBounds(target: string, timezone: string, weekStartDay: number) {
  const timestamp = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(target) ? localMidnight(target, timezone) : target);
  if (!Number.isFinite(timestamp)) throw new RangeError("Invalid targetWeekStart");
  const day = localDay(timestamp, timezone);
  const startDay = addDays(day, -(localWeekday(timestamp, timezone) - weekStartDay + 7) % 7);
  return { start: localMidnight(startDay, timezone), end: localMidnight(addDays(startDay, 7), timezone) };
}
