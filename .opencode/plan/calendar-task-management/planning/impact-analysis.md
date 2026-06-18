# Impact Analysis

## Affected Areas

| Area | Impact | Notes |
|---|---|---|
| Frontend | High | CalendarView, SettingsModal, Sidebar, TaskModal, BlockModal, CalendarContext, TaskContext, BlockContext, SettingsContext |
| Backend | None | All changes are frontend/domain/localStorage |
| Database | None | No database — localStorage only |
| Domain | Medium | taskDistributor.ts, availabilityCalculator.ts must respect new constraints |
| Shared Types | Medium | TaskRestriction gains new fields; Task type extends |
| Testing | Medium | Calendar interaction tests (drag-drop, click), domain algorithm tests for new constraints |

---

## Expected Changes

### Files — Phase 1 (Settings)

| File | Change |
|---|---|
| `apps/web/src/components/Sidebar.tsx` | Wire Settings button to open SettingsModal |
| `apps/web/src/components/SettingsModal.tsx` | Fix timezone: replace text input with `<select>`. Ensure Available Start/End Hour are persisted correctly |
| `apps/web/src/components/CalendarView.tsx` | Read `settings.workStartHour`/`.workEndHour` and apply to `slotMinTime`/`slotMaxTime` |
| `apps/web/src/contexts/SettingsContext.tsx` | Validate settings binding |

### Files — Phase 2 (Calendar Overhaul)

| File | Change |
|---|---|
| `apps/web/src/components/CalendarView.tsx` | 24h view, always-editable, `selectable`, `eventDrop`, `eventClick`, block rendering |
| `apps/web/src/contexts/BlockContext.tsx` | Expose blocks as calendar events |
| `apps/web/src/features/blocks/BlockModal.tsx` | Support edit/delete triggered from calendar |
| `apps/web/src/features/tasks/TaskModal.tsx` | Support edit/delete triggered from calendar |
| New: modal component | Create action chooser (Block vs Task) when clicking empty slot |
| `apps/web/src/services/localStorage.ts` | Ensure block position changes persist |

### Files — Phase 3 (Task Restrictions)

| File | Change |
|---|---|
| `packages/shared/src/types/index.ts` | Extend `TaskRestriction` with `frequency`, `gapDays`, `allowSameDay`, `restrictedRanges` |
| `apps/web/src/features/tasks/TaskModal.tsx` | Add UI for time groups, custom ranges, frequency, gap, same-day checkbox |
| `packages/domain/src/internal/taskDistributor.ts` | Apply new constraints during slot allocation |
| `packages/domain/src/internal/availabilityCalculator.ts` | Filter slots by restricted time ranges |

### Breaking Changes

- None (new fields are optional with defaults: `frequency=1`, `gapDays=1`, `allowSameDay=false`, `restrictedRanges=[]`)
