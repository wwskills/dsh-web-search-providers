/**
 * Plugin entry point: registers Tavily and Baidu providers into DSH's web seam.
 *
 * Only the selected provider is registered at a time. When `activeProvider` is
 * `none`, no custom provider is registered and DSH falls back to its built-in
 * DeepSeek web search. Switching providers disposes the old one and registers
 * the new one live (no restart).
 * @module @wwskills/dsh-web-search-providers/index
 */
export declare const name = "web-search-providers";
export declare const inject: string[];
declare const Config: any;
interface PluginConfig {
    activeProvider: 'none' | 'tavily' | 'baidu';
    tavily: {
        apiKey: string;
        baseURL: string;
        maxResults: number;
        searchDepth: 'basic' | 'advanced';
        timeoutMs: number;
    };
    baidu: {
        apiKey: string;
        maxResults: number;
        timeoutMs: number;
    };
}
export declare function apply(ctx: any, config?: Partial<PluginConfig>): void;
export { Config };
export default apply;
//# sourceMappingURL=index.d.ts.map