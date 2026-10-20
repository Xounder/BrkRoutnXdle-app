import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Modal, Stack, Text } from "@mantine/core";

const DURATIONS = [30, 60, 90, 120, 150, 180];

interface CreateActionModalProps {
  start: string;
  end: string;
  onCreateBlock: (start: string, end: string) => void;
  onCreateTaskInline?: (name: string, duration: number, start: string, end: string) => void;
  onClose: () => void;
}

function formatTimeDisplay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateDisplay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function CreateActionModal({ start, end, onCreateBlock, onCreateTaskInline, onClose }: CreateActionModalProps) {
  const [mode, setMode] = useState<"menu" | "form">("menu");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(() => {
    const min = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    return DURATIONS.reduce((prev, curr) =>
      Math.abs(curr - min) < Math.abs(prev - min) ? curr : prev
    );
  });
  const [error, setError] = useState<string | null>(null);

  const sameDay = new Date(start).toDateString() === new Date(end).toDateString();
  const timeLabel = sameDay
    ? `${formatDateDisplay(start)}, ${formatTimeDisplay(start)} – ${formatTimeDisplay(end)}`
    : `${formatDateDisplay(start)} ${formatTimeDisplay(start)} – ${formatDateDisplay(end)} ${formatTimeDisplay(end)}`;
  const durationMin = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Task name is required");
      return;
    }
    if (!DURATIONS.includes(duration)) {
      setError("Duration must be 30, 60, 90, 120, 150, or 180 minutes");
      return;
    }
    onCreateTaskInline?.(name.trim(), duration, start, end);
  };

  return (
    <Modal opened onClose={onClose} title="Create in this slot" centered size="sm">
      <Text size="sm" c="dimmed" mb="lg">{timeLabel} ({durationMin} min)</Text>
      {mode === "menu" ? (
        <Stack gap="sm">
          <Button color="orange" radius="xl" onClick={() => onCreateBlock(start, end)}>Create Block</Button>
          <Button color="teal" radius="xl" onClick={() => setMode("form")}>Create Task</Button>
          <Button variant="outline" color="teal" radius="xl" onClick={onClose}>Cancel</Button>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Stack gap={4}>
              <label htmlFor="task-name">Name</label>
              <input
                id="task-name"
                className="mantine-Input-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Task name"
                autoFocus
              />
            </Stack>
            <Stack gap={4}>
              <label htmlFor="task-duration">Duration (minutes)</label>
              <select
                id="task-duration"
                className="mantine-Input-input"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </Stack>
            {error && <Text c="red" size="sm" role="alert">{error}</Text>}
            <Button type="submit" color="teal" radius="xl">Create Task</Button>
            <Button
              type="button"
              variant="outline"
              color="teal"
              radius="xl"
              onClick={() => {
                setMode("menu");
                setError(null);
                setName("");
                setDuration(DURATIONS.reduce((prev, curr) =>
                  Math.abs(curr - durationMin) < Math.abs(prev - durationMin) ? curr : prev
                ));
              }}
            >Back</Button>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
