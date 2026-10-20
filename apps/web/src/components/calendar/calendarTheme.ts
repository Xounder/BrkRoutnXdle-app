import type { Settings } from "@brkroutnxdle/shared";

/**
 * The FullCalendar `--fc-*` custom-property contract.
 *
 * This is the single, documented list that both the stylesheet author
 * (`apps/web/src/styles/calendar/calendar-tokens.css`, TASK-09) and the
 * TypeScript author agree on. Every value resolves from a semantic
 * `--brk-*` token declared in `apps/web/src/styles/design-tokens.css`.
 *
 * The map is a documentation/typing artefact only — the actual declarations
 * live in the stylesheet, scoped to `.brk-calendar-google` (`M1`), so that
 * FullCalendar's runtime-injected CSS is themed via custom properties instead
 * of `!important` overrides. Keep this list in sync with that stylesheet.
 */
export const CALENDAR_FC_THEME_VARS: Record<string, string> = {
  "--fc-border-color": "var(--brk-border-subtle)",
  "--fc-page-bg-color": "var(--brk-bg-raised)",
  "--fc-neutral-bg-color": "var(--brk-bg-sunken)",
  "--fc-neutral-text-color": "var(--brk-text-muted)",
  "--fc-today-bg-color": "var(--brk-today-tint)",
  "--fc-non-business-color": "var(--brk-bg-subtle)",
  "--fc-now-indicator-color": "var(--brk-now-indicator)",
  "--fc-highlight-color":
    "color-mix(in srgb, var(--brk-accent-brand) 18%, transparent)",
  "--fc-event-bg-color": "var(--brk-event-generated)",
  "--fc-event-border-color": "var(--brk-event-generated)",
  "--fc-event-text-color": "var(--brk-text-on-brand)",
  "--fc-event-resizer-thickness": "8px",
  "--fc-small-font-size": "0.8125rem",
  "--fc-daygrid-event-dot-width": "8px",
  "--fc-list-event-hover-bg-color": "var(--brk-bg-sunken)",
};

/**
 * Formats a whole work hour as `HH:00`.
 *
 * Pads to two digits and clamps into `0`–`24` so an end hour of `24` renders
 * as `24:00` (end of day) rather than the malformed `2400`.
 */
export function formatWorkHour(hour: number): string {
  const clamped = Math.max(0, Math.min(24, Math.round(hour)));
  return `${String(clamped).padStart(2, "0")}:00`;
}

/**
 * Business-hours label for the toolbar badge, e.g. `"09:00 – 18:00"`,
 * derived from `settings.workStartHour` / `settings.workEndHour`.
 *
 * The label deliberately carries no other wording (no "Preview", no "Working
 * hours") — it is one of the toolbar's allowed strings and must not collide
 * with any E2E-asserted copy.
 */
export function formatBusinessHoursLabel(
  settings: Pick<Settings, "workStartHour" | "workEndHour">,
): string {
  return `${formatWorkHour(settings.workStartHour)} – ${formatWorkHour(
    settings.workEndHour,
  )}`;
}
