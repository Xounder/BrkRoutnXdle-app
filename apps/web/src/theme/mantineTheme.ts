import { createTheme, MantineColorsTuple } from "@mantine/core";
import { breakpoints } from "./breakpoints";

/**
 * Mantine theme derived from Tier-1 primitives in design-tokens.css.
 *
 * The design-tokens.css file is the source of truth (Tier 1 primitives → Tier 2/3 semantic).
 * This theme mirrors those values so Mantine components consume the same colour scale.
 *
 * B4 Constraint: The teal tuple must not reintroduce the ~2.1:1 white-on-#3CC4BD failure.
 * Approved tuple (matches design-tokens.css primitives):
 *   teal[0] = #E8F6F5  (--clr-primary-bg)
 *   teal[4] = #3CC4BD  (--clr-primary-light)
 *   teal[5] = #2BA8A2  (--clr-primary) — used for filled buttons in light mode (primaryShade.light=6)
 *   teal[6] = #1E8C86  (--clr-primary-dark) — used for filled buttons in dark mode (primaryShade.dark=4)
 *
 * Coral and Sky tuples use approved brand hexes at index 5/6.
 */

const teal: MantineColorsTuple = [
  "#E8F6F5", // 0 — --clr-primary-bg
  "#D1EDEB", // 1
  "#A3DCD7", // 2
  "#75CBC3", // 3
  "#3CC4BD", // 4 — --clr-primary-light
  "#2BA8A2", // 5 — --clr-primary (brand)
  "#1E8C86", // 6 — --clr-primary-dark
  "#16706B", // 7
  "#0E5550", // 8
  "#073935", // 9
];

const coral: MantineColorsTuple = [
  "#FEF0ED", // 0
  "#FDE0DB", // 1
  "#FBC1B0", // 2
  "#F9A285", // 3
  "#F7835A", // 4
  "#EF6C4A", // 5 — --clr-coral (brand)
  "#D45233", // 6 — --clr-coral-dark
  "#AA4029", // 7
  "#80301F", // 8
  "#572015", // 9
];

const sky: MantineColorsTuple = [
  "#EAF4FC", // 0
  "#D5E9F9", // 1
  "#AAD3F3", // 2
  "#7FBCED", // 3
  "#5DADE2", // 4 — --clr-sky (brand at lighter step)
  "#5DADE2", // 5 — --clr-sky (brand)
  "#4A9BDD", // 6
  "#3A7DBB", // 7
  "#2D5F99", // 8
  "#204277", // 9
];

export const mantineTheme = createTheme({
  primaryColor: "teal",
  colors: {
    teal,
    coral,
    sky,
  },

  /**
   * teal[7] is the filled-button shade in both tiers. White on teal[4–6]
   * does not meet 4.5:1; in particular teal[4] cannot be paired with white.
   */
  primaryShade: {
    light: 7,
    dark: 7,
  },

  fontFamily: "var(--font-stack)",
  defaultRadius: "md",

  headings: {
    fontFamily: "var(--font-stack)",
    sizes: {
      h1: { fontSize: "48px", lineHeight: "1.2" }, // var(--font-h1)
      h2: { fontSize: "36px", lineHeight: "1.3" }, // var(--font-h2)
      h3: { fontSize: "28px", lineHeight: "1.4" },
    },
  },

  breakpoints: {
    xs: breakpoints.xs,
    sm: breakpoints.sm,
    md: breakpoints.md,
    lg: breakpoints.lg,
    xl: breakpoints.xl,
  },

  // Respect the existing z-index scale from design-tokens.css (R-20)
  // Mantine's default z-indices align with our --z-* tokens.
});
