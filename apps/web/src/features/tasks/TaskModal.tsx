import React, { useState } from "react";
import type { Task, Priority } from "@brkroutnxdle/shared";
import { Priority as PriorityEnum } from "@brkroutnxdle/shared";
import { useTasks } from "../../hooks/useTasks";

interface TaskModalProps {
  task: Task | null; // null = creating, non-null = editing
  onClose: () => void;
}

export function TaskModal({ task, onClose }: TaskModalProps) {
  const { createTask, updateTask } = useTasks();
  const isEditing = task !== null;

  const [title, setTitle] = useState(task?.title ?? "");
  const [duration, setDuration] = useState(task?.duration ?? 60);
  const [priority, setPriority] = useState<Priority>(task?.priority ?? PriorityEnum.Medium);
  const [error, setError] = useState<string | null>(null);

  const ALLOWED_DURATIONS = [30, 60, 90, 120, 150, 180];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Task name is required");
      return;
    }
    if (!ALLOWED_DURATIONS.includes(duration)) {
      setError("Duration must be a multiple of 30 (30–180)");
      return;
    }

    if (isEditing) {
      updateTask(task!.id, { title: title.trim(), duration, priority });
    } else {
      createTask({
        title: title.trim(),
        description: undefined,
        duration,
        priority,
        restrictions: [],
        isActive: true,
      });
    }

    onClose();
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    background: "#fff", borderRadius: "24px", padding: "32px",
    width: "400px", maxWidth: "90vw",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px", color: "#1E8C86" }}>
          {isEditing ? "Edit Task" : "New Task"}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Name</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Exercise, Reading, Practice"
              style={inputStyle}
              autoFocus
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Duration (minutes)</span>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={inputStyle}>
              {ALLOWED_DURATIONS.map((d) => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Priority</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} style={inputStyle}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          {error && <p style={{ color: "#EF6C4A", fontSize: "13px", margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button type="button" onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
            <button type="submit" style={primaryBtnStyle}>
              {isEditing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px", border: "2px solid #ddd", borderRadius: "8px", fontSize: "14px",
};
const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 24px", background: "linear-gradient(135deg, #FFD23F, #E6B800)",
  border: "none", borderRadius: "9999px", fontWeight: 700, cursor: "pointer", color: "#1E8C86",
};
const secondaryBtnStyle: React.CSSProperties = {
  padding: "10px 24px", border: "2px solid #2BA8A2", borderRadius: "9999px",
  background: "transparent", color: "#2BA8A2", cursor: "pointer", fontWeight: 600,
};
