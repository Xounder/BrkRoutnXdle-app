# Task Template

## Task Information

### ID

TASK-003

### Title

Sidebar Toggle — Icon replacement, absolute positioning, and relative container

### Owner

senior-frontend

### Status

Pending

---

## Description

Fix the sidebar collapse/expand toggle button. Replace the current `✕`/`☰` icons with `◀`/`▶` arrows, move the toggle button **outside** the `<aside>` element so it remains clickable when collapsed, and add `position: "relative"` to the flex container in `MainLayout.tsx` to anchor the absolute positioning.

---

## Acceptance Criteria

- [ ] Toggle button displays `▶` when sidebar is collapsed and `◀` when sidebar is expanded
- [ ] Toggle button is positioned **outside** the `<aside>` element, absolutely on the left edge of the main layout's flex container
- [ ] The toggle button is clickable even when the sidebar is fully collapsed (width = 0px)
- [ ] `MainLayout.tsx` flex container (`<div style={{ display: "flex", flex: 1 }}>`) has `position: "relative"` so the absolute toggle anchors correctly
- [ ] Toggle animation remains smooth (width transition preserved)

---

## Dependencies

### Required Tasks

- None

### Dependency Notes

This task is independent and can run in parallel with TASK-001 and TASK-002.

---

## Technical Context

### Relevant Components

- `apps/web/src/components/Sidebar.tsx` — Currently renders toggle button **inside** `<aside>` with `✕`/`☰` icons
- `apps/web/src/components/MainLayout.tsx` — Contains the flex container that needs `position: "relative"`

### Relevant Modules

- None (local component changes only)

---

## Implementation Guidance

### Expected Changes

1. **`apps/web/src/components/Sidebar.tsx` — Replace icons (line 58):**
   - Change `isCollapsed ? "☰" : "✕"` to `isCollapsed ? "▶" : "◀"`

2. **`apps/web/src/components/Sidebar.tsx` — Move toggle button outside `<aside>`:**
   - Extract the toggle button from inside the `<aside>` element
   - Place it as a sibling **before** the `<aside>`, wrapped in a container or styled directly with absolute positioning
   - The button should be positioned at the top-left edge of the sidebar area
   - Style the button with:
     ```tsx
     position: "absolute",
     top: "12px",
     left: isCollapsed ? "0px" : "280px", // adjust to align with sidebar edge
     zIndex: 10,
     transition: "left 0.3s ease",
     ```
   - Keep the same padding, background, border, cursor, font-size, and color styles

3. **`apps/web/src/components/Sidebar.tsx` — Adjust container:**
   - The outer wrapper of Sidebar should have `position: "relative"` so the absolute button anchors inside it
   - The `<aside>` itself stays unchanged in its sizing/transition logic

4. **`apps/web/src/components/MainLayout.tsx` — Add position relative (line 49):**
   - Change the flex container's style from:
     ```tsx
     <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
     ```
     to:
     ```tsx
     <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
     ```

### Constraints

- The `<aside>` width transition (`width 0.3s ease, min-width 0.3s ease`) must be preserved
- The sidebar must still collapse completely to `width: 0px / min-width: 0px`
- The toggle button `z-index` must be high enough to stay above other elements
- The `◀`/`▶` characters are Unicode arrows (U+25C0 / U+25B6) — use them directly as JSX text content

### Validation Rules

- When sidebar is collapsed, only the `▶` button should be visible on the left edge
- Clicking `▶` expands the sidebar and shows `◀`
- Clicking `◀` collapses the sidebar and shows `▶`
- The toggle animation should be smooth

---

## Testing

### Unit Tests

- [ ] No unit tests needed (visual/interaction change)

### Integration Tests

- [ ] Verify sidebar toggle still calls `onToggle` correctly

### Manual Validation

- [ ] Click toggle to collapse sidebar — verify only `▶` icon is visible
- [ ] Click `▶` to expand — verify sidebar slides open with `◀` visible
- [ ] Verify toggle button is clickable in both states (especially collapsed where width=0)
- [ ] Verify no layout shift or broken z-index behavior
- [ ] Verify smooth animation on collapse/expand

---

## Definition of Done

- [ ] Implementation completed
- [ ] Acceptance criteria satisfied
- [ ] Tests created or updated
- [ ] Build passes (`pnpm build` in `apps/web`)
- [ ] Lint passes
- [ ] Validation completed

---

## References

- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/components/MainLayout.tsx`
