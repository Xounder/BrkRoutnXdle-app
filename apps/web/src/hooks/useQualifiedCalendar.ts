import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { CalendarRange } from "../services/calendarReconciliation";
import { activeRemoteAccount, getRemoteConfirmation, subscribeRemoteConfirmation } from "../services/remoteConfirmation";
import type { RemoteConfirmation } from "../services/remoteConfirmation";
import { useCalendarRefresh } from "./useCalendarRefresh";

/** Read-only full-GET evidence for one exact half-open range and current authenticated account.
 * `events` is empty unless confirmed; `confirmedAt` in unconfirmed states is historical context only.
 * `refresh()` forces a new network GET; it never promotes cached or local events.
 */
export function useQualifiedCalendar(range: CalendarRange): RemoteConfirmation & { refresh: () => Promise<void> } {
  const { user, loading } = useAuth();
  const { refresh } = useCalendarRefresh();
  const stableRange = useMemo(() => ({ timeMin: range.timeMin, timeMax: range.timeMax }),
    [range.timeMin, range.timeMax]);
  const snapshot = useSyncExternalStore(subscribeRemoteConfirmation,
    () => getRemoteConfirmation(stableRange));
  const accountId = !loading ? user?.id : undefined;
  const current = accountId && activeRemoteAccount() === accountId && snapshot.accountId === accountId
    ? snapshot : { status: "unconfirmed" as const, accountId: accountId ?? null,
      range: stableRange, confirmedAt: null, events: [] as const, reason: "unauthenticated" as const };
  const retry = useCallback(async () => { await refresh(stableRange, false); }, [refresh, stableRange]);
  return { ...current, refresh: retry };
}

export type { RemoteConfirmation } from "../services/remoteConfirmation";
