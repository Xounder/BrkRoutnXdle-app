import { useState, useCallback } from "react";

interface DevModeState {
  enabled: boolean;
  token: string | null;
  panelOpen: boolean;
}

function readStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    console.warn(`Failed to read ${key} from sessionStorage:`, e);
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Failed to write ${key} to sessionStorage:`, e);
  }
}

function removeStorage(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {
    console.warn(`Failed to remove ${key} from sessionStorage:`, e);
  }
}

export function useDevMode() {
  const [state, setState] = useState<DevModeState>(() => ({
    enabled: readStorage("brkroutnxdle:devMode") === "true",
    token: readStorage("brkroutnxdle:devToken"),
    panelOpen: false,
  }));

  const togglePanel = useCallback(() => {
    setState((prev) => ({ ...prev, panelOpen: !prev.panelOpen }));
  }, []);

  const updateToken = useCallback((token: string) => {
    writeStorage("brkroutnxdle:devToken", token);
    setState((prev) => ({ ...prev, token }));
  }, []);

  const toggleEnabled = useCallback((enabled: boolean) => {
    writeStorage("brkroutnxdle:devMode", String(enabled));
    if (!enabled) {
      removeStorage("brkroutnxdle:devToken");
    }
    setState((prev) => ({ ...prev, enabled, token: enabled ? prev.token : null }));
  }, []);

  return { ...state, togglePanel, updateToken, toggleEnabled };
}