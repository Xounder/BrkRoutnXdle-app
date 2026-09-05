import React from "react";
import { useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DevModeBadge } from "./components/DevModeBadge";
import { DevModePanel } from "./components/DevModePanel";
import { DevModeProvider, useDevModeContext } from "./contexts/DevModeContext";

export default function App() {
  return (
    <DevModeProvider>
      <AppContent />
    </DevModeProvider>
  );
}

function AppContent() {
  const { authenticated, loading } = useAuth();
  const devMode = useDevModeContext();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#EFF8F7",
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <>
        <LoginPage />
        {import.meta.env.DEV && (
          <>
            <DevModeBadge enabled={devMode.enabled} onClick={devMode.togglePanel} />
            <DevModePanel
              isOpen={devMode.panelOpen}
              onClose={() => devMode.togglePanel()}
              enabled={devMode.enabled}
              token={devMode.token}
              onToggleEnabled={devMode.toggleEnabled}
              onUpdateToken={devMode.updateToken}
            />
          </>
        )}
      </>
    );
  }

  return <DashboardPage />;
}