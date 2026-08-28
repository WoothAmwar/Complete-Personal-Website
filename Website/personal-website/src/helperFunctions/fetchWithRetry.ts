/**
 * Retrying fetch for the Flask backend.
 *
 * The backend runs with a capped number of concurrent Lambda instances, so any
 * request can come back 429 for a reason that would succeed a few hundred
 * milliseconds later. Every call to NEXT_PUBLIC_API_URL goes through here.
 *
 * Request shapes are untouched: same url, same options, same headers. Only the
 * number of attempts changes.
 */

/** Default retry budget for every backend call. Change it here, not at call sites. */
export const DEFAULT_MAX_RETRIES = 4;

const BASE_DELAY_MS = 200;
const MAX_DELAY_MS = 2000;
const JITTER_MS = 100;

/** Carries the HTTP status so callers (and React Query) can branch on 429. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = DEFAULT_MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, options);
      // Out of budget: hand the 429 back and let the caller deal with it.
      if (response.status !== 429 || attempt === maxRetries) return response;
    } catch (err) {
      // Network level failure: dropped connection, DNS blip, failed preflight.
      if (attempt === maxRetries) throw err;
    }
    const backoff =
      Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS) + Math.random() * JITTER_MS;
    await new Promise((resolve) => setTimeout(resolve, backoff));
  }
}
