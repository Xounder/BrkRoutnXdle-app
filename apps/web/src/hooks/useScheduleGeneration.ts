import { useCallback } from "react";
import { generateSchedule } from "@brkroutnxdle/domain";
import { useTaskContext } from "../contexts/TaskContext";
import { useBlockContext } from "../contexts/BlockContext";
import { useCalendar } from "../contexts/CalendarContext";
import { useSettings } from "../contexts/SettingsContext";
import { usePreview } from "../contexts/PreviewContext";

export function useScheduleGeneration() {
  const { tasks } = useTaskContext();
  const { blocks } = useBlockContext();
  const { events } = useCalendar();
  const { settings } = useSettings();
  const { setPreview, clearPreview, setGenerating, isGenerating } = usePreview();

  const runSchedule = useCallback(() => {
    if (isGenerating) return;
    setGenerating(true);
    try {
      const result = generateSchedule(tasks, blocks, events, settings);
      setPreview(result.generatedEvents, result.failures);
    } catch (err) {
      console.error("Generation failed:", err);
      setGenerating(false);
    }
  }, [tasks, blocks, events, settings, setPreview, setGenerating, isGenerating]);

  const discard = useCallback(() => {
    clearPreview();
  }, [clearPreview]);

  return {
    generateWeek: runSchedule,
    generateAgain: runSchedule,
    discard,
    isGenerating,
  };
}
