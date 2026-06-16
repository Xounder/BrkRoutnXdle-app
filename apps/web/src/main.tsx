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
import App from "./App";

import "./styles/design-tokens.css";
import "./styles/global.css";
import "./styles/CalendarStyles.css";

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
    </ErrorBoundary>
  </React.StrictMode>,
);