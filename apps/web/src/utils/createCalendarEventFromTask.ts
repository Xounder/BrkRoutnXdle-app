import type { CalendarEvent, Task, Settings } from "@brkroutnxdle/shared";

/**
 * Builds a CalendarEvent from a Task.
 * If explicit start/end are provided (e.g., from inline slot selection), uses those.
 * Otherwise, defaults to the current day at workStartHour with defaultTaskDuration.
 */
export function buildCalendarEventFromTask(
  task: Task,
  options: {
    start?: string;
    end?: string;
    settings: Settings;
    currentDate?: Date;
  }
): CalendarEvent {
  const { start: explicitStart, end: explicitEnd, settings, currentDate = new Date() } = options;

  let start: string;
  let end: string;

  if (explicitStart && explicitEnd) {
    // Inline "Create in this slot" - use the exact slot times
    start = explicitStart;
    end = explicitEnd;
  } else {
    // Sidebar creation - default to today at workStartHour with defaultTaskDuration
    const workStartHour = settings.workStartHour ?? 8;
    const defaultDuration = settings.defaultTaskDuration ?? 60;

    const startDate = new Date(currentDate);
    startDate.setHours(workStartHour, 0, 0, 0);

    const endDate = new Date(startDate.getTime() + defaultDuration * 60000);

    start = startDate.toISOString();
    end = endDate.toISOString();
  }

  return {
    id: task.id,
    title: task.title,
    start,
    end,
    isAllDay: false,
    isGenerated: true,
    taskId: task.id,
    isCompleted: false,
    source: "brkroutnxdle",
  };
}

/**
 * Checks if a CalendarEvent for the given task already exists in the events array.
 * Used for idempotency - prevents duplicate events on re-save/re-render.
 */
export function hasCalendarEventForTask(events: CalendarEvent[], taskId: string): boolean {
  return events.some((event) => event.taskId === taskId || event.id === taskId);
}

/**
 * Appends a CalendarEvent for a Task to the events array if one doesn't already exist.
 * Returns the updated events array.
 */
export function appendCalendarEventForTask(
  events: CalendarEvent[],
  task: Task,
  options: {
    start?: string;
    end?: string;
    settings: Settings;
    currentDate?: Date;
  }
): CalendarEvent[] {
  if (hasCalendarEventForTask(events, task.id)) {
    return events; // Idempotent: event already exists
  }

  const newEvent = buildCalendarEventFromTask(task, options);
  return [...events, newEvent];
}

/**
 * Updates an existing CalendarEvent for a Task in the events array.
 * If no event exists for the task, appends a new one.
 * Returns the updated events array.
 */
export function updateCalendarEventForTask(
  events: CalendarEvent[],
  task: Task,
  options: {
    start?: string;
    end?: string;
    settings: Settings;
    currentDate?: Date;
  }
): CalendarEvent[] {
  const eventIndex = events.findIndex((event) => event.taskId === task.id || event.id === task.id);
  
  const updatedEvent = buildCalendarEventFromTask(task, options);
  
  if (eventIndex >= 0) {
    // Update existing event
    const newEvents = [...events];
    newEvents[eventIndex] = { ...newEvents[eventIndex], ...updatedEvent };
    return newEvents;
  } else {
    // No existing event - append new one
    return [...events, updatedEvent];
  }
}