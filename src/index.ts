/**
 * Plugin entry point: registers Tavily and Baidu providers into DSH's web seam.
 *
 * Only the selected provider is registered at a time. When `activeProvider` is
 * `none`, no custom provider is registered and DSH falls back to its built-in
 * DeepSeek web search. Switching providers disposes the old one and registers
 * the new one live (no restart).
 * @module @wwskills/dsh-web-search-providers/index
 */

import Schema from '@deepseek-ai/schemastery'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { dataDirectory } from './config-path.js'
import { TavilySearchProvider, TAVILY_PROVIDER_ID, TAVILY_DEFAULT_BASE_URL } from './tavily.js'
import { BaiduSearchProvider, BAIDU_PROVIDER_ID, BAIDU_DEFAULT_ENDPOINT } from './baidu.js'
import { getUsageSnapshot, incrementUsage } from './usage.js'

export const name = 'web-search-providers'
export const inject = ['web', 'settings']

// DSH settings namespaces are lowercase kebab-case (`/^[a-z][a-z0-9-]*$/`).
const SETTINGS_NS = 'web-search-providers'

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
    maxResults: Schema.natural().default(5),
    timeoutMs: Schema.natural().default(30000),
  }),
})

interface PluginConfig {
  activeProvider: 'none' | 'tavily' | 'baidu'
  tavily: { apiKey: string; baseURL: string; maxResults: number; searchDepth: 'basic' | 'advanced'; timeoutMs: number }
  baidu: { apiKey: string; maxResults: number; timeoutMs: number }
}

function userConfigPath(): string {
  return join(dataDirectory(), 'user-config.json')
}

function loadPersistedConfig(cfg: PluginConfig): PluginConfig {
  try {
    const parsed = JSON.parse(readFileSync(userConfigPath(), 'utf8')) as Partial<PluginConfig>
    return mergeConfig(cfg, parsed)
  } catch {
    return cfg
  }
}

function persistConfig(data: PluginConfig): boolean {
  const target = userConfigPath()
  try {
    mkdirSync(dataDirectory(), { recursive: true })
    writeFileSync(target, JSON.stringify(data, null, 2) + '\n', 'utf8')
    return true
  } catch (error) {
    console.warn(`[web-search-providers] config persist failed: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

function mergeConfig<T>(base: T, override: Partial<T>): T {
  const out: T = { ...base }
  for (const key of Object.keys(override) as Array<keyof T>) {
    const baseValue = base[key]
    const overrideValue = override[key]
    if (
      typeof overrideValue === 'object' && overrideValue !== null && !Array.isArray(overrideValue)
      && typeof baseValue === 'object' && baseValue !== null && !Array.isArray(baseValue)
    ) {
      ;(out as Record<string, unknown>)[key as string] = mergeConfig(baseValue as Record<string, unknown>, overrideValue as Record<string, unknown>)
    } else if (overrideValue !== undefined) {
      ;(out as Record<string, unknown>)[key as string] = overrideValue
    }
  }
  return out
}

/**
 * Best-effort provider pinning across DSH generations.
 *
 * DSH < 0.1.2 exposed a writable `web.searchProviderId` to give the registered
 * provider priority. DSH 0.1.2 made it a constructor-time private field driven
 * by config (`searchProvider`) or env (`DSH_WEB_SEARCH_PROVIDER`) and selects
 * at call time: with no id configured, more than one usable provider fails with
 * `WEB_PROVIDER_AMBIGUOUS`. The legacy field is still a plain property at
 * runtime, so the assignment keeps working there too — but guarded, because a
 * future DSH may freeze it. Either way, point the user at the official knob.
 */
function pinSearchProvider(web: { searchProviderId?: string }, id: string): void {
  try {
    if ('searchProviderId' in web) (web as { searchProviderId: string }).searchProviderId = id
  } catch {
    console.log(
      `[web-search-providers] DSH 0.1.2+ uses constructor-time provider selection. ` +
      `Set web config searchProvider="${id}" or env DSH_WEB_SEARCH_PROVIDER=${id}`,
    )
  }
}

export function apply(ctx, config: Partial<PluginConfig> = {}): void {
  let cfg = loadPersistedConfig(config as PluginConfig)

  const state = {
    cfg,
    activeProvider: (cfg.activeProvider || 'none') as PluginConfig['activeProvider'],
    settingsHandle: null as null | { get(): PluginConfig; update(patch: Partial<PluginConfig>): void },
    currentDisposer: null as null | (() => void),
    webCtx: null as null | { web: { registerSearchProvider(provider: unknown): () => void; searchProviderId: string } },
  }

  function resolveOptions(): Record<string, string | number> | null {
    const provider = state.activeProvider
    if (provider === 'tavily') {
      const c = state.cfg.tavily ?? ({} as PluginConfig['tavily'])
      return {
        apiKey: c.apiKey ?? '',
        baseURL: c.baseURL ?? TAVILY_DEFAULT_BASE_URL,
        maxResults: c.maxResults ?? 5,
        searchDepth: c.searchDepth ?? 'basic',
        timeoutMs: c.timeoutMs ?? 30000,
      }
    }
    if (provider === 'baidu') {
      const c = state.cfg.baidu ?? ({} as PluginConfig['baidu'])
      return {
        apiKey: c.apiKey ?? '',
        endpoint: BAIDU_DEFAULT_ENDPOINT,
        maxResults: c.maxResults ?? 5,
        timeoutMs: c.timeoutMs ?? 30000,
      }
    }
    return null
  }

  function createProvider(): unknown | null {
    const provider = state.activeProvider
    let instance: { search: (req: unknown, sig?: AbortSignal) => Promise<unknown>; id: string } | null = null
    if (provider === 'tavily') instance = new TavilySearchProvider(() => resolveOptions() as never) as never
    if (provider === 'baidu') instance = new BaiduSearchProvider(() => resolveOptions() as never) as never
    if (!instance) return null

    // Wrap search() to track usage per call
    const originalSearch = instance.search.bind(instance)
    const providerId = instance.id
    instance.search = async (req, sig) => {
      try {
        const result = await originalSearch(req, sig)
        incrementUsage(providerId)
        return result
      } catch (error) {
        // Still count the attempt (provider was called, even if it failed)
        incrementUsage(providerId)
        throw error
      }
    }
    return instance
  }

  function registerActiveProvider(): void {
    if (!state.webCtx) return

    if (state.currentDisposer) {
      try { state.currentDisposer() } catch { /* already disposed */ }
      state.currentDisposer = null
    }

    const provider = createProvider()
    if (!provider) {
      console.log('[web-search-providers] no active provider, DSH falls back to default')
      return
    }

    try {
      state.currentDisposer = state.webCtx.web.registerSearchProvider(provider)
      pinSearchProvider(state.webCtx.web, state.activeProvider)
      console.log(`[web-search-providers] activated provider: ${state.activeProvider}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      // WEB_DUPLICATE_PROVIDER — already registered; not fatal.
      if (!/already registered/.test(message)) {
        console.warn(`[web-search-providers] provider registration failed: ${message}`)
      }
    }
  }

  // Register the DSH settings namespace (validated by schemastery).
  ctx.inject(['settings'], (settingsCtx: never) => {
    try {
      const base = {
        activeProvider: cfg.activeProvider || 'none',
        tavily: cfg.tavily ?? {},
        baidu: cfg.baidu ?? {},
      }
      state.settingsHandle = settingsCtx.settings.register(SETTINGS_NS, Config, { base })
      const resolved = state.settingsHandle.get()
      if (resolved?.activeProvider) {
        state.activeProvider = resolved.activeProvider
        state.cfg = resolved
      }
    } catch (error) {
      console.warn(`[web-search-providers] settings registration failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  // Wait for the web service, then register the active provider.
  ctx.inject(['web'], (webCtx: never) => {
    state.webCtx = webCtx
    registerActiveProvider()
    return () => {
      if (state.currentDisposer) {
        try { state.currentDisposer() } catch { /* already disposed */ }
        state.currentDisposer = null
      }
    }
  })

  // Web routes for the settings UI.
  const registerWebRoutes = (): void => {
    const ws = ctx.get('webServer')
    if (!ws) return

    ws.register({
      kind: 'exact',
      path: '/plugins/web-search-providers/api/config',
      handler: async (req, res) => {
        try {
          if (req.method === 'GET') {
            let current = {} as Partial<PluginConfig>
            if (state.settingsHandle) {
              try { current = state.settingsHandle.get() || {} } catch { /* read-only fallback */ }
            }
            const merged = {
              activeProvider: current.activeProvider || state.activeProvider || 'none',
              tavily: {
                apiKey: current.tavily?.apiKey || '',
                baseURL: current.tavily?.baseURL ?? TAVILY_DEFAULT_BASE_URL,
                maxResults: current.tavily?.maxResults ?? 5,
                searchDepth: current.tavily?.searchDepth ?? 'basic',
                timeoutMs: current.tavily?.timeoutMs ?? 30000,
              },
              baidu: {
                apiKey: current.baidu?.apiKey || '',
                maxResults: current.baidu?.maxResults ?? 5,
                timeoutMs: current.baidu?.timeoutMs ?? 30000,
              },
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
            res.end(JSON.stringify(merged))
          } else if (req.method === 'POST' || req.method === 'PUT') {
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(chunk as Buffer)
            const patch = JSON.parse(Buffer.concat(chunks).toString('utf8'))

            if (state.settingsHandle) {
              // settings.update() is async in DSH 0.1.2 — await so a rejection
              // surfaces here instead of becoming an unhandled rejection.
              try { await state.settingsHandle.update(patch) } catch (error) {
                console.warn(`[web-search-providers] settings update failed: ${error instanceof Error ? error.message : String(error)}`)
              }
            }

            const prevProvider = state.activeProvider
            if (patch.activeProvider !== undefined) state.activeProvider = patch.activeProvider
            state.cfg = mergeConfig(state.cfg, patch)
            persistConfig(state.cfg)

            if (prevProvider !== state.activeProvider) registerActiveProvider()

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ ok: true, persisted: true }))
          } else {
            res.writeHead(405)
            res.end('Method not allowed')
          }
        } catch (error) {
          res.writeHead(500)
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
        }
      },
    } as never, 'web-search-providers: config-api')

    ws.register({
      kind: 'exact',
      path: '/plugins/web-search-providers/api/test',
      handler: async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end('Method not allowed')
          return
        }
        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { provider?: string }
          const provider = body.provider
          if (provider !== 'tavily' && provider !== 'baidu') {
            res.writeHead(400)
            res.end(JSON.stringify({ error: 'Unknown provider' }))
            return
          }
          // Server-side test (avoids browser CORS): run one minimal real search
          // through the actual provider implementation, using the config of the
          // provider being tested (which may differ from the active one).
          const providerOptions = provider === 'tavily'
            ? () => {
                const c = state.cfg.tavily ?? ({} as PluginConfig['tavily'])
                return {
                  apiKey: c.apiKey ?? '',
                  baseURL: c.baseURL ?? TAVILY_DEFAULT_BASE_URL,
                  maxResults: c.maxResults ?? 5,
                  searchDepth: c.searchDepth ?? 'basic',
                  timeoutMs: c.timeoutMs ?? 30000,
                }
              }
            : () => {
                const c = state.cfg.baidu ?? ({} as PluginConfig['baidu'])
                return {
                  apiKey: c.apiKey ?? '',
                  endpoint: BAIDU_DEFAULT_ENDPOINT,
                  maxResults: c.maxResults ?? 5,
                  timeoutMs: c.timeoutMs ?? 30000,
                }
              }
          const instance = provider === 'tavily'
            ? new TavilySearchProvider(providerOptions as never)
            : new BaiduSearchProvider(providerOptions as never)
          await instance.search({ query: 'connectivity test', maxResults: 1 })
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: true, status: 200 }))
        } catch (error) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }))
        }
      },
    } as never, 'web-search-providers: test-api')

    ws.register({
      kind: 'exact',
      path: '/plugins/web-search-providers/api/usage',
      handler: async (req, res) => {
        if (req.method !== 'GET') {
          res.writeHead(405)
          res.end('Method not allowed')
          return
        }
        try {
          const snapshot = getUsageSnapshot()
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
          res.end(JSON.stringify(snapshot))
        } catch (error) {
          res.writeHead(500)
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
        }
      },
    } as never, 'web-search-providers: usage-api')
  }

  registerWebRoutes()
  ctx.on('internal/service', (serviceName: string) => {
    if (serviceName === 'webServer') registerWebRoutes()
  })
}

export { Config }
export default apply
