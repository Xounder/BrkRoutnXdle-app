import React from "react";
import { useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DevModeBadge } from "./components/DevModeBadge";
import { DevModePanel } from "./components/DevModePanel";
import { useDevMode } from "./hooks/useDevMode";

export default function App() {
  const { authenticated, loading } = useAuth();
  const devMode = useDevMode();

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
    return <LoginPage />;
  }

  return (
    <>
      <DashboardPage />
      {import.meta.env.DEV && (
        <>
          <DevModeBadge enabled={devMode.enabled} onClick={devMode.togglePanel} />
          <DevModePanel
            isOpen={devMode.panelOpen}
            onClose={() => devMode.togglePanel()}
          />
        </>
      )}
    </>
  );
}