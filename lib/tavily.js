// @wwskills/dsh-web-search-providers — Tavily search provider
//
// Calls Tavily's REST API (https://api.tavily.com) to perform web searches.
// Returns normalized search results compatible with DSH's web_search tool.
//
// API docs: https://docs.tavily.com

// WebError is provided by DSH at runtime; use a fallback for standalone tests.
let WebError = class WebError extends Error {
  constructor(message, code, opts) { super(message); this.code = code; if (opts) this.cause = opts.cause; }
};
try {
  const mod = await import('@deepseek-ai/dsh-web');
  if (mod.WebError) WebError = mod.WebError;
} catch {}

const TAVILY_PROVIDER_ID = 'tavily';
const TAVILY_DEFAULT_BASE_URL = 'https://api.tavily.com';
const TAVILY_DEFAULT_MAX_RESULTS = 5;
const TAVILY_DEFAULT_SEARCH_DEPTH = 'basic';
const TAVILY_DEFAULT_TIMEOUT_MS = 30000;

/**
 * Tavily search provider for DSH's web seam.
 *
 * Implements the WebSearchProvider interface:
 *   - id: stable provider identifier
 *   - available(): whether the provider is configured and ready
 *   - search(request, signal): perform a search, return normalized results
 */
export class TavilySearchProvider {
  constructor(resolveOptions) {
    this.id = TAVILY_PROVIDER_ID;
    this.resolveOptions = resolveOptions;
  }

  available() {
    const options = this.resolveOptions();
    return !!options.apiKey && options.apiKey.length > 0;
  }

  async search(request, signal) {
    const options = this.resolveOptions();
    const apiKey = options.apiKey;
    console.log('[web-search-providers] Tavily search: query=' + request.query + ', apiKey=' + (apiKey ? apiKey.slice(0,8) + '...' + apiKey.slice(-4) : 'MISSING'));

    if (!apiKey || apiKey.length === 0) {
      throw new WebError(
        'Tavily search requires an API key. Configure it in Settings → 网络搜索 → Tavily.',
        'WEB_PROVIDER_CREDENTIAL_MISSING'
      );
    }

    const baseURL = options.baseURL || TAVILY_DEFAULT_BASE_URL;
    const maxResults = options.maxResults ?? TAVILY_DEFAULT_MAX_RESULTS;
    const searchDepth = options.searchDepth ?? TAVILY_DEFAULT_SEARCH_DEPTH;
    const timeoutMs = options.timeoutMs ?? TAVILY_DEFAULT_TIMEOUT_MS;

    const body = {
      api_key: apiKey,
      query: request.query,
      max_results: request.maxResults ?? maxResults,
      search_depth: searchDepth,
      include_answer: true,
      include_raw_content: false,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Combine caller signal with our timeout
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeoutId);
        throw new WebError('Tavily search aborted', 'WEB_ABORTED');
      }
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      const response = await fetch(`${baseURL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new WebError(
          `Tavily API error: HTTP ${response.status} — ${text.slice(0, 200)}`,
          'WEB_PROVIDER_ERROR'
        );
      }

      const data = await response.json();

      // Normalize to DSH's expected format
      const sources = (data.results || []).map((r) => ({
        url: r.url || '',
        ...(r.title ? { title: r.title } : {}),
        ...(r.content ? { snippet: r.content } : {}),
        ...(r.published_date ? { publishedAt: r.published_date } : {}),
      }));

      return {
        sources,
        ...(data.answer ? { answer: data.answer } : {}),
        truncated: false,
      };
    } catch (error) {
      if (error instanceof WebError) throw error;
      if (error.name === 'AbortError') {
        throw new WebError('Tavily search timed out or was aborted', 'WEB_ABORTED');
      }
      throw new WebError(
        `Tavily search failed: ${error.message}`,
        'WEB_PROVIDER_ERROR',
        { cause: error }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export {
  TAVILY_PROVIDER_ID,
  TAVILY_DEFAULT_BASE_URL,
  TAVILY_DEFAULT_MAX_RESULTS,
  TAVILY_DEFAULT_SEARCH_DEPTH,
};
