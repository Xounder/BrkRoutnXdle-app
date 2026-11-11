import { AppError } from "../middleware/errorHandler.js";

export type EventTime = string | { dateTime: string; timeZone?: string };
type NormalizedTime = { dateTime: string; timeZone?: string };

const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?$/;

function invalid(): never {
  throw new AppError(400, "VALIDATION_ERROR", "Invalid event interval");
}

function parts(value: string) {
  const match = DATE_TIME.exec(value);
  if (!match) return invalid();
  const [, y, mo, d, h, min, s, fraction, suffix] = match;
  const year = Number(y), month = Number(mo), day = Number(d);
  const hour = Number(h), minute = Number(min), second = Number(s);
  const millisecond = Number((fraction?.slice(1) ?? "").padEnd(3, "0"));
  const base = new Date(0);
  base.setUTCFullYear(year, month - 1, day);
  base.setUTCHours(hour, minute, second, millisecond);
  if (year < 1 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59 ||
      base.getUTCFullYear() !== year || base.getUTCMonth() + 1 !== month || base.getUTCDate() !== day) return invalid();
  let offset: number | undefined;
  if (suffix) {
    if (suffix === "Z") offset = 0;
    else {
      const oh = Number(suffix.slice(1, 3)), om = Number(suffix.slice(4));
      if (oh > 23 || om > 59) return invalid();
      offset = (suffix[0] === "-" ? -1 : 1) * (oh * 60 + om);
    }
  }
  return { base: base.getTime(), offset, suffix, local: value.slice(0, suffix ? -suffix.length : undefined) };
}

function zoneOffset(zone: string, instant: number): number {
  const date = new Date(instant);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const fields = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, Number(p.value)]));
  const wall = Date.UTC(fields.year, fields.month - 1, fields.day, fields.hour, fields.minute, fields.second);
  return Math.round((wall - Math.floor(instant / 1000) * 1000) / 60000);
}

function offsetSuffix(offset: number): string {
  const n = Math.abs(offset);
  return `${offset < 0 ? "-" : "+"}${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}

function endpoint(input: EventTime, other: EventTime): { value: NormalizedTime; instant: number } {
  const value = typeof input === "string" ? { dateTime: input } : input;
  const peer = typeof other === "string" ? { dateTime: other } : other;
  const parsed = parts(value.dateTime);
  const peerParsed = parts(peer.dateTime);
  const zone = value.timeZone ?? peer.timeZone;
  if (value.timeZone !== undefined) {
    try { new Intl.DateTimeFormat("en-US", { timeZone: value.timeZone }); } catch { return invalid(); }
  }
  let offset = parsed.offset;
  if (offset === undefined && value.timeZone) {
    // A local time in a DST gap has no instant; a fold has two. Neither can
    // be resolved without an explicit offset supplied by the caller.
    const guesses = new Set<number>();
    for (let hours = -36; hours <= 36; hours += 6) {
      const candidateOffset = zoneOffset(value.timeZone, parsed.base + hours * 3600000);
      if (zoneOffset(value.timeZone, parsed.base - candidateOffset * 60000) === candidateOffset) guesses.add(candidateOffset);
    }
    if (guesses.size !== 1) return invalid();
    offset = [...guesses][0];
  }
  if (offset === undefined && peerParsed.offset !== undefined) offset = peerParsed.offset;
  if (offset === undefined && zone) {
    try {
      const guesses = new Set<number>();
      for (let hours = -36; hours <= 36; hours += 6) {
        const candidateOffset = zoneOffset(zone, parsed.base + hours * 3600000);
        if (zoneOffset(zone, parsed.base - candidateOffset * 60000) === candidateOffset) guesses.add(candidateOffset);
      }
      if (guesses.size !== 1) return invalid();
      offset = [...guesses][0];
    } catch { return invalid(); }
  }
  if (offset === undefined) return invalid();
  const instant = parsed.base - offset * 60000;
  if (!Number.isFinite(instant)) return invalid();
  if (value.timeZone && zoneOffset(value.timeZone, instant) !== offset) return invalid();
  return { value: { dateTime: parsed.offset === undefined ? `${parsed.local}${offsetSuffix(offset)}` : value.dateTime,
    ...(value.timeZone ? { timeZone: value.timeZone } : {}) }, instant };
}

export function normalizeEventInterval(start: EventTime, end: EventTime): { start: NormalizedTime; end: NormalizedTime } {
  const first = endpoint(start, end), last = endpoint(end, start);
  if (last.instant <= first.instant) return invalid();
  return { start: first.value, end: last.value };
}
