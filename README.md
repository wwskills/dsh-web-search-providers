# @wwskills/dsh-web-search-providers

Web search providers for [DeepSeek Harness](https://github.com/deepseek-ai/dsh).
Provides alternative search engines for DSH's built-in `web_search` tool.

Built and verified against **DSH 0.2.1-rc.2**. The package declares that version
in `engines.dsh`, which is the field DSH checks before importing plugin code, so
an incompatible host refuses the install instead of misbehaving silently.

DSH evaluates `engines.dsh` first; when it is present the `@deepseek-ai/dsh-*`
peer ranges are ignored for compatibility purposes. The peer on
`@deepseek-ai/dsh-web` is still declared, because it documents which seam the
plugin was built against.

> `dsh.manifestVersion` and `engines.dsh` are advisory metadata for tooling and
> the plugin market; enforcement happens at install and profile start, against
> the version reported by `dsh --version`.

## Supported Providers

| Provider | ID | Auth | Free Tier |
|----------|----|------|-----------|
| **Tavily** | `tavily` | API Key | 1,000 calls/month |
| **Baidu** | `baidu` | API Key (Bearer token) | 1,500 calls/month, granted daily |

Free-tier figures come from each provider's own console and change without
notice — check the provider's dashboard for current allowances.

## Compatibility

| Requirement | Value |
|-------------|-------|
| DSH | `0.2.1-rc.2` (declared in `engines.dsh`) |
| Node.js | `>=24` (declared in `engines.node`) |

DSH checks `engines.dsh` against the version reported by `dsh --version` before
importing plugin code. If the range is not met, installation is refused with an
`incompatible-version` error naming the unmet requirement. An exact prerelease
such as `0.2.1-rc.2` is a valid range and pins the plugin to that release;
`~0.2.1-rc.2` or `>=0.2.1-rc.2 <0.3.0` accept compatible patch or prerelease
updates. To run a plugin against an unverified DSH version you must grant an
explicit per-version exemption, which DSH treats as an acknowledged risk.

## Development

The plugin is written in strict TypeScript and emits host ESM bundles plus a
browser client bundle via esbuild, mirroring the DSH plugin engineering standard.

```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run build       # esbuild host + client, then tsc declarations
```

`pnpm-workspace.yaml` exists only to allow esbuild's install script under pnpm;
npm does not read it.

Source lives in `src/` (`index.ts` host entry, `client.tsx` browser panel,
`tavily.ts` / `baidu.ts` providers, `types.ts` shared contracts, `usage.ts`
quota tracking, `config-path.ts` cross-platform data dir, `http-util.ts` shared
helpers). Tests live in `tests/` and cover provider availability, response
normalization, error classification, timeout/abort handling, usage persistence,
and the Windows-safe path resolver.

## Installation

Install it through DSH rather than by editing the profile by hand — DSH owns
`package.json` and `cordis.patch.yml` in the profile directory, and writing
those directly is unsupported.

From an agent session, ask for the bundle install:

```
plugin_manager action=install_bundle target=D:\path\to\dsh-web-search-providers
```

`install_bundle` performs the package installation and records the bundle
selection. An agent can also pass `target=@wwskills/dsh-web-search-providers` once
the package is published to a registry your profile can reach.

Both host and browser code load on the next DSH start, so restart afterwards to
see the panel.

## Configuration

### Via WebUI

Open **Settings → Plugins** and pick the search bundle. It appears as
**网络搜索** in Chinese and **Web Search** in English; the title follows the
interface language. Then:

1. Choose a provider (Default / Tavily / Baidu)
2. Enter its API key — the field links to the provider's console
3. Test connection (uses the key you just typed, no need to save first)
4. Save — takes effect immediately, no restart needed

### Provider Switching

Switching providers is instant. On save the plugin disposes the old provider,
registers the new one, and repoints the `web` seam's `searchProvider` pin at it.

That last step is required, not cosmetic: the seam resolves the pin before it
considers any provider's availability, so a pin left behind makes every later
switch fail with `configured web provider "<id>" is not registered`. The plugin
writes the pin through the config's volatile reference, which changes it for the
running session only — selection itself is persisted in `user-config.json`, and
the two realign on the next start.

### Fallback to DeepSeek

Pick **Default** and no custom provider is registered, so DSH uses its built-in
web search.

### Usage Tracking

The plugin tracks monthly API calls per provider and displays usage in the
settings panel. Data is persisted to `usage.json` in the plugin's data
directory.

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
- **Config**: `apiKey`, `maxResults`, `timeoutMs` (the endpoint is fixed)

## Localization

The plugin ships Chinese and English. The bundle title and description come from
`locale/zh.json` and `locale/en.json`; every string in the settings panel is
routed through the client locale service and follows the interface language.

## Styling

Panel controls are hand-written against DSH's theme tokens (`--dsw-alias-*`,
`--dsw-radius-*`) rather than imported from Harness client packages, which are
not a stable dependency for third-party plugins. Colours come from tokens only,
so a renamed token degrades appearance instead of breaking rendering.

Two constraints worth knowing if you extend the panel:

- The native `<select>` popup is drawn by the OS, so its option hover colour
  cannot be themed. The provider picker is a `button` + listbox for that reason.
- The provider icon reproduces the built-in Web Search artwork. DSH fills its
  ring with a `foreignObject` conic-gradient, which renders blank once the icon
  loads as an `<img>`, so `icon.svg` carries the same four arcs as solid colours.

## Web API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/plugins/web-search-providers/api/config` | Get current configuration |
| `POST` | `/plugins/web-search-providers/api/config` | Update configuration |
| `POST` | `/plugins/web-search-providers/api/test` | Test provider connection |
| `GET` | `/plugins/web-search-providers/api/usage` | Get monthly usage stats |

## License

MIT
