# Impact Analysis — Deep CSS Theming

## Affected Modules

| Module | Impact Level | Description |
|---|---|---|
| `apps/web/src/components/CalendarView.tsx` | Medium | Add props (`weekNumbers`, `allDaySlot`, `allDayText`, `eventTimeFormat`, `dayHeaderFormat`). Remove `backgroundColor`/`borderColor` from event mapping, use only `classNames`. |
| `apps/web/src/styles/CalendarStyles.css` | High | Comprehensive restyle: grid lines, event chips, all-day slot, week numbers, hover effects, today highlight, now indicator |
| `apps/web/src/pages/DashboardPage.tsx` | None | No changes needed |
| `apps/web/src/components/MainLayout.tsx` | None | No changes needed |
| `apps/web/src/components/Header.tsx` | None | No changes needed |
| `packages/calendar/` | None | Backend package unaffected |
| `packages/domain/` | None | Domain package unaffected |
| `packages/shared/` | None | Shared types unaffected |
| `apps/api/` | None | Backend unaffected |

## Breaking Changes

None — no public APIs, no component interfaces changed. `CalendarViewProps` remains the same.

## Dependency Changes

None — no package.json changes required.
