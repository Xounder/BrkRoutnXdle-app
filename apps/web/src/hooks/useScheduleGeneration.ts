import { useCallback, useEffect, useRef } from "react";
import { generateSchedule } from "@brkroutnxdle/domain";
import { useTaskContext } from "../contexts/TaskContext";
import { useBlockContext } from "../contexts/BlockContext";
import { useCalendar } from "../contexts/CalendarContext";
import { useSettings } from "../contexts/SettingsContext";
import { usePreview } from "../contexts/PreviewContext";
import { generationInputs, replacementCandidates, sameReplacementBaseline } from "../pages/dashboard/previewSchedule";
import type { PreviewRange } from "../pages/dashboard/previewSchedule";

export function useScheduleGeneration(range: PreviewRange) {
  const { tasks } = useTaskContext();
  const { blocks } = useBlockContext();
  const { events } = useCalendar();
  const { settings } = useSettings();
  const { result, previewEvents, replacementBaseline, setResult, setMessage,
    clearPreview, setGenerating, isGenerating } = usePreview();
  const sequence = useRef(0);
  const rangeKey = `${range.timeMin}/${range.timeMax}/${settings.timezone}/${settings.weekStartDay}`;
  const latestKey = useRef(rangeKey);
  latestKey.current = rangeKey;
  const attempt = useRef(0);

  useEffect(() => {
    if (result && (result.weekStart !== range.timeMin || result.weekEnd !== range.timeMax)) {
      sequence.current++;
      attempt.current = 0;
      clearPreview();
    }
  }, [range.timeMin, range.timeMax, result, clearPreview]);

  const runSchedule = useCallback((again: boolean) => {
    if (isGenerating) return;
    const key = rangeKey;
    const ticket = ++sequence.current;
    setGenerating(true);
    // Keep generation asynchronous so quick navigation/discard invalidates an obsolete request.
    Promise.resolve().then(() => {
      if (ticket !== sequence.current || key !== latestKey.current) return;
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
      if (ticket !== sequence.current || key !== latestKey.current) return;
      if (next.outcome === "no-alternative") {
        setMessage(next.message ?? "No different allocation found under the current constraints.");
        return;
      }
      setResult(next, baseline);
    }).catch(error => {
      if (ticket === sequence.current && key === latestKey.current) {
        console.error("Generation failed:", error);
        setMessage("Could not generate this week. Please try again.");
      }
    });
  }, [isGenerating, rangeKey, tasks, events, range, blocks, settings, result, previewEvents,
    replacementBaseline, setGenerating, setMessage, setResult]);

  const discard = useCallback(() => {
    sequence.current++;
    attempt.current = 0;
    clearPreview();
  }, [clearPreview]);

  return {
    generateWeek: () => runSchedule(false),
    generateAgain: () => runSchedule(true),
    discard,
    isGenerating,
  };
}
