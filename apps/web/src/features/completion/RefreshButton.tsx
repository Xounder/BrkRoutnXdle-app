import { Button } from "@mantine/core";

interface RefreshButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function RefreshButton({ onClick, isLoading }: RefreshButtonProps) {
  return (
    <Button variant="outline" color="blue" radius="xl" size="sm" onClick={onClick} disabled={isLoading} loading={isLoading}>
      {isLoading ? "Refreshing..." : "↻ Refresh"}
    </Button>
  );
}
