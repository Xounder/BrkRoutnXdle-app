# TASK-04 Implementation Guide — Part 2

Dev mode components and final configuration.

---

### Step 7: Create `apps/web/src/components/DevModePanel.tsx`

```tsx
import React, { useState, useEffect } from "react";

interface DevModePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DevModePanel({ isOpen, onClose }: DevModePanelProps) {
  const [token, setToken] = useState(() =>
    sessionStorage.getItem("brkroutnxdle:devToken") ?? "",
  );
  const [enabled, setEnabled] = useState(() =>
    sessionStorage.getItem("brkroutnxdle:devMode") === "true",
  );

  useEffect(() => {
    if (enabled && token) {
      sessionStorage.setItem("brkroutnxdle:devToken", token);
    } else {
      sessionStorage.removeItem("brkroutnxdle:devToken");
    }
    sessionStorage.setItem("brkroutnxdle:devMode", String(enabled));
  }, [enabled, token]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        width: "360px",
        padding: "24px",
        background: "#FFF8E7",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.16)",
        zIndex: 1000,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, color: "#1E8C86" }}>Dev Mode</h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "20px",
            color: "#666",
          }}
        >
          ×
        </button>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <span>Enable Dev Mode Bypass</span>
      </label>

      {enabled && (
        <div>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#555" }}>
            OAuth Playground Token
          </label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your Google OAuth Playground token here..."
            rows={3}
            style={{
              width: "100%",
              padding: "8px",
              border: "2px solid #2BA8A2",
              borderRadius: "8px",
              fontFamily: "monospace",
              fontSize: "12px",
              resize: "none",
            }}
          />
          <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
            Token is stored in sessionStorage and sent as X-Dev-Access-Token header.
          </p>
        </div>
      )}
    </div>
  );
}
```

### Step 8: Create `apps/web/src/components/DevModeBadge.tsx`

```tsx
import React from "react";

interface DevModeBadgeProps {
  enabled: boolean;
  onClick: () => void;
}

export function DevModeBadge({ enabled, onClick }: DevModeBadgeProps) {
  if (import.meta.env.PROD) return null;

  return (
    <button
      onClick={onClick}
      title={enabled ? "Dev mode active — click to configure" : "Dev mode inactive — click to configure"}
      style={{
        position: "fixed",
        bottom: "8px",
        left: "8px",
        padding: "4px 12px",
        fontSize: "11px",
        fontWeight: 700,
        borderRadius: "9999px",
        border: "none",
        cursor: "pointer",
        zIndex: 999,
        background: enabled
          ? "linear-gradient(135deg, #EF6C4A, #D45233)"
          : "linear-gradient(135deg, #2BA8A2, #1E8C86)",
        color: "#fff",
        boxShadow: enabled
          ? "0 2px 8px rgba(239,108,74,0.35)"
          : "0 2px 8px rgba(43,168,162,0.30)",
      }}
    >
      {enabled ? "⚡ DEV" : "DEV"}
    </button>
  );
}
```

### Step 9: Create `apps/web/src/hooks/useDevMode.ts`

```tsx
import { useState, useCallback } from "react";

interface DevModeState {
  enabled: boolean;
  token: string | null;
  panelOpen: boolean;
}

export function useDevMode() {
  const [state, setState] = useState<DevModeState>(() => ({
    enabled: sessionStorage.getItem("brkroutnxdle:devMode") === "true",
    token: sessionStorage.getItem("brkroutnxdle:devToken"),
    panelOpen: false,
  }));

  const togglePanel = useCallback(() => {
    setState((prev) => ({ ...prev, panelOpen: !prev.panelOpen }));
  }, []);

  const updateToken = useCallback((token: string) => {
    sessionStorage.setItem("brkroutnxdle:devToken", token);
    setState((prev) => ({ ...prev, token }));
  }, []);

  const toggleEnabled = useCallback((enabled: boolean) => {
    sessionStorage.setItem("brkroutnxdle:devMode", String(enabled));
    if (!enabled) {
      sessionStorage.removeItem("brkroutnxdle:devToken");
    }
    setState((prev) => ({ ...prev, enabled, token: enabled ? prev.token : null }));
  }, []);

  return { ...state, togglePanel, updateToken, toggleEnabled };
}
```

### Step 10: Update `apps/web/src/App.tsx` — Add dev mode badge and panel

Insert the dev mode components at the end of the DashboardPage rendering. Add the following imports and usage:

```tsx
// Add imports at top:
import { DevModeBadge } from "./components/DevModeBadge";
import { DevModePanel } from "./components/DevModePanel";
import { useDevMode } from "./hooks/useDevMode";

// Inside the App component, add:
const devMode = useDevMode();

// Inside the authenticated branch, wrap the dashboard with dev mode UI:
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
```

Update the App component accordingly:

```tsx
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
```

### Step 11: Add `apps/web/src/vite-env.d.ts`

```ts
/// <reference types="vite/client" />
```

### Step 12: Verify the build

```powershell
pnpm install
pnpm build
```

The Vite web app compiles without errors. The app starts on `http://localhost:5173` with `pnpm dev`.
