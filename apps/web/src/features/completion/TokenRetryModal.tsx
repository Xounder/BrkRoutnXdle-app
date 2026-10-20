import { useEffect, useState } from "react";
import { Button, Group, Stack, Text, Textarea } from "@mantine/core";
import { Modal } from "@brkroutnxdle/ui";
import { useDevModeContext } from "../../contexts/DevModeContext";

interface TokenRetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export function TokenRetryModal({ isOpen, onClose, onRetry }: TokenRetryModalProps) {
  const { updateToken } = useDevModeContext();
  const [insertMode, setInsertMode] = useState(false);
  const [draftToken, setDraftToken] = useState("");

  useEffect(() => {
    if (isOpen) {
      setInsertMode(false);
      setDraftToken("");
    }
  }, [isOpen]);

  const handleRetry = () => {
    onRetry();
    onClose();
  };

  const handleApply = () => {
    const trimmed = draftToken.trim();
    if (!trimmed) return;
    updateToken(trimmed);
    onRetry();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Google token expired">
      {insertMode ? (
        <Stack gap="sm">
          <Text size="sm" c="dimmed">Insert a valid Google OAuth token to retry the calendar sync.</Text>
          <Textarea
            value={draftToken}
            onChange={(e) => setDraftToken(e.target.value)}
            placeholder="Paste your Google OAuth Playground token here..."
            rows={3}
            autosize={false}
          />
          <Group grow>
            <Button variant="outline" color="teal" onClick={() => setInsertMode(false)}>Back</Button>
            <Button color="teal" onClick={handleApply} disabled={!draftToken.trim()}>Apply &amp; retry</Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="sm">
          <Text size="sm" fw={600} c="red.9">Google token expired. Please re-authenticate.</Text>
          <Group grow>
            <Button color="teal" onClick={() => setInsertMode(true)}>Insert another token</Button>
            <Button variant="outline" color="teal" onClick={handleRetry}>Retry</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
