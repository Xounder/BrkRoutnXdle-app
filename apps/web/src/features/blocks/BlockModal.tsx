import React, { useState } from "react";
import { Button, Checkbox, Divider, Fieldset, Group, Stack, Text, TextInput } from "@mantine/core";
import { Modal } from "@brkroutnxdle/ui";
import type { BlockedSlot, BlockType } from "@brkroutnxdle/shared";
import { BlockType as BlockTypeEnum } from "@brkroutnxdle/shared";
import { useBlocks } from "../../hooks/useBlocks";

interface BlockModalProps {
  block: BlockedSlot | null;
  onClose: () => void;
  defaultStartDate?: string; // pre-filled start date when creating (block is null)
  defaultEndDate?: string; // pre-filled end date when creating (block is null)
  defaultStartTime?: string; // pre-filled start time (HH:mm) when creating from slot
  defaultEndTime?: string; // pre-filled end time (HH:mm) when creating from slot
}

export function BlockModal({ block, onClose, defaultStartDate, defaultEndDate, defaultStartTime, defaultEndTime }: BlockModalProps) {
  const { createBlock, updateBlock } = useBlocks();
  const isEditing = block !== null;

  const [blockType, setBlockType] = useState<BlockType>(block?.blockType ?? BlockTypeEnum.SingleDay);
  const [title, setTitle] = useState(block?.title ?? "");
  const [startDate, setStartDate] = useState(block?.startDate ?? defaultStartDate ?? "");
  const [endDate, setEndDate] = useState(block?.endDate ?? defaultEndDate ?? "");
  // For SingleDay blocks created from a slot, pre-fill time from the slot selection
  const [startTime, setStartTime] = useState(block?.startTime ?? defaultStartTime ?? "09:00");
  const [endTime, setEndTime] = useState(block?.endTime ?? defaultEndTime ?? "10:00");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(block?.daysOfWeek ?? [1, 3, 5]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startDate) { setError("Start date is required"); return; }
    if (blockType === BlockTypeEnum.RecurringPeriod && !endDate) {
      setError("End date is required for period blocks"); return;
    }

    // For SingleDay blocks, combine date and time into full ISO-8601 datetime strings
    const resolvedStartDate = blockType === BlockTypeEnum.SingleDay
      ? `${startDate}T${startTime}:00`
      : startDate;
    const resolvedEndDate = blockType === BlockTypeEnum.SingleDay && startDate === endDate
      ? `${endDate}T${endTime}:00`
      : blockType === BlockTypeEnum.RecurringPeriod
        ? endDate
        : undefined;

    const base: Omit<BlockedSlot, "id" | "isRecurring"> = {
      title: title || undefined,
      blockType,
      startDate: resolvedStartDate,
      endDate: resolvedEndDate,
      startTime: blockType !== BlockTypeEnum.SingleDay ? startTime : undefined,
      endTime: blockType !== BlockTypeEnum.SingleDay ? endTime : undefined,
      daysOfWeek: blockType === BlockTypeEnum.RecurringWeekday ? daysOfWeek : undefined,
    };

    if (isEditing) {
      updateBlock(block!.id, base);
    } else {
      createBlock(base);
    }
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={isEditing ? "Edit Block" : "New Block"}>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput label="Label (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />

          <Stack component="label" gap={4}>
            <Text component="span" size="sm" fw={600}>Type</Text>
            <select value={blockType} onChange={(e) => setBlockType(e.target.value as BlockType)} className="mantine-Input-input">
              <option value="single-day">Single Day</option>
              <option value="recurring-weekday">Recurring Weekday</option>
              <option value="recurring-period">Recurring Period</option>
            </select>
          </Stack>

          <Stack component="label" gap={4}>
            <Text component="span" size="sm" fw={600}>
              {blockType === BlockTypeEnum.SingleDay ? "Date" : "Start Date"}
            </Text>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mantine-Input-input" />
          </Stack>

          {blockType === BlockTypeEnum.RecurringPeriod && (
            <Stack component="label" gap={4}>
              <Text component="span" size="sm" fw={600}>End Date</Text>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mantine-Input-input" />
            </Stack>
          )}

          <Group grow align="flex-start">
            <Stack component="label" gap={4}>
              <Text component="span" size="sm" fw={600}>Start Time</Text>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mantine-Input-input" />
            </Stack>
            <Stack component="label" gap={4}>
              <Text component="span" size="sm" fw={600}>End Time</Text>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mantine-Input-input" />
            </Stack>
          </Group>

          {blockType === BlockTypeEnum.RecurringWeekday && (
            <Fieldset legend="Days of Week">
              <Group gap="sm">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                  <Checkbox key={day} label={day} checked={daysOfWeek.includes(i)} onChange={() => {
                    setDaysOfWeek((prev) => prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]);
                  }} />
                ))}
              </Group>
            </Fieldset>
          )}

          {error && <Text c="red" size="sm">{error}</Text>}

          <Divider />
          <Group justify="flex-end">
            <Button type="button" variant="default" onClick={onClose}>Cancel</Button>
            <Button type="submit">
              {isEditing ? "Save" : "Create"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
