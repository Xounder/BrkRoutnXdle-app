# TASK-06 Implementation Guide — Part 2

UI components for task and block management.

---

### Step 6: Create `apps/web/src/features/tasks/TaskCard.tsx`

```tsx
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
```

### Step 7: Create `apps/web/src/features/tasks/TaskPanel.tsx`

```tsx
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
```

### Step 8: Create `apps/web/src/features/tasks/TaskModal.tsx`

```tsx
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
```

### Step 9: Create `apps/web/src/features/blocks/BlockCard.tsx`

```tsx
import React from "react";
import type { BlockedSlot, BlockType } from "@brkroutnxdle/shared";
import { BlockType as BlockTypeEnum } from "@brkroutnxdle/shared";

interface BlockCardProps {
  block: BlockedSlot;
  onEdit: (block: BlockedSlot) => void;
  onDelete: (id: string) => void;
}

const TYPE_LABELS: Record<BlockType, string> = {
  [BlockTypeEnum.SingleDay]: "Single Day",
  [BlockTypeEnum.RecurringWeekday]: "Recurring (Weekday)",
  [BlockTypeEnum.RecurringPeriod]: "Recurring (Period)",
};

export function BlockCard({ block, onEdit, onDelete }: BlockCardProps) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "16px",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        borderLeft: "6px solid #EF6C4A",
        marginBottom: "8px",
        cursor: "pointer",
      }}
      onClick={() => onEdit(block)}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <strong style={{ fontSize: "14px", color: "#333" }}>
            {block.title ?? TYPE_LABELS[block.blockType]}
          </strong>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
            {block.startDate}{block.endDate ? ` → ${block.endDate}` : ""}
            {block.startTime ? ` · ${block.startTime}-${block.endTime}` : ""}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
          style={{ background: "none", border: "none", color: "#EF6C4A", cursor: "pointer" }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
```

### Step 10: Create `apps/web/src/features/blocks/BlockPanel.tsx`

```tsx
import React, { useState } from "react";
import { useBlocks } from "../../hooks/useBlocks";
import { BlockCard } from "./BlockCard";
import { BlockModal } from "./BlockModal";
import type { BlockedSlot } from "@brkroutnxdle/shared";

export function BlockPanel() {
  const { blocks, deleteBlock } = useBlocks();
  const [editingBlock, setEditingBlock] = useState<BlockedSlot | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ fontWeight: 600, color: "#1E8C86", fontSize: "14px" }}>
          Blocks ({blocks.length})
        </span>
        <button
          onClick={() => setIsCreating(true)}
          style={{
            padding: "4px 12px", background: "#EF6C4A", color: "#fff",
            border: "none", borderRadius: "9999px", cursor: "pointer", fontSize: "12px", fontWeight: 700,
          }}
        >
          + Block
        </button>
      </div>

      {blocks.length === 0 && (
        <p style={{ fontSize: "13px", color: "#999", textAlign: "center", padding: "16px" }}>
          No blocked slots yet.
        </p>
      )}

      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {blocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            onEdit={setEditingBlock}
            onDelete={deleteBlock}
          />
        ))}
      </div>

      {(isCreating || editingBlock) && (
        <BlockModal
          block={editingBlock}
          onClose={() => { setIsCreating(false); setEditingBlock(null); }}
        />
      )}
    </div>
  );
}
```

### Step 11: Create `apps/web/src/features/blocks/BlockModal.tsx`

```tsx
import React, { useState } from "react";
import type { BlockedSlot, BlockType } from "@brkroutnxdle/shared";
import { BlockType as BlockTypeEnum } from "@brkroutnxdle/shared";
import { useBlocks } from "../../hooks/useBlocks";

interface BlockModalProps {
  block: BlockedSlot | null;
  onClose: () => void;
}

export function BlockModal({ block, onClose }: BlockModalProps) {
  const { createBlock, updateBlock } = useBlocks();
  const isEditing = block !== null;

  const [blockType, setBlockType] = useState<BlockType>(block?.blockType ?? BlockTypeEnum.SingleDay);
  const [title, setTitle] = useState(block?.title ?? "");
  const [startDate, setStartDate] = useState(block?.startDate ?? "");
  const [endDate, setEndDate] = useState(block?.endDate ?? "");
  const [startTime, setStartTime] = useState(block?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(block?.endTime ?? "10:00");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(block?.daysOfWeek ?? [1, 3, 5]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startDate) { setError("Start date is required"); return; }
    if (blockType === BlockTypeEnum.RecurringPeriod && !endDate) {
      setError("End date is required for period blocks"); return;
    }

    const base: Omit<BlockedSlot, "id" | "isRecurring"> = {
      title: title || undefined,
      blockType,
      startDate,
      endDate: blockType === BlockTypeEnum.RecurringPeriod ? endDate : undefined,
      startTime: blockType !== BlockTypeEnum.SingleDay ? startTime : undefined,
      endTime: blockType !== BlockTypeEnum.SingleDay ? endTime : undefined,
      daysOfWeek: blockType === BlockTypeEnum.RecurringWeekday ? daysOfWeek : undefined,
    };

    if (isEditing) {
      updateBlock(block!.id, base);
    } else {
      createBlock(base);
    }
    onClose();
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
  };
  const modalStyle: React.CSSProperties = {
    background: "#fff", borderRadius: "24px", padding: "32px",
    width: "440px", maxWidth: "90vw",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 20px", color: "#EF6C4A" }}>
          {isEditing ? "Edit Block" : "New Block"}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Label (optional)</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Type</span>
            <select value={blockType} onChange={(e) => setBlockType(e.target.value as BlockType)} style={inputStyle}>
              <option value="single-day">Single Day</option>
              <option value="recurring-weekday">Recurring Weekday</option>
              <option value="recurring-period">Recurring Period</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>
              {blockType === BlockTypeEnum.SingleDay ? "Date" : "Start Date"}
            </span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </label>

          {blockType === BlockTypeEnum.RecurringPeriod && (
            <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>End Date</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </label>
          )}

          {blockType !== BlockTypeEnum.SingleDay && (
            <>
              <div style={{ display: "flex", gap: "12px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>Start Time</span>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>End Time</span>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
                </label>
              </div>
            </>
          )}

          {blockType === BlockTypeEnum.RecurringWeekday && (
            <fieldset style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "12px" }}>
              <legend style={{ fontSize: "14px", fontWeight: 600 }}>Days of Week</legend>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                  <label key={day} style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <input
                      type="checkbox"
                      checked={daysOfWeek.includes(i)}
                      onChange={() => {
                        setDaysOfWeek((prev) =>
                          prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i],
                        );
                      }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

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
```

### Step 12: Update `apps/web/src/main.tsx` — Add TaskProvider and BlockProvider

Add the imports and wrap:

```tsx
import { TaskProvider } from "./contexts/TaskContext";
import { BlockProvider } from "./contexts/BlockContext";

// Inside the provider tree, add:
<TaskProvider>
  <BlockProvider>
    {/* existing providers */}
  </BlockProvider>
</TaskProvider>
```

### Step 13: Update `apps/web/src/components/Sidebar.tsx` — Wire TaskPanel and BlockPanel

Replace the static section content:

```tsx
import { TaskPanel } from "../features/tasks/TaskPanel";
import { BlockPanel } from "../features/blocks/BlockPanel";

// In the sections array, replace "content" with:
const sections = [
  {
    id: "tasks",
    label: "Tasks",
    content: <TaskPanel />,
  },
  {
    id: "blocks",
    label: "Blocked Slots",
    content: <BlockPanel />,
  },
  {
    id: "settings",
    label: "Settings",
    content: <p>Settings panel (will redirect to Settings modal)</p>,
  },
];

// Then render content as:
{openSection === section.id && (
  <div style={{ padding: "12px 16px" }}>
    {section.content}
  </div>
)}
```
