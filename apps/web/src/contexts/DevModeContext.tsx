import React, { createContext, useContext } from "react";
import { useDevMode } from "../hooks/useDevMode";

type DevModeContextValue = ReturnType<typeof useDevMode>;

const DevModeContext = createContext<DevModeContextValue | null>(null);

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const devMode = useDevMode();

  return (
    <DevModeContext.Provider value={devMode}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevModeContext(): DevModeContextValue {
  const ctx = useContext(DevModeContext);
  if (!ctx) throw new Error("useDevModeContext must be used within DevModeProvider");
  return ctx;
}