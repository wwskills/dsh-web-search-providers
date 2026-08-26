# @wwskills/dsh-web-search-providers

Web search providers for [DeepSeek Harness](https://github.com/deepseek-ai/dsh). Provides alternative search engines for DSH's built-in `web_search` tool.

## Supported Providers

| Provider | ID | Description |
|----------|----|-------------|
| **Tavily** | `tavily` | AI-optimized web search API |
| **Baidu** | `baidu` | Baidu AI Open Platform search |

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

### 1. Set Environment Variable

DSH needs to know which search provider to use. Set this before starting DSH:

```bash
# In systemd override or environment
export DSH_WEB_SEARCH_PROVIDER=tavily
```

Or via systemd:
```bash
sudo systemctl edit dsh
# Add:
# [Service]
# Environment="DSH_WEB_SEARCH_PROVIDER=tavily"
```

### 2. Configure via WebUI

Go to **Settings → Plugins → 网络搜索** to configure:
- Select active provider (Tavily / Baidu / None)
- Enter API key
- Test connection
- Save

### 3. Provider Switching

Switching providers requires a DSH restart (DSH framework limitation). API key changes take effect immediately.

### 4. Fallback to DeepSeek

When `activeProvider` is set to `none`, no custom provider is registered, and DSH falls back to its built-in DeepSeek web search.

## License

MIT
