import React from "react";
import { ActionIcon, Badge, Card, Group, Stack, Text } from "@mantine/core";
import type { BlockedSlot, BlockType } from "@brkroutnxdle/shared";
import { BlockType as BlockTypeEnum } from "@brkroutnxdle/shared";

interface BlockCardProps {
  block: BlockedSlot;
  onEdit: (block: BlockedSlot) => void;
  onDelete: (id: string) => void;
}

const TYPE_LABELS: Record<BlockType, string> = {
  [BlockTypeEnum.SingleDay]: "Single Day",
  [BlockTypeEnum.RecurringWeekday]: "Recurring (Weekday)",
  [BlockTypeEnum.RecurringPeriod]: "Recurring (Period)",
};

export function BlockCard({ block, onEdit, onDelete }: BlockCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "block",
        blockId: block.id,
        blockType: block.blockType,
        title: block.title,
      }),
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      p="sm"
      radius="md"
      shadow="xs"
      withBorder
      bd="2px solid var(--mantine-color-red-6)"
      onClick={() => onEdit(block)}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4}>
          <Text size="sm" fw={700}>
            {block.title ?? TYPE_LABELS[block.blockType]}
          </Text>
          <Group gap="xs">
            <Badge size="xs" variant="light" color="red">{TYPE_LABELS[block.blockType]}</Badge>
            <Text size="xs" c="dimmed">
              {block.startDate}{block.endDate ? ` \u2192 ${block.endDate}` : ""}
              {block.startTime ? ` \u00B7 ${block.startTime}-${block.endTime}` : ""}
            </Text>
          </Group>
        </Stack>
        <ActionIcon aria-label="Delete block" variant="subtle" color="red"
          onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
        >
          ×
        </ActionIcon>
      </Group>
    </Card>
  );
}
