import type { Settings } from "@brkroutnxdle/shared";
import type { PreviewRange } from "./previewSchedule";

/** This checks configured work windows, not task restrictions or free calendar slots. */
export function ElapsedWeekNotice({ range, settings, onNext, onSettings }: {
  range: PreviewRange; settings: Settings; onNext: () => void; onSettings: () => void;
}) {
  const now = Date.now();
  if (now < Date.parse(range.timeMin)) return null;
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: settings.timezone,
    weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" });
  const parts = Object.fromEntries(formatter.formatToParts(now).map(part => [part.type, part.value]));
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const hour = Number(parts.hour) + Number(parts.minute) / 60;
  const daysLeft = (settings.weekStartDay + 6 - day + 7) % 7;
  const hasWindow = now < Date.parse(range.timeMax) && day >= 0 &&
    Array.from({ length: daysLeft + 1 }, (_, offset) => (day + offset) % 7)
      .some((candidate, offset) => settings.workDays.includes(candidate) &&
        (offset > 0 || hour < settings.workEndHour));
  if (hasWindow) return null;
  const label = new Intl.DateTimeFormat("en-GB", { timeZone: settings.timezone,
    day: "numeric", month: "short", year: "numeric" }).format(new Date(range.timeMin));
  return <div role="note" style={{ margin: "8px 16px 0" }}>
    Viewed week of {label}: no configured working hours remain in this week. Calculation stays on this
    viewed week; past slots cannot be reopened. Choose another week explicitly or review working hours,
    workdays and calendar blocks. A calendar read error is separate from this work-window notice.
    {" "}<button type="button" onClick={onNext}>View next week</button>
    {" "}<button type="button" onClick={onSettings}>Review settings</button>
  </div>;
}
