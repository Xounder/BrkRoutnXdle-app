import type { CalendarEvent, Task, Settings } from "@brkroutnxdle/shared";

interface ExplicitPlacement {
  start: string;
  end: string;
  // Accepted for existing slot callers; settings never selects a placement time.
  settings?: Settings;
}

/**
 * Build one local pending occurrence only after an intentional slot selection.
 * Definition creation must never call this helper.
 */
export function buildCalendarEventFromTask(
  task: Task,
  options: ExplicitPlacement
): CalendarEvent {
  if (!options.start || !options.end) {
    throw new Error("Explicit start and end are required to place a task");
  }

  return {
    id: crypto.randomUUID(),
    title: task.title,
    start: options.start,
    end: options.end,
    isAllDay: false,
    isGenerated: true,
    isPinned: true,
    taskId: task.id,
    isCompleted: false,
    source: "brkroutnxdle",
  };
}

/**
 * Checks whether a task has any placed occurrence, not whether it may be placed again.
 */
export function hasCalendarEventForTask(events: CalendarEvent[], taskId: string): boolean {
  return events.some((event) => event.taskId === taskId || event.id === taskId);
}

/**
 * Appends exactly one pending occurrence per explicit placement action.
 * Multiple independent placements of the same definition are allowed.
 */
export function appendCalendarEventForTask(
  events: CalendarEvent[],
  task: Task,
  options: ExplicitPlacement
): CalendarEvent[] {
  return [...events, buildCalendarEventFromTask(task, options)];
}

/**
 * Reflect definition metadata on existing occurrences only. Never change their
 * identity, source, time, or persistence status; never insert a new occurrence.
 */
export function updateCalendarEventForTask(
  events: CalendarEvent[],
  task: Task
): CalendarEvent[] {
  return events.map((event) =>
    event.taskId === task.id || event.id === task.id
      ? { ...event, title: task.title }
      : event,
  );
}
