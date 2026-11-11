import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { CalendarEvent } from "@brkroutnxdle/shared";
import { useAuth } from "../../contexts/AuthContext";
import { changeManualEdit, checkManualEditStorage, manualEdits, restoreManualEdits } from "../../services/manualEditJournal";

/** Keep calendar drafts and their recoverable storage diagnostics together. */
export function useManualCalendarEdits(events: CalendarEvent[],
  setEvents: Dispatch<SetStateAction<CalendarEvent[]>>, saveStatus: string) {
  const { user } = useAuth();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const edits = manualEdits(user.id);
      if (edits.size) {
        setEvents(prev => restoreManualEdits(user.id, prev));
        setHasUnsavedChanges(true);
      }
    } catch { setManualError("Manual edits could not be restored from storage. Restore storage before saving."); }
  }, [user?.id, setEvents]);

  useEffect(() => {
    if (saveStatus !== "success") return;
    try {
      setHasUnsavedChanges(!!user?.id && manualEdits(user.id).size > 0);
    } catch { setManualError("Manual edits could not be restored from storage. Restore storage before saving."); }
  }, [saveStatus, user?.id]);

  const handleExternalEventChange = useCallback((id: string, start: string, end: string): boolean => {
    const event = events.find(item => item.id === id);
    if (!event || !user?.id) return false;
    if (event.source === "google") {
      try {
        changeManualEdit(user.id, id, { original: manualEdits(user.id).get(id)?.original ?? event,
          desired: { start, end }, written: false });
      } catch {
        setManualError("Could not persist manual edit. Check browser storage and retry.");
        return false;
      }
    }
    setEvents(prev => prev.map(item => item.id === id ? { ...item, start, end } : item));
    setHasUnsavedChanges(true);
    return true;
  }, [events, setEvents, user?.id]);

  const retryManualStorage = useCallback(() => {
    if (!user?.id) return;
    try {
      checkManualEditStorage(user.id);
      setManualError(null);
    } catch { setManualError("Could not persist manual edit. Check browser storage and retry."); }
  }, [user?.id]);

  return { hasUnsavedChanges, setHasUnsavedChanges, manualError, setManualError,
    handleExternalEventChange, retryManualStorage };
}
