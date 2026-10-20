import { Button, Modal, Stack, Text } from "@mantine/core";

interface ConflictDialogProps {
  isOpen: boolean;
  changedEventCount: number;
  onReload: () => void;
  onDiscardPreview: () => void;
}

export function ConflictDialog({ isOpen, changedEventCount, onReload, onDiscardPreview }: ConflictDialogProps) {
  if (!isOpen) return null;

  return (
    <Modal opened={isOpen} onClose={onDiscardPreview} title="Calendar Changes Detected" centered size="sm">
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          {changedEventCount} event(s) in your Google Calendar have changed since you generated the current preview.
        </Text>
        <Text size="sm" c="dimmed">What would you like to do?</Text>
        <Button color="yellow" c="teal.9" radius="xl" onClick={onReload}>Reload — Load latest calendar data</Button>
        <Button variant="outline" color="red" radius="xl" onClick={onDiscardPreview}>Discard Preview — Start fresh</Button>
      </Stack>
    </Modal>
  );
}
