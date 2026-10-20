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

// src/index.ts
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
function apply(ctx, config = {}) {
  const activeProvider = String(readCell(config, "activeProvider", "none"));
  if (activeProvider === "none") {
    console.log("[web-search-providers] activeProvider=none \u2014 DSH falls back to its built-in search");
    return;
  }
  if (!PROVIDER_IDS.includes(activeProvider)) {
    console.warn(`[web-search-providers] unknown activeProvider "${activeProvider}" \u2014 expected one of ${PROVIDER_IDS.join(", ")}`);
    return;
  }
  const timeoutMs = Number(readCell(config, "timeoutMs", 3e4));
  let instance = null;
  if (activeProvider === "tavily") {
    instance = new TavilySearchProvider(() => ({
      apiKey: String(readCell(config, "tavilyApiKey", "")),
      baseURL: String(readCell(config, "tavilyBaseURL", TAVILY_DEFAULT_BASE_URL)),
      maxResults: Number(readCell(config, "tavilyMaxResults", 5)),
      searchDepth: readCell(config, "tavilySearchDepth", "basic"),
      timeoutMs
    }));
  } else {
    instance = new BaiduSearchProvider(() => ({
      apiKey: String(readCell(config, "baiduApiKey", "")),
      endpoint: BAIDU_DEFAULT_ENDPOINT,
      maxResults: Number(readCell(config, "baiduMaxResults", 5)),
      timeoutMs
    }));
  }
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
  try {
    ctx.web.registerSearchProvider(instance);
    console.log(
      `[web-search-providers] registered provider "${providerId}". If another usable provider is mounted too, pin an id via the web row's searchProvider config or $DSH_WEB_SEARCH_PROVIDER to avoid WEB_PROVIDER_AMBIGUOUS.`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[web-search-providers] provider registration failed: ${message}`);
  }
}
function readCell(config, key, fallback) {
  const cell = config?.[key];
  const value = typeof cell?.get === "function" ? cell.get() : cell;
  return value === void 0 || value === null ? fallback : value;
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
