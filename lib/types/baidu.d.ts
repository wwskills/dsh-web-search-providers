/**
 * Baidu Qianfan AI Search provider.
 *
 * Calls `qianfan.baidubce.com/v2/ai_search/web_search` with a Bearer API key
 * (no AK/SK flow) and normalizes its `references` array into DSH's web shape.
 * Docs: https://cloud.baidu.com/doc/qianfan-api/s/Wmbq4z7e5
 * @module @wwskills/dsh-web-search-providers/baidu
 */
import type { SearchRequest, SearchResponse, WebSearchProvider } from './types.js';
export declare const BAIDU_PROVIDER_ID = "baidu";
export declare const BAIDU_DEFAULT_ENDPOINT = "https://qianfan.baidubce.com";
export declare const BAIDU_DEFAULT_MAX_RESULTS = 5;
export declare const BAIDU_DEFAULT_TIMEOUT_MS = 30000;
export interface BaiduOptions {
    apiKey?: string;
    endpoint?: string;
    maxResults?: number;
    timeoutMs?: number;
}
type ResolveOptions = () => BaiduOptions;
/**
 * Baidu provider for DSH's web seam.
 *
 * Implements {@link WebSearchProvider}: `id`, `available()`, `search()`. The
 * request body follows Qianfan's chat-completion-shaped `messages` format with
 * a `search_source` of `baidu_search_v2`.
 */
export declare class BaiduSearchProvider implements WebSearchProvider {
    readonly id = "baidu";
    private readonly resolveOptions;
    constructor(resolveOptions: ResolveOptions);
    available(): boolean;
    search(request: SearchRequest, signal?: AbortSignal): Promise<SearchResponse>;
}
export {};
//# sourceMappingURL=baidu.d.ts.map