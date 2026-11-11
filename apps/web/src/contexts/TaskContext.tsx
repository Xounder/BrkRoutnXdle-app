import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import type { Task, Priority } from "@brkroutnxdle/shared";
import { Priority as PriorityEnum } from "@brkroutnxdle/shared";
import { storage } from "../services/localStorage";

const STORAGE_KEY = "brkroutnxdle:tasks";

function generateId(): string {
  return crypto.randomUUID();
}

function loadTasks(): Task[] {
  const stored: unknown = storage.get<unknown>(STORAGE_KEY, []);
  // A parseable value is not necessarily a list of task definitions.
  const tasks = Array.isArray(stored) ? stored.filter((item): item is Task =>
    item !== null && typeof item === "object" && !Array.isArray(item) &&
    typeof item.id === "string" && typeof item.title === "string",
  ) : [];
  // Migrate: default priority to "medium" if missing
  return tasks.map((t) => ({
    ...t,
    priority: t.priority ?? PriorityEnum.Medium,
  }));
}

interface TaskContextValue {
  tasks: Task[];
  createTask: (partial: Omit<Task, "id" | "createdAt" | "updatedAt">) => Task;
  updateTask: (id: string, partial: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTask: (id: string) => Task | undefined;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const currentTasks = useRef(tasks);

  const persist = useCallback((next: Task[]) => {
    // Never publish an unpersisted definition. Keep the latest committed value
    // available to callbacks invoked before React has rendered again.
    storage.set(STORAGE_KEY, next);
    currentTasks.current = next;
    setTasks(next);
  }, []);

  const createTask = useCallback(
    (partial: Omit<Task, "id" | "createdAt" | "updatedAt">): Task => {
      const now = new Date().toISOString();
      const task: Task = {
        ...partial,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      persist([...currentTasks.current, task]);
      return task;
    },
    [persist],
  );

  const updateTask = useCallback(
    (id: string, partial: Partial<Task>) => {
      const next = currentTasks.current.map((t) =>
        t.id === id ? { ...t, ...partial, updatedAt: new Date().toISOString() } : t,
      );
      persist(next);
    },
    [persist],
  );

  const deleteTask = useCallback(
    (id: string) => {
      persist(currentTasks.current.filter((t) => t.id !== id));
    },
    [persist],
  );

  const getTask = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
    [tasks],
  );

  return (
    <TaskContext.Provider value={{ tasks, createTask, updateTask, deleteTask, getTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTaskContext must be used within TaskProvider");
  return ctx;
}
