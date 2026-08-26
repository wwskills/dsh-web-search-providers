// @wwskills/dsh-web-search-providers — plugin entry point
//
// Registers Tavily and Baidu search providers into DSH's web seam.
// Only the selected provider is registered at a time.
// When activeProvider='none', no provider is registered, and DSH
// falls back to its built-in DeepSeek web search.

import Schema from '@deepseek-ai/schemastery';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
import { TavilySearchProvider, TAVILY_PROVIDER_ID, TAVILY_DEFAULT_BASE_URL } from './tavily.js';
import { BaiduSearchProvider, BAIDU_PROVIDER_ID, BAIDU_DEFAULT_ENDPOINT } from './baidu.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const name = 'web-search-providers';
const inject = ['web', 'settings'];

const SETTINGS_NS = settingsNamespace('web-search-providers');

const Config = Schema.object({
  activeProvider: Schema.union(['none', 'tavily', 'baidu']).default('none'),
  tavily: Schema.object({
    apiKey: Schema.string().role('secret').default(''),
    baseURL: Schema.string().default(TAVILY_DEFAULT_BASE_URL),
    maxResults: Schema.natural().default(5),
    searchDepth: Schema.union(['basic', 'advanced']).default('basic'),
    timeoutMs: Schema.natural().default(30000),
  }),
  baidu: Schema.object({
    apiKey: Schema.string().role('secret').default(''),
    secretKey: Schema.string().role('secret').default(''),
    endpoint: Schema.string().default(BAIDU_DEFAULT_ENDPOINT),
    maxResults: Schema.natural().default(5),
    timeoutMs: Schema.natural().default(30000),
  }),
});

function resolveConfigPath() {
  const home = process.env.DSH_HOME || `${process.env.HOME || '/root'}/.dsh`;
  return join(home, 'web-search-providers', 'user-config.json');
}

function loadPersistedConfig(cfg) {
  try {
    const raw = readFileSync(resolveConfigPath(), 'utf8');
    const persisted = JSON.parse(raw);
    return mergeConfig(cfg, persisted);
  } catch {
    return cfg;
  }
}

function persistConfig(data) {
  const path = resolveConfigPath();
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
    return true;
  } catch (e) {
    console.warn('[web-search-providers] config persist failed:', e.message);
    return false;
  }
}

function mergeConfig(base, override) {
  const out = { ...base };
  for (const key of Object.keys(override)) {
    if (typeof override[key] === 'object' && !Array.isArray(override[key]) &&
        typeof base[key] === 'object' && !Array.isArray(base[key])) {
      out[key] = mergeConfig(base[key], override[key]);
    } else if (override[key] !== undefined) {
      out[key] = override[key];
    }
  }
  return out;
}

function apply(ctx, config = {}) {
  let cfg = loadPersistedConfig(config);

  const state = {
    cfg,
    activeProvider: cfg.activeProvider || 'none',
    settingsHandle: null,
    currentDisposer: null,  // disposer for the currently registered provider
    webCtx: null,
  };

  // Resolve options based on active provider
  function resolveOptions() {
    const p = state.activeProvider;
    if (p === 'tavily') {
      const c = state.cfg.tavily || {};
      return {
        apiKey: c.apiKey || '',
        baseURL: c.baseURL || TAVILY_DEFAULT_BASE_URL,
        maxResults: c.maxResults || 5,
        searchDepth: c.searchDepth || 'basic',
        timeoutMs: c.timeoutMs || 30000,
      };
    }
    if (p === 'baidu') {
      const c = state.cfg.baidu || {};
      return {
        apiKey: c.apiKey || '',
        secretKey: c.secretKey || '',
        endpoint: c.endpoint || BAIDU_DEFAULT_ENDPOINT,
        maxResults: c.maxResults || 5,
        timeoutMs: c.timeoutMs || 30000,
      };
    }
    return null;
  }

  // Create the appropriate provider instance
  function createProvider() {
    const p = state.activeProvider;
    if (p === 'tavily') return new TavilySearchProvider(resolveOptions);
    if (p === 'baidu') return new BaiduSearchProvider(resolveOptions);
    return null;
  }

  // Register the active provider (dispose old one first)
  function registerActiveProvider() {
    if (!state.webCtx) return;

    // Dispose previous provider
    if (state.currentDisposer) {
      try { state.currentDisposer(); } catch {}
      state.currentDisposer = null;
    }

    // Create and register new provider
    const provider = createProvider();
    if (!provider) {
      console.log('[web-search-providers] no active provider, DSH falls back to default');
      return;
    }

    try {
      state.currentDisposer = state.webCtx.web.registerSearchProvider(provider);
      console.log(`[web-search-providers] activated provider: ${state.activeProvider}`);
    var _opts = resolveOptions();
    if (_opts) {
      var _k = _opts.apiKey || '';
    }
    } catch (e) {
      // WEB_DUPLICATE_PROVIDER — provider already registered, skip
      if (!/already registered/.test(e.message)) {
        console.warn('[web-search-providers] provider registration failed:', e.message);
      }
    }
  }

  // Register settings namespace
  ctx.inject(['settings'], (settingsCtx) => {
    try {
      const base = {
        activeProvider: cfg.activeProvider || 'none',
        tavily: cfg.tavily || {},
        baidu: cfg.baidu || {},
      };
      state.settingsHandle = settingsCtx.settings.register(SETTINGS_NS, Config, { base });
      const resolved = state.settingsHandle.get();
      if (resolved?.activeProvider) {
        state.activeProvider = resolved.activeProvider;
        state.cfg = resolved;
      }
    } catch (e) {
      console.warn('[web-search-providers] settings registration failed:', e.message);
    }
  });

  // Wait for web service, then register the active provider
  ctx.inject(['web'], (webCtx) => {
    state.webCtx = webCtx;
    registerActiveProvider();
  });

  // Web API for settings UI
  const registerWebRoutes = () => {
    const ws = ctx.get('webServer');
    if (!ws) return;

    ws.register({
      kind: 'exact',
      path: '/plugins/web-search-providers/api/config',
      handler: async (req, res) => {
        try {
          if (req.method === 'GET') {
            let current = {};
            if (state.settingsHandle) {
              try { current = state.settingsHandle.get() || {}; } catch {}
            }
            const merged = {
              activeProvider: current.activeProvider || state.activeProvider || 'none',
              tavily: {
                apiKey: current.tavily?.apiKey || '',
                baseURL: current.tavily?.baseURL || TAVILY_DEFAULT_BASE_URL,
                maxResults: current.tavily?.maxResults || 5,
                searchDepth: current.tavily?.searchDepth || 'basic',
                timeoutMs: current.tavily?.timeoutMs || 30000,
              },
              baidu: {
                apiKey: current.baidu?.apiKey || '',
                secretKey: current.baidu?.secretKey || '',
                endpoint: current.baidu?.endpoint || BAIDU_DEFAULT_ENDPOINT,
                maxResults: current.baidu?.maxResults || 5,
                timeoutMs: current.baidu?.timeoutMs || 30000,
              },
            };
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end(JSON.stringify(merged));
          } else if (req.method === 'POST' || req.method === 'PUT') {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const patch = JSON.parse(Buffer.concat(chunks).toString('utf8'));

            // Update settings (DSH settings service)
            if (state.settingsHandle) {
              try { state.settingsHandle.update(patch); } catch (e) {
                console.warn('[web-search-providers] settings update failed:', e.message);
              }
            }

            // Update live state
            const prevProvider = state.activeProvider;
            if (patch.activeProvider !== undefined) state.activeProvider = patch.activeProvider;
            state.cfg = mergeConfig(state.cfg, patch);

            // Persist to disk
            persistConfig(state.cfg);

            // If provider changed, re-register
            if (prevProvider !== state.activeProvider) {
              registerActiveProvider();
            }

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: true, persisted: true }));
          } else {
            res.writeHead(405);
            res.end('Method not allowed');
          }
        } catch (e) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: e.message }));
        }
      }
    }), 'web-search-providers: config-api';
  };

  registerWebRoutes();
  ctx.on('internal/service', (name) => {
    if (name === 'webServer') registerWebRoutes();
  });
}

export { name, inject, Config, apply };
export default apply;
