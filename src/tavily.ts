/**
 * Tavily search provider.
 *
 * Calls Tavily's REST API (`api.tavily.com/search`) and normalizes its results
 * into DSH's `web_search` shape. Docs: https://docs.tavily.com
 * @module @wwskills/dsh-web-search-providers/tavily
 */

import {
  WebError,
  WEB_ABORTED,
  WEB_PROVIDER_CREDENTIAL_MISSING,
  WEB_PROVIDER_ERROR,
} from './types.js'
import type { SearchRequest, SearchResponse, WebSearchProvider } from './types.js'
import { fetchWithTimeout, buildAbortSignal, isAbortError } from './http-util.js'

export const TAVILY_PROVIDER_ID = 'tavily'
export const TAVILY_DEFAULT_BASE_URL = 'https://api.tavily.com'
export const TAVILY_DEFAULT_MAX_RESULTS = 5
export const TAVILY_DEFAULT_SEARCH_DEPTH = 'basic'
export const TAVILY_DEFAULT_TIMEOUT_MS = 30000

export interface TavilyOptions {
  apiKey?: string
  baseURL?: string
  maxResults?: number
  searchDepth?: 'basic' | 'advanced'
  timeoutMs?: number
}

type ResolveOptions = () => TavilyOptions

/**
 * Tavily provider for DSH's web seam.
 *
 * Implements {@link WebSearchProvider}: `id`, `available()`, `search()`. The
 * options are read lazily through a `resolveOptions` callback so the active
 * config can change between calls without re-instantiating the provider.
 */
export class TavilySearchProvider implements WebSearchProvider {
  readonly id = TAVILY_PROVIDER_ID
  private readonly resolveOptions: ResolveOptions

  constructor(resolveOptions: ResolveOptions) {
    this.resolveOptions = resolveOptions
  }

  available(): boolean {
    const { apiKey } = this.resolveOptions()
    return Boolean(apiKey && apiKey.length > 0)
  }

  async search(request: SearchRequest, signal?: AbortSignal): Promise<SearchResponse> {
    const options = this.resolveOptions()
    const apiKey = options.apiKey ?? ''

    if (!apiKey) {
      throw new WebError(
        'Tavily search requires an API key. Configure it in Settings → Web Search → Tavily.',
        WEB_PROVIDER_CREDENTIAL_MISSING,
      )
    }

    const baseURL = options.baseURL || TAVILY_DEFAULT_BASE_URL
    const maxResults = options.maxResults ?? TAVILY_DEFAULT_MAX_RESULTS
    const searchDepth = options.searchDepth ?? TAVILY_DEFAULT_SEARCH_DEPTH
    const timeoutMs = options.timeoutMs ?? TAVILY_DEFAULT_TIMEOUT_MS

    const controller = buildAbortSignal(signal, timeoutMs)
    const body = {
      api_key: apiKey,
      query: request.query,
      max_results: request.maxResults ?? maxResults,
      search_depth: searchDepth,
      include_answer: true,
      include_raw_content: false,
    }

    try {
      const response = await fetchWithTimeout(`${baseURL}/search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller,
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new WebError(
          `Tavily API error: HTTP ${response.status} — ${text.slice(0, 200)}`,
          WEB_PROVIDER_ERROR,
          { cause: text.slice(0, 200) },
        )
      }

      const data = (await response.json()) as TavilyPayload

      const sources = (Array.isArray(data.results) ? data.results : []).map(result => ({
        url: result.url || '',
        ...(result.title ? { title: result.title } : {}),
        ...(result.content ? { snippet: result.content } : {}),
        ...(result.published_date ? { publishedAt: result.published_date } : {}),
      }))

      return {
        sources,
        // Tavily's API field is `answer`; DSH's normalized result field is `content`.
        ...(typeof data.answer === 'string' && data.answer ? { content: data.answer } : {}),
        truncated: false,
      }
    } catch (error) {
      if (error instanceof WebError) throw error
      if (isAbortError(error)) {
        throw new WebError('Tavily search timed out or was aborted', WEB_ABORTED, { cause: error })
      }
      throw new WebError(
        `Tavily search failed: ${error instanceof Error ? error.message : String(error)}`,
        WEB_PROVIDER_ERROR,
        { cause: error },
      )
    }
  }
}

interface TavilyPayload {
  results?: Array<{ url?: string; title?: string; content?: string; published_date?: string }>
  answer?: string
}
