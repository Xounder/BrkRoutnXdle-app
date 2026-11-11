import { useCallback, useEffect, useRef } from "react";
import { generateSchedule } from "@brkroutnxdle/domain";
import { useTaskContext } from "../contexts/TaskContext";
import { useBlockContext } from "../contexts/BlockContext";
import { useCalendar } from "../contexts/CalendarContext";
import { useSettings } from "../contexts/SettingsContext";
import { usePreview } from "../contexts/PreviewContext";
import { useAuth } from "../contexts/AuthContext";
import { useCalendarRefresh } from "./useCalendarRefresh";
import { activeRemoteAccount, getRemoteConfirmation, remoteEpoch } from "../services/remoteConfirmation";
import { calendarErrorMessage } from "../services/api";
import { generationInputs, previewInputKey, replacementCandidates, sameReplacementBaseline } from "../pages/dashboard/previewSchedule";
import type { PreviewRange } from "../pages/dashboard/previewSchedule";

export function useScheduleGeneration(range: PreviewRange) {
  const { tasks } = useTaskContext();
  const { blocks } = useBlockContext();
  const { events } = useCalendar();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { refresh } = useCalendarRefresh();
  const { result, previewEvents, replacementBaseline, setResult, setMessage,
    clearPreview, setGenerating, isGenerating } = usePreview();
  const sequence = useRef(0);
  const inputKey = previewInputKey(tasks, blocks, settings, events, range);
  const pending = useRef<string | null>(null);
  const latest = useRef({ tasks, blocks, settings, events, range, account: user?.id });
  latest.current = { tasks, blocks, settings, events, range, account: user?.id };
  const attempt = useRef(0);

  useEffect(() => {
    if (result && (result.weekStart !== range.timeMin || result.weekEnd !== range.timeMax)) {
      sequence.current++;
      attempt.current = 0;
      clearPreview();
    }
  }, [range.timeMin, range.timeMax, result, clearPreview]);

  const runSchedule = useCallback((again: boolean) => {
    if (pending.current) return;
    const key = inputKey;
    const ticket = ++sequence.current;
    pending.current = key;
    setGenerating(true);
    const identity = user?.id;
    const epoch = remoteEpoch();
    const original = latest.current;
    const signature = (value: typeof original) => JSON.stringify([value.tasks, value.blocks,
      value.settings, value.range, value.account]);
    const initialSignature = signature(original);
    const localSignature = JSON.stringify(original.events.filter(event => event.source !== "google"));
    // Never infer occupancy from the display cache or a previous confirmed timestamp.
    Promise.resolve().then(async () => {
      if (ticket !== sequence.current) return;
      if (!identity || activeRemoteAccount() !== identity) throw new Error("Sign in and retry the calendar read before calculating.");
      let snapshot = getRemoteConfirmation(range);
      const displayMatches = snapshot.status === "confirmed" && snapshot.events.every(remote =>
        original.events.some(local => local.id === remote.id && local.start === remote.start && local.end === remote.end)) &&
        original.events.filter(local => local.source === "google" &&
          Date.parse(local.start) < Date.parse(range.timeMax) && Date.parse(local.end) > Date.parse(range.timeMin))
          .every(local => snapshot.events.some(remote => remote.id === local.id));
      if (snapshot.status !== "confirmed" || snapshot.accountId !== identity || !displayMatches) {
        const read = await refresh(range, false, () => ticket === sequence.current &&
          activeRemoteAccount() === identity && signature(latest.current) === initialSignature);
        if (ticket !== sequence.current) return;
        if (!read) throw new Error("Calendar read was interrupted or superseded. Retry Calculate Week.");
        // Allow the calendar reconciliation to commit before capturing its input key.
        await new Promise(resolve => setTimeout(resolve, 0));
        snapshot = getRemoteConfirmation(range);
      }
      if (ticket !== sequence.current) return;
      const current = latest.current;
      if (signature(current) !== initialSignature ||
        JSON.stringify(current.events.filter(event => event.source !== "google")) !== localSignature ||
        activeRemoteAccount() !== identity || remoteEpoch() !== epoch ||
        snapshot.status !== "confirmed" || snapshot.accountId !== identity ||
        getRemoteConfirmation(range).status !== "confirmed") {
        throw new Error("Calendar or planning inputs changed while reading. Retry Calculate Week for the viewed week.");
      }
      const { tasks, blocks, settings, events } = current;
      const confirmedKey = previewInputKey(tasks, blocks, settings, events, range);
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
      let next;
      try {
        next = generateSchedule(inputs.tasks, blocks, inputs.base, settings, undefined, {
          targetWeekStart: range.timeMin,
          previousResult: prior,
          generationAttempt: again ? ++attempt.current : 0,
        });
      } catch {
        throw new Error("Calendar read succeeded, but schedule calculation failed. Retry after reviewing your planning inputs.");
      }
      if (ticket !== sequence.current) return;
      if (signature(latest.current) !== initialSignature ||
        previewInputKey(latest.current.tasks, latest.current.blocks, latest.current.settings,
          latest.current.events, latest.current.range) !== confirmedKey ||
        getRemoteConfirmation(range).status !== "confirmed") return;
      pending.current = null;
      if (next.outcome === "no-alternative") {
        setMessage(next.message ?? "No different allocation found under the current constraints.");
        return;
      }
      setResult(next, baseline, confirmedKey);
    }).catch(error => {
      if (ticket === sequence.current) {
        pending.current = null;
        setGenerating(false);
        setMessage(`Could not verify calendar occupancy for this week: ${calendarErrorMessage(error)} Retry Calculate Week or Generate again. Existing placements and preview were kept.`);
      }
    }).finally(() => {
      if (ticket === sequence.current && pending.current) {
        pending.current = null;
        setGenerating(false);
      }
    });
  }, [inputKey, user?.id, range, result, previewEvents, replacementBaseline,
    refresh, setGenerating, setMessage, setResult]);

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
