import type { CalendarEvent } from "@brkroutnxdle/shared";
import type { CalendarRange } from "./calendarReconciliation";
import { isInRange } from "./calendarReconciliation";

export interface ManualEdit {
  original: CalendarEvent;
  desired: { start: string; end: string } | null;
  written: boolean;
  /** Persisted before sending the write; an uncertain response is never blindly replayed. */
  attempted?: boolean;
}

const key = (account: string) => `brkroutnxdle:manual-edits:${encodeURIComponent(account)}`;
const entries = new Map<string, Map<string, ManualEdit>>();

export function manualEdits(account: string): Map<string, ManualEdit> {
  let edits = entries.get(account);
  if (edits) return edits;
  const raw = localStorage.getItem(key(account));
  const parsed: unknown = raw === null ? [] : JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Manual edit journal is invalid. Restore storage before saving.");
  edits = new Map();
  for (const entry of parsed) {
    if (!Array.isArray(entry) || typeof entry[0] !== "string" || !entry[1] ||
      entry[1].original?.id !== entry[0] || entry[1].original?.source !== "google" ||
      (entry[1].desired !== null && (!entry[1].desired?.start || !entry[1].desired?.end))) {
      throw new Error("Manual edit journal is invalid. Restore storage before saving.");
    }
    edits.set(entry[0], entry[1] as ManualEdit);
  }
  entries.set(account, edits);
  return edits;
}

export function changeManualEdit(account: string, id: string, edit: ManualEdit | null) {
  const current = manualEdits(account);
  const next = new Map(current);
  if (edit) next.set(id, edit);
  else next.delete(id);
  localStorage.setItem(key(account), JSON.stringify([...next]));
  entries.set(account, next);
}

export function checkManualEditStorage(account: string) {
  localStorage.setItem(key(account), JSON.stringify([...manualEdits(account)]));
}

/** An acknowledged HTTP write is remembered in this tab even if storage has filled up.
 * The durable pre-send `attempted` marker makes reload retry confirmation-only. */
export function acknowledgeManualWrite(account: string, id: string, edit: ManualEdit) {
  try {
    changeManualEdit(account, id, { ...edit, attempted: true, written: true });
  } catch {
    const next = new Map(manualEdits(account));
    next.set(id, { ...edit, attempted: true, written: true });
    entries.set(account, next);
    throw new Error("Calendar write succeeded but browser storage failed. Retry to confirm the remote occurrence; no write will be repeated.");
  }
}

/** Keep a local draft hidden from background GETs until the save has been confirmed. */
export function overlayManualEdits(account: string, current: CalendarEvent[], remote: CalendarEvent[], range?: CalendarRange) {
  const edits = manualEdits(account);
  const locals = new Map(current.map(event => [event.id, event]));
  const visible = remote.flatMap(event => {
    const edit = edits.get(event.id);
    if (!edit) return [event];
    if (edit.desired === null) return [];
    return [{ ...event, ...edit.desired, ...(locals.get(event.id)?.isPinned ? { isPinned: true } : {}) }];
  });
  // A stale or concurrently changed GET must not erase an unsaved move. The
  // unmodified GET remains authoritative for conflict detection during Save.
  for (const [id, edit] of edits) {
    if (edit.desired && !remote.some(event => event.id === id) &&
      (!range || isInRange({ ...edit.original, ...edit.desired }, range))) {
      visible.push({ ...edit.original, ...edit.desired });
    }
  }
  return visible;
}

export function restoreManualEdits(account: string, current: CalendarEvent[]) {
  const edits = manualEdits(account);
  return [...current.filter(event => !edits.has(event.id)),
    ...[...edits.values()].filter(edit => edit.desired !== null).map(edit => ({
      ...edit.original, ...edit.desired!,
    }))];
}
