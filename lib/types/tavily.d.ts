/**
 * Tavily search provider.
 *
 * Calls Tavily's REST API (`api.tavily.com/search`) and normalizes its results
 * into DSH's `web_search` shape. Docs: https://docs.tavily.com
 * @module @wwskills/dsh-web-search-providers/tavily
 */
import type { SearchRequest, SearchResponse, WebSearchProvider } from './types.js';
export declare const TAVILY_PROVIDER_ID = "tavily";
export declare const TAVILY_DEFAULT_BASE_URL = "https://api.tavily.com";
export declare const TAVILY_DEFAULT_MAX_RESULTS = 5;
export declare const TAVILY_DEFAULT_SEARCH_DEPTH = "basic";
export declare const TAVILY_DEFAULT_TIMEOUT_MS = 30000;
export interface TavilyOptions {
    apiKey?: string;
    baseURL?: string;
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
    timeoutMs?: number;
}
type ResolveOptions = () => TavilyOptions;
/**
 * Tavily provider for DSH's web seam.
 *
 * Implements {@link WebSearchProvider}: `id`, `available()`, `search()`. The
 * options are read lazily through a `resolveOptions` callback so the active
 * config can change between calls without re-instantiating the provider.
 */
export declare class TavilySearchProvider implements WebSearchProvider {
    readonly id = "tavily";
    private readonly resolveOptions;
    constructor(resolveOptions: ResolveOptions);
    available(): boolean;
    search(request: SearchRequest, signal?: AbortSignal): Promise<SearchResponse>;
}
export {};
//# sourceMappingURL=tavily.d.ts.map