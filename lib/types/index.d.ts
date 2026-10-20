/**
 * Plugin entry point: registers a Tavily or Baidu provider into DSH's web seam.
 *
 * Rewritten for DSH 0.2.x. Differences from the 0.1.x generation:
 * - Config is declared by exporting `Config`; DSH projects it into Settings by
 *   itself. `settings.register()` no longer exists.
 * - `web` is a declared inject, so `ctx.web` is available directly.
 * - Provider selection is owned by the seam: pin an id with the `web` row's
 *   `searchProvider` config or `$DSH_WEB_SEARCH_PROVIDER`. Nothing here assigns
 *   `searchProviderId` any more.
 * - The settings panel and its HTTP routes were removed together with the client
 *   bundle; usage counters remain, persisted to the plugin data directory.
 *
 * Only the configured provider registers. When `activeProvider` is `none`, DSH
 * falls back to its built-in DeepSeek search.
 * @module @wwskills/dsh-web-search-providers/index
 */
import Schema from '@deepseek-ai/schemastery';
export declare const name = "web-search-providers";
export declare const inject: string[];
/** Config schema. DSH validates the row's config against it and renders the form. */
export declare const Config: Schema<Schemastery.ObjectS<NoInfer<{
    activeProvider: Schema<string, string, "defined">;
    tavilyApiKey: Schema<string, string, "defined">;
    tavilyBaseURL: Schema<string, string, "defined">;
    tavilyMaxResults: Schema<number, number, "defined">;
    tavilySearchDepth: Schema<string, string, "defined">;
    baiduApiKey: Schema<string, string, "defined">;
    baiduMaxResults: Schema<number, number, "defined">;
    timeoutMs: Schema<number, number, "defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    activeProvider: Schema<string, string, "defined">;
    tavilyApiKey: Schema<string, string, "defined">;
    tavilyBaseURL: Schema<string, string, "defined">;
    tavilyMaxResults: Schema<number, number, "defined">;
    tavilySearchDepth: Schema<string, string, "defined">;
    baiduApiKey: Schema<string, string, "defined">;
    baiduMaxResults: Schema<number, number, "defined">;
    timeoutMs: Schema<number, number, "defined">;
}>>, "plain">;
/**
 * Register the configured provider.
 * @param ctx - plugin context; `web` is injected.
 * @param config - the row's config cells.
 */
export declare function apply(ctx: any, config?: any): void;
export default apply;
//# sourceMappingURL=index.d.ts.map