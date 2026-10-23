import React, { useState } from "react";
import { Button, Checkbox, Divider, Group, NumberInput, Stack, Text } from "@mantine/core";
import { Modal } from "@brkroutnxdle/ui";
import type { Task, Priority, CustomRange, TimeGroupPreset, RestrictedRange, TaskRestriction } from "@brkroutnxdle/shared";
import { Priority as PriorityEnum, TIME_GROUP_PRESETS } from "@brkroutnxdle/shared";
import { useTasks } from "../../hooks/useTasks";
import { useCalendar } from "../../hooks/useCalendar";
import { updateCalendarEventForTask } from "../../utils/createCalendarEventFromTask";

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
  const { setEvents } = useCalendar();
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
      const updatedTask = { ...task!, ...baseTaskData, restrictions: buildRestrictions(task!.restrictions) };
      updateTask(task!.id, {
        ...baseTaskData,
        restrictions: updatedTask.restrictions,
      });

      // Reflect definition metadata on all existing placements, without scheduling another.
      setEvents((prev) => updateCalendarEventForTask(prev, updatedTask));
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

  return (
    <Modal isOpen onClose={onClose} title={isEditing ? "Edit Task" : "New Task"}>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
          <Stack component="label" gap={4}>
            <Text component="span" size="sm" fw={600}>Name</Text>
            <input
              id="task-name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Exercise, Reading, Practice"
              className="mantine-Input-input"
              autoFocus
            />
          </Stack>

          <Stack component="label" gap={4}>
            <Text component="span" size="sm" fw={600}>Duration (minutes)</Text>
            <select id="task-duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mantine-Input-input">
              {ALLOWED_DURATIONS.map((d) => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </select>
          </Stack>

          <Stack component="label" gap={4}>
            <Text component="span" size="sm" fw={600}>Priority</Text>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="mantine-Input-input">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </Stack>

          <Divider label="Time Groups" labelPosition="left" />
          <Stack gap="xs">
              {(Object.keys(TIME_GROUP_PRESETS) as TimeGroupPreset[]).map((preset) => (
                <Checkbox
                  key={preset}
                  label={TIME_GROUP_LABELS[preset]}
                  checked={selectedTimeGroups.includes(preset)}
                  onChange={() => handleTimeGroupToggle(preset)}
                />
              ))}
          </Stack>

          <Divider label="Custom Ranges" labelPosition="left" />
          <Stack gap="xs">
            {customRanges.map((range, index) => (
              <Group key={index} gap="xs" wrap="nowrap">
                <NumberInput
                  aria-label="Start"
                  min={0}
                  max={23}
                  value={range.startHour}
                  onChange={(value) => handleCustomRangeChange(index, "startHour", Number(value))}
                  w={85}
                  placeholder="Start"
                />
                <Text>&ndash;</Text>
                <NumberInput
                  aria-label="End"
                  min={0}
                  max={23}
                  value={range.endHour}
                  onChange={(value) => handleCustomRangeChange(index, "endHour", Number(value))}
                  w={85}
                  placeholder="End"
                />
                <Button type="button" size="xs" color="red" onClick={() => handleRemoveCustomRange(index)}>
                  Remove
                </Button>
              </Group>
            ))}
            <Button type="button" size="xs" onClick={handleAddCustomRange}>
              + Add Range
            </Button>
          </Stack>

          <NumberInput
              label="Frequency (times per week)"
              min={1}
              max={7}
              value={frequency}
              onChange={(value) => setFrequency(Math.min(7, Math.max(1, Number(value))))}
            />

          <NumberInput
              label="Gap Between Days"
              min={0}
              max={6}
              value={gapDays}
              onChange={(value) => setGapDays(Math.min(6, Math.max(0, Number(value))))}
            />

          <Checkbox label="Allow Same Day" checked={allowSameDay} onChange={(e) => setAllowSameDay(e.target.checked)} />

          {error && <Text c="red" size="sm">{error}</Text>}

          <Divider />
          <Group justify="flex-end" mt="xs">
            <Button type="button" variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit">
              {isEditing ? "Save" : "Create"}
            </Button>
          </Group>
          </Stack>
        </form>
    </Modal>
  );
}
