// I-01: Exponential backoff retry for fetch calls.
// Retries only on network errors or 5xx server errors.
// 4xx responses are intentional and returned immediately without retrying.
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxAttempts = 3,
  baseDelayMs = 1000
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(input, init);

      // Client errors (4xx) are intentional — return immediately
      if (res.ok || (res.status >= 400 && res.status < 500)) return res;

      // Server error (5xx) — retry after backoff
      lastError = new Error(`Server error: ${res.status}`);
    } catch (err) {
      // Network failure (offline, DNS, timeout) — retry
      lastError = err;
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, baseDelayMs * Math.pow(2, attempt))
      );
    }
  }

  throw lastError;
}
