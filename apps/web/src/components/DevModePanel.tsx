import { useEffect, useState } from "react";
import { Button, Checkbox, Modal, Stack, Textarea } from "@mantine/core";

interface DevModePanelProps {
  isOpen: boolean;
  onClose: () => void;
  enabled: boolean;
  token: string | null;
  onToggleEnabled: (enabled: boolean) => void;
  onUpdateToken: (token: string) => void;
}

export function DevModePanel({ isOpen, onClose, enabled, token, onToggleEnabled, onUpdateToken }: DevModePanelProps) {
  const [draft, setDraft] = useState(token ?? "");

  useEffect(() => {
    setDraft(token ?? "");
  }, [token]);

  return (
    <Modal opened={isOpen} onClose={onClose} title="Dev Mode" centered size="sm">
      <Stack gap="md">
        <Checkbox
          label="Enable Dev Mode Bypass" checked={enabled}
          onChange={(event) => onToggleEnabled(event.currentTarget.checked)}
        />
        {enabled && (
          <>
            <Textarea
              label="OAuth Playground Token" value={draft}
              onChange={(event) => {
                setDraft(event.currentTarget.value);
                onUpdateToken(event.currentTarget.value);
              }}
              placeholder="Paste your Google OAuth Playground token here..."
              rows={3} resize="none"
            />
            <Button onClick={() => location.reload()}>Recarregar e aplicar</Button>
          </>
        )}
      </Stack>
    </Modal>
  );
}
