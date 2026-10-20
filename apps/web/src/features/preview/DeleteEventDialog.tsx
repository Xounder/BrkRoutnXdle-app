import { Button, Group, Modal, Text } from "@mantine/core";

interface DeleteEventDialogProps {
  isOpen: boolean;
  eventTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteEventDialog({ isOpen, eventTitle, onConfirm, onCancel }: DeleteEventDialogProps) {
  if (!isOpen) return null;

  return (
    <Modal opened={isOpen} onClose={onCancel} title="Delete Event" centered size="sm">
      <Text size="sm" c="dimmed" mb="lg">
        Are you sure you want to delete "{eventTitle}"? This action cannot be undone until you save.
      </Text>
      <Group justify="center">
        <Button variant="outline" color="teal" radius="xl" onClick={onCancel}>Cancel</Button>
        <Button color="red" radius="xl" onClick={onConfirm}>Delete</Button>
      </Group>
    </Modal>
  );
}
