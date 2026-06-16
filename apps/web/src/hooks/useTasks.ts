import { useTaskContext } from "../contexts/TaskContext";

export function useTasks() {
  return useTaskContext();
}
