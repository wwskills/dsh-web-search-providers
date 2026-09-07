window.__ModuleLoader__.load({ id: "@wwskills/dsh-web-search-providers", factory: (require) => {
var module = { exports: {} };

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.tsx
var client_exports = {};
__export(client_exports, {
  NS: () => NS,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var NS = "web-search-providers";
var API_ROOT = "/plugins/web-search-providers/api";
function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
function loadConfig() {
  return fetch(`${API_ROOT}/config`).then((response) => response.json()).catch(() => ({ activeProvider: "none", tavily: {}, baidu: {} }));
}
function loadUsage() {
  return fetch(`${API_ROOT}/usage`).then((response) => response.json()).catch(() => null);
}
function saveConfig(cfg) {
  return fetch(`${API_ROOT}/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg)
  });
}
function testProvider(provider) {
  return fetch(`${API_ROOT}/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider })
  }).then((response) => response.json());
}
var cardStyle = {
  background: "var(--dsw-alias-bg-layer-2)",
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: "12px"
};
var labelStyle = {
  fontSize: "14px",
  fontWeight: 500,
  color: "var(--dsw-alias-label-primary)",
  marginBottom: "4px"
};
var descStyle = {
  fontSize: "12px",
  color: "var(--dsw-alias-label-tertiary)",
  marginTop: "4px"
};
var inputStyle = {
  height: "40px",
  padding: "0 12px",
  background: "var(--dsw-alias-bg-input)",
  color: "var(--dsw-alias-label-primary)",
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box"
};
var selectStyle = { ...inputStyle, background: "inherit" };
var btnPrimary = {
  height: "36px",
  padding: "0 20px",
  background: "var(--dsw-alias-button-primary-fill)",
  color: "var(--dsw-alias-label-primary-foreground)",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  cursor: "pointer",
  fontWeight: 500
};
var btnOutline = {
  height: "36px",
  padding: "0 16px",
  background: "transparent",
  color: "var(--dsw-alias-label-secondary)",
  border: "1px solid var(--dsw-alias-border-l2)",
  borderRadius: "8px",
  fontSize: "14px",
  cursor: "pointer"
};
var zh = {
  tab: "\u7F51\u7EDC\u641C\u7D22",
  title: "\u7F51\u7EDC\u641C\u7D22",
  providerLabel: "Provider",
  tavily: "Tavily",
  baidu: "Baidu",
  none: "\u4E0D\u4F7F\u7528",
  statusEnabled: "\u5DF2\u542F\u7528",
  statusDisabled: "\u672A\u542F\u7528",
  apiKey: "API Key",
  apiKeyHint: "Tavily API \u5BC6\u94A5\uFF0C\u4EE5 tvly- \u5F00\u5934",
  baiduApiKeyHint: "\u5343\u5E06\u5E73\u53F0 API Key",
  getBaiduKey: "\u83B7\u53D6 API Key",
  maxResults: "\u6700\u5927\u8FD4\u56DE\u7ED3\u679C",
  searchDepth: "\u641C\u7D22\u6DF1\u5EA6",
  testConnection: "\u6D4B\u8BD5\u8FDE\u63A5",
  save: "\u4FDD\u5B58",
  cancel: "\u53D6\u6D88",
  saved: "\u2713 \u5DF2\u4FDD\u5B58\uFF0C\u5373\u65F6\u751F\u6548",
  getTavilyKey: "\u83B7\u53D6 API Key",
  configLabel: "\u914D\u7F6E",
  unsavedChanges: "\u25CF \u6709\u672A\u4FDD\u5B58\u7684\u66F4\u6539",
  saveFailed: "\u2717 \u4FDD\u5B58\u5931\u8D25",
  testing: "\u6D4B\u8BD5\u4E2D...",
  saving: "\u4FDD\u5B58\u4E2D...",
  connectionOk: "\u2713 \u8FDE\u63A5\u6210\u529F",
  connectionFail: "\u2717 HTTP",
  usageThisMonth: "\u672C\u6708\u7528\u91CF",
  usageUnit: "\u6B21"
};
var en = {
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
  save: "Save",
  cancel: "Cancel",
  saved: "\u2713 Saved",
  getTavilyKey: "Get API Key",
  configLabel: "Config",
  unsavedChanges: "\u25CF Unsaved changes",
  saveFailed: "\u2717 Save failed",
  testing: "Testing...",
  saving: "Saving...",
  connectionOk: "\u2713 Connected",
  connectionFail: "\u2717 HTTP",
  usageThisMonth: "This month",
  usageUnit: "calls"
};
function SettingsTab(props) {
  const t = props.t;
  const [cfg, setCfg] = (0, import_react.useState)(null);
  const [snapshot, setSnapshot] = (0, import_react.useState)(null);
  const [usage, setUsage] = (0, import_react.useState)(null);
  const [dirty, setDirty] = (0, import_react.useState)(false);
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [msg, setMsg] = (0, import_react.useState)("");
  const [testing, setTesting] = (0, import_react.useState)(false);
  const [testRes, setTestRes] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    let cancelled = false;
    void loadConfig().then((data) => {
      if (cancelled) return;
      setCfg(data);
      setSnapshot(deepClone(data));
    });
    void loadUsage().then((data) => {
      if (cancelled) return;
      setUsage(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (cfg === null) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { color: "var(--dsw-alias-label-tertiary)", padding: "24px" }, children: "Loading..." });
  }
  const update = (path, value) => {
    const next = deepClone(cfg);
    const parts = path.split(".");
    let cursor = next;
    for (let i = 0; i < parts.length - 1; i += 1) {
      if (typeof cursor[parts[i]] !== "object" || cursor[parts[i]] === null) cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    setCfg(next);
    setDirty(true);
  };
  const doSave = () => {
    if (cfg === null || saving) return;
    setSaving(true);
    setMsg("");
    void saveConfig(cfg).then((res) => {
      if (res.ok) {
        setMsg(t("saved"));
        setDirty(false);
        setSnapshot(deepClone(cfg));
      } else {
        setMsg(`${t("saveFailed")} (HTTP ${res.status})`);
      }
      setSaving(false);
    }).catch((err) => {
      setMsg(`\u2717 ${err instanceof Error ? err.message : String(err)}`);
      setSaving(false);
    });
  };
  const doCancel = () => {
    if (snapshot) setCfg(deepClone(snapshot));
    setDirty(false);
    setMsg("");
    setTestRes("");
  };
  const doTest = () => {
    if (cfg === null || testing || cfg.activeProvider === "none") return;
    setTesting(true);
    setTestRes("");
    void testProvider(cfg.activeProvider).then((d) => {
      setTestRes(d.ok ? t("connectionOk") : `${t("connectionFail")} ${d.status ?? d.error ?? ""}`);
      setTesting(false);
    }).catch((err) => {
      setTestRes(`\u2717 ${err instanceof Error ? err.message : String(err)}`);
      setTesting(false);
    });
  };
  const isEnabled = cfg.activeProvider !== "none";
  const providerUsage = isEnabled && usage?.providers?.[cfg.activeProvider];
  const statusPill = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: {
    fontSize: "12px",
    border: `1px solid ${isEnabled ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-border-l2)"}`,
    background: isEnabled ? "var(--dsw-alias-state-success-primary)" : "transparent",
    color: isEnabled ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-label-tertiary)",
    borderRadius: "12px",
    padding: "1px 10px",
    whiteSpace: "nowrap",
    opacity: isEnabled ? 1 : 0.5
  }, children: isEnabled ? `\u25CF ${t("statusEnabled")}` : `\u25CB ${t("statusDisabled")}` });
  let providerConfig = null;
  if (cfg.activeProvider === "tavily") {
    providerConfig = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: "1px", background: "var(--dsw-alias-border-l2)", margin: "16px 0" } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: labelStyle, children: [
          t("tavily"),
          " ",
          t("configLabel")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: "https://tavily.com", target: "_blank", rel: "noreferrer", style: { fontSize: "12px", color: "var(--dsw-alias-accent)" }, children: t("getTavilyKey") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: labelStyle, children: t("apiKey") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "password", value: cfg.tavily.apiKey || "", onChange: (e) => update("tavily.apiKey", e.target.value), placeholder: "tvly-xxx", style: inputStyle }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: descStyle, children: t("apiKeyHint") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: labelStyle, children: t("maxResults") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "number", value: cfg.tavily.maxResults || 5, onChange: (e) => update("tavily.maxResults", parseInt(e.target.value, 10) || 5), style: inputStyle })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: labelStyle, children: t("searchDepth") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { value: cfg.tavily.searchDepth || "basic", onChange: (e) => update("tavily.searchDepth", e.target.value), style: selectStyle, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "basic", children: "Basic" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "advanced", children: "Advanced" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestRow, { t, testing, testRes, onTest: doTest })
    ] });
  } else if (cfg.activeProvider === "baidu") {
    providerConfig = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: "1px", background: "var(--dsw-alias-border-l2)", margin: "16px 0" } }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: labelStyle, children: [
          t("baidu"),
          " ",
          t("configLabel")
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: "https://console.bce.baidu.com/qianfan/ais/api/applicationService/api", target: "_blank", rel: "noreferrer", style: { fontSize: "12px", color: "var(--dsw-alias-accent)" }, children: t("getBaiduKey") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: labelStyle, children: t("apiKey") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "password", value: cfg.baidu.apiKey || "", onChange: (e) => update("baidu.apiKey", e.target.value), placeholder: "bce-v3/...", style: inputStyle }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: descStyle, children: t("baiduApiKeyHint") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: "16px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: labelStyle, children: t("maxResults") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "number", value: cfg.baidu.maxResults || 5, onChange: (e) => update("baidu.maxResults", parseInt(e.target.value, 10) || 5), style: inputStyle })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestRow, { t, testing, testRes, onTest: doTest })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "16px 0", display: "flex", flexDirection: "column", gap: "16px" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...cardStyle, padding: "20px 24px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: "16px", fontWeight: 600, color: "var(--dsw-alias-label-primary)", margin: 0 }, children: t("providerLabel") }),
        statusPill
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginTop: "16px", display: "flex", gap: "12px", alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", { value: cfg.activeProvider, onChange: (e) => update("activeProvider", e.target.value), style: { ...selectStyle, maxWidth: "240px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "none", children: t("none") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "tavily", children: t("tavily") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "baidu", children: t("baidu") })
        ] }),
        providerUsage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { fontSize: "12px", color: "var(--dsw-alias-label-tertiary)", whiteSpace: "nowrap" }, children: [
          t("usageThisMonth"),
          " ",
          providerUsage.used,
          " ",
          t("usageUnit")
        ] })
      ] }),
      providerConfig
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "flex-end", gap: "8px", alignItems: "center" }, children: [
      dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "12px", color: "var(--dsw-alias-accent)", marginRight: "auto" }, children: t("unsavedChanges") }) : msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "12px", color: msg.startsWith("\u2713") ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-label-error)", marginRight: "auto" }, children: msg }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: doCancel, style: { ...btnOutline, opacity: dirty ? 1 : 0.5 }, children: t("cancel") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: doSave, disabled: saving || !dirty, style: { ...btnPrimary, opacity: saving || !dirty ? 0.5 : 1, cursor: saving || !dirty ? "default" : "pointer" }, children: saving ? t("saving") : t("save") })
    ] })
  ] });
}
function TestRow(props) {
  const { t, testing, testRes, onTest } = props;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", marginTop: "8px" }, children: [
    testRes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "12px", color: testRes.startsWith("\u2713") ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-label-error)" }, children: testRes }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: onTest, disabled: testing, style: { ...btnOutline, opacity: testing ? 0.5 : 1 }, children: testing ? t("testing") : t("testConnection") })
  ] });
}
var inject = ["slots", "locale"];
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "web-search-providers: dictionaries");
  const t = ctx.locale.bind(NS);
  ctx.slots.inject(
    "settings.plugins.tab",
    () => ctx.slots.register(
      { name: "settings.plugins.tab", id: NS, order: 21, label: () => t("tab"), locale: NS, inject: () => ({}) },
      SettingsTab
    )
  );
}
return module.exports; } });
//# sourceMappingURL=client.js.map
