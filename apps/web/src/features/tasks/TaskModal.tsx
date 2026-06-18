import React, { useState } from "react";
import type { Task, Priority, CustomRange, TimeGroupPreset, RestrictedRange, TaskRestriction } from "@brkroutnxdle/shared";
import { Priority as PriorityEnum, TIME_GROUP_PRESETS } from "@brkroutnxdle/shared";
import { useTasks } from "../../hooks/useTasks";

// --- Restriction helpers ---

function extractTimeGroups(restrictions: TaskRestriction[]): TimeGroupPreset[] {
  const entry = restrictions.find(
    (r): r is TaskRestriction & { type: "restricted-range"; ranges: RestrictedRange[] } =>
      r.type === "restricted-range",
  );
  if (!entry) return [];
  return entry.ranges
    .filter((r): r is RestrictedRange & { preset: TimeGroupPreset } => "preset" in r)
    .map((r) => r.preset);
}

function extractCustomRanges(restrictions: TaskRestriction[]): CustomRange[] {
  const entry = restrictions.find(
    (r): r is TaskRestriction & { type: "restricted-range"; ranges: RestrictedRange[] } =>
      r.type === "restricted-range",
  );
  if (!entry) return [];
  return entry.ranges
    .filter((r): r is RestrictedRange & { custom: CustomRange } => "custom" in r)
    .map((r) => r.custom);
}

function formatPresetLabel(preset: TimeGroupPreset): string {
  const range = TIME_GROUP_PRESETS[preset];
  const name = preset.charAt(0).toUpperCase() + preset.slice(1);
  return `${name} (${range.startHour}\u2013${range.endHour})`;
}

interface TaskModalProps {
  task: Task | null; // null = creating, non-null = editing
  onClose: () => void;
  defaultDuration?: number; // pre-filled duration when creating (task is null)
}

export function TaskModal({ task, onClose, defaultDuration }: TaskModalProps) {
  const { createTask, updateTask } = useTasks();
  const isEditing = task !== null;

  const [title, setTitle] = useState(task?.title ?? "");
  const [duration, setDuration] = useState(task?.duration ?? defaultDuration ?? 60);
  const [priority, setPriority] = useState<Priority>(task?.priority ?? PriorityEnum.Medium);
  const [selectedTimeGroups, setSelectedTimeGroups] = useState<TimeGroupPreset[]>(
    () => extractTimeGroups(task?.restrictions ?? []),
  );
  const [customRanges, setCustomRanges] = useState<CustomRange[]>(
    () => extractCustomRanges(task?.restrictions ?? []),
  );
  const [frequency, setFrequency] = useState(task?.frequency ?? 1);
  const [gapDays, setGapDays] = useState(task?.gapDays ?? 1);
  const [allowSameDay, setAllowSameDay] = useState(task?.allowSameDay ?? false);
  const [error, setError] = useState<string | null>(null);

  const ALLOWED_DURATIONS = [30, 60, 90, 120, 150, 180];

  const TIME_GROUP_LABELS: Record<TimeGroupPreset, string> = {
    morning: formatPresetLabel("morning"),
    afternoon: formatPresetLabel("afternoon"),
    evening: formatPresetLabel("evening"),
    night: formatPresetLabel("night"),
  };

  const handleTimeGroupToggle = (preset: TimeGroupPreset) => {
    setSelectedTimeGroups((prev) =>
      prev.includes(preset) ? prev.filter((p) => p !== preset) : [...prev, preset],
    );
  };

  const handleAddCustomRange = () => {
    setCustomRanges((prev) => [...prev, { startHour: 0, endHour: 0 }]);
  };

  const handleRemoveCustomRange = (index: number) => {
    setCustomRanges((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCustomRangeChange = (index: number, field: "startHour" | "endHour", value: number) => {
    const clamped = Math.min(23, Math.max(0, value));
    setCustomRanges((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: clamped } : r)),
    );
  };

  const buildRestrictions = (existing: TaskRestriction[]): TaskRestriction[] => {
    const filtered: TaskRestriction[] = existing.filter((r) => r.type !== "restricted-range");
    const ranges: RestrictedRange[] = [
      ...selectedTimeGroups.map((preset) => ({ preset }) as RestrictedRange),
      ...customRanges.map((c) => ({ custom: c }) as RestrictedRange),
    ];
    if (ranges.length > 0) {
      filtered.push({ type: "restricted-range", ranges });
    }
    return filtered;
  };

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

    const baseTaskData = {
      title: title.trim(),
      duration,
      priority,
      frequency,
      gapDays,
      allowSameDay,
    };

    if (isEditing) {
      updateTask(task!.id, {
        ...baseTaskData,
        restrictions: buildRestrictions(task!.restrictions),
      });
    } else {
      createTask({
        ...baseTaskData,
        description: undefined,
        isActive: true,
        restrictions: buildRestrictions([]),
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

          {/* Time Groups */}
          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <legend style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
              Time Groups
            </legend>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {(Object.keys(TIME_GROUP_PRESETS) as TimeGroupPreset[]).map((preset) => (
                <label
                  key={preset}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    fontSize: "14px", cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTimeGroups.includes(preset)}
                    onChange={() => handleTimeGroupToggle(preset)}
                  />
                  {TIME_GROUP_LABELS[preset]}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Custom Ranges */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Custom Ranges</span>
            {customRanges.map((range, index) => (
              <div key={index} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={range.startHour}
                  onChange={(e) => handleCustomRangeChange(index, "startHour", Number(e.target.value))}
                  style={{ ...inputStyle, width: "70px" }}
                  placeholder="Start"
                />
                <span>&ndash;</span>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={range.endHour}
                  onChange={(e) => handleCustomRangeChange(index, "endHour", Number(e.target.value))}
                  style={{ ...inputStyle, width: "70px" }}
                  placeholder="End"
                />
                <button type="button" onClick={() => handleRemoveCustomRange(index)} style={removeBtnStyle}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={handleAddCustomRange} style={addBtnStyle}>
              + Add Range
            </button>
          </div>

          {/* Frequency */}
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Frequency (times per week)</span>
            <input
              type="number"
              min={1}
              max={7}
              value={frequency}
              onChange={(e) => setFrequency(Math.min(7, Math.max(1, Number(e.target.value))))}
              style={inputStyle}
            />
          </label>

          {/* Gap Between Days */}
          <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Gap Between Days</span>
            <input
              type="number"
              min={0}
              max={6}
              value={gapDays}
              onChange={(e) => setGapDays(Math.min(6, Math.max(0, Number(e.target.value))))}
              style={inputStyle}
            />
          </label>

          {/* Allow Same Day */}
          <label
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              fontSize: "14px", cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={allowSameDay}
              onChange={(e) => setAllowSameDay(e.target.checked)}
            />
            Allow Same Day
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

const removeBtnStyle: React.CSSProperties = {
  padding: "4px 8px", background: "#EF6C4A", color: "#fff",
  border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px",
};

const addBtnStyle: React.CSSProperties = {
  padding: "6px 12px", background: "#2BA8A2", color: "#fff",
  border: "none", borderRadius: "9999px", cursor: "pointer", fontSize: "12px", fontWeight: 600,
};
