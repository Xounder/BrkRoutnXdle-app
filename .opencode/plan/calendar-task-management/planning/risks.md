# Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| FullCalendar `select`/drag-drop conflicts with preview mode | Medium | High | Separate "live edit" mode from "preview" mode; clear mode boundaries in CalendarView |
| Domain algorithm does not support new constraint types | High | Medium | Extend `taskDistributor.ts` to filter slots by restricted time ranges, gap, same-day rules |
| Existing localStorage data incompatible after Task type change | High | Low | Migration logic in TaskContext (default/fallback for missing fields) |
| Block drag-drop changes need to persist to localStorage | Medium | Low | BlockContext already has `updateBlock`; wire to `eventDrop` handler |
| Scope creep on calendar overhaul | Medium | High | Phase 1 fixes are simple — tackle them first to validate pipeline |
| Timezone selector with incorrect offsets | Low | Medium | Use well-maintained IANA timezone list; cross-check with `Intl.supportedValuesOf('timeZone')` |

---

## Technical Risks

- FullCalendar `editable` + `selectable` simultaneously may cause interaction conflicts — test thoroughly
- Domain algorithm currently hardcodes restriction logic; refactoring needed to make it data-driven

## Delivery Risks

- Phase 2 (calendar) is the largest effort — if blocked, Phase 1 and 3 can still proceed independently

## Operational Risks

- None — no backend or infrastructure changes
