import { Affix, Badge, UnstyledButton } from "@mantine/core";

interface DevModeBadgeProps {
  enabled: boolean;
  onClick: () => void;
}

export function DevModeBadge({ enabled, onClick }: DevModeBadgeProps) {
  if (import.meta.env.PROD) return null;

  return (
    <Affix position={{ bottom: 8, left: 8 }} zIndex={999}>
      <UnstyledButton
        onClick={onClick}
        title={enabled ? "Dev mode active — click to configure" : "Dev mode inactive — click to configure"}
        aria-label="Configure dev mode"
      >
        <Badge color={enabled ? "orange" : "teal"} variant="filled" size="lg">
          {enabled ? "⚡ DEV" : "DEV"}
        </Badge>
      </UnstyledButton>
    </Affix>
  );
}
