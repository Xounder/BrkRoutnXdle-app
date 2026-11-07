import { useCallback, useEffect, useRef } from "react";
import { generateSchedule } from "@brkroutnxdle/domain";
import { useTaskContext } from "../contexts/TaskContext";
import { useBlockContext } from "../contexts/BlockContext";
import { useCalendar } from "../contexts/CalendarContext";
import { useSettings } from "../contexts/SettingsContext";
import { usePreview } from "../contexts/PreviewContext";
import { generationInputs, previewInputKey, replacementCandidates, sameReplacementBaseline } from "../pages/dashboard/previewSchedule";
import type { PreviewRange } from "../pages/dashboard/previewSchedule";

export function useScheduleGeneration(range: PreviewRange) {
  const { tasks } = useTaskContext();
  const { blocks } = useBlockContext();
  const { events } = useCalendar();
  const { settings } = useSettings();
  const { result, previewEvents, replacementBaseline, setResult, setMessage,
    clearPreview, setGenerating, isGenerating } = usePreview();
  const sequence = useRef(0);
  const inputKey = previewInputKey(tasks, blocks, settings, events, range);
  const latestKey = useRef(inputKey);
  latestKey.current = inputKey;
  const pending = useRef<string | null>(null);
  const attempt = useRef(0);

  useEffect(() => {
    if (pending.current && pending.current !== inputKey) {
      sequence.current++;
      pending.current = null;
      setGenerating(false);
    }
  }, [inputKey, setGenerating]);

  useEffect(() => {
    if (result && (result.weekStart !== range.timeMin || result.weekEnd !== range.timeMax)) {
      sequence.current++;
      attempt.current = 0;
      clearPreview();
    }
  }, [range.timeMin, range.timeMax, result, clearPreview]);

  const runSchedule = useCallback((again: boolean) => {
    if (isGenerating) return;
    const key = inputKey;
    const ticket = ++sequence.current;
    pending.current = key;
    setGenerating(true);
    // Keep generation asynchronous so quick navigation/discard invalidates an obsolete request.
    Promise.resolve().then(() => {
      if (ticket !== sequence.current) return;
      if (key !== latestKey.current) { pending.current = null; setGenerating(false); return; }
      const now = Date.now();
      const baseline = replacementCandidates(events, range, now);
      if (again && result?.weekStart === range.timeMin &&
        !sameReplacementBaseline(replacementBaseline, baseline)) {
        setMessage("Remote schedule changed since this preview. Discard and calculate again before saving.");
        return;
      }
      const inputs = generationInputs(tasks, events, range, now);
      const prior = again && result?.weekStart === range.timeMin
        ? { ...result, generatedEvents: previewEvents } : undefined;
      const next = generateSchedule(inputs.tasks, blocks, inputs.base, settings, undefined, {
        targetWeekStart: range.timeMin,
        previousResult: prior,
        generationAttempt: again ? ++attempt.current : 0,
      });
      if (ticket !== sequence.current) return;
      if (key !== latestKey.current) { pending.current = null; setGenerating(false); return; }
      pending.current = null;
      if (next.outcome === "no-alternative") {
        setMessage(next.message ?? "No different allocation found under the current constraints.");
        return;
      }
      setResult(next, baseline, key);
    }).catch(error => {
      if (ticket === sequence.current) {
        pending.current = null;
        setGenerating(false);
        if (key !== latestKey.current) return;
        console.error("Generation failed:", error);
        setMessage("Could not generate this week. Please try again.");
      }
    });
  }, [isGenerating, inputKey, tasks, events, range, blocks, settings, result, previewEvents,
    replacementBaseline, setGenerating, setMessage, setResult]);

  const discard = useCallback(() => {
    sequence.current++;
    pending.current = null;
    attempt.current = 0;
    clearPreview();
  }, [clearPreview]);

  return {
    generateWeek: () => runSchedule(false),
    generateAgain: () => runSchedule(true),
    discard,
    isGenerating,
    inputKey,
  };
}
