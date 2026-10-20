/**
 * Breakpoint constants — single source of truth for responsive design.
 *
 * M4 Constraint: Mantine breakpoints MUST be numerically identical to the
 * `global.css` media queries and the PostCSS config.
 *
 * NOTE: The design's original `sm = 36em` figure was REJECTED because
 * Mantine's `sm` breakpoint is `48em` (768px at default 16px).
 * Both `global.css` media queries and this file use:
 *   xs: 36em (576px) — extra small, NOT used as Mantine's `sm`
 *   sm: 48em (768px) — Mantine's `sm`, matches global.css @media (max-width: 48em)
 *   md: 62em (992px) — Mantine's `md`, matches global.css @media (max-width: 62em)
 *   lg: 75em (1200px) — Mantine's `lg`, matches global.css @media (max-width: 75em)
 *   xl: 88em (1408px) — Mantine's `xl`
 *
 * `global.css` media queries MUST repeat these values with the cross-reference comment.
 */

export const breakpoints = Object.freeze({
  xs: "36em",
  sm: "48em",
  md: "62em",
  lg: "75em",
  xl: "88em",
} as const);

export type Breakpoint = keyof typeof breakpoints;
export type BreakpointValue = (typeof breakpoints)[Breakpoint];

/**
 * Helper to parse em/rem strings to numbers (base 16px) if needed by shell config.
 * Not used by Mantine directly — Mantine expects strings like "48em".
 */
export function parseRemEm(value: string): number {
  const match = value.match(/^([\d.]+)(rem|em)$/);
  if (!match) throw new Error(`Invalid rem/em value: ${value}`);
  return parseFloat(match[1]) * 16;
}