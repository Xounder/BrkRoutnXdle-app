# Epic 07 — Production Polish

## Epic Information

### ID

EPIC-07

### Title

Production Polish

### Priority

Medium

### Status

Pending

---

## Objective

Elevate the application from functional to production-ready by ensuring it works well on mobile devices, is accessible to all users, handles errors gracefully, protects against accidental data loss, and presents a cohesive visual interface through the design system.

---

## User Value

### Problem

The core scheduling functionality works, but users access the app from different devices, may rely on assistive technologies, encounter errors that are hard to understand, risk losing unsaved changes, and experience inconsistent visual presentation.

### Expected Outcome

The app works on mobile screens with a collapsed sidebar and floating action buttons. Keyboard navigation and screen reader support make the app usable by everyone. Errors are explained clearly with actionable recovery steps. Unsaved changes prompt a confirmation before leaving. All UI follows a consistent design system with proper colors, typography, spacing, and animations.

### Success Criteria

- App is usable on mobile devices (collapsed sidebar, FAB/bottom sheet)
- All functionality is accessible via keyboard
- Screen readers can navigate and interpret all UI elements
- No functionality relies solely on color
- Errors display clear messages with suggested actions
- Retry mechanisms are available for transient failures
- User is warned before leaving with unsaved changes
- All UI components use design system tokens (colors, typography, spacing, animations)

---

## Scope

### Included

- Responsive layout for mobile (sidebar collapsed by default, calendar as priority)
- Floating action button for primary actions on mobile
- Bottom sheet for secondary actions on mobile
- Full keyboard navigation for all interactive elements
- Screen reader support (ARIA labels, roles, live regions)
- Color-independent design (icons, text labels alongside colors)
- Error messages with human-readable explanations and action buttons
- Retry mechanisms for network and API failures
- Unsaved changes warning when navigating away or closing the browser
- Design system implementation: CSS custom properties on `:root`, consistent tokens for colors, typography, radius, shadows, animations
- Component styling following the visual spec

### Excluded

- Native mobile app (web-responsive only in V1)
- Advanced accessibility features like voice control or switch device support
- Automated error reporting or crash analytics (V2+)

---

## Deliverables

- Mobile-responsive layout with collapsed sidebar and FAB
- Keyboard navigation implementation across all components
- ARIA labels and screen reader support
- Error message templates with user-friendly language
- Retry buttons on API failures
- Unsaved changes browser warning (beforeunload + in-app dialog)
- Design system CSS custom properties
- Consistent component styling using design tokens

---

## Acceptance Criteria

- [ ] App functions on a mobile screen width (~375px) with all features accessible
- [ ] Sidebar is collapsed by default on mobile, expandable via hamburger or tap
- [ ] Primary actions are accessible via a floating action button on mobile
- [ ] All form controls, buttons, and navigation are keyboard-accessible
- [ ] Screen readers can read calendar events, task names, and action labels
- [ ] Color is never the only indicator of state (icons/text accompany colors)
- [ ] API errors show a message like "Could not load calendar data. Check your connection and try again."
- [ ] Every failure state has a "Retry" or equivalent action button
- [ ] Closing the browser tab with unsaved changes triggers a confirmation
- [ ] Navigating away from a preview triggers an unsaved changes warning
- [ ] CSS custom properties are defined for all design tokens (colors, fonts, spacing, shadows, radius)
- [ ] Components match the design system visual spec consistently

---

## Dependencies

### Required

- EPIC-04 (Schedule Generation & Preview) — for mobile preview experience
- EPIC-05 (Save & Manual Calendar Editing) — for unsaved changes protection

### Blocks

- None

---

## Risks

- Mobile experience may be constrained by FullCalendar's mobile touch support
- Accessibility audit may reveal issues requiring significant rework
- Design system tokens may evolve as components are implemented

---

## Notes

This epic runs in parallel with or after the core functional epics. Some mobile, accessibility, and error handling work can begin alongside EPIC-03/EPIC-04, but the unsaved changes protection requires preview state to exist.

---

## References

- `architecture/docs/feature/mobile-experience.md` — Feature spec
- `architecture/docs/feature/accessibility.md` — Feature spec
- `architecture/docs/feature/error-handling-and-retry.md` — Feature spec
- `architecture/docs/feature/unsaved-changes-protection.md` — Feature spec
- `architecture/docs/feature/design-system-implementation.md` — Feature spec
- `architecture/docs/design-system.md` — Design tokens, components, animations
- `architecture/docs/error-handling-strategy.md` — Error categories and retry
- `architecture/ux-flows.md` — Mobile experience, accessibility goals
