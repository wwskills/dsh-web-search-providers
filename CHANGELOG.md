# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-09-07

### Changed

- **Rewrite in strict TypeScript** (`src/`), matching the DSH plugin engineering
  standard used by `dsh-kb` (`tsconfig` + esbuild + `tsc` declarations + vitest)
- Host entry / client / providers now ship as esbuild-compiled ESM bundles with
  separate `.d.ts` declarations under `lib/types`
- Config persistence and usage files now resolve through a **cross-platform data
  directory** (`config-path.ts`) instead of a POSIX-only `$HOME` path — no longer
  collapses to `/root/.dsh` on Windows
- Shared, single-purpose `http-util` module for timeout/abort signal coalescing
  and abort classification, so both providers classify timeouts consistently
- Packaging: `main`/`types`/`exports` target the compiled `lib/` outputs
- **DSH 0.1.2-rc.1 compatibility**:
  - Search result answer field renamed `answer` → `content` to match the
    `WebSearchResult` contract change
  - `web.searchProviderId` is now private/constructor-driven in DSH; the plugin
    keeps a guarded best-effort legacy pin
  - `settingsNamespace()` is no longer exported by `@deepseek-ai/dsh-settings`;
    the plugin now passes the namespace string directly
  - `settings.update()` is async since DSH 0.1.2; the config API now awaits it
  - Peer dependency ranges widened to `>=0.1.0-rc.6 <0.2.0`

### Added

- `ds`-standard scripts: `typecheck`, `build`, `check` (typecheck + test + build)
- `vitest` tests: 26 tests across 4 modules (baidu, tavily, usage, http-util)

### Fixed

- Windows: config path no longer resolves to `/root/.dsh`
- Restored the missing `POST /plugins/web-search-providers/api/test` endpoint
  (lost in the 0.3.0 TypeScript rewrite)
- `buildAbortSignal` memory leak: external signal listener now properly cleaned up
- `incrementUsage` wired into every provider search call
- WebUI: dropdown dark theme support (`colorScheme: dark` + custom SVG arrow)
- WebUI: status indicator matches DSH native `_indicator` component style

## [0.2.0] - 2026-08-27

### Changed

- **Breaking**: Baidu auth changed from AK/SK OAuth2 to API Key (Bearer token)
- Baidu endpoint changed from `aip.baidubce.com` to `qianfan.baidubce.com`
- Baidu search request format updated to Qianfan `messages` + `search_source` format
- Baidu response parsing updated to handle `references` array
- WebUI: merged "Search Provider" and "Activate Provider" into single "Provider" section
- Test connection now runs server-side (fixes browser CORS issues)
- Provider switching is instant (no DSH restart needed)

### Added

- Usage tracking: monthly API call counts per provider (`usage.js`)
- Usage API: `GET /plugins/web-search-providers/api/usage`
- Usage display in WebUI (inline next to provider dropdown)
- Baidu: "Get API Key" link to Qianfan console
- Baidu: `maxResults` config field
- i18n: `saving` key for save button loading state
- Plugin auto-pins `searchProviderId` on DSH web service to avoid ambiguous provider errors

### Removed

- Baidu `secretKey` config field (no longer needed with API Key auth)
- Baidu `endpoint` config field (fixed to `qianfan.baidubce.com`)
- Debug `console.log` that printed API key in tavily.js
- Debug residual code in index.js

### Fixed

- Tavily: removed `console.log` leaking API key prefix
- Baidu: response parsing — `references` array
- Index: `searchProviderId` now set on web service to avoid "multiple usable providers" error
- cordis.patch.yml: removed hardcoded `searchProvider: tavily` from DSH profile

## [0.1.0] - 2026-08-26

### Added

- Tavily search provider (REST API, AI-optimized search)
- Baidu search provider (Baidu AI Open Platform, OAuth2 auth)
- Provider selection: activeProvider config (none/tavily/baidu)
- Plugin-managed config persistence (user-config.json)
- WebUI settings tab: Web Search
- DSH settings namespace registration
- Web API: GET/POST /plugins/web-search-providers/api/config