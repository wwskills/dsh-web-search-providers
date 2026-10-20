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

import Schema from '@deepseek-ai/schemastery'
import { TavilySearchProvider, TAVILY_DEFAULT_BASE_URL } from './tavily.js'
import { BaiduSearchProvider, BAIDU_DEFAULT_ENDPOINT } from './baidu.js'
import { getUsageSnapshot, incrementUsage } from './usage.js'
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { dataDirectory } from './config-path.js'

export const name = 'web-search-providers'
export const inject = ['web']

/** Config schema. DSH validates the row's config against it and renders the form. */
export const Config = Schema.object({
  activeProvider: Schema.string().default('none'),
  tavilyApiKey: Schema.string().role('secret').default(''),
  tavilyBaseURL: Schema.string().default(TAVILY_DEFAULT_BASE_URL),
  tavilyMaxResults: Schema.number().step(1).min(1).default(5),
  tavilySearchDepth: Schema.string().default('basic'),
  baiduApiKey: Schema.string().role('secret').default(''),
  baiduMaxResults: Schema.number().step(1).min(1).default(5),
  timeoutMs: Schema.number().step(1).min(1).default(30000),
})

/** Provider ids this plugin can activate. */
const PROVIDER_IDS: readonly string[] = ['tavily', 'baidu']

/**
 * Disposer of the currently registered provider. The seam rejects a duplicate
 * id, so switching providers must dispose the previous registration first.
 */
let disposer: (() => void) | null = null

function disposeCurrentProvider(): void {
  if (!disposer) return
  try {
    disposer()
    debug('disposed previous provider')
  } catch (error) {
    debug(`dispose failed: ${error instanceof Error ? error.message : String(error)}`)
  }
  disposer = null
}

const ROUTE_PREFIX = '/plugins/web-search-providers/api'

/**
 * Append one line to the plugin data directory. The DSH host does not persist
 * plugin console output, so this is the only way to observe activation.
 * Never writes credential values.
 */
function debug(message: string): void {
  try {
    const dir = dataDirectory()
    mkdirSync(dir, { recursive: true })
    appendFileSync(join(dir, 'debug.log'), `${new Date().toISOString()} ${message}\n`, 'utf8')
  } catch {
    // best effort
  }
}

interface PluginConfig {
  activeProvider: string
  tavilyApiKey: string
  tavilyBaseURL: string
  tavilyMaxResults: number
  tavilySearchDepth: string
  baiduApiKey: string
  baiduMaxResults: number
  timeoutMs: number
}

/**
 * Read one config cell defensively: DSH 0.2 may hand the plugin cells, while
 * tests and other callers may pass plain values.
 */
function readCell(config: any, key: string, fallback: any): any {
  const cell = config?.[key]
  const value = typeof cell?.get === 'function' ? cell.get() : cell
  return value === undefined || value === null ? fallback : value
}

function rowConfig(config: any): PluginConfig {
  return {
    activeProvider: String(readCell(config, 'activeProvider', 'none')),
    tavilyApiKey: String(readCell(config, 'tavilyApiKey', '')),
    tavilyBaseURL: String(readCell(config, 'tavilyBaseURL', TAVILY_DEFAULT_BASE_URL)),
    tavilyMaxResults: Number(readCell(config, 'tavilyMaxResults', 5)),
    tavilySearchDepth: String(readCell(config, 'tavilySearchDepth', 'basic')),
    baiduApiKey: String(readCell(config, 'baiduApiKey', '')),
    baiduMaxResults: Number(readCell(config, 'baiduMaxResults', 5)),
    timeoutMs: Number(readCell(config, 'timeoutMs', 30000)),
  }
}

function userConfigPath(): string {
  return join(dataDirectory(), 'user-config.json')
}

function loadPersisted(): Partial<PluginConfig> {
  try {
    return JSON.parse(readFileSync(userConfigPath(), 'utf8')) as Partial<PluginConfig>
  } catch {
    return {}
  }
}

function persistConfig(config: PluginConfig): boolean {
  try {
    mkdirSync(dataDirectory(), { recursive: true })
    writeFileSync(userConfigPath(), JSON.stringify(config, null, 2) + '\n', 'utf8')
    return true
  } catch (error) {
    debug(`persist failed: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

/** The row's config with the panel's saved values merged over it. */
function effectiveConfig(base: PluginConfig): PluginConfig {
  return { ...base, ...loadPersisted() }
}

/**
 * Build the provider for the active id. Options are a thunk that re-reads the
 * effective config on every call, so a key saved from the panel applies to the
 * next search without re-registering.
 */
function createInstance(base: PluginConfig, forcedProvider?: string): any | null {
  const active = forcedProvider ?? effectiveConfig(base).activeProvider
  if (active === 'tavily') {
    return new TavilySearchProvider(() => {
      const c = effectiveConfig(base)
      return {
        apiKey: c.tavilyApiKey,
        baseURL: c.tavilyBaseURL,
        maxResults: c.tavilyMaxResults,
        searchDepth: c.tavilySearchDepth as 'basic' | 'advanced',
        timeoutMs: c.timeoutMs,
      }
    })
  }
  if (active === 'baidu') {
    return new BaiduSearchProvider(() => {
      const c = effectiveConfig(base)
      return {
        apiKey: c.baiduApiKey,
        endpoint: BAIDU_DEFAULT_ENDPOINT,
        maxResults: c.baiduMaxResults,
        timeoutMs: c.timeoutMs,
      }
    })
  }
  return null
}

/** Wrap `search()` so every call that reaches the provider is counted. */
function withUsageCounter(instance: any): any {
  const originalSearch = instance.search.bind(instance)
  const providerId: string = instance.id
  instance.search = async (request: any, signal?: AbortSignal) => {
    try {
      const result = await originalSearch(request, signal)
      incrementUsage(providerId)
      return result
    } catch (error) {
      incrementUsage(providerId)
      throw error
    }
  }
  return instance
}

/**
 * Register with `ctx.inject`, which acquires the `web` service at the point of
 * use. Reading `ctx.web` directly failed here with
 * `cannot get property "web" without inject`, because this row is inserted by a
 * bundle patch and the loader did not honour the `inject` export.
 */
function registerWithWeb(ctx: any, instance: any, providerId: string): void {
  const register = (target: any, via: string): void => {
    debug(`registering ${providerId} via ${via}; web=${typeof target?.web}`)
    disposer = target.web.registerSearchProvider(instance)
    debug(`registered OK: ${providerId} (via ${via})`)
  }

  if (typeof ctx?.inject === 'function') {
    try {
      ctx.inject(['web'], (injected: any) => {
        try {
          register(injected, 'ctx.inject')
        } catch (error) {
          debug(`injected register failed: ${error instanceof Error ? error.message : String(error)}`)
        }
      })
      return
    } catch (error) {
      debug(`ctx.inject threw: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  try {
    register(ctx, 'ctx.web')
  } catch (error) {
    debug(`ctx.web register failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/** Mount this plugin's settings API; the panel in the Plugins page calls it. */
function registerRoutes(ctx: any, base: PluginConfig, reactivate: () => void): void {
  const attach = (ws: any, via: string): void => {
    const send = (res: any, status: number, body: unknown): void => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      res.end(JSON.stringify(body))
    }
    const readBody = async (req: any): Promise<any> => {
      const chunks: Buffer[] = []
      for await (const chunk of req) chunks.push(chunk as Buffer)
      const raw = Buffer.concat(chunks).toString('utf8')
      return raw ? JSON.parse(raw) : {}
    }

    ws.register({
      kind: 'exact',
      path: `${ROUTE_PREFIX}/config`,
      handler: async (req: any, res: any) => {
        try {
          if (req.method === 'GET') return send(res, 200, effectiveConfig(base))
          const patch = (await readBody(req)) as Partial<PluginConfig>
          persistConfig(effectiveConfig({ ...base, ...patch }))
          reactivate()
          return send(res, 200, { ok: true, persisted: true })
        } catch (error) {
          return send(res, 500, { error: error instanceof Error ? error.message : String(error) })
        }
      },
    })

    ws.register({
      kind: 'exact',
      path: `${ROUTE_PREFIX}/test`,
      handler: async (req: any, res: any) => {
        try {
          const body = (await readBody(req)) as { provider?: string }
          const provider = body.provider ?? effectiveConfig(base).activeProvider
          const instance = createInstance(base, provider)
          if (!instance) return send(res, 200, { ok: false, error: 'Unknown provider' })
          await instance.search({ query: 'connectivity test', maxResults: 1 })
          return send(res, 200, { ok: true, status: 200 })
        } catch (error) {
          return send(res, 200, { ok: false, error: error instanceof Error ? error.message : String(error) })
        }
      },
    })

    ws.register({
      kind: 'exact',
      path: `${ROUTE_PREFIX}/usage`,
      handler: async (_req: any, res: any) => {
        try {
          return send(res, 200, getUsageSnapshot())
        } catch (error) {
          return send(res, 500, { error: error instanceof Error ? error.message : String(error) })
        }
      },
    })

    debug(`settings API mounted via ${via}`)
  }

  if (typeof ctx?.get === 'function') {
    try {
      const ws = ctx.get('webServer')
      if (ws) return attach(ws, 'ctx.get')
    } catch (error) {
      debug(`ctx.get('webServer') failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  if (typeof ctx?.inject === 'function') {
    try {
      ctx.inject(['webServer'], (injected: any) => {
        try {
          attach(injected.webServer ?? injected, 'ctx.inject')
        } catch (error) {
          debug(`injected route attach failed: ${error instanceof Error ? error.message : String(error)}`)
        }
      })
      return
    } catch (error) {
      debug(`ctx.inject(webServer) threw: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  debug('webServer unavailable — settings API not mounted')
}

/**
 * Activate the configured provider and mount the settings API.
 * @param ctx - plugin context.
 * @param config - the row's config cells or plain values.
 */
export function apply(ctx: any, config: any = {}): void {
  debug('apply() entered')
  const base = rowConfig(config)
  debug(`resolved activeProvider="${base.activeProvider}" (from row, before panel overrides)`)

  const current = effectiveConfig(base)
  if (!PROVIDER_IDS.includes(current.activeProvider)) {
    debug(`activeProvider="${current.activeProvider}" is not one of ${PROVIDER_IDS.join(', ')} — nothing registered`)
    console.log('[web-search-providers] no active provider — DSH falls back to its built-in search')
  }

  const reactivate = (): void => {
    const cfg = effectiveConfig(base)
    if (!PROVIDER_IDS.includes(cfg.activeProvider)) {
      debug(`reactivate: provider="${cfg.activeProvider}" not activatable`)
      return
    }
    disposeCurrentProvider()
    const instance = withUsageCounter(createInstance(base))
    registerWithWeb(ctx, instance, instance.id)
    console.log(
      `[web-search-providers] activated "${instance.id}". If another usable provider is mounted too, ` +
      `pin an id via the web row's searchProvider config or $DSH_WEB_SEARCH_PROVIDER.`,
    )
  }

  reactivate()
  registerRoutes(ctx, base, reactivate)
}

export default apply
