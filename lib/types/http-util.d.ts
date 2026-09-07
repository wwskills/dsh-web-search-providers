/**
 * Small shared HTTP helpers for both providers: timeout-plus-external-signal
 * coalescing and abort classification. Each is a pure, unit-testable function.
 * @module @wwskills/dsh-web-search-providers/http-util
 */
/**
 * Build a controller whose signal aborts on either the caller's `signal` or
 * the timeout, whichever fires first. Returns `AbortSignal.any` when available,
 * otherwise a manually-wired controller.
 */
export declare function buildAbortSignal(external: AbortSignal | undefined, timeoutMs: number): AbortSignal;
/** True when an error is a DOMException/AbortError (timeout or cancellation). */
export declare function isAbortError(error: unknown): boolean;
//# sourceMappingURL=http-util.d.ts.map