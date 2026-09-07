// src/index.ts
import Schema from "@deepseek-ai/schemastery";
import { mkdirSync as mkdirSync2, readFileSync as readFileSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join3 } from "node:path";

// src/config-path.ts
import { homedir } from "node:os";
import { join } from "node:path";
function dataDirectory() {
  const override = process.env.DSH_HOME?.trim();
  if (override) return join(override, "web-search-providers");
  return join(homedir(), ".dsh", "web-search-providers");
}

// src/types.ts
var WebError = class extends Error {
  code;
  cause;
  constructor(message, code, opts) {
    super(message);
    this.name = "WebError";
    this.code = code;
    this.cause = opts?.cause;
  }
};
var WEB_ABORTED = "WEB_ABORTED";
var WEB_PROVIDER_ERROR = "WEB_PROVIDER_ERROR";
var WEB_PROVIDER_CREDENTIAL_MISSING = "WEB_PROVIDER_CREDENTIAL_MISSING";

// src/http-util.ts
function buildAbortSignal(external, timeoutMs) {
  const controller = new AbortController();
  const cancel = () => {
    controller.abort();
    clearTimeout(timer);
    if (external) external.removeEventListener("abort", onExternalAbort);
  };
  const onExternalAbort = () => cancel();
  const timer = setTimeout(cancel, timeoutMs);
  if (external?.aborted) {
    cancel();
  } else if (external) {
    external.addEventListener("abort", onExternalAbort, { once: true });
  }
  return controller.signal;
}
function isAbortError(error) {
  return error instanceof Error && (error.name === "AbortError" || error.code === "ABORT_ERR");
}

// src/tavily.ts
var TAVILY_PROVIDER_ID = "tavily";
var TAVILY_DEFAULT_BASE_URL = "https://api.tavily.com";
var TAVILY_DEFAULT_MAX_RESULTS = 5;
var TAVILY_DEFAULT_SEARCH_DEPTH = "basic";
var TAVILY_DEFAULT_TIMEOUT_MS = 3e4;
var TavilySearchProvider = class {
  id = TAVILY_PROVIDER_ID;
  resolveOptions;
  constructor(resolveOptions) {
    this.resolveOptions = resolveOptions;
  }
  available() {
    const { apiKey } = this.resolveOptions();
    return Boolean(apiKey && apiKey.length > 0);
  }
  async search(request, signal) {
    const options = this.resolveOptions();
    const apiKey = options.apiKey ?? "";
    if (!apiKey) {
      throw new WebError(
        "Tavily search requires an API key. Configure it in Settings \u2192 Web Search \u2192 Tavily.",
        WEB_PROVIDER_CREDENTIAL_MISSING
      );
    }
    const baseURL = options.baseURL || TAVILY_DEFAULT_BASE_URL;
    const maxResults = options.maxResults ?? TAVILY_DEFAULT_MAX_RESULTS;
    const searchDepth = options.searchDepth ?? TAVILY_DEFAULT_SEARCH_DEPTH;
    const timeoutMs = options.timeoutMs ?? TAVILY_DEFAULT_TIMEOUT_MS;
    const controller = buildAbortSignal(signal, timeoutMs);
    const body = {
      api_key: apiKey,
      query: request.query,
      max_results: request.maxResults ?? maxResults,
      search_depth: searchDepth,
      include_answer: true,
      include_raw_content: false
    };
    try {
      const response = await fetch(`${baseURL}/search`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new WebError(
          `Tavily API error: HTTP ${response.status} \u2014 ${text.slice(0, 200)}`,
          WEB_PROVIDER_ERROR,
          { cause: text.slice(0, 200) }
        );
      }
      const data = await response.json();
      const sources = (Array.isArray(data.results) ? data.results : []).map((result) => ({
        url: result.url || "",
        ...result.title ? { title: result.title } : {},
        ...result.content ? { snippet: result.content } : {},
        ...result.published_date ? { publishedAt: result.published_date } : {}
      }));
      return {
        sources,
        // Tavily's API field is `answer`; DSH's normalized result field is `content`.
        ...typeof data.answer === "string" && data.answer ? { content: data.answer } : {},
        truncated: false
      };
    } catch (error) {
      if (error instanceof WebError) throw error;
      if (isAbortError(error)) {
        throw new WebError("Tavily search timed out or was aborted", WEB_ABORTED, { cause: error });
      }
      throw new WebError(
        `Tavily search failed: ${error instanceof Error ? error.message : String(error)}`,
        WEB_PROVIDER_ERROR,
        { cause: error }
      );
    }
  }
};

// src/baidu.ts
var BAIDU_PROVIDER_ID = "baidu";
var BAIDU_DEFAULT_ENDPOINT = "https://qianfan.baidubce.com";
var BAIDU_DEFAULT_MAX_RESULTS = 5;
var BAIDU_DEFAULT_TIMEOUT_MS = 3e4;
var BaiduSearchProvider = class {
  id = BAIDU_PROVIDER_ID;
  resolveOptions;
  constructor(resolveOptions) {
    this.resolveOptions = resolveOptions;
  }
  available() {
    const { apiKey } = this.resolveOptions();
    return Boolean(apiKey && apiKey.length > 0);
  }
  async search(request, signal) {
    const options = this.resolveOptions();
    const apiKey = options.apiKey ?? "";
    if (!apiKey) {
      throw new WebError(
        "Baidu search requires an API Key. Configure it in Settings \u2192 Web Search \u2192 Baidu.",
        WEB_PROVIDER_CREDENTIAL_MISSING
      );
    }
    const endpoint = options.endpoint || BAIDU_DEFAULT_ENDPOINT;
    const maxResults = options.maxResults ?? BAIDU_DEFAULT_MAX_RESULTS;
    const timeoutMs = options.timeoutMs ?? BAIDU_DEFAULT_TIMEOUT_MS;
    const controller = buildAbortSignal(signal, timeoutMs);
    const body = {
      messages: [{ role: "user", content: request.query }],
      search_source: "baidu_search_v2",
      resource_type_filter: [{ type: "web", top_k: request.maxResults ?? maxResults }]
    };
    try {
      const response = await fetch(`${endpoint}/v2/ai_search/web_search`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new WebError(
          `Baidu search API error: HTTP ${response.status} \u2014 ${text.slice(0, 200)}`,
          WEB_PROVIDER_ERROR,
          { cause: text.slice(0, 200) }
        );
      }
      const data = await response.json();
      const sources = extractSources(data).map((result) => ({
        url: result.url || result.link || "",
        ...result.title ? { title: result.title } : {},
        ...result.snippet || result.content || result.abstract ? { snippet: result.snippet || result.content || result.abstract } : {},
        ...result.date || result.create_time || result.publish_time ? { publishedAt: result.date || result.create_time || result.publish_time } : {}
      }));
      const answer = data?.content?.[0]?.content ?? data?.answer ?? data?.summary;
      return {
        sources,
        // DSH's normalized result field is `content` (was `answer` before 0.1.2).
        ...typeof answer === "string" && answer ? { content: answer } : {},
        truncated: false
      };
    } catch (error) {
      if (error instanceof WebError) throw error;
      if (isAbortError(error)) {
        throw new WebError("Baidu search timed out or was aborted", WEB_ABORTED, { cause: error });
      }
      throw new WebError(
        `Baidu search failed: ${error instanceof Error ? error.message : String(error)}`,
        WEB_PROVIDER_ERROR,
        { cause: error }
      );
    }
  }
};
function extractSources(data) {
  return data?.references ?? data?.search_info?.search_results ?? data?.search_results ?? data?.results ?? [];
}

// src/usage.ts
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join as join2, dirname } from "node:path";
var FREE_QUOTAS = {
  tavily: 1e3,
  baidu: 1500
};
function usagePath() {
  return join2(dataDirectory(), "usage.json");
}
function currentMonthKey() {
  const now = /* @__PURE__ */ new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function loadUsage() {
  try {
    return JSON.parse(readFileSync(usagePath(), "utf8"));
  } catch {
    return {};
  }
}
function saveUsage(data) {
  try {
    mkdirSync(dirname(usagePath()), { recursive: true });
    writeFileSync(usagePath(), JSON.stringify(data, null, 2) + "\n", "utf8");
  } catch (error) {
    console.warn(`[web-search-providers] usage persist failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
function incrementUsage(provider) {
  const data = loadUsage();
  const month = currentMonthKey();
  if (!data[month]) data[month] = {};
  if (!data[month][provider]) data[month][provider] = 0;
  data[month][provider] += 1;
  saveUsage(data);
  return {
    provider,
    month,
    used: data[month][provider],
    quota: FREE_QUOTAS[provider] ?? null
  };
}
function getUsageSnapshot() {
  const data = loadUsage();
  const month = currentMonthKey();
  const monthData = data[month] ?? {};
  const providers = {};
  for (const provider of Object.keys(FREE_QUOTAS)) {
    providers[provider] = {
      used: monthData[provider] ?? 0,
      quota: FREE_QUOTAS[provider]
    };
  }
  return { month, providers };
}

// src/index.ts
var name = "web-search-providers";
var inject = ["web", "settings"];
var SETTINGS_NS = "web-search-providers";
var Config = Schema.object({
  activeProvider: Schema.union(["none", "tavily", "baidu"]).default("none"),
  tavily: Schema.object({
    apiKey: Schema.string().role("secret").default(""),
    baseURL: Schema.string().default(TAVILY_DEFAULT_BASE_URL),
    maxResults: Schema.natural().default(5),
    searchDepth: Schema.union(["basic", "advanced"]).default("basic"),
    timeoutMs: Schema.natural().default(3e4)
  }),
  baidu: Schema.object({
    apiKey: Schema.string().role("secret").default(""),
    maxResults: Schema.natural().default(5),
    timeoutMs: Schema.natural().default(3e4)
  })
});
function userConfigPath() {
  return join3(dataDirectory(), "user-config.json");
}
function loadPersistedConfig(cfg) {
  try {
    const parsed = JSON.parse(readFileSync2(userConfigPath(), "utf8"));
    return mergeConfig(cfg, parsed);
  } catch {
    return cfg;
  }
}
function persistConfig(data) {
  const target = userConfigPath();
  try {
    mkdirSync2(dataDirectory(), { recursive: true });
    writeFileSync2(target, JSON.stringify(data, null, 2) + "\n", "utf8");
    return true;
  } catch (error) {
    console.warn(`[web-search-providers] config persist failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}
function mergeConfig(base, override) {
  const out = { ...base };
  for (const key of Object.keys(override)) {
    const baseValue = base[key];
    const overrideValue = override[key];
    if (typeof overrideValue === "object" && overrideValue !== null && !Array.isArray(overrideValue) && typeof baseValue === "object" && baseValue !== null && !Array.isArray(baseValue)) {
      ;
      out[key] = mergeConfig(baseValue, overrideValue);
    } else if (overrideValue !== void 0) {
      ;
      out[key] = overrideValue;
    }
  }
  return out;
}
function pinSearchProvider(web, id) {
  try {
    if ("searchProviderId" in web) web.searchProviderId = id;
  } catch {
    console.log(
      `[web-search-providers] DSH 0.1.2+ uses constructor-time provider selection. Set web config searchProvider="${id}" or env DSH_WEB_SEARCH_PROVIDER=${id}`
    );
  }
}
function apply(ctx, config = {}) {
  let cfg = loadPersistedConfig(config);
  const state = {
    cfg,
    activeProvider: cfg.activeProvider || "none",
    settingsHandle: null,
    currentDisposer: null,
    webCtx: null
  };
  function resolveOptions() {
    const provider = state.activeProvider;
    if (provider === "tavily") {
      const c = state.cfg.tavily ?? {};
      return {
        apiKey: c.apiKey ?? "",
        baseURL: c.baseURL ?? TAVILY_DEFAULT_BASE_URL,
        maxResults: c.maxResults ?? 5,
        searchDepth: c.searchDepth ?? "basic",
        timeoutMs: c.timeoutMs ?? 3e4
      };
    }
    if (provider === "baidu") {
      const c = state.cfg.baidu ?? {};
      return {
        apiKey: c.apiKey ?? "",
        endpoint: BAIDU_DEFAULT_ENDPOINT,
        maxResults: c.maxResults ?? 5,
        timeoutMs: c.timeoutMs ?? 3e4
      };
    }
    return null;
  }
  function createProvider() {
    const provider = state.activeProvider;
    let instance = null;
    if (provider === "tavily") instance = new TavilySearchProvider(() => resolveOptions());
    if (provider === "baidu") instance = new BaiduSearchProvider(() => resolveOptions());
    if (!instance) return null;
    const originalSearch = instance.search.bind(instance);
    const providerId = instance.id;
    instance.search = async (req, sig) => {
      try {
        const result = await originalSearch(req, sig);
        incrementUsage(providerId);
        return result;
      } catch (error) {
        incrementUsage(providerId);
        throw error;
      }
    };
    return instance;
  }
  function registerActiveProvider() {
    if (!state.webCtx) return;
    if (state.currentDisposer) {
      try {
        state.currentDisposer();
      } catch {
      }
      state.currentDisposer = null;
    }
    const provider = createProvider();
    if (!provider) {
      console.log("[web-search-providers] no active provider, DSH falls back to default");
      return;
    }
    try {
      state.currentDisposer = state.webCtx.web.registerSearchProvider(provider);
      pinSearchProvider(state.webCtx.web, state.activeProvider);
      console.log(`[web-search-providers] activated provider: ${state.activeProvider}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/already registered/.test(message)) {
        console.warn(`[web-search-providers] provider registration failed: ${message}`);
      }
    }
  }
  ctx.inject(["settings"], (settingsCtx) => {
    try {
      const base = {
        activeProvider: cfg.activeProvider || "none",
        tavily: cfg.tavily ?? {},
        baidu: cfg.baidu ?? {}
      };
      state.settingsHandle = settingsCtx.settings.register(SETTINGS_NS, Config, { base });
      const resolved = state.settingsHandle.get();
      if (resolved?.activeProvider) {
        state.activeProvider = resolved.activeProvider;
        state.cfg = resolved;
      }
    } catch (error) {
      console.warn(`[web-search-providers] settings registration failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  ctx.inject(["web"], (webCtx) => {
    state.webCtx = webCtx;
    registerActiveProvider();
    return () => {
      if (state.currentDisposer) {
        try {
          state.currentDisposer();
        } catch {
        }
        state.currentDisposer = null;
      }
    };
  });
  const registerWebRoutes = () => {
    const ws = ctx.get("webServer");
    if (!ws) return;
    ws.register({
      kind: "exact",
      path: "/plugins/web-search-providers/api/config",
      handler: async (req, res) => {
        try {
          if (req.method === "GET") {
            let current = {};
            if (state.settingsHandle) {
              try {
                current = state.settingsHandle.get() || {};
              } catch {
              }
            }
            const merged = {
              activeProvider: current.activeProvider || state.activeProvider || "none",
              tavily: {
                apiKey: current.tavily?.apiKey || "",
                baseURL: current.tavily?.baseURL ?? TAVILY_DEFAULT_BASE_URL,
                maxResults: current.tavily?.maxResults ?? 5,
                searchDepth: current.tavily?.searchDepth ?? "basic",
                timeoutMs: current.tavily?.timeoutMs ?? 3e4
              },
              baidu: {
                apiKey: current.baidu?.apiKey || "",
                maxResults: current.baidu?.maxResults ?? 5,
                timeoutMs: current.baidu?.timeoutMs ?? 3e4
              }
            };
            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
            res.end(JSON.stringify(merged));
          } else if (req.method === "POST" || req.method === "PUT") {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const patch = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            if (state.settingsHandle) {
              try {
                await state.settingsHandle.update(patch);
              } catch (error) {
                console.warn(`[web-search-providers] settings update failed: ${error instanceof Error ? error.message : String(error)}`);
              }
            }
            const prevProvider = state.activeProvider;
            if (patch.activeProvider !== void 0) state.activeProvider = patch.activeProvider;
            state.cfg = mergeConfig(state.cfg, patch);
            persistConfig(state.cfg);
            if (prevProvider !== state.activeProvider) registerActiveProvider();
            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ ok: true, persisted: true }));
          } else {
            res.writeHead(405);
            res.end("Method not allowed");
          }
        } catch (error) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
        }
      }
    }, "web-search-providers: config-api");
    ws.register({
      kind: "exact",
      path: "/plugins/web-search-providers/api/test",
      handler: async (req, res) => {
        if (req.method !== "POST") {
          res.writeHead(405);
          res.end("Method not allowed");
          return;
        }
        try {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          const provider = body.provider;
          if (provider !== "tavily" && provider !== "baidu") {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "Unknown provider" }));
            return;
          }
          const providerOptions = provider === "tavily" ? () => {
            const c = state.cfg.tavily ?? {};
            return {
              apiKey: c.apiKey ?? "",
              baseURL: c.baseURL ?? TAVILY_DEFAULT_BASE_URL,
              maxResults: c.maxResults ?? 5,
              searchDepth: c.searchDepth ?? "basic",
              timeoutMs: c.timeoutMs ?? 3e4
            };
          } : () => {
            const c = state.cfg.baidu ?? {};
            return {
              apiKey: c.apiKey ?? "",
              endpoint: BAIDU_DEFAULT_ENDPOINT,
              maxResults: c.maxResults ?? 5,
              timeoutMs: c.timeoutMs ?? 3e4
            };
          };
          const instance = provider === "tavily" ? new TavilySearchProvider(providerOptions) : new BaiduSearchProvider(providerOptions);
          await instance.search({ query: "connectivity test", maxResults: 1 });
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: true, status: 200 }));
        } catch (error) {
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
        }
      }
    }, "web-search-providers: test-api");
    ws.register({
      kind: "exact",
      path: "/plugins/web-search-providers/api/usage",
      handler: async (req, res) => {
        if (req.method !== "GET") {
          res.writeHead(405);
          res.end("Method not allowed");
          return;
        }
        try {
          const snapshot = getUsageSnapshot();
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
          res.end(JSON.stringify(snapshot));
        } catch (error) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
        }
      }
    }, "web-search-providers: usage-api");
  };
  registerWebRoutes();
  ctx.on("internal/service", (serviceName) => {
    if (serviceName === "webServer") registerWebRoutes();
  });
}
var index_default = apply;
export {
  Config,
  apply,
  index_default as default,
  inject,
  name
};
//# sourceMappingURL=index.js.map
