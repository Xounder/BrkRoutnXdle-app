import React, { useState } from "react";
import { useTasks } from "../../hooks/useTasks";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import type { Task } from "@brkroutnxdle/shared";

export function TaskPanel() {
  const { tasks, deleteTask } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ fontWeight: 600, color: "#1E8C86", fontSize: "14px" }}>
          Tasks ({tasks.length})
        </span>
        <button
          onClick={() => setIsCreating(true)}
          style={{
            padding: "4px 12px",
            background: "#2BA8A2",
            color: "#fff",
            border: "none",
            borderRadius: "9999px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          + New
        </button>
      </div>

      {tasks.length === 0 && (
        <p style={{ fontSize: "13px", color: "#999", textAlign: "center", padding: "16px" }}>
          No tasks yet. Click "+ New" to create one.
        </p>
      )}

      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={setEditingTask}
            onDelete={deleteTask}
          />
        ))}
      </div>

      {(isCreating || editingTask) && (
        <TaskModal
          task={editingTask}
          onClose={() => { setIsCreating(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}
