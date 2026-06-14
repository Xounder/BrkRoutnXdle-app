# Mobile Experience

## Status

Planned (V1)

---

## Purpose

Provide a functional mobile experience that maintains the core capabilities of the application on smaller screens.

---

## Source Documents

- `ux-flows.md` — Mobile experience goals, layout, actions

---

## Goal

Maintain minimum functionality without compromising the single-screen principle.

---

## Layout Adaptations

| Element | Mobile Behavior |
|---|---|
| Sidebar | Collapsed by default, expandable |
| Calendar | Priority component, fills available space |
| Actions | Floating Action Button (FAB) or Bottom Sheet |

---

## Key Decisions

| Decision | Rationale |
|---|---|
| Collapsed sidebar | Maximizes calendar space |
| FAB / Bottom Sheet | Accessible actions without cluttering UI |
| Calendar priority | Core feature must work on mobile |

---

## Touch Targets

- All interactive elements minimum 48px height
- Pill-shaped buttons for easy tapping
- Adequate spacing between touch targets

---

## Constraints

- Full feature parity is not required on mobile
- Calendar navigation and schedule review are the priority
- Complex task editing may be deferred to desktop

---

## Success Criteria

1. Calendar is viewable and navigable on mobile.
2. Schedule generation and preview work on mobile.
3. Essential actions are accessible via FAB or Bottom Sheet.
4. Sidebar is collapsible and does not obstruct calendar.

---

## References

- `ux-flows.md` — Mobile experience section
- `design-system.md` — Touch target sizes, button styles
