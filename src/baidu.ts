/**
 * Baidu Qianfan AI Search provider.
 *
 * Calls `qianfan.baidubce.com/v2/ai_search/web_search` with a Bearer API key
 * (no AK/SK flow) and normalizes its `references` array into DSH's web shape.
 * Docs: https://cloud.baidu.com/doc/qianfan-api/s/Wmbq4z7e5
 * @module @wwskills/dsh-web-search-providers/baidu
 */

import {
  WebError,
  WEB_ABORTED,
  WEB_PROVIDER_CREDENTIAL_MISSING,
  WEB_PROVIDER_ERROR,
} from './types.js'
import type { SearchRequest, SearchResponse, WebSearchProvider } from './types.js'
import { buildAbortSignal, isAbortError } from './http-util.js'

export const BAIDU_PROVIDER_ID = 'baidu'
export const BAIDU_DEFAULT_ENDPOINT = 'https://qianfan.baidubce.com'
export const BAIDU_DEFAULT_MAX_RESULTS = 5
export const BAIDU_DEFAULT_TIMEOUT_MS = 30000

export interface BaiduOptions {
  apiKey?: string
  endpoint?: string
  maxResults?: number
  timeoutMs?: number
}

type ResolveOptions = () => BaiduOptions

/**
 * Baidu provider for DSH's web seam.
 *
 * Implements {@link WebSearchProvider}: `id`, `available()`, `search()`. The
 * request body follows Qianfan's chat-completion-shaped `messages` format with
 * a `search_source` of `baidu_search_v2`.
 */
export class BaiduSearchProvider implements WebSearchProvider {
  readonly id = BAIDU_PROVIDER_ID
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
        'Baidu search requires an API Key. Configure it in Settings → Web Search → Baidu.',
        WEB_PROVIDER_CREDENTIAL_MISSING,
      )
    }

    const endpoint = options.endpoint || BAIDU_DEFAULT_ENDPOINT
    const maxResults = options.maxResults ?? BAIDU_DEFAULT_MAX_RESULTS
    const timeoutMs = options.timeoutMs ?? BAIDU_DEFAULT_TIMEOUT_MS

    const controller = buildAbortSignal(signal, timeoutMs)
    const body = {
      messages: [{ role: 'user', content: request.query }],
      search_source: 'baidu_search_v2',
      resource_type_filter: [{ type: 'web', top_k: request.maxResults ?? maxResults }],
    }

    try {
      const response = await fetch(`${endpoint}/v2/ai_search/web_search`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller,
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new WebError(
          `Baidu search API error: HTTP ${response.status} — ${text.slice(0, 200)}`,
          WEB_PROVIDER_ERROR,
          { cause: text.slice(0, 200) },
        )
      }

      const data = (await response.json()) as BaiduPayload
      const sources = extractSources(data).map(result => ({
        url: result.url || result.link || '',
        ...(result.title ? { title: result.title } : {}),
        ...(result.snippet || result.content || result.abstract ? { snippet: result.snippet || result.content || result.abstract } : {}),
        ...(result.date || result.create_time || result.publish_time ? { publishedAt: result.date || result.create_time || result.publish_time } : {}),
      }))

      const answer = data?.content?.[0]?.content ?? data?.answer ?? data?.summary

      return {
        sources,
        // DSH's normalized result field is `content` (was `answer` before 0.1.2).
        ...(typeof answer === 'string' && answer ? { content: answer } : {}),
        truncated: false,
      }
    } catch (error) {
      if (error instanceof WebError) throw error
      if (isAbortError(error)) {
        throw new WebError('Baidu search timed out or was aborted', WEB_ABORTED, { cause: error })
      }
      throw new WebError(
        `Baidu search failed: ${error instanceof Error ? error.message : String(error)}`,
        WEB_PROVIDER_ERROR,
        { cause: error },
      )
    }
  }
}

interface BaiduReference {
  url?: string
  link?: string
  title?: string
  snippet?: string
  content?: string
  abstract?: string
  date?: string
  create_time?: string
  publish_time?: string
}

interface BaiduPayload {
  references?: BaiduReference[]
  search_info?: { search_results?: BaiduReference[] }
  search_results?: BaiduReference[]
  results?: BaiduReference[]
  content?: Array<{ content?: string }>
  answer?: string
  summary?: string
}

/** Normalize the many possible Qianfan result field shapes into one list. */
function extractSources(data: BaiduPayload): BaiduReference[] {
  return (
    data?.references
    ?? data?.search_info?.search_results
    ?? data?.search_results
    ?? data?.results
    ?? []
  )
}
