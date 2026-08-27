window.__ModuleLoader__.load({
	id: "@wwskills/dsh-web-search-providers",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		var j = react_jsx_runtime.jsx, js = react_jsx_runtime.jsxs;
		let slots = require("@deepseek-ai/dsh-client-ui-slots");

		const NS = "web-search-providers";

		const zh = {
			tab: "网络搜索",
			title: "网络搜索",
			providerLabel: "Provider",
			tavily: "Tavily",
			baidu: "Baidu",
			none: "不使用",
			statusEnabled: "已启用",
			statusDisabled: "未启用",
			apiKey: "API Key",
			apiKeyHint: "Tavily API 密钥，以 tvly- 开头",
			baiduApiKeyHint: "千帆平台 API Key",
			getBaiduKey: "获取 API Key",
			maxResults: "最大返回结果",
			searchDepth: "搜索深度",
			testConnection: "测试连接",
			testing: "测试中...",
			save: "保存",
			saving: "保存中...",
			cancel: "取消",
			saved: "✓ 已保存，即时生效",
			getTavilyKey: "获取 API Key",
			noneOption: "不使用",
			tavilyOption: "Tavily",
			baiduOption: "Baidu",
			configLabel: "配置",
			unsavedChanges: "● 有未保存的更改",
			saveFailed: "✗ 保存失败",
			connectionOk: "✓ 连接成功",
			connectionFail: "✗ HTTP",
			notConfigured: "网络搜索未启用",
			notConfiguredHint: "选择 Tavily 或 Baidu 启用 web_search 工具",
			usageThisMonth: "本月用量",
			usageUnit: "次",
		};

		const en = {
			tab: "Web Search",
			title: "Web Search",
			providerLabel: "Provider",
			tavily: "Tavily",
			baidu: "Baidu",
			none: "None",
			statusEnabled: "Enabled",
			statusDisabled: "Disabled",
			apiKey: "API Key",
			apiKeyHint: "Tavily API key, starts with tvly-",
			baiduApiKeyHint: "Qianfan API Key",
			getBaiduKey: "Get API Key",
			maxResults: "Max Results",
			searchDepth: "Search Depth",
			testConnection: "Test Connection",
			testing: "Testing...",
			save: "Save",
			saving: "Saving...",
			cancel: "Cancel",
			saved: "✓ Saved",
			getTavilyKey: "Get API Key",
			noneOption: "None",
			tavilyOption: "Tavily",
			baiduOption: "Baidu",
			configLabel: "Config",
			unsavedChanges: "● Unsaved changes",
			saveFailed: "✗ Save failed",
			connectionOk: "✓ Connected",
			connectionFail: "✗ HTTP",
			notConfigured: "Web search is not enabled",
			notConfiguredHint: "Select Tavily or Baidu to enable the web_search tool",
			usageThisMonth: "This month",
			usageUnit: "calls",
		};

		const cardStyle = {
			background: "var(--dsw-alias-bg-layer-2)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "12px",
		};

		const headerStyle = {
			fontSize: "16px",
			fontWeight: 600,
			color: "var(--dsw-alias-label-primary)",
			margin: "0",
		};

		const dividerStyle = {
			height: "1px",
			background: "var(--dsw-alias-border-l2)",
			margin: "16px 0",
		};

		const labelStyle = {
			fontSize: "14px",
			fontWeight: 500,
			color: "var(--dsw-alias-label-primary)",
			marginBottom: "4px",
		};

		const descStyle = {
			fontSize: "12px",
			color: "var(--dsw-alias-label-tertiary)",
			marginTop: "4px",
		};

		const inputStyle = {
			height: "40px",
			padding: "0 12px",
			background: "var(--dsw-alias-bg-input)",
			color: "var(--dsw-alias-label-primary)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "8px",
			fontSize: "14px",
			outline: "none",
			width: "100%",
			boxSizing: "border-box",
		};

		const selectStyle = {
			height: "40px",
			padding: "0 12px",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "8px",
			fontSize: "14px",
			width: "100%",
			boxSizing: "border-box",
		};

		const btnPrimary = {
			height: "36px",
			padding: "0 20px",
			background: "var(--dsw-alias-button-primary-fill)",
			color: "var(--dsw-alias-label-primary-foreground)",
			border: "none",
			borderRadius: "8px",
			fontSize: "14px",
			cursor: "pointer",
			fontWeight: 500,
		};

		const btnOutline = {
			height: "36px",
			padding: "0 16px",
			background: "transparent",
			color: "var(--dsw-alias-label-secondary)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "8px",
			fontSize: "14px",
			cursor: "pointer",
		};

		const btnPill = {
			border: "1px solid var(--dsw-alias-border-l2)",
			background: "transparent",
			color: "var(--dsw-alias-label-primary)",
			borderRadius: "12px",
			padding: "1px 10px",
			cursor: "pointer",
			fontSize: "12px",
			whiteSpace: "nowrap",
			height: "22px",
			lineHeight: "20px",
		};

		function field(label, inputEl, desc) {
			return js("div", { style: { marginBottom: "16px" }, children: [
				j("div", { style: labelStyle, children: label }),
				inputEl,
				desc ? j("div", { style: descStyle, children: desc }) : null,
			]});
		}

		function WebSearchSettingsTab({ t }) {
			var _useState = react.useState, _useEffect = react.useEffect;
			var cfgState = _useState(null), setCfg = cfgState[1], cfg = cfgState[0];
			var saving = _useState(false), setSaving = saving[1], savingFlag = saving[0];
			var msgState = _useState(''), setMsg = msgState[1], msgText = msgState[0];
			var testingState = _useState(false), setTesting = testingState[1], testing = testingState[0];
			var testResult = _useState(''), setTestResult = testResult[1], testRes = testResult[0];
			var snapshotState = _useState(null), setSnapshot = snapshotState[1], snap = snapshotState[0];
			var dirtyState = _useState(false), setDirty = dirtyState[1], isDirty = dirtyState[0];
			var usageState = _useState(null), setUsage = usageState[1], usage = usageState[0];

			_useEffect(function() {
				var cancelled = false;
				fetch('/plugins/web-search-providers/api/config')
					.then(function(r) { return r.json(); })
					.then(function(data) { if (!cancelled) { setCfg(data); setSnapshot(JSON.parse(JSON.stringify(data))); } })
					.catch(function() { if (!cancelled) { setCfg({ activeProvider: 'none' }); setSnapshot({ activeProvider: 'none' }); } });
				fetch('/plugins/web-search-providers/api/usage')
					.then(function(r) { return r.json(); })
					.then(function(data) { if (!cancelled) setUsage(data); })
					.catch(function() {});
				return function() { cancelled = true; };
			}, []);

			if (!cfg) return j("div", { style: { color: "var(--dsw-alias-label-tertiary)", padding: "24px" }, children: "Loading..." });

			function update(path, value) {
				var next = JSON.parse(JSON.stringify(cfg));
				var parts = path.split('.');
				var cursor = next;
				for (var i = 0; i < parts.length - 1; i++) {
					if (!cursor[parts[i]]) cursor[parts[i]] = {};
					cursor = cursor[parts[i]];
				}
				cursor[parts[parts.length - 1]] = value;
				setCfg(next);
				setDirty(true);
			}

			function doSave() {
				if (!cfg || savingFlag) return;
				setSaving(true);
				setMsg('');
				fetch('/plugins/web-search-providers/api/config', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(cfg)
				}).then(function(r) {
					if (r.ok) {
						setMsg(t('saved'));
						setDirty(false);
						setSnapshot(JSON.parse(JSON.stringify(cfg)));
					} else { setMsg(t('saveFailed') + ' (HTTP ' + r.status + ')'); }
					setSaving(false);
				}).catch(function(e) { setMsg('✗ ' + e.message); setSaving(false); });
			}

			function doCancel() {
				if (snap) { setCfg(JSON.parse(JSON.stringify(snap))); }
				setDirty(false);
				setMsg('');
				setTestResult('');
			}

			function doTest() {
				if (!cfg || testing) return;
				var provider = cfg.activeProvider;
				if (provider === 'none') return;
				setTesting(true);
				setTestResult('');
				fetch('/plugins/web-search-providers/api/test', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ provider: provider })
				}).then(function(r) { return r.json(); })
				.then(function(d) {
					setTestResult(d.ok ? t('connectionOk') : t('connectionFail') + ' ' + (d.status || d.error || ''));
					setTesting(false);
				}).catch(function(e) { setTestResult('✗ ' + e.message); setTesting(false); });
			}

			var isEnabled = cfg.activeProvider !== 'none';

			// ── Build provider config section (expands based on selection) ──
			var providerConfig = null;
			if (cfg.activeProvider === 'tavily') {
				providerConfig = js(react.Fragment, { children: [
					j("div", { style: dividerStyle }),
					js("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }, children: [
						j("div", { style: labelStyle, children: t("tavily") + " " + t("configLabel") }),
						j("a", { href: "https://tavily.com", target: "_blank", style: { fontSize: "12px", color: "var(--dsw-alias-accent)" }, children: t("getTavilyKey") }),
					]}),
					field(t("apiKey"), j("input", {
						type: "password",
						value: (cfg.tavily && cfg.tavily.apiKey) || '',
						onChange: function(e) { update('tavily.apiKey', e.target.value); },
						placeholder: "tvly-xxx",
						style: inputStyle
					}), t("apiKeyHint")),
					js("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }, children: [
						field(t("maxResults"), j("input", {
							type: "number",
							value: (cfg.tavily && cfg.tavily.maxResults) || 5,
							onChange: function(e) { update('tavily.maxResults', parseInt(e.target.value) || 5); },
							style: inputStyle
						})),
						field(t("searchDepth"), j("select", {
							value: (cfg.tavily && cfg.tavily.searchDepth) || 'basic',
							onChange: function(e) { update('tavily.searchDepth', e.target.value); },
							style: selectStyle,
							children: [
								j("option", { value: "basic", children: "Basic" }),
								j("option", { value: "advanced", children: "Advanced" }),
							]
						})),
					]}),
					js("div", { style: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", marginTop: "8px" }, children: [
						testRes ? j("span", { style: { fontSize: "12px", color: testRes.startsWith("✓") ? "#34d399" : "#f87171" }, children: testRes }) : null,
						j("button", { onClick: doTest, disabled: testing, style: { ...btnOutline, opacity: testing ? 0.5 : 1 }, children: testing ? t("testing") : t("testConnection") }),
					]}),
				]});
			} else if (cfg.activeProvider === 'baidu') {
				providerConfig = js(react.Fragment, { children: [
					j("div", { style: dividerStyle }),
					js("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }, children: [
						j("div", { style: labelStyle, children: t("baidu") + " " + t("configLabel") }),
						j("a", { href: "https://console.bce.baidu.com/qianfan/ais/api/applicationService/api", target: "_blank", style: { fontSize: "12px", color: "var(--dsw-alias-accent)" }, children: t("getBaiduKey") }),
					]}),
					field(t("apiKey"), j("input", {
						type: "password",
						value: (cfg.baidu && cfg.baidu.apiKey) || '',
						onChange: function(e) { update('baidu.apiKey', e.target.value); },
						placeholder: "bce-v3/...",
						style: inputStyle
					}), t("baiduApiKeyHint")),
					field(t("maxResults"), j("input", {
						type: "number",
						value: (cfg.baidu && cfg.baidu.maxResults) || 5,
						onChange: function(e) { update('baidu.maxResults', parseInt(e.target.value) || 5); },
						style: inputStyle
					})),
					js("div", { style: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", marginTop: "8px" }, children: [
						testRes ? j("span", { style: { fontSize: "12px", color: testRes.startsWith("✓") ? "#34d399" : "#f87171" }, children: testRes }) : null,
						j("button", { onClick: doTest, disabled: testing, style: { ...btnOutline, opacity: testing ? 0.5 : 1 }, children: testing ? t("testing") : t("testConnection") }),
					]}),
				]});
			}

			return js("div", { style: { padding: "16px 0", display: "flex", flexDirection: "column", gap: "16px" }, children: [
				// ── Single merged card: Provider + Config ──
				js("div", { style: { ...cardStyle, padding: "20px 24px" }, children: [
					// Header: title + status pill
					js("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
						j("div", { style: headerStyle, children: t("providerLabel") }),
						j("span", {
							style: {
								...btnPill,
								background: isEnabled ? "rgba(52, 211, 153, 0.10)" : "transparent",
								borderColor: isEnabled ? "rgba(52, 211, 153, 0.30)" : "var(--dsw-alias-border-l2)",
								color: isEnabled ? "#34d399" : "var(--dsw-alias-label-tertiary)",
							},
							children: isEnabled ? "● " + t("statusEnabled") : "○ " + t("statusDisabled"),
						}),
					]}),

					// Provider dropdown + inline usage stats
					j("div", { style: { marginTop: "16px", display: "flex", gap: "12px", alignItems: "center" }, children: [
						j("select", {
							value: cfg.activeProvider || 'none',
							onChange: function(e) { update('activeProvider', e.target.value); },
							style: { ...selectStyle, maxWidth: "240px" },
							children: [
								j("option", { value: "none", children: t("noneOption") }),
								j("option", { value: "tavily", children: t("tavilyOption") }),
								j("option", { value: "baidu", children: t("baiduOption") }),
							]
						}),
						(isEnabled && usage && usage.providers && usage.providers[cfg.activeProvider]) ? j("span", {
							style: { fontSize: "12px", color: "var(--dsw-alias-label-tertiary)", whiteSpace: "nowrap" },
							children: t("usageThisMonth") + " " + usage.providers[cfg.activeProvider].used + " " + t("usageUnit")
						}) : null,
					]}),

					// Provider-specific config (expands inline)
					providerConfig,



					// None empty state
					cfg.activeProvider === 'none' ? j("div", {
						style: { ...dividerStyle, marginBottom: "0" }
					}) : null,
				]}),

				// ── Save bar ──
				js("div", { style: { display: "flex", justifyContent: "flex-end", gap: "8px", alignItems: "center" }, children: [
					isDirty ? j("span", { style: { fontSize: "12px", color: "#fbbf24", marginRight: "auto" }, children: t("unsavedChanges") }) :
						(msgText ? j("span", { style: { fontSize: "12px", color: msgText.startsWith("✓") ? "#34d399" : "#f87171", marginRight: "auto" }, children: msgText }) : null),
					j("button", {
						onClick: doCancel,
						style: { ...btnOutline, opacity: isDirty ? 1 : 0.5 },
						children: t("cancel")
					}),
					j("button", {
						onClick: doSave,
						disabled: savingFlag || !isDirty,
						style: { ...btnPrimary, opacity: (savingFlag || !isDirty) ? 0.5 : 1, cursor: (savingFlag || !isDirty) ? "default" : "pointer" },
						children: savingFlag ? t("saving") : t("save")
					}),
				]}),
			]});
		}

		const inject = ["slots", "locale"];

		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "web-search-providers: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.plugins.tab", () =>
				ctx.slots.register(
					{
						name: "settings.plugins.tab",
						id: "web-search-providers",
						order: 21,
						label: () => t("tab"),
						locale: NS,
						inject: () => ({}),
					},
					WebSearchSettingsTab
				)
			);
		}

		exports.NS = NS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	},
});
