import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { mantineTheme } from "./mantineTheme";

/**
 * ThemeProvider — composes the Mantine provider tree.
 *
 * Order (outermost first):
 * 1. MantineProvider — theme, color scheme management
 * 2. ModalsProvider — required for Modals API (from @mantine/modals)
 * 3. Notifications — required for notifications.show() (from @mantine/notifications)
 *
 * Colour scheme source: Mantine's built-in `localStorageColorSchemeManager` (default)
 * with `defaultColorScheme="auto"`. This respects OS preference and persists user choice
 * in localStorage. No server-persisted colorScheme (R-24).
 *
 * ErrorBoundary (in main.tsx) remains the outermost component inside StrictMode.
 * This provider wraps all Mantine consumers but sits inside ErrorBoundary.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider
      theme={mantineTheme}
      defaultColorScheme="auto"
      // forceColorScheme={undefined} — let Mantine's localStorageColorSchemeManager handle it
    >
      <ModalsProvider>
        <Notifications position="top-right" />
        {children}
      </ModalsProvider>
    </MantineProvider>
  );
}