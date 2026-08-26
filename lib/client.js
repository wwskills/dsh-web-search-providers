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
			providerLabel: "搜索 Provider",
			tavily: "Tavily",
			baidu: "百度搜索",
			none: "不使用",
			statusEnabled: "已启用",
			statusDisabled: "未启用",
			apiKey: "API Key",
			apiKeyHint: "Tavily API 密钥，以 tvly- 开头",
			baiduApiKey: "API Key",
			baiduSecretKey: "Secret Key",
			baiduEndpoint: "API Endpoint",
			maxResults: "最大返回结果",
			searchDepth: "搜索深度",
			testConnection: "测试连接",
			testing: "测试中...",
			save: "保存",
			cancel: "取消",
			saved: "✓ 已保存，即时生效",
			getTavilyKey: "获取 API Key",
		};

		const en = {
			tab: "Web Search",
			title: "Web Search",
			providerLabel: "Search Provider",
			tavily: "Tavily",
			baidu: "Baidu",
			none: "None",
			statusEnabled: "Enabled",
			statusDisabled: "Disabled",
			apiKey: "API Key",
			apiKeyHint: "Tavily API key, starts with tvly-",
			baiduApiKey: "API Key",
			baiduSecretKey: "Secret Key",
			baiduEndpoint: "API Endpoint",
			maxResults: "Max Results",
			searchDepth: "Search Depth",
			testConnection: "Test Connection",
			testing: "Testing...",
			save: "Save",
			cancel: "Cancel",
			saved: "✓ Saved",
			getTavilyKey: "Get API Key",
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

			_useEffect(function() {
				var cancelled = false;
				fetch('/plugins/web-search-providers/api/config')
					.then(function(r) { return r.json(); })
					.then(function(data) { if (!cancelled) { setCfg(data); setSnapshot(JSON.parse(JSON.stringify(data))); } })
					.catch(function() { if (!cancelled) { setCfg({ activeProvider: 'none' }); setSnapshot({ activeProvider: 'none' }); } });
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
				var providerChanged = snap && snap.activeProvider !== cfg.activeProvider;
				setSaving(true);
				setMsg('');
				fetch('/plugins/web-search-providers/api/config', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(cfg)
				}).then(function(r) {
					if (r.ok) {
						setMsg(providerChanged ? '✓ 已保存，切换 Provider 需重启 DSH 生效' : '✓ 已保存，即时生效');
						setDirty(false);
						setSnapshot(JSON.parse(JSON.stringify(cfg)));
					} else { setMsg('✗ 保存失败 (HTTP ' + r.status + ')'); }
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
				setTesting(true);
				setTestResult('');
				var provider = cfg.activeProvider;
				if (provider === 'tavily') {
					var url = (cfg.tavily && cfg.tavily.baseURL || 'https://api.tavily.com') + '/search';
					fetch(url, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ api_key: cfg.tavily.apiKey, query: 'test', max_results: 1 })
					}).then(function(r) {
						setTestResult(r.ok ? '✓ 连接成功' : '✗ HTTP ' + r.status);
						setTesting(false);
					}).catch(function(e) { setTestResult('✗ ' + e.message); setTesting(false); });
				} else if (provider === 'baidu') {
					var endpoint = cfg.baidu && cfg.baidu.endpoint || 'https://aip.baidubce.com';
					var authUrl = endpoint + '/oauth/2.0/token?grant_type=client_credentials&client_id=' + encodeURIComponent(cfg.baidu.apiKey) + '&client_secret=' + encodeURIComponent(cfg.baidu.secretKey);
						fetch(authUrl)
						.then(function(r) {
							setTestResult(r.ok ? '✓ 连接成功' : '✗ HTTP ' + r.status);
							setTesting(false);
						}).catch(function(e) { setTestResult('✗ ' + e.message); setTesting(false); });
				}
			}

			var isEnabled = cfg.activeProvider !== 'none';

			// ── Build provider config section (expands based on selection) ──
			var providerConfig = null;
			if (cfg.activeProvider === 'tavily') {
				providerConfig = js(react.Fragment, { children: [
					j("div", { style: dividerStyle }),
					js("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }, children: [
						j("div", { style: labelStyle, children: t("tavily") + " 配置" }),
						j("a", { href: "https://tavily.com", target: "_blank", style: { fontSize: "12px", color: "var(--dsw-alias-accent)" }, children: t("getTavilyKey") }),
					]}),
					field(t("apiKey"), j("input", {
						type: "password",
						value: (cfg.tavily && cfg.tavily.apiKey) || '',
						onChange: function(e) { update('tavily.apiKey', e.target.value); },
						placeholder: "tvly-xxx",
						style: inputStyle
					})),
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
					j("div", { style: labelStyle, children: t("baidu") + " 配置" }),
					field(t("baiduApiKey"), j("input", {
						type: "password",
						value: (cfg.baidu && cfg.baidu.apiKey) || '',
						onChange: function(e) { update('baidu.apiKey', e.target.value); },
						placeholder: "Baidu API Key",
						style: inputStyle
					})),
					field(t("baiduSecretKey"), j("input", {
						type: "password",
						value: (cfg.baidu && cfg.baidu.secretKey) || '',
						onChange: function(e) { update('baidu.secretKey', e.target.value); },
						placeholder: "Baidu Secret Key",
						style: inputStyle
					})),
					field(t("baiduEndpoint"), j("input", {
						value: (cfg.baidu && cfg.baidu.endpoint) || 'https://aip.baidubce.com',
						onChange: function(e) { update('baidu.endpoint', e.target.value); },
						style: { ...inputStyle, fontFamily: "monospace", fontSize: "13px" }
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

					// Provider dropdown
					j("div", { style: { marginTop: "16px" } }),
					field("激活 Provider", j("select", {
						value: cfg.activeProvider || 'none',
						onChange: function(e) { update('activeProvider', e.target.value); },
						style: selectStyle,
						children: [
							j("option", { value: "none", children: "不使用" }),
							j("option", { value: "tavily", children: "Tavily — 高质量 AI 搜索" }),
							j("option", { value: "baidu", children: "百度搜索 — 国内搜索" }),
						]
					})),

					// Provider-specific config (expands inline)
					providerConfig,

					// None empty state
					cfg.activeProvider === 'none' ? j("div", {
						style: { ...dividerStyle, marginBottom: "0" }
					}) : null,
				]}),

				// ── Save bar ──
				js("div", { style: { display: "flex", justifyContent: "flex-end", gap: "8px", alignItems: "center" }, children: [
					isDirty ? j("span", { style: { fontSize: "12px", color: "#fbbf24", marginRight: "auto" }, children: "● 有未保存的更改" }) :
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
						children: savingFlag ? "保存中..." : t("save")
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
