import React, { createContext, useContext, useState, useCallback } from "react";
import type { GeneratedEvent, AllocationFailure, ScheduleResult } from "@brkroutnxdle/domain";
import type { CalendarEvent } from "@brkroutnxdle/shared";

interface PreviewState {
  previewEvents: GeneratedEvent[];
  isPreviewActive: boolean;
  allocationFailures: AllocationFailure[];
  isGenerating: boolean;
  result: ScheduleResult | null;
  message: string | null;
  /** Immutable replacement snapshot captured when this proposal was generated. */
  replacementBaseline: ReadonlyArray<Readonly<CalendarEvent>>;
}

interface PreviewContextValue extends PreviewState {
  setPreview: (events: GeneratedEvent[], failures: AllocationFailure[]) => void;
  setResult: (result: ScheduleResult, replacementBaseline?: CalendarEvent[]) => void;
  setMessage: (message: string | null) => void;
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
    result: null,
    message: null,
    replacementBaseline: [],
  });

  const setPreview = useCallback(
    (events: GeneratedEvent[], failures: AllocationFailure[]) => {
      setState(prev => ({
        ...prev,
        previewEvents: events,
        isPreviewActive: true,
        allocationFailures: failures,
        isGenerating: false,
      }));
    },
    [],
  );

  const clearPreview = useCallback(() => {
    setState({
      previewEvents: [],
      isPreviewActive: false,
      allocationFailures: [],
      isGenerating: false,
      result: null,
      message: null,
      replacementBaseline: [],
    });
  }, []);

  const setGenerating = useCallback((generating: boolean) => {
    setState((prev) => ({ ...prev, isGenerating: generating }));
  }, []);

  const setResult = useCallback((result: ScheduleResult, replacementBaseline: CalendarEvent[] = []) => {
    setState(prev => ({ ...prev, result, previewEvents: result.generatedEvents,
      replacementBaseline: Object.freeze(replacementBaseline.map(event => Object.freeze({ ...event }))),
      allocationFailures: result.failures, isPreviewActive: true,
      isGenerating: false, message: result.message ?? (result.outcome === "alternative"
        ? "A different schedule was found." : null) }));
  }, []);

  const setMessage = useCallback((message: string | null) => {
    setState(prev => ({ ...prev, message, isGenerating: false }));
  }, []);

  return (
    <PreviewContext.Provider value={{ ...state, setPreview, setResult, setMessage, clearPreview, setGenerating }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error("usePreview must be used within PreviewProvider");
  return ctx;
}
