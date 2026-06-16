import React from "react";
import type { Task, Priority } from "@brkroutnxdle/shared";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#5DADE2",
  medium: "#2BA8A2",
  high: "#FFD23F",
  critical: "#EF6C4A",
};

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "16px",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        borderLeft: `6px solid ${PRIORITY_COLORS[task.priority]}`,
        marginBottom: "8px",
        cursor: "pointer",
      }}
      onClick={() => onEdit(task)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <strong style={{ fontSize: "14px", color: "#333" }}>{task.title}</strong>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
            {task.duration}min · {task.restrictions.length > 0 ? `${task.restrictions.length} restriction(s)` : "no restrictions"}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          style={{
            background: "none",
            border: "none",
            color: "#EF6C4A",
            cursor: "pointer",
            fontSize: "16px",
            padding: "4px",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
