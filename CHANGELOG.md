# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-08-27

### Changed

- **Breaking**: Baidu auth changed from AK/SK OAuth2 to API Key (Bearer token)
- Baidu endpoint changed from `aip.baidubce.com` to `qianfan.baidubce.com`
- Baidu search request format updated to Qianfan `messages` + `search_source` format
- Baidu response parsing updated to handle `references` array
- WebUI: merged "Search Provider" and "Activate Provider" into single "Provider" section
- WebUI: simplified dropdown labels (removed descriptive suffixes)
- WebUI: provider config header now shows provider name + "Config"
- Test connection now runs server-side (fixes browser CORS issues)
- Provider switching is instant (no DSH restart needed)

### Added

- Usage tracking: monthly API call counts per provider (`usage.js`)
- Usage API: `GET /plugins/web-search-providers/api/usage`
- Usage display in WebUI (inline next to provider dropdown)
- Baidu: "Get API Key" link to Qianfan console
- Baidu: `maxResults` config field
- i18n: `saving` key for save button loading state
- i18n: `baiduApiKeyHint` for Baidu API key placeholder
- Plugin auto-pins `searchProviderId` on DSH web service to avoid ambiguous provider errors

### Removed

- Baidu `secretKey` config field (no longer needed with API Key auth)
- Baidu `endpoint` config field (fixed to `qianfan.baidubce.com`)
- Debug `console.log` that printed API key in tavily.js
- Debug residual code in index.js (`var _opts = resolveOptions()`)
- Redundant i18n keys: `baiduEndpoint`, `activateProvider`, `providerChangedMsg`, `baiduApiKey`

### Fixed

- Tavily: removed `console.log` leaking API key prefix
- Baidu: response parsing — `references` array (was looking for `search_info.search_results`)
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
