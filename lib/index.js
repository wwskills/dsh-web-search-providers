// src/index.ts
import Schema from "@deepseek-ai/schemastery";

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

// src/config-path.ts
import { homedir } from "node:os";
import { join } from "node:path";
function dataDirectory() {
  const override = process.env.DSH_HOME?.trim();
  if (override) return join(override, "web-search-providers");
  return join(homedir(), ".dsh", "web-search-providers");
}

// src/usage.ts
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
import { appendFileSync, mkdirSync as mkdirSync2, readFileSync as readFileSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join3 } from "node:path";
var name = "web-search-providers";
var inject = ["web"];
var Config = Schema.object({
  activeProvider: Schema.string().default("none"),
  tavilyApiKey: Schema.string().role("secret").default(""),
  tavilyBaseURL: Schema.string().default(TAVILY_DEFAULT_BASE_URL),
  tavilyMaxResults: Schema.number().step(1).min(1).default(5),
  tavilySearchDepth: Schema.string().default("basic"),
  baiduApiKey: Schema.string().role("secret").default(""),
  baiduMaxResults: Schema.number().step(1).min(1).default(5),
  timeoutMs: Schema.number().step(1).min(1).default(3e4)
});
var PROVIDER_IDS = ["tavily", "baidu"];
var disposer = null;
function disposeCurrentProvider() {
  if (!disposer) return;
  try {
    disposer();
    debug("disposed previous provider");
  } catch (error) {
    debug(`dispose failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  disposer = null;
}
var ROUTE_PREFIX = "/plugins/web-search-providers/api";
function debug(message) {
  try {
    const dir = dataDirectory();
    mkdirSync2(dir, { recursive: true });
    appendFileSync(join3(dir, "debug.log"), `${(/* @__PURE__ */ new Date()).toISOString()} ${message}
`, "utf8");
  } catch {
  }
}
function readCell(config, key, fallback) {
  const cell = config?.[key];
  const value = typeof cell?.get === "function" ? cell.get() : cell;
  return value === void 0 || value === null ? fallback : value;
}
function rowConfig(config) {
  return {
    activeProvider: String(readCell(config, "activeProvider", "none")),
    tavilyApiKey: String(readCell(config, "tavilyApiKey", "")),
    tavilyBaseURL: String(readCell(config, "tavilyBaseURL", TAVILY_DEFAULT_BASE_URL)),
    tavilyMaxResults: Number(readCell(config, "tavilyMaxResults", 5)),
    tavilySearchDepth: String(readCell(config, "tavilySearchDepth", "basic")),
    baiduApiKey: String(readCell(config, "baiduApiKey", "")),
    baiduMaxResults: Number(readCell(config, "baiduMaxResults", 5)),
    timeoutMs: Number(readCell(config, "timeoutMs", 3e4))
  };
}
function userConfigPath() {
  return join3(dataDirectory(), "user-config.json");
}
function loadPersisted() {
  try {
    return JSON.parse(readFileSync2(userConfigPath(), "utf8"));
  } catch {
    return {};
  }
}
function persistConfig(config) {
  try {
    mkdirSync2(dataDirectory(), { recursive: true });
    writeFileSync2(userConfigPath(), JSON.stringify(config, null, 2) + "\n", "utf8");
    return true;
  } catch (error) {
    debug(`persist failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}
function effectiveConfig(base) {
  return { ...base, ...loadPersisted() };
}
function createInstance(base, forcedProvider) {
  const active = forcedProvider ?? effectiveConfig(base).activeProvider;
  if (active === "tavily") {
    return new TavilySearchProvider(() => {
      const c = effectiveConfig(base);
      return {
        apiKey: c.tavilyApiKey,
        baseURL: c.tavilyBaseURL,
        maxResults: c.tavilyMaxResults,
        searchDepth: c.tavilySearchDepth,
        timeoutMs: c.timeoutMs
      };
    });
  }
  if (active === "baidu") {
    return new BaiduSearchProvider(() => {
      const c = effectiveConfig(base);
      return {
        apiKey: c.baiduApiKey,
        endpoint: BAIDU_DEFAULT_ENDPOINT,
        maxResults: c.baiduMaxResults,
        timeoutMs: c.timeoutMs
      };
    });
  }
  return null;
}
function withUsageCounter(instance) {
  const originalSearch = instance.search.bind(instance);
  const providerId = instance.id;
  instance.search = async (request, signal) => {
    try {
      const result = await originalSearch(request, signal);
      incrementUsage(providerId);
      return result;
    } catch (error) {
      incrementUsage(providerId);
      throw error;
    }
  };
  return instance;
}
function registerWithWeb(ctx, instance, providerId) {
  const register = (target, via) => {
    debug(`registering ${providerId} via ${via}; web=${typeof target?.web}`);
    disposer = target.web.registerSearchProvider(instance);
    debug(`registered OK: ${providerId} (via ${via})`);
    console.log(
      syncPin(target.web, providerId) ? `[web-search-providers] activated "${providerId}" and pinned the web seam to it.` : `[web-search-providers] activated "${providerId}", but the web seam pin still points elsewhere; web_search keeps using the pinned provider until the web row's searchProvider matches.`
    );
  };
  if (typeof ctx?.inject === "function") {
    try {
      ctx.inject(["web"], (injected) => {
        try {
          register(injected, "ctx.inject");
        } catch (error) {
          debug(`injected register failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
      return;
    } catch (error) {
      debug(`ctx.inject threw: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  try {
    register(ctx, "ctx.web");
  } catch (error) {
    debug(`ctx.web register failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
function registerRoutes(ctx, base, reactivate) {
  const attach = (ws, via) => {
    const send = (res, status, body) => {
      res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(JSON.stringify(body));
    };
    const readBody = async (req) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      return raw ? JSON.parse(raw) : {};
    };
    ws.register({
      kind: "exact",
      path: `${ROUTE_PREFIX}/config`,
      handler: async (req, res) => {
        try {
          if (req.method === "GET") return send(res, 200, effectiveConfig(base));
          const patch = await readBody(req);
          persistConfig({ ...base, ...patch });
          reactivate();
          return send(res, 200, { ok: true, persisted: true });
        } catch (error) {
          return send(res, 500, { error: error instanceof Error ? error.message : String(error) });
        }
      }
    });
    ws.register({
      kind: "exact",
      path: `${ROUTE_PREFIX}/test`,
      handler: async (req, res) => {
        try {
          const body = await readBody(req);
          const provider = body.provider ?? effectiveConfig(base).activeProvider;
          const overrides = {};
          if (body.tavilyApiKey !== void 0) overrides.tavilyApiKey = body.tavilyApiKey;
          if (body.baiduApiKey !== void 0) overrides.baiduApiKey = body.baiduApiKey;
          const testBase = { ...base, ...overrides };
          const instance = createInstance(testBase, provider);
          if (!instance) return send(res, 200, { ok: false, error: "Unknown provider" });
          await instance.search({ query: "connectivity test", maxResults: 1 });
          return send(res, 200, { ok: true, status: 200 });
        } catch (error) {
          return send(res, 200, { ok: false, error: error instanceof Error ? error.message : String(error) });
        }
      }
    });
    ws.register({
      kind: "exact",
      path: `${ROUTE_PREFIX}/usage`,
      handler: async (_req, res) => {
        try {
          return send(res, 200, getUsageSnapshot());
        } catch (error) {
          return send(res, 500, { error: error instanceof Error ? error.message : String(error) });
        }
      }
    });
    debug(`settings API mounted via ${via}`);
  };
  if (typeof ctx?.get === "function") {
    try {
      const ws = ctx.get("webServer");
      if (ws) return attach(ws, "ctx.get");
    } catch (error) {
      debug(`ctx.get('webServer') failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (typeof ctx?.inject === "function") {
    try {
      ctx.inject(["webServer"], (injected) => {
        try {
          attach(injected.webServer ?? injected, "ctx.inject");
        } catch (error) {
          debug(`injected route attach failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
      return;
    } catch (error) {
      debug(`ctx.inject(webServer) threw: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  debug("webServer unavailable \u2014 settings API not mounted");
}
var VOLATILE_WRITE = Symbol.for("cosmokit.volatile.write");
function syncPin(web, providerId) {
  try {
    const cell = web?.config?.searchProvider;
    if (!cell) {
      const own = web ? Object.keys(web).slice(0, 24).join(",") : String(web);
      const cfg = web?.config ? Object.keys(web.config).slice(0, 24).join(",") : "none";
      debug(`pin sync skipped: no searchProvider cell; web keys=[${own}]; config keys=[${cfg}]`);
      return false;
    }
    if (cell.get?.() === providerId) {
      debug(`pin already "${providerId}"`);
      return true;
    }
    const write = cell[VOLATILE_WRITE];
    if (typeof write !== "function") {
      debug("pin sync failed: no volatile writer on searchProvider");
      return false;
    }
    write.call(cell, providerId);
    debug(`pinned web.searchProvider="${providerId}" -> ${String(cell.get?.())}`);
    return cell.get?.() === providerId;
  } catch (error) {
    debug(`pin sync failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}
function apply(ctx, config = {}) {
  debug("apply() entered");
  const base = rowConfig(config);
  debug(`resolved activeProvider="${base.activeProvider}" (from row, before panel overrides)`);
  const current = effectiveConfig(base);
  if (!PROVIDER_IDS.includes(current.activeProvider)) {
    debug(`activeProvider="${current.activeProvider}" is not one of ${PROVIDER_IDS.join(", ")} \u2014 nothing registered`);
    console.log("[web-search-providers] no active provider \u2014 DSH falls back to its built-in search");
  }
  const reactivate = () => {
    const cfg = effectiveConfig(base);
    if (!PROVIDER_IDS.includes(cfg.activeProvider)) {
      debug(`reactivate: provider="${cfg.activeProvider}" not activatable`);
      return;
    }
    disposeCurrentProvider();
    const instance = withUsageCounter(createInstance(base));
    registerWithWeb(ctx, instance, instance.id);
  };
  reactivate();
  registerRoutes(ctx, base, reactivate);
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
