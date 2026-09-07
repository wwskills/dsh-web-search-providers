import { describe, expect, it, afterEach, vi } from 'vitest'
import { BaiduSearchProvider, BAIDU_PROVIDER_ID, BAIDU_DEFAULT_ENDPOINT } from '../src/baidu.js'
import { WebError, WEB_ABORTED, WEB_PROVIDER_CREDENTIAL_MISSING, WEB_PROVIDER_ERROR } from '../src/types.js'

const noKey = () => ({ apiKey: '' })
const withKey = () => ({
  apiKey: 'bce-v3/test-key',
  endpoint: BAIDU_DEFAULT_ENDPOINT,
  maxResults: 5,
  timeoutMs: 30000,
})

function mockFetch(status: number, body: unknown): void {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status })))
}

describe('BaiduSearchProvider', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('exposes a stable provider id and defaults to Qianfan', () => {
    const provider = new BaiduSearchProvider(noKey)
    expect(provider.id).toBe(BAIDU_PROVIDER_ID)
    expect(BAIDU_DEFAULT_ENDPOINT).toBe('https://qianfan.baidubce.com')
  })

  it('is unavailable without an API key and available with one', () => {
    expect(new BaiduSearchProvider(noKey).available()).toBe(false)
    expect(new BaiduSearchProvider(withKey).available()).toBe(true)
  })

  it('throws a credential-missing error for an empty key', async () => {
    const error = await new BaiduSearchProvider(noKey).search({ query: 'x' }).catch(e => e as WebError)
    expect(error.code).toBe(WEB_PROVIDER_CREDENTIAL_MISSING)
  })

  it('normalizes Qianfan references into web_search sources', async () => {
    mockFetch(200, {
      content: [{ content: 'a summary' }],
      references: [
        { url: 'https://a.example', title: 'A', content: 'body a', date: '2024-03-04' },
        { url: 'https://b.example', title: 'B', abstract: 'abstract b' },
      ],
    })
    const result = await new BaiduSearchProvider(withKey).search({ query: '天气' })
    expect(result.sources).toHaveLength(2)
    expect(result.sources[0]).toEqual({ url: 'https://a.example', title: 'A', snippet: 'body a', publishedAt: '2024-03-04' })
    expect(result.sources[1]).toEqual({ url: 'https://b.example', title: 'B', snippet: 'abstract b' })
    expect(result.content).toBe('a summary')
  })

  it('supports alternate result field shapes', async () => {
    mockFetch(200, { search_results: [{ url: 'https://x.example', create_time: '2024-01-01' }] })
    const result = await new BaiduSearchProvider(withKey).search({ query: 'x' })
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0].publishedAt).toBe('2024-01-01')
  })

  it('classifies a non-OK response as provider error', async () => {
    mockFetch(401, 'unauthorized')
    const error = await new BaiduSearchProvider(withKey).search({ query: 'x' }).catch(e => e as WebError)
    expect(error.code).toBe(WEB_PROVIDER_ERROR)
    expect(error.message).toContain('HTTP 401')
  })

  it('classifies an abort as WEB_ABORTED', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw Object.assign(new Error('aborted'), { name: 'AbortError' })
    }))
    const error = await new BaiduSearchProvider(withKey).search({ query: 'x' }).catch(e => e as WebError)
    expect(error.code).toBe(WEB_ABORTED)
  })

  it('throws a credential web error rather than a bare WebError for network failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('ECONNREFUSED')
    }))
    const error = await new BaiduSearchProvider(withKey).search({ query: 'x' }).catch(e => e as WebError)
    expect(error).toBeInstanceOf(WebError)
    expect(error.code).toBe(WEB_PROVIDER_ERROR)
  })
})
