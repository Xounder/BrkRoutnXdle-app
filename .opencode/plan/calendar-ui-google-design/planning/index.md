# Calendar UI — Google Calendar Design

## Context

User requested the calendar to visually resemble Google Calendar while maintaining the BrkRoutnXdle retro-playful design system (teal-coral-gold aesthetic).

## Selected Approach

**Approach 1: Deep CSS Theming of FullCalendar** — 2-3 day effort, frontend-only, zero risk to existing interactions.

## Design Reference

`.opencode/plan/calendar-ui-google-design/design-docs/approach-analysis.md`

## Key Decisions

- Keep FullCalendar v6.1 — no library replacement
- Use CSS custom properties from `design-tokens.css` for all calendar colors
- Enable `weekNumbers` and `allDaySlot` FullCalendar props
- Replace hardcoded hex colors with CSS class-based styling
- Style events as compact chips with colored left border accent
- Scope all calendar overrides under `.brk-calendar-google` class

## Affected Files

| File | Change Type |
|---|---|
| `apps/web/src/components/CalendarView.tsx` | Props + color removal |
| `apps/web/src/styles/CalendarStyles.css` | Comprehensive restyle |
