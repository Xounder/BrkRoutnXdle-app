import { Button, Group, Paper, Text } from "@mantine/core";
import type { GuideStep } from "./savedWeekSummary";

export function FirstUseGuide({ step, dismissed, onDismiss, onCreate, onCalculate, onPreview }: {
  step: GuideStep; dismissed: boolean; onDismiss: () => void;
  onCreate: () => void; onCalculate: () => void; onPreview: () => void;
}) {
  if (dismissed) return null;
  const label = { create: "Create a task to get started", calculate: "Calculate this week to see a proposal",
    preview: "Inspect the proposed plan and shortfalls, then save or discard explicitly",
    success: "Saved schedule confirmed for this week" }[step];
  return <Paper withBorder p="sm" m="sm" aria-label="First-use guide">
    <Group justify="space-between" wrap="wrap">
      <Text size="sm">Next step: {label}</Text>
      <Group gap="xs">
        {step === "create" && <Button size="xs" onClick={onCreate}>Add first task</Button>}
        {step === "calculate" && <Button size="xs" onClick={onCalculate}>Plan this week</Button>}
        {step === "preview" && <Button size="xs" onClick={onPreview}>Review proposal</Button>}
        <Button size="xs" variant="subtle" onClick={onDismiss}>Dismiss guide</Button>
      </Group>
    </Group>
  </Paper>;
}
