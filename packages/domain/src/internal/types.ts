import type { Task, BlockedSlot, CalendarEvent, Settings } from "@brkroutnxdle/shared";

/** A single 30-minute time slot used by the algorithm. */
export interface WeekSlot {
  start: string;   // ISO-8601
  end: string;     // ISO-8601 (start + 30 min)
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  occupied: boolean;
  blocked: boolean;
  frozen: boolean;
}

/** A continuous available window. */
export interface AvailabilityWindow {
  start: string;
  end: string;
}

/** A single generated event output by the algorithm. */
export interface GeneratedEvent {
  id: string;
  taskId: string;
  start: string;
  end: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Allocation failure for a specific task. */
export interface AllocationFailure {
  taskId: string;
  taskName: string;
  required: number;
  allocated: number;
}

/** Final result of the schedule generation. */
export interface ScheduleResult {
  weekStart: string;
  weekEnd: string;
  generatedEvents: GeneratedEvent[];
  failures: AllocationFailure[];
  generatedAt: string;
}

/** Snapshot of the previous week's generation. */
export interface PreviousWeekSnapshot {
  generatedEvents: Array<{
    taskId: string;
    start: string;
    end: string;
  }>;
}

/** Input parameters for the generation algorithm. */
export interface ScheduleInput {
  tasks: Task[];
  blocks: BlockedSlot[];
  events: CalendarEvent[];
  settings: Settings;
  previousWeek?: PreviousWeekSnapshot;
  targetWeekStart: string;  // ISO-8601 Monday 00:00
}