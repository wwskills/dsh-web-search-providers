/**
 * Browser settings panel for the web search providers plugin.
 *
 * Rendered into the DSH settings "plugins" tab. A single merged card holds the
 * provider selector and its config; the save bar tracks dirty state and offers
 * test connection (server-side, so browser CORS is not an issue).
 * @module @wwskills/dsh-web-search-providers/client
 */
export declare const NS = "web-search-providers";
interface Locale {
    tab: string;
    title: string;
    providerLabel: string;
    tavily: string;
    baidu: string;
    none: string;
    statusEnabled: string;
    statusDisabled: string;
    apiKey: string;
    apiKeyHint: string;
    baiduApiKeyHint: string;
    getBaiduKey: string;
    maxResults: string;
    searchDepth: string;
    testConnection: string;
    save: string;
    cancel: string;
    saved: string;
    getTavilyKey: string;
    configLabel: string;
    unsavedChanges: string;
    saveFailed: string;
    testing: string;
    saving: string;
    connectionOk: string;
    connectionFail: string;
    usageThisMonth: string;
    usageUnit: string;
}
export declare const inject: string[];
export declare function apply(ctx: {
    effect: (fn: () => unknown, label?: string) => unknown;
    locale: {
        register: (ns: string, dicts: {
            zh: Locale;
            en: Locale;
        }) => unknown;
        bind: (ns: string) => (key: string) => string;
    };
    slots: {
        inject: (slot: string, fn: () => unknown) => unknown;
    };
}): void;
export {};
//# sourceMappingURL=client.d.ts.map