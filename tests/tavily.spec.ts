import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { TavilySearchProvider, TAVILY_PROVIDER_ID } from '../src/tavily.js'
import type { TavilyOptions } from '../src/tavily.js'
import { WebError, WEB_ABORTED, WEB_PROVIDER_CREDENTIAL_MISSING, WEB_PROVIDER_ERROR } from '../src/types.js'
import type { WebSearchProvider } from '../src/types.js'

const noKey = (): TavilyOptions => ({ apiKey: '' })
const withKey = (): TavilyOptions => ({
  apiKey: 'tvly-test-key',
  baseURL: 'https://api.tavily.com',
  maxResults: 5,
  searchDepth: 'basic',
  timeoutMs: 30000,
})

function mockFetch(status: number, body: unknown): void {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })))
}

/** Await a rejecting provider call and return the thrown `WebError`. */
async function expectWebError(provider: WebSearchProvider, query: string): Promise<WebError> {
  const error = await provider.search({ query }).then(
    () => undefined,
    (e: unknown) => e,
  )
  expect(error).toBeInstanceOf(WebError)
  return error as WebError
}

describe('TavilySearchProvider', () => {
  afterEach(() => vi.unstubAllGlobals())

  beforeEach(() => {
    // Global fetch may be undefined in node<18; ensure a baseline present.
    if (typeof (globalThis as { fetch?: unknown }).fetch !== 'function') {
      vi.stubGlobal('fetch', vi.fn())
    }
  })

  it('exposes a stable provider id', () => {
    expect(new TavilySearchProvider(noKey).id).toBe(TAVILY_PROVIDER_ID)
  })

  it('is unavailable without an API key and available with one', () => {
    expect(new TavilySearchProvider(noKey).available()).toBe(false)
    expect(new TavilySearchProvider(withKey).available()).toBe(true)
  })

  it('throws a credential-missing error for an empty key', async () => {
    const provider = new TavilySearchProvider(noKey)
    await expect(provider.search({ query: 'x' })).rejects.toMatchObject({
      name: 'WebError',
      code: WEB_PROVIDER_CREDENTIAL_MISSING,
    })
  })

  it('normalizes Tavily results into web_search sources', async () => {
    mockFetch(200, {
      answer: 'a synthesized answer',
      results: [
        { url: 'https://a.example', title: 'A', content: 'body a', published_date: '2024-01-02' },
        { url: 'https://b.example', title: 'B', content: 'body b' },
      ],
    })
    const provider = new TavilySearchProvider(withKey)
    const result = await provider.search({ query: 'cold brew' })
    expect(result.sources).toHaveLength(2)
    expect(result.sources[0]).toEqual({
      url: 'https://a.example',
      title: 'A',
      snippet: 'body a',
      publishedAt: '2024-01-02',
    })
    expect(result.sources[1]).toEqual({ url: 'https://b.example', title: 'B', snippet: 'body b' })
    expect(result.content).toBe('a synthesized answer')
    expect(result.truncated).toBe(false)
  })

  it('omits optional content when absent', async () => {
    mockFetch(200, { results: [{ url: 'https://a.example' }] })
    const result = await new TavilySearchProvider(withKey).search({ query: 'x' })
    expect(result.content).toBeUndefined()
  })

  it('classifies a non-OK response as provider error with status', async () => {
    mockFetch(429, 'rate limited')
    const error = await expectWebError(new TavilySearchProvider(withKey), 'x')
    expect(error.code).toBe(WEB_PROVIDER_ERROR)
    expect(error.message).toContain('HTTP 429')
  })

  it('classifies an aborted request as WEB_ABORTED', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw Object.assign(new Error('aborted'), { name: 'AbortError' })
    }))
    const error = await expectWebError(new TavilySearchProvider(withKey), 'x')
    expect(error.code).toBe(WEB_ABORTED)
  })

  it('surfaces network and parse failures as provider errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('socket hang up')
    }))
    const error = await expectWebError(new TavilySearchProvider(withKey), 'x')
    expect(error.code).toBe(WEB_PROVIDER_ERROR)
    expect(error.message).toContain('socket hang up')
  })
})
