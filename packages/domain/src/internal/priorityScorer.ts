import type { Task, Priority } from "@brkroutnxdle/shared";
import { Priority as PriorityEnum } from "@brkroutnxdle/shared";

/**
 * Priority weight mapping used for task ordering.
 * Higher weight = higher priority.
 */
const PRIORITY_WEIGHTS: Record<Priority, number> = {
  [PriorityEnum.Critical]: 100,
  [PriorityEnum.High]: 75,
  [PriorityEnum.Medium]: 50,
  [PriorityEnum.Low]: 25,
};

/**
 * Returns the numeric weight for a given priority level.
 */
export function getPriorityWeight(priority: Priority): number {
  return PRIORITY_WEIGHTS[priority] ?? PRIORITY_WEIGHTS[PriorityEnum.Medium];
}

/**
 * Compares two tasks by priority (descending).
 * Returns negative if a should come before b.
 */
export function comparePriority(a: Task, b: Task): number {
  return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
}

/**
 * Sorts tasks by priority (critical → high → medium → low).
 */
export function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort(comparePriority);
}