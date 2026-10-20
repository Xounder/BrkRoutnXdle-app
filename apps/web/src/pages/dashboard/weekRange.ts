/**
 * Week-boundary helpers for the dashboard's calendar event query range.
 *
 * Extracted verbatim from `DashboardPage` during TASK-07 so the toolbar
 * addition keeps `DashboardPage.tsx` at its TASK-06 size (≤ 350-line target,
 * `M9` / `P-8`: extend via `pages/dashboard/`, do not grow the page file).
 */

/** Sunday 00:00:00 of the week containing `date`. */
export const getWeekStart = (date: Date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // Sunday
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Saturday 23:59:59.999 of the week containing `date`. */
export const getWeekEnd = (date: Date) => {
  const d = new Date(date);
  d.setDate(d.getDate() + (6 - d.getDay())); // Saturday
  d.setHours(23, 59, 59, 999);
  return d;
};
