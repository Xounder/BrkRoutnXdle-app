import { ActionIcon, Group, Paper, Stack, Text } from "@mantine/core";
import type { AllocationFailure } from "@brkroutnxdle/domain";

interface AllocationFailurePanelProps {
  failures: AllocationFailure[];
  onDismiss: () => void;
}

export function AllocationFailurePanel({ failures, onDismiss }: AllocationFailurePanelProps) {
  if (failures.length === 0) return null;

  return (
    <Paper p="md" my="sm" radius="lg" bg="orange.0" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={700} c="orange.9" size="sm">Allocation Warning</Text>
          <ActionIcon variant="subtle" color="orange" onClick={onDismiss} aria-label="Dismiss allocation warning">×</ActionIcon>
        </Group>
        <Text size="sm" c="dimmed">
          Some tasks could not be fully allocated. You can still save the partial schedule or adjust tasks and regenerate.
        </Text>
        {failures.map((f) => (
          <Paper key={f.taskId} p="xs" radius="sm">
            <Group justify="space-between">
              <Text fw={600} size="sm">{f.taskName}</Text>
              <Text c="orange.8" size="sm">{f.allocated}/{f.required} allocated</Text>
            </Group>
          </Paper>
        ))}
        <Text size="xs" c="dimmed" ta="center">
          You can accept this partial allocation or adjust your tasks and try again.
        </Text>
      </Stack>
    </Paper>
  );
}
