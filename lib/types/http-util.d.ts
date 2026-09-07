/**
 * Small shared HTTP helpers for both providers: timeout-plus-external-signal
 * coalescing and abort classification. Each is a pure, unit-testable function.
 * @module @wwskills/dsh-web-search-providers/http-util
 */
/** A `fetch`-style init that also carries our timeout signal. */
export interface FetchRequestInit extends RequestInit {
    signal?: AbortSignal;
}
/**
 * Build a controller whose signal aborts on either the caller's `signal` or
 * the timeout, whichever fires first. Returns `AbortSignal.any` when available,
 * otherwise a manually-wired controller.
 */
export declare function buildAbortSignal(external: AbortSignal | undefined, timeoutMs: number): AbortSignal;
/** True when an error is a DOMException/AbortError (timeout or cancellation). */
export declare function isAbortError(error: unknown): boolean;
/**
 * `fetch` wrapper that merges an external `init.signal` with an explicit
 * timeout (applied via `buildAbortSignal`). Callers should pass the combined
 * signal through `init.signal`; this wrapper then delegates to `fetch`.
 *
 * The timeout itself is enforced by the signal — this function exists as a
 * single point where transport-level retry / logging could be added later.
 */
export declare function fetchWithTimeout(url: string, init: FetchRequestInit): Promise<Response>;
//# sourceMappingURL=http-util.d.ts.map