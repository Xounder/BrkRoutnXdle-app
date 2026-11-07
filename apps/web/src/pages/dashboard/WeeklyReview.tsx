import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import type { RemoteConfirmation } from "../../services/remoteConfirmation";
import type { WeeklySummary } from "./savedWeekSummary";
import type { PreviewRange } from "./previewSchedule";
import { CompletionAction } from "../../features/completion/CompletionAction";
import { useCompletion } from "../../hooks/useCompletion";

export function WeeklyReview({ range, timezone, snapshot, summary }: {
  range: PreviewRange; snapshot: RemoteConfirmation & { refresh: () => Promise<void> };
  summary: WeeklySummary | null; timezone: string;
}) {
  const { toggleCompletion, isToggling, error } = useCompletion(range);
  const week = new Date(range.timeMin).toLocaleDateString(undefined, { dateStyle: "medium", timeZone: timezone });
  return <Paper withBorder p="sm" m="sm" aria-label="Saved weekly review">
    <Stack gap="xs">
      <Group justify="space-between" wrap="wrap">
        <Text fw={700}>Saved weekly review · Week of {week}</Text>
        <Button size="xs" variant="subtle" onClick={() => { void snapshot.refresh().catch(() => undefined); }}>
          Check saved week
        </Button>
      </Group>
      {isToggling && <Text size="sm">Updating completion · awaiting calendar confirmation</Text>}
      {error && <Text role="alert" c="red" size="sm">Completion not confirmed. Check saved week to retry.</Text>}
      {summary ? <>
        <Text size="sm">{summary.occurrences.length ?
          `${summary.completed.length} of ${summary.occurrences.length} saved generated occurrences completed` :
          "No saved generated occurrences"}</Text>
        <Text size="xs" c="dimmed">Confirmed from calendar {new Date(snapshot.confirmedAt!).toLocaleString()} · Saved pinned occurrences included</Text>
        {summary.completed.length > 0 && <div><Text size="sm" fw={600}>Completed</Text>
          <ul>{summary.completed.map(event => <li key={event.id}>{event.title?.trim() || "Untitled occurrence"} {!isToggling && <CompletionAction eventId={event.id} isCompleted={true} isGenerated={true} onToggle={toggleCompletion} />}</li>)}</ul></div>}
        {summary.outstanding.length > 0 && <div><Text size="sm" fw={600}>Outstanding</Text>
          <ul>{summary.outstanding.map(event => <li key={event.id}>{event.title?.trim() || "Untitled occurrence"} {!isToggling && <CompletionAction eventId={event.id} isCompleted={false} isGenerated={true} onToggle={toggleCompletion} />}</li>)}</ul></div>}
      </> : <Text size="sm">Not confirmed · {snapshot.reason ?? "Week not available"}{snapshot.confirmedAt ?
        ` · Last confirmed ${new Date(snapshot.confirmedAt).toLocaleString()}` : ""}. Refresh to retry.</Text>}
    </Stack>
  </Paper>;
}
