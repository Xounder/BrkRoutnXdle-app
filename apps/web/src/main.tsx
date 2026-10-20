import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles/design-tokens.css";
import "./styles/global.css";
import "./styles/CalendarStyles.css";
import "./styles/calendar/calendar-tokens.css";
import "./styles/calendar/calendar-events.css";
import "./styles/calendar/calendar-dark.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { CalendarProvider } from "./contexts/CalendarContext";
import { TaskProvider } from "./contexts/TaskContext";
import { BlockProvider } from "./contexts/BlockContext";
import { PreviewProvider } from "./contexts/PreviewContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./theme/ThemeProvider";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SettingsProvider>
              <TaskProvider>
                <BlockProvider>
                  <CalendarProvider>
                    <PreviewProvider>
                      <App />
                    </PreviewProvider>
                  </CalendarProvider>
                </BlockProvider>
              </TaskProvider>
            </SettingsProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
