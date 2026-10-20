import { Button } from "@mantine/core";

interface SaveButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSaving: boolean;
  progress: number;
}

export function SaveButton({ onClick, disabled, isSaving, progress }: SaveButtonProps) {
  return (
    <Button color="green" radius="xl" onClick={onClick} disabled={disabled || isSaving} loading={isSaving}>
      {isSaving ? `Saving... ${progress}%` : "Save to Calendar"}
    </Button>
  );
}
