/**
 * Shared types for the web search provider plugin.
 * @module @wwskills/dsh-web-search-providers/types
 */
/** Normalized search source, matching DSH's `web_search` result shape. */
export interface SearchSource {
    url: string;
    title?: string;
    snippet?: string;
    publishedAt?: string;
}
/** Request passed by the host into a provider's `search()`. */
export interface SearchRequest {
    query: string;
    maxResults?: number;
}
/** Normalized search output the host consumes. */
export interface SearchResponse {
    sources: SearchSource[];
    /** Optional provider-generated answer text or summary (DSH 0.1.2 field name). */
    content?: string;
    truncated: boolean;
}
/**
 * A structured web-search error carrying a stable machine-readable code.
 * DSH's web seam recognises `code` to decide how the failure surfaces.
 */
export declare class WebError extends Error {
    readonly code: string;
    readonly cause?: unknown;
    constructor(message: string, code: string, opts?: {
        cause?: unknown;
    });
}
/** Error codes this plugin raises (kept in sync with the service seam). */
export declare const WEB_ABORTED = "WEB_ABORTED";
export declare const WEB_PROVIDER_ERROR = "WEB_PROVIDER_ERROR";
export declare const WEB_PROVIDER_CREDENTIAL_MISSING = "WEB_PROVIDER_CREDENTIAL_MISSING";
/**
 * The provider contract DSH's web seam expects. A provider exposes a stable
 * `id`, an `available()` probe, and a `search(request, signal)` that returns
 * normalized sources.
 */
export interface WebSearchProvider {
    readonly id: string;
    available(): boolean;
    search(request: SearchRequest, signal?: AbortSignal): Promise<SearchResponse>;
}
//# sourceMappingURL=types.d.ts.map