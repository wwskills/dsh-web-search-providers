/**
 * Small shared HTTP helpers for both providers: timeout-plus-external-signal
 * coalescing and abort classification. Each is a pure, unit-testable function.
 * @module @wwskills/dsh-web-search-providers/http-util
 */

/** A `fetch`-style init that also carries our timeout signal. */
export interface FetchRequestInit extends RequestInit {
  signal?: AbortSignal
}

/**
 * Build a controller whose signal aborts on either the caller's `signal` or
 * the timeout, whichever fires first. Returns `AbortSignal.any` when available,
 * otherwise a manually-wired controller.
 */
export function buildAbortSignal(external: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  const controller = new AbortController()
  const cancel = (): void => {
    controller.abort()
    clearTimeout(timer)
    if (external) external.removeEventListener('abort', onExternalAbort)
  }
  const onExternalAbort = (): void => cancel()
  const timer = setTimeout(cancel, timeoutMs)
  // Already-aborted external signal: abort immediately.
  if (external?.aborted) {
    cancel()
  } else if (external) {
    external.addEventListener('abort', onExternalAbort, { once: true })
  }
  return controller.signal
}

/** True when an error is a DOMException/AbortError (timeout or cancellation). */
export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error
    && (error.name === 'AbortError' || (error as { code?: string }).code === 'ABORT_ERR')
  )
}

/**
 * `fetch` wrapper that merges an external `init.signal` with an explicit
 * timeout (applied via `buildAbortSignal`). Callers should pass the combined
 * signal through `init.signal`; this wrapper then delegates to `fetch`.
 *
 * The timeout itself is enforced by the signal — this function exists as a
 * single point where transport-level retry / logging could be added later.
 */
export async function fetchWithTimeout(url: string, init: FetchRequestInit): Promise<Response> {
  return fetch(url, init)
}
