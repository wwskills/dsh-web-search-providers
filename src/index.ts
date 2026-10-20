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

import Schema from '@deepseek-ai/schemastery'
import { TavilySearchProvider, TAVILY_DEFAULT_BASE_URL } from './tavily.js'
import { BaiduSearchProvider, BAIDU_DEFAULT_ENDPOINT } from './baidu.js'
import { incrementUsage } from './usage.js'

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
 * Register the configured provider.
 * @param ctx - plugin context; `web` is injected.
 * @param config - the row's config cells.
 */
export function apply(ctx: any, config: any = {}): void {
  const activeProvider = String(readCell(config, 'activeProvider', 'none'))

  if (activeProvider === 'none') {
    console.log('[web-search-providers] activeProvider=none — DSH falls back to its built-in search')
    return
  }

  if (!PROVIDER_IDS.includes(activeProvider)) {
    console.warn(`[web-search-providers] unknown activeProvider "${activeProvider}" — expected one of ${PROVIDER_IDS.join(', ')}`)
    return
  }

  const timeoutMs = Number(readCell(config, 'timeoutMs', 30000))

  let instance: any = null
  if (activeProvider === 'tavily') {
    instance = new TavilySearchProvider(() => ({
      apiKey: String(readCell(config, 'tavilyApiKey', '')),
      baseURL: String(readCell(config, 'tavilyBaseURL', TAVILY_DEFAULT_BASE_URL)),
      maxResults: Number(readCell(config, 'tavilyMaxResults', 5)),
      searchDepth: readCell(config, 'tavilySearchDepth', 'basic') as 'basic' | 'advanced',
      timeoutMs,
    }))
  } else {
    instance = new BaiduSearchProvider(() => ({
      apiKey: String(readCell(config, 'baiduApiKey', '')),
      endpoint: BAIDU_DEFAULT_ENDPOINT,
      maxResults: Number(readCell(config, 'baiduMaxResults', 5)),
      timeoutMs,
    }))
  }

  // Count every call that reaches the provider, success or failure.
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

  try {
    ctx.web.registerSearchProvider(instance)
    console.log(
      `[web-search-providers] registered provider "${providerId}". ` +
      `If another usable provider is mounted too, pin an id via the web row's ` +
      `searchProvider config or $DSH_WEB_SEARCH_PROVIDER to avoid WEB_PROVIDER_AMBIGUOUS.`,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[web-search-providers] provider registration failed: ${message}`)
  }
}

/**
 * Read one config cell defensively: DSH 0.2 hands the plugin cells, while tests
 * and other callers may pass plain values.
 */
function readCell(config: any, key: string, fallback: any): any {
  const cell = config?.[key]
  const value = typeof cell?.get === 'function' ? cell.get() : cell
  return value === undefined || value === null ? fallback : value
}

export default apply
