import type { Task, Settings, RestrictedRange } from "@brkroutnxdle/shared";
import { TIME_GROUP_PRESETS } from "@brkroutnxdle/shared";
import { localDay, localParts, localWeekday } from "./localTime.js";

function inRange(start: number, end: number, range: RestrictedRange): boolean {
  const { startHour, endHour } = "preset" in range ? TIME_GROUP_PRESETS[range.preset] : range.custom;
  if (endHour <= startHour) return start >= startHour || (start < endHour && end <= endHour);
  return start >= startHour && end <= endHour;
}

/** Check both boundaries in local wall time; no occurrence may cross a local date. */
export function permittedInterval(start: string, end: string, task: Task, settings: Settings): boolean {
  const last = new Date(Date.parse(end) - 1).toISOString();
  if (localDay(start, settings.timezone) !== localDay(last, settings.timezone)) return false;
  const a = localParts(start, settings.timezone);
  const b = localParts(end, settings.timezone);
  const firstHour = a.hour + a.minute / 60;
  const lastHour = b.hour + b.minute / 60;
  if (lastHour < firstHour) return false; // Repeated DST hour cannot masquerade as forward wall time.
  const day = localWeekday(start, settings.timezone);
  if (!settings.workDays.includes(day) || firstHour < settings.workStartHour || lastHour > settings.workEndHour) return false;
  for (const restriction of task.restrictions) {
    if ((restriction.type === "no-weekends" || restriction.type === "weekdays-only") && (day === 0 || day === 6)) return false;
    if (restriction.type === "specific-days" && !restriction.days.includes(day)) return false;
    if (restriction.type === "morning-only" && lastHour > 12) return false;
    if (restriction.type === "afternoon-only" && firstHour < 12) return false;
    if (restriction.type === "restricted-range" && !restriction.ranges.some(range => inRange(firstHour, lastHour, range))) return false;
  }
  return true;
}
