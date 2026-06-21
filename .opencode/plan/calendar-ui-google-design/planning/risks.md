# Risk Analysis — Deep CSS Theming

| Risk | Probability | Severity | Mitigation |
|---|---|---|---|
| `allDaySlot` causes block/recurring events to render incorrectly | Low | Medium | Set `display: 'auto'` explicitly on recurring blocks; test all 3 block types (SingleDay, RecurringWeekday, RecurringPeriod) |
| CSS specificity conflicts with FullCalendar internals | Medium | Low | Already using `!important` in existing CSS; scope all new rules under `.brk-calendar-google` parent class |
| Hardcoded hex color removal misses some event types | Low | Medium | Audit all event creation paths in `CalendarView.tsx`: generated, external, block, preview — ensure all use classNames only |
| FullCalendar version upgrade breaks CSS overrides | Low | Medium (future) | All overrides in single CSS file; selector changes documented inline; version upgrades can be tested in isolation |
| Week numbers in month view conflict with existing layout | Low | Low | Simple toggle — can be disabled if spacing issues arise |
| All-day slot takes vertical space from time grid | Low | Medium | Keep `allDaySlot` minimal height; style with compact padding |

## Overall Risk: **LOW**

No blocking risks identified. All risks have straightforward mitigations.
