// @wwskills/dsh-web-search-providers — Baidu search provider
//
// Calls Baidu Qianfan AI Search API to perform web searches.
// Returns normalized search results compatible with DSH's web_search tool.
//
// Docs: https://cloud.baidu.com/doc/qianfan-api/s/Wmbq4z7e5
// Auth: API Key (Bearer token), no AK/SK flow

// WebError is provided by DSH at runtime; use a fallback for standalone tests.
let WebError = class WebError extends Error {
  constructor(message, code, opts) { super(message); this.code = code; if (opts) this.cause = opts.cause; }
};
try {
  const mod = await import('@deepseek-ai/dsh-web');
  if (mod.WebError) WebError = mod.WebError;
} catch {}

let incrementUsage = null;
try {
  const mod = await import('./usage.js');
  incrementUsage = mod.incrementUsage;
} catch {}

const BAIDU_PROVIDER_ID = 'baidu';
const BAIDU_DEFAULT_ENDPOINT = 'https://qianfan.baidubce.com';
const BAIDU_DEFAULT_MAX_RESULTS = 5;
const BAIDU_DEFAULT_TIMEOUT_MS = 30000;

/**
 * Baidu search provider for DSH's web seam.
 *
 * Uses Baidu Qianfan AI Search API with API Key (Bearer token) authentication.
 *
 * Implements the WebSearchProvider interface:
 *   - id: stable provider identifier
 *   - available(): whether the provider is configured and ready
 *   - search(request, signal): perform a search, return normalized results
 */
export class BaiduSearchProvider {
  constructor(resolveOptions) {
    this.id = BAIDU_PROVIDER_ID;
    this.resolveOptions = resolveOptions;
  }

  available() {
    const options = this.resolveOptions();
    return !!options.apiKey && options.apiKey.length > 0;
  }

  async search(request, signal) {
    const options = this.resolveOptions();

    if (!options.apiKey) {
      throw new WebError(
        'Baidu search requires an API Key. Configure it in Settings → Web Search → Baidu.',
        'WEB_PROVIDER_CREDENTIAL_MISSING'
      );
    }

    const endpoint = options.endpoint || BAIDU_DEFAULT_ENDPOINT;
    const maxResults = options.maxResults ?? BAIDU_DEFAULT_MAX_RESULTS;
    const timeoutMs = options.timeoutMs ?? BAIDU_DEFAULT_TIMEOUT_MS;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeoutId);
        throw new WebError('Baidu search aborted', 'WEB_ABORTED');
      }
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      // Qianfan AI Search API
      const searchUrl = `${endpoint}/v2/ai_search/web_search`;
      const body = {
        messages: [
          { role: 'user', content: request.query },
        ],
        search_source: 'baidu_search_v2',
        resource_type_filter: [{ type: 'web', top_k: request.maxResults ?? maxResults }],
      };

      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new WebError(
          `Baidu search API error: HTTP ${response.status} — ${text.slice(0, 200)}`,
          'WEB_PROVIDER_ERROR'
        );
      }

      const data = await response.json();

      // Track usage after successful API call
      if (incrementUsage) incrementUsage(BAIDU_PROVIDER_ID);

      // Normalize Qianfan response to DSH format
      // Response structure: { references: [{ title, url, content, date, snippet, ... }] }
      const rawResults = data?.references ||
                         data?.search_info?.search_results ||
                         data?.search_results ||
                         data?.results ||
                         [];
      const sources = rawResults.map((r) => ({
        url: r.url || r.link || '',
        ...(r.title ? { title: r.title } : {}),
        ...(r.content || r.abstract || r.snippet ? { snippet: r.snippet || r.content || r.abstract } : {}),
        ...(r.date || r.create_time || r.publish_time ? { publishedAt: r.date || r.create_time || r.publish_time } : {}),
      }));

      // Extract AI-generated summary if present
      const answer = data?.content?.[0]?.content ||
                     data?.answer ||
                     data?.summary ||
                     undefined;

      return {
        sources,
        ...(answer ? { answer } : {}),
        truncated: false,
      };
    } catch (error) {
      if (error instanceof WebError) throw error;
      if (error.name === 'AbortError') {
        throw new WebError('Baidu search timed out or was aborted', 'WEB_ABORTED');
      }
      throw new WebError(
        `Baidu search failed: ${error.message}`,
        'WEB_PROVIDER_ERROR',
        { cause: error }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export {
  BAIDU_PROVIDER_ID,
  BAIDU_DEFAULT_ENDPOINT,
  BAIDU_DEFAULT_MAX_RESULTS,
  BAIDU_DEFAULT_TIMEOUT_MS,
};
