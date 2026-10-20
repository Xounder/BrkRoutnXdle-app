import { Button } from "@mantine/core";

interface CalculateWeekButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}

export function CalculateWeekButton({ onClick, disabled, isLoading }: CalculateWeekButtonProps) {
  return (
    <Button color="yellow" c="teal.9" radius="xl" onClick={onClick} disabled={disabled || isLoading} loading={isLoading}>
      {isLoading ? "Generating..." : "Calculate Week"}
    </Button>
  );
}
