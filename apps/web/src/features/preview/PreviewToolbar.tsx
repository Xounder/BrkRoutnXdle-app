import { Button, Group, Paper, Text } from "@mantine/core";
import { SaveButton } from "./SaveButton";

interface PreviewToolbarProps {
  onGenerateAgain: () => void;
  onDiscard: () => void;
  isLoading: boolean;
  eventCount: number;
  onSave: () => void;
  saveState: { status: string; progress: number };
}

export function PreviewToolbar({
  onGenerateAgain, onDiscard, isLoading, eventCount, onSave, saveState,
}: PreviewToolbarProps) {
  return (
    <Paper p="sm" radius="md" bg="teal.0" withBorder>
      <Group gap="sm" wrap="wrap">
        <Text fw={600} c="teal.8" size="sm">Preview: {eventCount} events</Text>
        <Button variant="outline" color="teal" radius="xl" onClick={onGenerateAgain} disabled={isLoading}>
          Generate Again
        </Button>
        <Button variant="outline" color="red" radius="xl" onClick={onDiscard}>
          Discard
        </Button>
        <SaveButton onClick={onSave} disabled={isLoading} isSaving={saveState.status === "saving"} progress={saveState.progress} />
      </Group>
    </Paper>
  );
}
