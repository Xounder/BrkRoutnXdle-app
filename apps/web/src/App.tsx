import { Center, Text } from "@mantine/core";
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
      <Center mih="100vh"><Text>Loading...</Text></Center>
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
