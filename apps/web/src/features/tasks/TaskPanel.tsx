import { useEffect, useRef, useState } from "react";
import { Draggable } from "@fullcalendar/interaction";
import { Button, Group, Paper, ScrollArea, Stack, Text, Title } from "@mantine/core";
import { useTasks } from "../../hooks/useTasks";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import type { Task } from "@brkroutnxdle/shared";

export function TaskPanel() {
  const dragContainer = useRef<HTMLDivElement>(null);
  const { tasks, deleteTask } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!dragContainer.current) return;
    const draggable = new Draggable(dragContainer.current, {
      itemSelector: '[data-task-drag="true"]',
      eventData: (element) => ({ title: element.dataset.taskTitle, create: false }),
    });
    return () => draggable.destroy();
  }, [tasks.length]);

  return (
    <Paper p="sm" radius="md">
      <Group justify="space-between" mb="sm">
        <Title order={4}>Tasks ({tasks.length})</Title>
        <Button size="xs" radius="xl" onClick={() => setIsCreating(true)}>
          + New
        </Button>
      </Group>

      {tasks.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" p="md">
          No tasks yet. Click "+ New" to create one.
        </Text>
      )}

      {tasks.length > 0 && (
        <ScrollArea.Autosize mah={300}>
          <Stack gap="xs" ref={dragContainer}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={setEditingTask}
                onDelete={deleteTask}
              />
            ))}
          </Stack>
        </ScrollArea.Autosize>
      )}

      {(isCreating || editingTask) && (
        <TaskModal
          task={editingTask}
          onClose={() => { setIsCreating(false); setEditingTask(null); }}
        />
      )}
    </Paper>
  );
}
