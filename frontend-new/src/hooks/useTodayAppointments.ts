/**
 * useTodayAppointments — single source of truth for today's schedule.
 *
 * Multiple surfaces read this (the appointments pane and the welcome hero
 * stat tiles), so we hoist fetching into a shared hook to avoid duplicate
 * requests and keep the two views in lockstep.
 *
 * Resilience:
 *   - First load tries up to 3 attempts with exponential backoff
 *     (300ms → 1s → 3s) before surfacing an error. Cloud Run cold starts
 *     and transient DB blips disappear silently.
 *   - On window focus we refetch (Sarah comes back from another tab).
 *   - While the tab is visible we poll every 60s — the on-call schedule
 *     can shift mid-shift and stale data is dangerous.
 *   - Errors expose backend `detail` (e.g. "DB unreachable") so the UI can
 *     show the real reason behind a "Why?" disclosure.
 *   - Last-known good data is kept across a failure so the UI can show
 *     "stale" rather than going blank.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/api';
import { useMASession } from '../context/MASessionContext';
import { extractApiError, type ApiErrorInfo } from '../utils/apiError';
import type { Appointment } from '../types/appointment';

const POLL_INTERVAL_MS = 60_000;
const RETRY_DELAYS = [300, 1_000, 3_000];

export interface UseTodayAppointmentsResult {
  appointments: Appointment[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: ApiErrorInfo | null;
  /** Stale = we showed data but a subsequent refresh failed. */
  isStale: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useTodayAppointments(): UseTodayAppointmentsResult {
  const { session } = useMASession();
  const facilityId = session?.facility_id;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Track the latest in-flight fetch so a stale response from an earlier
  // facility/session can't overwrite a newer one.
  const fetchIdRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);

  const doFetch = useCallback(
    async (mode: 'initial' | 'refresh') => {
      const myId = ++fetchIdRef.current;
      if (mode === 'initial') {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      let lastErr: ApiErrorInfo | null = null;

      // Backoff retries only on initial load — periodic polls fail-soft and
      // wait for the next tick so we don't hammer a sick backend.
      const attempts = mode === 'initial' ? RETRY_DELAYS.length + 1 : 1;
      for (let i = 0; i < attempts; i++) {
        try {
          const data = await apiService.getTodaysAppointments(facilityId);
          if (myId !== fetchIdRef.current) return; // superseded

          setAppointments(data);
          setError(null);
          setIsStale(false);
          setLastUpdated(new Date());
          hasLoadedOnceRef.current = true;
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        } catch (err) {
          lastErr = extractApiError(err, "Couldn't load today's schedule");
          // Only retry transient failures. 4xx fail fast.
          if (!lastErr.isTransient || i === attempts - 1) break;
          await new Promise((r) => setTimeout(r, RETRY_DELAYS[i]));
        }
      }

      if (myId !== fetchIdRef.current) return;

      // If we'd previously loaded data, keep it visible but mark stale.
      if (hasLoadedOnceRef.current) {
        setIsStale(true);
      }
      setError(lastErr);
      setIsLoading(false);
      setIsRefreshing(false);
    },
    [facilityId],
  );

  const refresh = useCallback(() => {
    void doFetch('refresh');
  }, [doFetch]);

  // Initial load + refetch when facility changes.
  useEffect(() => {
    hasLoadedOnceRef.current = false;
    setIsStale(false);
    void doFetch('initial');
  }, [doFetch]);

  // Refresh on tab focus — Sarah comes back from another tab and the
  // schedule should already be up to date.
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') {
        void doFetch('refresh');
      }
    };
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [doFetch]);

  // Poll every 60s while visible. Pause when hidden so we don't burn the
  // backend / Cloud Run cold-start budget on idle background tabs.
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id) return;
      id = setInterval(() => {
        if (document.visibilityState === 'visible') {
          void doFetch('refresh');
        }
      }, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (id) {
        clearInterval(id);
        id = null;
      }
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [doFetch]);

  return {
    appointments,
    isLoading,
    isRefreshing,
    error,
    isStale,
    lastUpdated,
    refresh,
  };
}

/** "Updated 12s ago" / "Updated 4m ago" — kept loose; refreshes every minute. */
export function formatLastUpdated(d: Date | null, now: Date = new Date()): string {
  if (!d) return '';
  const sec = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));
  if (sec < 5) return 'Updated just now';
  if (sec < 60) return `Updated ${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `Updated ${min}m ago`;
  const hr = Math.floor(min / 60);
  return `Updated ${hr}h ago`;
}
