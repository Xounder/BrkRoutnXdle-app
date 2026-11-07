import { Stack, Text } from "@mantine/core";
import { Modal } from "@brkroutnxdle/ui";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { CompletionAction } from "../../features/completion/CompletionAction";
import { useCompletion } from "../../hooks/useCompletion";
import type { PreviewRange } from "./previewSchedule";

export function OccurrenceReviewModal({ event, range, onClose }: {
  event: CalendarEvent; range: PreviewRange; onClose: () => void;
}) {
  const { toggleCompletion, isToggling, error } = useCompletion(range);
  return <Modal isOpen title="Saved occurrence" onClose={onClose}>
    <Stack gap="sm">
      <Text>{event.title?.trim() || "Untitled occurrence"}</Text>
      <Text size="sm">{new Date(event.start).toLocaleString()} · {event.isCompleted ? "Completed" : "Outstanding"}</Text>
      {isToggling ? <Text size="sm">Updating completion · awaiting calendar confirmation</Text> :
        <CompletionAction eventId={event.id} isCompleted={event.isCompleted}
          isGenerated={true} onToggle={toggleCompletion} />}
      {error && <Text role="alert" c="red">Completion not confirmed. Refresh the saved week to retry.</Text>}
    </Stack>
  </Modal>;
}
