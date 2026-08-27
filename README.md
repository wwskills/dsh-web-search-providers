# @wwskills/dsh-web-search-providers

Web search providers for [DeepSeek Harness](https://github.com/deepseek-ai/dsh). Provides alternative search engines for DSH's built-in `web_search` tool.

## Supported Providers

| Provider | ID | Auth | Free Tier |
|----------|----|------|-----------|
| **Tavily** | `tavily` | API Key | 1,000 calls/month |
| **Baidu** | `baidu` | API Key (Bearer token) | 1,500 calls/month |

## Installation

```bash
# In your DSH profile directory
pnpm add @wwskills/dsh-web-search-providers
```

Add to your profile's `package.json` bundles:

```json
{
  "dsh": {
    "profile": {
      "bundles": [
        "@wwskills/dsh-web-search-providers"
      ]
    }
  }
}
```

## Configuration

### Via WebUI

Go to **Settings → Plugins → Web Search** to configure:

1. Select active provider (Tavily / Baidu / None)
2. Enter API key (get free key from provider's platform)
3. Test connection
4. Save — takes effect immediately, no restart needed

### Provider Switching

Switching providers is instant. The plugin disposes the old provider and registers the new one on save.

### Fallback to DeepSeek

When `activeProvider` is set to `none`, no custom provider is registered, and DSH falls back to its built-in DeepSeek web search.

### Usage Tracking

The plugin tracks monthly API calls per provider and displays usage in the settings panel. Data is persisted to `usage.json` in the plugin's data directory.

## API Reference

### Tavily

- **Endpoint**: `https://api.tavily.com/search`
- **Auth**: API Key in request body (`api_key` field)
- **Docs**: [docs.tavily.com](https://docs.tavily.com)
- **Config**: `apiKey`, `baseURL`, `maxResults`, `searchDepth`, `timeoutMs`

### Baidu (Qianfan AI Search)

- **Endpoint**: `https://qianfan.baidubce.com/v2/ai_search/web_search`
- **Auth**: `Authorization: Bearer <API Key>`
- **Docs**: [cloud.baidu.com](https://cloud.baidu.com/doc/qianfan-api/s/Wmbq4z7e5)
- **Config**: `apiKey`, `maxResults`, `timeoutMs`

## Web API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/plugins/web-search-providers/api/config` | Get current configuration |
| `POST` | `/plugins/web-search-providers/api/config` | Update configuration |
| `POST` | `/plugins/web-search-providers/api/test` | Test provider connection |
| `GET` | `/plugins/web-search-providers/api/usage` | Get monthly usage stats |

## License

MIT
