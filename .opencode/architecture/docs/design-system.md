# BrkRoutnXdle Design System

## Overview

BrkRoutnXdle adopts a retro-playful, teal-coral-gold design system inspired by the Flip7 card game aesthetic. The visual language is bold, joyful, and tactile — every element feels like a game piece you want to tap.

The design supports the core UX principles (see `ux-flows.md`): single screen, calendar first, preview before save, user control.

---

## Colors

| Role | Token | Value | Usage |
|---|---|---|---|
| Primary | `--clr-primary` | #2BA8A2 | Main UI, buttons, avatars, progress bars |
| Primary Light | `--clr-primary-light` | #3CC4BD | Hover states, lighter accents |
| Primary Dark | `--clr-primary-dark` | #1E8C86 | Deep backgrounds, text on light surfaces |
| Primary BG | `--clr-primary-bg` | #E8F6F5 | Subtle teal tint for backgrounds |
| Accent Gold | `--clr-accent` | #FFD23F | CTAs, highlights, celebration states |
| Accent Light | `--clr-accent-light` | #FFE47A | Soft gold tints, active states |
| Accent Dark | `--clr-accent-dark` | #E6B800 | Gold hover states, depth |
| Coral | `--clr-coral` | #EF6C4A | Delete, warnings, conflicts, energy |
| Coral Light | `--clr-coral-light` | #FF8A6A | Soft coral tints |
| Coral Dark | `--clr-coral-dark` | #D45233 | Coral depth, hover |
| Cream | `--clr-cream` | #FFF8E7 | Input surfaces, card backgrounds |
| Sky Blue | `--clr-sky` | #5DADE2 | Info states, sync indicators |
| Surface Base | `--clr-surface` | #EFF8F7 | Page background |
| Surface Card | `--clr-card` | #FFFFFF | Card backgrounds |
| Success | `--clr-success` | #27AE60 | Saved, completed states |
| Error | `--clr-error` | #E74C3C | Error states |

---

## Typography

| Style | Size | Weight | Usage |
|---|---|---|---|
| Display | 72px | 800 | App logo, empty states |
| h1 | 48px | 800 | Screen titles |
| h2 | 36px | 800 | Section headers |
| h3 | 32px | 700 | Card titles, modal headers |
| body | 16px | 500 | Primary content |
| sm | 14px | 500 | Metadata, labels |
| xs | 12px | 500 | Badges, timestamps |

Font stack:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```

Headlines use generous letter-spacing: `0.08em` to `0.12em`.

---

## Spacing

Base unit: **8px**

| Token | Value |
|---|---|
| `--space-xs` | 8px |
| `--space-sm` | 16px |
| `--space-md` | 24px |
| `--space-lg` | 32px |
| `--space-xl` | 48px |

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 8px | Tags, inputs |
| `--radius-md` | 16px | Cards, buttons |
| `--radius-lg` | 24px | Feature cards, panels |
| `--radius-xl` | 32px | Hero cards, modals |
| `--radius-round` | 9999px | Pill buttons, badges |

---

## Elevation — Colored Glow System

Use colored glows instead of plain black shadows for interactive elements.

| Token | Value |
|---|---|
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.08)` |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.12)` |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.16)` |
| `--shadow-card` | `0 4px 20px rgba(43,168,162,0.10)` |
| `--shadow-coral-glow` | `0 4px 20px rgba(239,108,74,0.35)` |
| `--shadow-teal-glow` | `0 4px 20px rgba(43,168,162,0.30)` |
| `--shadow-accent-glow` | `0 4px 20px rgba(255,210,63,0.40)` |
| `--shadow-sky-glow` | `0 4px 16px rgba(93,173,226,0.30)` |
| `--shadow-focus` | `0 0 0 4px rgba(43,168,162,0.15)` |

---

## Components

### Logo (Header)

Three-layer composition inspired by retro game packaging:

1. **Background fan**: 5 colored cards fanned behind the text (rotation: -24°, -12°, 0°, 12°, 24°)
2. **App name**: Rotated -3°, cream parallelogram background (`skewX(-6deg)`) with dark border. Primary-dark text with light text-shadow
3. **Ribbon banner**: Retro folded-ribbon style, cream with dark border, folded tail pseudo-elements (z-index: -1, offset top: 8px for 3D effect)

---

### Buttons

Pill shape (`--radius-round`), minimum 48px height, bounce transition curve.

**Primary (Gold CTA)**

```css
background: linear-gradient(135deg, var(--clr-accent), var(--clr-accent-dark));
box-shadow: var(--shadow-accent-glow);
&:active { transform: scale(0.95); }
```

**Secondary (Teal Outline)**

```css
border: 2px solid var(--clr-primary);
color: var(--clr-primary);
background: transparent;
```

**Icon Button (Square)**

Rounded square (`--radius-md`), 48px × 48px.

- Save/Generate: teal themed
- Delete/Warning: coral themed
- Info: sky-blue themed

---

### Cards

White background, `--radius-lg`, `--shadow-card`, 6px colored left accent bar.

| State | Left Bar | Background |
|---|---|---|
| Default | `var(--clr-primary)` | White |
| Selected | `var(--clr-accent)` | Light gold gradient |
| Completed | `var(--clr-success)` | Light green tint |
| Conflict | `var(--clr-coral)` | Coral pulse animation |

---

### Preview State Cards

During preview (see `schedule-generation-workflow.md`):

- New events: dashed teal border, `--shadow-teal-glow`
- Removed events: strikethrough text, coral tint
- Modified events: gold left accent, `--shadow-accent-glow`

---

### Calendar Events

FullCalendar events styled per design system:

| Event Type | Background | Border | Text |
|---|---|---|---|
| Task (unsaved) | Teal 85% opacity | Teal | White |
| Task (saved) | Teal solid | Teal dark | White |
| External | Cream | Gray | Dark |
| Blocked | Coral 70% opacity | Coral dark | White |
| Completed | Green | Green dark | White |

---

### Section Titles

- Icon in a view container (not inline with text) for consistent alignment
- 3px dashed bottom border for playful feel
- Color: `var(--clr-primary-dark)`

---

### Progress / Loading

- Teal gradient progress bar
- Pulsing glow animation for indeterminate states
- Loading overlay: cream backdrop with teal spinner

---

### Allocation Failure Panel

Coral-themed, with `--shadow-coral-glow`. Each failure item shows:

```text
[warning icon] Drawing — 2 occurrences could not be allocated
```

---

## Animations

| Animation | Duration | Timing | Usage |
|---|---|---|---|
| Button bounce | 200ms | ease-back-out | Button press |
| Card glow pulse | 2s | ease-in-out infinite | Selected card highlight |
| Coral pulse | 2s | ease-in-out infinite | Conflict/error state |
| Confetti burst | 3.2-4.5s | ease-out | Week saved successfully |
| Slide-up panel | 300ms | ease-out | Modal/drawer entry |
| Fade-in | 200ms | ease-out | Preview generation |

---

## Do's and Don'ts

1. **Do** use colored glow shadows for interactive elements.
2. **Do** use pill-shaped buttons consistently.
3. **Do** use cream (`--clr-cream`) for input surfaces.
4. **Don't** use plain black shadows on interactive elements.
5. **Do** celebrate actions visually with matching brand colors.
6. **Do** use dashed borders for section dividers.
7. **Don't** make micro-interaction animations longer than 500ms.
8. **Do** use left-border color accents on cards for state communication.
9. **Do** ensure all touch targets are at least 48px.
10. **Do** use the colored glow system over opacity-based hover states.
11. **Do** use the retro ribbon pattern for announcement banners.
12. **Don't** apply more than 3 glow shadow layers in a single component.
13. **Do** use coral for destructive actions only.
14. **Don't** mix teal and coral as equal-weight CTAs on the same screen.

---

## CSS Custom Properties

All tokens should be exposed as CSS custom properties on `:root`:

```css
:root {
  --clr-primary: #2BA8A2;
  --clr-primary-light: #3CC4BD;
  --clr-primary-dark: #1E8C86;
  --clr-primary-bg: #E8F6F5;
  --clr-accent: #FFD23F;
  --clr-accent-light: #FFE47A;
  --clr-accent-dark: #E6B800;
  --clr-coral: #EF6C4A;
  --clr-coral-light: #FF8A6A;
  --clr-coral-dark: #D45233;
  --clr-cream: #FFF8E7;
  --clr-sky: #5DADE2;
  --clr-surface: #EFF8F7;
  --clr-card: #FFFFFF;
  --clr-success: #27AE60;
  --clr-error: #E74C3C;

  --space-xs: 8px;
  --space-sm: 16px;
  --space-md: 24px;
  --space-lg: 32px;
  --space-xl: 48px;

  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-round: 9999px;
}
```

---

## References

- `ux-flows.md` — UX principles and interaction flows
- `component-architecture.md` — Component tree and state architecture
- `schedule-generation-workflow.md` — Preview and save workflow
- `error-handling-strategy.md` — Error state handling
