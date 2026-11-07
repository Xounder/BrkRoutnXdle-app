import { ActionIcon, Button, Group, Paper, Stack, Text } from "@mantine/core";
import type { AllocationFailure } from "@brkroutnxdle/domain";

export interface AllocationFailurePanelProps {
  failures: AllocationFailure[];
  onDismiss: () => void;
  editTask?: (taskId: string) => void;
  reviewBlocks?: () => void;
  settings?: () => void;
  regenerate?: () => void;
  /** When supplied, only these currently existing task IDs can be opened. */
  availableTaskIds?: ReadonlySet<string>;
}

export function AllocationFailurePanel({
  failures, onDismiss, editTask, reviewBlocks, settings, regenerate, availableTaskIds,
}: AllocationFailurePanelProps) {
  if (failures.length === 0) return null;

  return (
    <Paper p="md" my="sm" radius="lg" bg="orange.0" withBorder aria-label="Allocation warning">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={700} c="orange.9" size="sm">Allocation Warning</Text>
          <ActionIcon variant="subtle" color="orange" onClick={onDismiss} aria-label="Dismiss allocation warning">×</ActionIcon>
        </Group>
        <Text size="sm" c="dimmed">
          Observed result: some task occurrences could not be placed in this preview. The precise cause is unknown from these counts.
        </Text>
        {failures.map((failure) => {
          const missing = Math.max(0, failure.required - failure.allocated);
          const canEdit = Boolean(editTask) && (!availableTaskIds || availableTaskIds.has(failure.taskId));
          return (
            <Paper key={failure.taskId} p="xs" radius="sm">
              <Stack gap="xs">
                <Text fw={600} size="sm">{failure.taskName} (task ID: {failure.taskId})</Text>
                <Text c="orange.8" size="sm">
                  {failure.allocated} of {failure.required} occurrences allocated; {missing} not placed.
                </Text>
                <Button size="xs" variant="light" onClick={() => editTask?.(failure.taskId)}
                  disabled={!canEdit} aria-label={`Edit task ${failure.taskName} (ID: ${failure.taskId})`}>
                  Edit this task
                </Button>
              </Stack>
            </Paper>
          );
        })}
        <Text size="sm">
          Possible actions: review your blocks or settings, or edit a task, then regenerate to review a new preview.
        </Text>
        <Group gap="xs" wrap="wrap">
          <Button size="xs" variant="outline" onClick={reviewBlocks} disabled={!reviewBlocks}>Review or edit blocks</Button>
          <Button size="xs" variant="outline" onClick={settings} disabled={!settings}>Open settings</Button>
          <Button size="xs" variant="outline" onClick={regenerate} disabled={!regenerate}>Regenerate preview</Button>
        </Group>
        <Text size="xs" c="dimmed">
          Editing changes inputs, not this preview or your saved calendar. Review a new preview after regenerating.
          You may still save this partial preview, but saving to your calendar requires an explicit action.
        </Text>
      </Stack>
    </Paper>
  );
}
