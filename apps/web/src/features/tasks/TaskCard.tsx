import { ActionIcon, Badge, Card, Group, Stack, Text } from "@mantine/core";
import type { Task, Priority } from "@brkroutnxdle/shared";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "blue",
  medium: "teal",
  high: "yellow",
  critical: "red",
};

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <Card
      data-task-drag="true"
      data-task-id={task.id}
      data-task-title={task.title}
      data-task-duration={task.duration}
      p="sm"
      radius="md"
      shadow="xs"
      withBorder
      bd={`2px solid var(--mantine-color-${PRIORITY_COLORS[task.priority]}-6)`}
      onClick={() => onEdit(task)}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4}>
          <Text size="sm" fw={700}>{task.title}</Text>
          <Group gap="xs">
            <Badge size="xs" variant="light" color={PRIORITY_COLORS[task.priority]}>{task.duration}min</Badge>
            <Text size="xs" c="dimmed">
              {task.restrictions.length > 0 ? `${task.restrictions.length} restriction(s)` : "no restrictions"}
            </Text>
          </Group>
        </Stack>
        <ActionIcon
          aria-label="Delete task"
          variant="subtle"
          color="red"
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        >
          ×
        </ActionIcon>
      </Group>
    </Card>
  );
}
