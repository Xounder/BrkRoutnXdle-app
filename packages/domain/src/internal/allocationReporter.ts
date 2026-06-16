import type { Task } from "@brkroutnxdle/shared";
import type { AllocationFailure } from "./types.js";

interface RawFailure {
  taskId: string;
  taskName: string;
  required: number;
  allocated: number;
}

/**
 * Converts raw allocation failures into the standard AllocationFailure format
 * and enriches with task metadata.
 */
export function reportAllocationFailures(
  allTasks: Task[],
  rawFailures: RawFailure[],
): AllocationFailure[] {
  const taskMap = new Map(allTasks.map((t) => [t.id, t]));

  return rawFailures.map((f) => ({
    taskId: f.taskId,
    taskName: f.taskName,
    required: f.required,
    allocated: f.allocated,
  }));
}

/**
 * Returns a human-readable summary of allocation failures.
 */
export function summarizeFailures(failures: AllocationFailure[]): string {
  if (failures.length === 0) return "All tasks fully allocated.";

  return failures
    .map(
      (f) =>
        `${f.taskName}: ${f.allocated}/${f.required} occurrences allocated`,
    )
    .join("\n");
}

/**
 * Returns the total allocation rate as a percentage.
 */
export function allocationRate(
  totalRequired: number,
  totalAllocated: number,
): number {
  if (totalRequired === 0) return 100;
  return Math.round((totalAllocated / totalRequired) * 100);
}