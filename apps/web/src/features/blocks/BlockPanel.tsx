import { useState } from "react";
import { Button, Group, Paper, ScrollArea, Stack, Text, Title } from "@mantine/core";
import { useBlocks } from "../../hooks/useBlocks";
import { BlockCard } from "./BlockCard";
import { BlockModal } from "./BlockModal";
import type { BlockedSlot } from "@brkroutnxdle/shared";

export function BlockPanel() {
  const { blocks, deleteBlock } = useBlocks();
  const [editingBlock, setEditingBlock] = useState<BlockedSlot | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <Paper p="sm" radius="md">
      <Group justify="space-between" mb="sm">
        <Title order={4}>Blocks ({blocks.length})</Title>
        <Button size="xs" radius="xl" color="red" onClick={() => setIsCreating(true)}>
          + Block
        </Button>
      </Group>

      {blocks.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" p="md">
          No blocked slots yet.
        </Text>
      )}

      {blocks.length > 0 && (
        <ScrollArea.Autosize mah={300}>
          <Stack gap="xs">
            {blocks.map((block) => (
              <BlockCard
                key={block.id}
                block={block}
                onEdit={setEditingBlock}
                onDelete={deleteBlock}
              />
            ))}
          </Stack>
        </ScrollArea.Autosize>
      )}

      {(isCreating || editingBlock) && (
        <BlockModal
          block={editingBlock}
          onClose={() => { setIsCreating(false); setEditingBlock(null); }}
        />
      )}
    </Paper>
  );
}
