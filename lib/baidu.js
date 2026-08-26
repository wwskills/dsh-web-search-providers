// @wwskills/dsh-web-search-providers — Baidu search provider
//
// Calls Baidu's search API to perform web searches.
// Returns normalized search results compatible with DSH's web_search tool.
//
// Baidu AI Open Platform search API: https://ai.baidu.com

import { WebError } from '@deepseek-ai/dsh-web';

const BAIDU_PROVIDER_ID = 'baidu';
const BAIDU_DEFAULT_ENDPOINT = 'https://aip.baidubce.com';
const BAIDU_DEFAULT_MAX_RESULTS = 5;
const BAIDU_DEFAULT_TIMEOUT_MS = 30000;

/**
 * Baidu search provider for DSH's web seam.
 *
 * Uses Baidu AI Open Platform's search API with API Key + Secret Key
 * authentication (OAuth2 access token flow).
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
    return !!options.apiKey && options.apiKey.length > 0 &&
           !!options.secretKey && options.secretKey.length > 0;
  }

  /**
   * Get OAuth2 access token from Baidu AI platform.
   * Token is cached with expiry.
   */
  async getAccessToken(signal) {
    const options = this.resolveOptions();
    const endpoint = options.endpoint || BAIDU_DEFAULT_ENDPOINT;
    const apiKey = options.apiKey;
    const secretKey = options.secretKey;

    // Check cached token
    if (this._cachedToken && this._tokenExpiry > Date.now() + 60000) {
      return this._cachedToken;
    }

    const url = `${endpoint}/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`;

    const response = await fetch(url, { method: 'GET', signal });
    if (!response.ok) {
      throw new WebError(
        `Baidu auth failed: HTTP ${response.status}`,
        'WEB_PROVIDER_CREDENTIAL_MISSING'
      );
    }

    const data = await response.json();
    this._cachedToken = data.access_token;
    this._tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // 5min buffer

    return this._cachedToken;
  }

  async search(request, signal) {
    const options = this.resolveOptions();

    if (!options.apiKey || !options.secretKey) {
      throw new WebError(
        'Baidu search requires API Key and Secret Key. Configure them in Settings → 网络搜索 → Baidu.',
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
      const accessToken = await this.getAccessToken(controller.signal);

      // Baidu AI search API
      const searchUrl = `${endpoint}/rpc/2.0/ai_custom/v1/wenxinworkshop/ai_interface/search`;
      const body = {
        query: request.query,
        num: request.maxResults ?? maxResults,
      };

      const response = await fetch(`${searchUrl}?access_token=${encodeURIComponent(accessToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      // Normalize Baidu response to DSH format
      const results = data.results || data.data || [];
      const sources = results.map((r) => ({
        url: r.url || r.link || '',
        ...(r.title ? { title: r.title } : {}),
        ...(r.abstract || r.content || r.snippet ? { snippet: r.abstract || r.content || r.snippet } : {}),
        ...(r.create_time || r.publish_time ? { publishedAt: r.create_time || r.publish_time } : {}),
      }));

      return {
        sources,
        ...(data.answer || data.summary ? { answer: data.answer || data.summary } : {}),
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
};
