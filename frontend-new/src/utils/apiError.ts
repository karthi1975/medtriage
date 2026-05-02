/**
 * Honest API error extraction.
 *
 * Backends almost always send something more useful than the generic axios
 * `Network Error`. This util pulls the clearest signal we can in this
 * priority order:
 *
 *   1. response.data.detail          (FastAPI HTTPException convention)
 *   2. response.data.message         (alt JSON convention)
 *   3. response.data (string)        (some routes return text)
 *   4. response.statusText
 *   5. error.message                 (axios fallback)
 *
 * Returned shape lets the UI separate a short, user-friendly summary
 * (`message`) from a detailed reason it can hide behind a "Why?" disclosure
 * (`detail`). Status code is exposed for tone selection (e.g. 5xx → amber
 * "we're retrying", 4xx → red "fix needed").
 */
import axios from 'axios';

export interface ApiErrorInfo {
  /** Short, user-friendly summary suitable for a status line. */
  message: string;
  /** Full backend reason, suitable for a "Why?" disclosure or a debug log. */
  detail?: string;
  /** HTTP status if known. */
  status?: number;
  /** True when the failure looks transient (5xx / network) and worth auto-retrying. */
  isTransient: boolean;
}

export function extractApiError(err: unknown, fallback = 'Request failed'): ApiErrorInfo {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as
      | { detail?: string; message?: string }
      | string
      | undefined;

    let detail: string | undefined;
    if (typeof data === 'string' && data) {
      detail = data;
    } else if (data && typeof data === 'object') {
      detail = data.detail || data.message;
    }

    // Network / no response at all
    if (!err.response) {
      return {
        message: 'Network error',
        detail: err.message,
        status: undefined,
        isTransient: true,
      };
    }

    // 5xx → likely transient (cold start, DB hiccup) — UI can auto-retry softly
    if (status && status >= 500) {
      return {
        message: "Server didn't respond cleanly",
        detail: detail || err.response.statusText,
        status,
        isTransient: true,
      };
    }

    // 4xx → caller fault, usually not worth auto-retrying
    return {
      message: detail ? 'Request rejected' : `Request failed (${status})`,
      detail: detail || err.response.statusText,
      status,
      isTransient: false,
    };
  }

  // Non-axios (rare — TypeError from bad response shape, etc.)
  return {
    message: fallback,
    detail: err instanceof Error ? err.message : String(err),
    isTransient: false,
  };
}
