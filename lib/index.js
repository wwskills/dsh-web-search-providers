// @wwskills/dsh-web-search-providers — plugin entry point
//
// Registers Tavily and Baidu search providers into DSH's web seam.
// Users select which provider is active via DSH config or the WebUI.
//
// Plugin structure mirrors @deepseek-ai/dsh-web-search-deepseek:
//   - inject: ['web'] — waits for the web service
//   - Config: schemastery schema for plugin config
//   - apply: registers providers + settings namespace
//   - client.js: browser-side settings UI

import Schema from '@deepseek-ai/schemastery';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
import { TavilySearchProvider, TAVILY_PROVIDER_ID, TAVILY_DEFAULT_BASE_URL } from './tavily.js';
import { BaiduSearchProvider, BAIDU_PROVIDER_ID, BAIDU_DEFAULT_ENDPOINT } from './baidu.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const name = 'web-search-providers';
const inject = ['web'];

const SETTINGS_NS = settingsNamespace('web-search-providers');

/**
 * Plugin config schema (schemastery).
 * Mirrors dsh-web-search-deepseek's Config pattern.
 */
const Config = Schema.object({
  // Active provider selection
  activeProvider: Schema.union(['none', 'tavily', 'baidu']).default('none').description(
    'Select which search provider to activate. Set to "none" to disable.'
  ),

  // Tavily config
  tavily: Schema.object({
    apiKey: Schema.string().role('secret').default('').description('Tavily API key (tvly-xxx)'),
    baseURL: Schema.string().default(TAVILY_DEFAULT_BASE_URL).description('Tavily API base URL'),
    maxResults: Schema.natural().default(5).description('Max results per search'),
    searchDepth: Schema.union(['basic', 'advanced']).default('basic').description('Search depth'),
    timeoutMs: Schema.natural().default(30000).description('Request timeout in ms'),
  }),

  // Baidu config
  baidu: Schema.object({
    apiKey: Schema.string().role('secret').default('').description('Baidu AI API key'),
    secretKey: Schema.string().role('secret').default('').description('Baidu AI Secret key'),
    endpoint: Schema.string().default(BAIDU_DEFAULT_ENDPOINT).description('Baidu API endpoint'),
    maxResults: Schema.natural().default(5).description('Max results per search'),
    timeoutMs: Schema.natural().default(30000).description('Request timeout in ms'),
  }),
});

/**
 * Resolve config path for plugin-managed persistence (same pattern as long-memory).
 */
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

function saveProviderConfig(provider, config) {
  const path = resolveConfigPath();
  try {
    let existing = {};
    try { existing = JSON.parse(readFileSync(path, 'utf8')); } catch {}
    existing[provider] = config;
    writeFileSync(path, JSON.stringify(existing, null, 2) + '\n', 'utf8');
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

/**
 * Plugin entry point.
 * Registers Tavily and Baidu providers, but only the selected one is "available".
 */
function apply(ctx, config = {}) {
  let cfg = config;
  cfg = loadPersistedConfig(cfg);

  const state = {
    cfg,
    activeProvider: cfg.activeProvider || 'none',
    settingsHandle: null,
  };

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

  // Resolve options for Tavily
  const resolveTavilyOptions = () => {
    const c = state.cfg.tavily || {};
    return {
      apiKey: c.apiKey || '',
      baseURL: c.baseURL || TAVILY_DEFAULT_BASE_URL,
      maxResults: c.maxResults || 5,
      searchDepth: c.searchDepth || 'basic',
      timeoutMs: c.timeoutMs || 30000,
    };
  };

  // Resolve options for Baidu
  const resolveBaiduOptions = () => {
    const c = state.cfg.baidu || {};
    return {
      apiKey: c.apiKey || '',
      secretKey: c.secretKey || '',
      endpoint: c.endpoint || BAIDU_DEFAULT_ENDPOINT,
      maxResults: c.maxResults || 5,
      timeoutMs: c.timeoutMs || 30000,
    };
  };

  // Register providers — only the active one will be available()
  const tavilyProvider = new TavilySearchProvider(resolveTavilyOptions);
  const baiduProvider = new BaiduSearchProvider(resolveBaiduOptions);

  // Override available() to respect activeProvider selection
  const tavilyAvailable = tavilyProvider.available.bind(tavilyProvider);
  tavilyProvider.available = () => state.activeProvider === 'tavily' && tavilyAvailable();

  const baiduAvailable = baiduProvider.available.bind(baiduProvider);
  baiduProvider.available = () => state.activeProvider === 'baidu' && baiduAvailable();

  try {
    ctx.web.registerSearchProvider(tavilyProvider);
    ctx.web.registerSearchProvider(baiduProvider);
    console.log(`[web-search-providers] registered tavily + baidu (active: ${state.activeProvider})`);
  } catch (e) {
    console.warn('[web-search-providers] provider registration failed:', e.message);
  }

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

            // Update settings
            let saved = false;
            if (state.settingsHandle) {
              try {
                state.settingsHandle.update(patch);
                saved = true;
              } catch (e) {
                console.warn('[web-search-providers] settings update failed:', e.message);
              }
            }

            // Update live state
            if (patch.activeProvider !== undefined) state.activeProvider = patch.activeProvider;
            state.cfg = { ...state.cfg, ...patch };

            // Persist to disk
            saveProviderConfig('activeProvider', state.activeProvider);
            if (patch.tavily) saveProviderConfig('tavily', patch.tavily);
            if (patch.baidu) saveProviderConfig('baidu', patch.baidu);

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
