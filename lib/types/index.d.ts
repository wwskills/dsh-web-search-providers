/**
 * Plugin entry point: registers a Tavily or Baidu provider into DSH's web seam
 * and serves the settings panel's API.
 *
 * Rewritten for DSH 0.2.x. Differences from the 0.1.x generation:
 * - Config is declared by exporting `Config`; DSH projects it into Settings by
 *   itself. `settings.register()` no longer exists.
 * - The row is inserted by a bundle patch, and the loader did not honour
 *   `export const inject`, so services are acquired with `ctx.inject(...)` at
 *   the point of use.
 * - Provider selection belongs to the seam: pin an id with the `web` row's
 *   `searchProvider` config or `$DSH_WEB_SEARCH_PROVIDER`.
 * - Values saved from the settings panel are persisted to `user-config.json`
 *   and merged over the row's config, so they take effect without a restart.
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
 * Activate the configured provider and mount the settings API.
 * @param ctx - plugin context.
 * @param config - the row's config cells or plain values.
 */
export declare function apply(ctx: any, config?: any): void;
export default apply;
//# sourceMappingURL=index.d.ts.map