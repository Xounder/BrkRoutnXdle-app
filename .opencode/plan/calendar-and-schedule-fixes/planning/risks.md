# Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CSS specificity conflict (Issue 1) | Low | Low | Use existing selector chain; verify with browser devtools |
| Slot modal form validation gaps (Issue 2) | Medium | Low | Add inline validation for empty name and zero/minimum duration |
| Scroll fix breaks other pages (Issue 3) | Low | Medium | Apply `overflow: hidden` only to Home page `<main>`, not globally |
| AM/PM setting not persisted across sessions (Issue 4) | Low | Medium | Verify SettingsContext reads from localStorage on init |
| Timezone API incompatibility in older browsers (Issue 5) | Low | Low | `Intl.DateTimeFormat` with `timeZoneName: 'shortOffset'` supported since Chrome 102 / Firefox 109 / Safari 16.4 — acceptable baseline |

## Technical Risks

- **Issue 2 (Slot modal):** If `createTask` requires backend validation, error handling must be surfaced in the modal UI.
- **Issue 4 (AM/PM):** FullCalendar's `eventTimeFormat` with `hour12` may not cascade correctly to all view types — verify in month, week, and day views.

## Delivery Risks

- None. All fixes are small, independent, and can be delivered incrementally.

## Operational Risks

- None. No backend, database, or infrastructure changes.

## Decision Summary

### Selected Approach

Implement all 5 fixes independently (Approach A from feasibility analysis).

### Reasoning

Each fix is isolated, low-risk, and requires no coordinated deployment. Independent implementation minimizes delivery time and enables per-fix validation.

### Expected Outcome

Improved readability (font color), quicker slot creation (modal), smoother navigation (scroll fix), configurable time display (AM/PM), and clearer timezone selection (UTC offset).

### Open Questions

- None
