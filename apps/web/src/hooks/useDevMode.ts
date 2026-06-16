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