import type { CalendarEvent } from "@brkroutnxdle/shared";
import { api } from "./api";
import { confirmRemoteEvents } from "./calendarReconciliation";
import type { CalendarRange } from "./calendarReconciliation";

export const CONFIRMATION_TTL_MS = 300_000;
/** A structurally valid GET with unusable intervals can inform refresh diagnostics, never confirmation. */
export class InvalidRemoteIntervals extends Error {
  constructor(readonly events: CalendarEvent[]) {
    super("Calendar GET returned an invalid event interval. Refresh before retrying.");
  }
}
export type RemoteConfirmation =
  | { status: "confirmed"; accountId: string; range: CalendarRange; confirmedAt: number; events: readonly CalendarEvent[]; reason: null }
  | { status: "unconfirmed"; accountId: string | null; range: CalendarRange; confirmedAt: number | null; events: readonly []; reason: "unauthenticated" | "not-read" | "reading" | "failed" | "expired" | "mutation" };

const listeners = new Set<() => void>();
let account: string | null = null;
let epoch = 0;
let identityVersion = 0;
let sequence = 0;
let pendingWrites = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const records = new Map<string, { snapshot: RemoteConfirmation; sequence: number }>();
const keyOf = (range: CalendarRange) => JSON.stringify([range.timeMin, range.timeMax]);
function emit() { listeners.forEach(listener => listener()); }
function reschedule() {
  clearTimeout(timer);
  const nearest = [...records.values()].filter(record => record.snapshot.status === "confirmed")
    .map(record => record.snapshot.confirmedAt! + CONFIRMATION_TTL_MS - Date.now())
    .filter(delay => delay >= 0).sort((a, b) => a - b)[0];
  if (nearest !== undefined) timer = setTimeout(() => { expire(); }, nearest + 1);
}
export function subscribeRemoteConfirmation(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function activeRemoteAccount() { return account; }
export function remoteEpoch() { return epoch; }
export function remoteIdentityVersion() { return identityVersion; }
export function setRemoteAccount(id: string | null) {
  if (id === account) return;
  account = id;
  epoch++;
  identityVersion++;
  pendingWrites = 0;
  records.clear();
  clearTimeout(timer);
  emit();
}
export function invalidateRemoteConfirmation() {
  epoch++;
  for (const [key, record] of records) records.set(key, {
    ...record, snapshot: { status: "unconfirmed", accountId: account,
      range: record.snapshot.range, confirmedAt: record.snapshot.confirmedAt, events: [], reason: "mutation" },
  });
  clearTimeout(timer);
  emit();
}
/** Block incidental reads during a write; release before the authoritative follow-up GET. */
export function beginRemoteMutation() {
  const identity = identityVersion;
  pendingWrites++;
  invalidateRemoteConfirmation();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (identity === identityVersion) pendingWrites = Math.max(0, pendingWrites - 1);
  };
}
function expire() {
  let changed = false;
  for (const [key, record] of records) {
    if (record.snapshot.status === "confirmed" && Date.now() >= record.snapshot.confirmedAt + CONFIRMATION_TTL_MS) {
      records.set(key, { ...record, snapshot: { status: "unconfirmed", accountId: account,
        range: record.snapshot.range, confirmedAt: record.snapshot.confirmedAt, events: [], reason: "expired" } });
      changed = true;
    }
  }
  if (changed) emit();
  reschedule();
}
const defaults = new Map<string, RemoteConfirmation>();
export function getRemoteConfirmation(range: CalendarRange): RemoteConfirmation {
  const key = keyOf(range);
  const existing = records.get(key)?.snapshot;
  if (existing) {
    if (existing.status === "confirmed" && Date.now() >= existing.confirmedAt + CONFIRMATION_TTL_MS) expire();
    return records.get(key)!.snapshot;
  }
  const defaultKey = `${account ?? ""}/${key}`;
  if (!defaults.has(defaultKey)) defaults.set(defaultKey, { status: "unconfirmed", accountId: account,
    range, confirmedAt: null, events: [], reason: account ? "not-read" : "unauthenticated" });
  return defaults.get(defaultKey)!;
}

/** Only this full network GET can create a qualified snapshot. Return null if identity/epoch/read changed. */
export async function readRemoteCalendar(range: CalendarRange, expectedAccount: string): Promise<CalendarEvent[] | null> {
  if (!expectedAccount || account !== expectedAccount) return null;
  const epochAtStart = epoch;
  const startedDuringWrite = pendingWrites > 0;
  const key = keyOf(range);
  const ticket = ++sequence;
  const prior = getRemoteConfirmation(range);
  records.set(key, { sequence: ticket, snapshot: { status: "unconfirmed", accountId: account,
    range, confirmedAt: prior.confirmedAt, events: [], reason: "reading" } });
  reschedule(); emit();
  try {
    const events = confirmRemoteEvents(await api.get<unknown>("/events", { timeMin: range.timeMin, timeMax: range.timeMax }));
    if (events.some(event => !Number.isFinite(Date.parse(event.start)) ||
      !Number.isFinite(Date.parse(event.end)) || Date.parse(event.end) <= Date.parse(event.start))) {
      throw new InvalidRemoteIntervals(events);
    }
    if (account !== expectedAccount || epoch !== epochAtStart || records.get(key)?.sequence !== ticket) return null;
    if (startedDuringWrite || pendingWrites) {
      records.set(key, { sequence: ticket, snapshot: { status: "unconfirmed", accountId: account,
        range, confirmedAt: prior.confirmedAt, events: [], reason: "mutation" } });
      emit();
      return null;
    }
    records.set(key, { sequence: ticket, snapshot: { status: "confirmed", accountId: expectedAccount,
      range, confirmedAt: Date.now(), events, reason: null } });
    reschedule(); emit();
    return events;
  } catch (error) {
    if (account === expectedAccount && epoch === epochAtStart && records.get(key)?.sequence === ticket) {
      records.set(key, { sequence: ticket, snapshot: { status: "unconfirmed", accountId: account,
        range, confirmedAt: prior.confirmedAt, events: [], reason: "failed" } });
      reschedule(); emit();
    }
    throw error;
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => { if (!document.hidden) expire(); });
  window.addEventListener("focus", expire);
}
