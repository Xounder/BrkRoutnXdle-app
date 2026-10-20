import { ActionIcon, Badge, Button, Group, Text } from "@mantine/core";
import type { Settings, ViewType } from "@brkroutnxdle/shared";
import { ViewType as ViewTypeEnum } from "@brkroutnxdle/shared";
import { formatBusinessHoursLabel } from "./calendarTheme";

/**
 * CalendarToolbar — the single owner of calendar date-stepping and the
 * view switcher (`M15`).
 *
 * Rendered by `DashboardPage` above `CalendarView`, inside the `AppShell.Main`
 * column. The app `Header` keeps only brand-level actions (Settings, colour
 * scheme); exactly one `Today` control exists and it lives here.
 *
 * B1: the Day/Week/Month switcher is real `<button>` elements (Mantine
 * `Button`) — a radio-input-based segmented control would emit no `<button>`
 * and break the `button:has-text(...)` selectors in
 * `apps/web/e2e/TASK-02.spec.ts`.
 *
 * Copy rule (strict): this component may introduce only `Today`,
 * `Previous period`, `Next period`, `Calendar view`, `Unsaved changes` and
 * the business-hours label (`R-23`).
 */
interface CalendarToolbarProps {
  currentDate: Date;
  currentView: ViewType;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: ViewType) => void;
  hasUnsavedChanges: boolean;
  settings: Pick<Settings, "workStartHour" | "workEndHour">;
}

const VIEW_LABELS: Record<ViewType, string> = {
  [ViewTypeEnum.Day]: "Day",
  [ViewTypeEnum.Week]: "Week",
  [ViewTypeEnum.Month]: "Month",
};

const VIEWS: ViewType[] = [ViewTypeEnum.Day, ViewTypeEnum.Week, ViewTypeEnum.Month];

export function CalendarToolbar({
  currentDate,
  currentView,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  hasUnsavedChanges,
  settings,
}: CalendarToolbarProps) {
  // Date title format kept identical to the previous Header implementation.
  const dateTitle = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    ...(currentView === ViewTypeEnum.Day ? { day: "numeric" } : {}),
  });

  return (
    <div
      className="brk-calendar-google brk-calendar-toolbar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "var(--space-xs)",
        padding: "var(--space-xs) var(--space-md)",
        borderBottom: "1px solid var(--brk-border-default)",
        background: "var(--brk-bg-raised)",
      }}
    >
      {/* Navigation + date title */}
      <Group gap="var(--space-xs)">
        <ActionIcon
          onClick={onPrev}
          aria-label="Previous period"
          variant="subtle"
          size="sm"
        >
          ‹
        </ActionIcon>
        <Button onClick={onToday} variant="default" size="sm">
          Today
        </Button>
        <ActionIcon
          onClick={onNext}
          aria-label="Next period"
          variant="subtle"
          size="sm"
        >
          ›
        </ActionIcon>
        <Text
          component="h2"
          fw={600}
          c="var(--brk-text-brand)"
          style={{ margin: 0, fontSize: "var(--font-h2)" }}
        >
          {dateTitle}
        </Text>
      </Group>

      {/* Badges + view switcher */}
      <Group gap="var(--space-xs)">
        <Badge variant="light">{formatBusinessHoursLabel(settings)}</Badge>
        {hasUnsavedChanges && (
          <Badge color="yellow" variant="light">
            Unsaved changes
          </Badge>
        )}
        {/* B1: real <button> elements with visible text, segmented styling */}
        <div
          role="group"
          aria-label="Calendar view"
          style={{
            display: "inline-flex",
            border: "1px solid var(--brk-border-default)",
            borderRadius: "var(--brk-radius-sm)",
            overflow: "hidden",
          }}
        >
          {VIEWS.map((view) => (
            <Button
              key={view}
              onClick={() => onViewChange(view)}
              variant={currentView === view ? "filled" : "subtle"}
              size="sm"
              aria-pressed={currentView === view}
              style={{
                borderRadius: 0,
                fontWeight: currentView === view ? 700 : 500,
              }}
            >
              {VIEW_LABELS[view]}
            </Button>
          ))}
        </div>
      </Group>
    </div>
  );
}
