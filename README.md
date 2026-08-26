# @wwskills/dsh-web-search-providers

Web search providers for [DeepSeek Harness](https://github.com/deepseek-ai/dsh). Provides alternative search engines for DSH's built-in `web_search` tool.

## Supported Providers

| Provider | ID | Description |
|----------|----|-------------|
| **Tavily** | `tavily` | AI-optimized web search API |
| **Baidu** | `baidu` | Baidu search API |

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

Configure via DSH Settings UI → Plugins → 网络搜索.

### Tavily

```yaml
provider: tavily
tavily:
  api_key: tvly-xxx
  max_results: 5
  search_depth: basic  # or "advanced"
```

### Baidu

```yaml
provider: baidu
baidu:
  api_key: xxx
  secret_key: xxx
  endpoint: https://api.baidu.com/jsonapi
```

## Provider Selection

DSH's `searchProvider` config selects which provider handles `web_search` calls. Only one provider can be active at a time.

Set via environment variable:
```bash
export DSH_WEB_SEARCH_PROVIDER=tavily
```

Or via DSH config:
```yaml
searchProvider: tavily
```

## License

MIT
