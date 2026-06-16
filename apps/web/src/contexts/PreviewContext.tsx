import React, { createContext, useContext, useState, useCallback } from "react";
import type { GeneratedEvent, AllocationFailure } from "@brkroutnxdle/domain";

interface PreviewState {
  previewEvents: GeneratedEvent[];
  isPreviewActive: boolean;
  allocationFailures: AllocationFailure[];
  isGenerating: boolean;
}

interface PreviewContextValue extends PreviewState {
  setPreview: (events: GeneratedEvent[], failures: AllocationFailure[]) => void;
  clearPreview: () => void;
  setGenerating: (generating: boolean) => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PreviewState>({
    previewEvents: [],
    isPreviewActive: false,
    allocationFailures: [],
    isGenerating: false,
  });

  const setPreview = useCallback(
    (events: GeneratedEvent[], failures: AllocationFailure[]) => {
      setState({
        previewEvents: events,
        isPreviewActive: true,
        allocationFailures: failures,
        isGenerating: false,
      });
    },
    [],
  );

  const clearPreview = useCallback(() => {
    setState({
      previewEvents: [],
      isPreviewActive: false,
      allocationFailures: [],
      isGenerating: false,
    });
  }, []);

  const setGenerating = useCallback((generating: boolean) => {
    setState((prev) => ({ ...prev, isGenerating: generating }));
  }, []);

  return (
    <PreviewContext.Provider value={{ ...state, setPreview, clearPreview, setGenerating }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error("usePreview must be used within PreviewProvider");
  return ctx;
}
