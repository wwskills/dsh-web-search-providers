# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-26

### Added

- Tavily search provider (REST API, AI-optimized search)
- Baidu search provider (Baidu AI Open Platform, OAuth2 auth)
- Provider selection: activeProvider config (none/tavily/baidu)
- Plugin-managed config persistence (user-config.json)
- WebUI settings tab: 网络搜索
- DSH settings namespace registration
- Web API: GET/POST /plugins/web-search-providers/api/config
