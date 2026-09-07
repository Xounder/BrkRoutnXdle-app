# Codebase Analysis — Implementation

Generated: 2026-09-07T01:09:22.038Z

```

╔══════════════════════════════════════════╗
║     Codebase — Implementation Report     ║
╚══════════════════════════════════════════╝

Generated: 2026-09-07T01:09:22.038Z
Parser:    regex

── Overview ──
  Total files:      87 (TS: 47, TSX: 40)
  Total imports:    267
  Total exports:    167
  Functions:        145
  Arrow functions:  31
  Classes:          4
  Interfaces:       69
  Type aliases:     6
  React components: 5

── Per Package ──
  apps/web:
    Files:        51
    Imports:      186
    Exports:      65
    Declarations: 151
  apps/api:
    Files:        11
    Imports:      41
    Exports:      19
    Declarations: 26
  packages/shared:
    Files:        3
    Imports:      1
    Exports:      22
    Declarations: 11
  packages/domain:
    Files:        11
    Imports:      25
    Exports:      28
    Declarations: 36
  packages/calendar:
    Files:        6
    Imports:      10
    Exports:      23
    Declarations: 19
  packages/ui:
    Files:        5
    Imports:      4
    Exports:      10
    Declarations: 12

── Top Dependencies ──
  @brkroutnxdle/shared           51
  react                          47
  express                        9
  ./types.js                     7
  ../services/api                6
  @brkroutnxdle/domain           6
  ../contexts/CalendarContext    6
  ../middleware/auth.js          6
  ../contexts/SettingsContext    5
  @tanstack/react-query          5
  ../contexts/PreviewContext     5
  ../middleware/errorHandler.js  5
  ../contexts/BlockContext       4
  ../contexts/TaskContext        4
  ../services/localStorage       3

── Exported API Surface (1) ──
  web:
    function       useCalendarEvents              apps/web/src/hooks/useCalendar.ts

── Files Scanned ──
  apps/api/src/index.ts
  apps/api/src/middleware/auth.ts
  apps/api/src/middleware/errorHandler.ts
  apps/api/src/middleware/rateLimiter.ts
  apps/api/src/routes/auth.ts
  apps/api/src/routes/calendars.ts
  apps/api/src/routes/events.ts
  apps/api/src/services/calendar-client.ts
  apps/api/src/services/google-oauth.ts
  apps/api/src/services/session.ts
  apps/api/src/types.ts
  apps/web/src/App.tsx
  apps/web/src/components/CalendarView.tsx
  apps/web/src/components/DevModeBadge.tsx
  apps/web/src/components/DevModePanel.tsx
  apps/web/src/components/ErrorBoundary.tsx
  apps/web/src/components/ErrorFallback.tsx
  apps/web/src/components/Header.tsx
  apps/web/src/components/MainLayout.tsx
  apps/web/src/components/SettingsModal.tsx
  apps/web/src/components/Sidebar.tsx
  apps/web/src/contexts/AuthContext.tsx
  apps/web/src/contexts/BlockContext.tsx
  apps/web/src/contexts/CalendarContext.tsx
  apps/web/src/contexts/DevModeContext.tsx
  apps/web/src/contexts/PreviewContext.tsx
  apps/web/src/contexts/SettingsContext.tsx
  apps/web/src/contexts/TaskContext.tsx
  apps/web/src/features/blocks/BlockCard.tsx
  apps/web/src/features/blocks/BlockModal.tsx
  apps/web/src/features/blocks/BlockPanel.tsx
  apps/web/src/features/completion/CompletionAction.tsx
  apps/web/src/features/completion/ConflictDialog.tsx
  apps/web/src/features/completion/RefreshButton.tsx
  apps/web/src/features/completion/TokenRetryModal.tsx
  apps/web/src/features/preview/AllocationFailurePanel.tsx
  apps/web/src/features/preview/CalculateWeekButton.tsx
  apps/web/src/features/preview/DeleteEventDialog.tsx
  apps/web/src/features/preview/PreviewToolbar.tsx
  apps/web/src/features/preview/SaveButton.tsx
  apps/web/src/features/shared/CreateActionModal.tsx
  apps/web/src/features/tasks/TaskCard.tsx
  apps/web/src/features/tasks/TaskModal.tsx
  apps/web/src/features/tasks/TaskPanel.tsx
  apps/web/src/hooks/useBlocks.ts
  apps/web/src/hooks/useCalendar.ts
  apps/web/src/hooks/useCalendarRefresh.ts
  apps/web/src/hooks/useCompletion.ts
  apps/web/src/hooks/useDevMode.ts
  apps/web/src/hooks/useSaveSchedule.ts
  apps/web/src/hooks/useScheduleEditing.ts
  apps/web/src/hooks/useScheduleGeneration.ts
  apps/web/src/hooks/useSettings.ts
  apps/web/src/hooks/useTasks.ts
  apps/web/src/hooks/useUnsavedChanges.ts
  apps/web/src/main.tsx
  apps/web/src/pages/DashboardPage.tsx
  apps/web/src/pages/LoginPage.tsx
  apps/web/src/services/api.ts
  apps/web/src/services/calendarCache.ts
  apps/web/src/services/diffCalculator.ts
  apps/web/src/services/localStorage.ts
  packages/calendar/src/index.ts
  packages/calendar/src/internal/metadata.ts
  packages/calendar/src/internal/normalizer.ts
  packages/calendar/src/internal/types.ts
  packages/calendar/src/public/index.ts
  packages/calendar/src/public/operations.ts
  packages/domain/src/index.ts
  packages/domain/src/internal/allocationReporter.ts
  packages/domain/src/internal/availabilityCalculator.ts
  packages/domain/src/internal/priorityScorer.ts
  packages/domain/src/internal/shuffleEngine.ts
  packages/domain/src/internal/slotBuilder.ts
  packages/domain/src/internal/taskDistributor.ts
  packages/domain/src/internal/types.ts
  packages/domain/src/internal/validator.ts
  packages/domain/src/public/generateSchedule.ts
  packages/domain/src/public/index.ts
  packages/shared/src/constants/index.ts
  packages/shared/src/index.ts
  packages/shared/src/types/index.ts
  packages/ui/src/components/BottomSheet.tsx
  packages/ui/src/components/Button.tsx
  packages/ui/src/components/FAB.tsx
  packages/ui/src/components/Modal.tsx
  packages/ui/src/index.ts

```
