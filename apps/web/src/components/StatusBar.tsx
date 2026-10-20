import React from "react";
import { Alert, Button, Paper, Skeleton, Text } from "@mantine/core";
import { AllocationFailurePanel } from "../features/preview/AllocationFailurePanel";
import type { DashboardStatusBarProps } from "../pages/dashboard/dashboardTypes";

/**
 * StatusBar — the single status region rendered above the calendar.
 *
 * At most ONE region is rendered at a time, resolved by strict priority:
 *   1. save error   -> Alert red    "Error: {message}"
 *   2. calendar err -> Alert red    "Failed to sync calendar events: {message}"
 *   3. save success -> Alert green  "Schedule saved successfully!"
 *   4. loading      -> Skeleton + Text "Loading calendar events..."
 *   5. failures     -> Paper hosting AllocationFailurePanel
 *
 * Copy is verbatim from the previous five inline banners (`M15`). Each error
 * region keeps its inline `Retry` button with the existing behaviour.
 */
export function StatusBar({
  saveStatus,
  saveError,
  calendarIsError,
  calendarError,
  calendarIsLoading,
  calendarIsFetching,
  isPreviewActive,
  failurePanelOpen,
  allocationFailures,
  onSaveRetry,
  onCalendarRetry,
  onDismissFailures,
}: DashboardStatusBarProps) {
  let content: React.ReactNode = null;

  if (saveStatus === "error") {
    content = (
      <Alert color="red" style={{ margin: "8px 16px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span>Error: {saveError ?? "An unknown error occurred"}</span>
          <Button color="red" variant="outline" size="xs" onClick={onSaveRetry}>
            Retry
          </Button>
        </div>
      </Alert>
    );
  } else if (calendarIsError) {
    content = (
      <Alert color="red" style={{ margin: "8px 16px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span>
            Failed to sync calendar events: {calendarError?.message ?? "Unknown error"}
          </span>
          <Button
            color="red"
            variant="outline"
            size="xs"
            onClick={onCalendarRetry}
            disabled={calendarIsFetching}
          >
            Retry
          </Button>
        </div>
      </Alert>
    );
  } else if (saveStatus === "success") {
    content = (
      <Alert color="green" style={{ margin: "8px 16px 0" }}>
        Schedule saved successfully!
      </Alert>
    );
  } else if (calendarIsLoading) {
    content = (
      <div
        style={{
          margin: "8px 16px 0",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <Skeleton height={12} width={160} radius="xl" />
        <Text size="sm">Loading calendar events...</Text>
      </div>
    );
  } else if (isPreviewActive && failurePanelOpen) {
    content = (
      <Paper withBorder style={{ margin: "8px 16px 0" }}>
        <AllocationFailurePanel
          failures={allocationFailures}
          onDismiss={onDismissFailures}
        />
      </Paper>
    );
  }

  return (
    <div role="status" aria-live="polite">
      {content}
    </div>
  );
}
