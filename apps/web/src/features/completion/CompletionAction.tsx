import { Button } from "@mantine/core";

interface CompletionActionProps {
  eventId: string;
  isCompleted: boolean;
  isGenerated: boolean;
  onToggle: (eventId: string, isCompleted: boolean) => void;
}

export function CompletionAction({ eventId, isCompleted, isGenerated, onToggle }: CompletionActionProps) {
  if (!isGenerated) return null;

  return (
    <Button
      size="compact-xs"
      radius="xl"
      color="green"
      variant={isCompleted ? "filled" : "outline"}
      onClick={(e) => { e.stopPropagation(); onToggle(eventId, isCompleted); }}
      title={isCompleted ? "Mark as incomplete" : "Mark as completed"}
    >
      {isCompleted ? "✓ Done" : "Complete"}
    </Button>
  );
}
