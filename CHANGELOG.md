# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.1] - 2026-10-26

### Changed

- **DSH 0.2.1-rc.3 compatibility.** `engines.dsh` widened from the exact
  prerelease pin `0.2.1-rc.2` to `>=0.2.1-rc.2 <0.3.0`, so a DSH 0.2.1-rc.3
  host accepts the plugin again. An exact prerelease matches only that one
  release, which made DSH 0.2.1-rc.3 refuse every install of 0.4.0 with an
  `incompatible-version` error; the range accepts rc.3 and later 0.2.x
  prereleases and patches. The `@deepseek-ai/dsh-web` peer range widened to
  match. No code changes — host and client bundles are identical to 0.4.0,
  and the DSH rc.2→rc.3 release touched no seam this plugin uses.

## [0.4.0] - 2026-10-22

### Changed

- **DSH 0.2.1-rc.2 port.** `settings.register()` and the
  `internal/service` event are gone; config is now declared by exporting
  `Config` and projected into Settings by DSH itself.
- Panel styling rewritten against the built-in Web Search page, read from the
  DSH install rather than guessed: `0.5px` borders with `radius-md`, 34px
  controls, `:focus-visible` with `state-business-primary`, and a filled
  primary save button. Scoped CSS now uses the official `data-plugin-css`
  injection pattern.
- Replaced the native `<select>` with a button + listbox. The OS draws the
  native popup, so its option hover colour cannot be themed; the custom control
  uses `interactive-bg-hover` like DSH's own menus.
- Panel copy moved out of markup into an `en`/`zh` dictionary routed through
  `ctx.locale`, with an offline fallback for when the locale service has not
  registered yet.

### Added

- `engines.dsh: "0.2.1-rc.2"` and `dsh.manifestVersion: 1`, declaring the
  DSH version this plugin supports. `engines.dsh` is the field DSH checks at
  install and profile start, so an incompatible host refuses the plugin instead
  of loading code written against a different seam.
- `locale/en.json` and `locale/zh.json` supply the plugin title and description
  that Plugin Manager and Settings read, so the bundle shows as
  "Web Search" / "网络搜索" rather than the package name.
- `icon.svg` reproduces the built-in `PluginArtworkSearch` artwork. DSH colours
  its ring with a `foreignObject` conic-gradient, which renders blank when the
  icon loads as an `<img>`, so the four arcs carry the equivalent solid colours.
- API-key guidance links under each provider's field.
- **Short-name npm variant**: `npm run build:short` assembles `dist-short/` —
  the same plugin published under the unscoped npm name
  `dsh-web-search-providers`, so installs can type the name without the scope.
  The build swaps every identity-bearing spot (package name, loader row name,
  client module-table id, settings-panel slot key) to the short name; the host
  bundle is byte-identical to the scoped build. Published as
  `dsh-web-search-providers@0.4.0`. Both names carry the same code — install
  one, not both (two installs register duplicate search providers).
  Note: npm creates a transient `0.0.0-stage` placeholder version while
  processing a brand-new package; it is server-side, harmless, and remains in
  the version list.

### Fixed

- **Provider switching now works.** The seam resolves `searchProvider` before
  anything else, so the patch's static pin left the panel unable to switch:
  activating a second provider made the seam look for an id nobody registered
  and fail with `configured web provider "tavily" is not registered`. The plugin
  now pins the seam to whichever provider it just registered, writing the
  volatile cell through the shared `Symbol.for('cosmokit.volatile.write')`
  handle from inside the `ctx.inject` callback — the only point where the `web`
  service is guaranteed live, since `ctx.get('web')` returns `undefined` during
  `apply()`.
- Saving from the panel no longer reverts a provider switch. The save route
  merged the patch over the *persisted* config, so the old `activeProvider`
  overwrote the new one.
- Testing a connection now uses the key currently in the form instead of the
  last saved one, so an unsaved key can be checked before committing.
- Usage counts survive an interrupted search.

### Known limitations

- The seam pin is written through the volatile reference, which is a
  runtime-only change and is not persisted. Provider selection itself is
  persisted by the plugin's own `user-config.json`, and the two realign on the
  next start.

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

[0.4.1]: https://github.com/wwskills/dsh-web-search-providers/releases/tag/v0.4.1
[0.4.0]: https://github.com/wwskills/dsh-web-search-providers/releases/tag/v0.4.0
[0.3.0]: https://github.com/wwskills/dsh-web-search-providers/releases/tag/v0.3.0
[0.1.0]: https://github.com/wwskills/dsh-web-search-providers/releases/tag/v0.1.0