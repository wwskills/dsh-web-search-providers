window.__ModuleLoader__.load({ id: "@wwskills/dsh-web-search-providers", factory: (require) => {
var module = { exports: {} };

"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.tsx
var client_exports = {};
__export(client_exports, {
  default: () => client_default
});
module.exports = __toCommonJS(client_exports);
var React = __toESM(require("react"), 1);
var PACKAGE_ID = "@wwskills/dsh-web-search-providers";
var API = "/plugins/web-search-providers/api";
var NS = "webSearchProviders";
var en = {
  provider: "Provider",
  optionDefault: "Default \u2014 use built-in DSH search",
  optionTavily: "Tavily",
  optionBaidu: "Baidu",
  tavilyKey: "Tavily API Key",
  baiduKey: "Baidu API Key",
  tavilyHint: "Register for a free account to get an API key (1000 free calls/month):",
  tavilyLink: "app.tavily.com",
  baiduHint: "Create an application on Baidu Qianfan and copy its API key (1500 free calls/month, granted daily):",
  baiduLink: "Qianfan console",
  test: "Test connection",
  save: "Save",
  loading: "Loading\u2026",
  testing: "Testing\u2026",
  saved: "Saved and applied immediately",
  saveFailed: "Save failed",
  connected: "Connected",
  connectFailed: "Connection failed",
  unknownError: "unknown error",
  loadFailed: "Failed to load config",
  usage: "This month"
};
var zh = {
  provider: "Provider",
  optionDefault: "Default \u2014 \u4F7F\u7528 DSH \u5185\u7F6E\u641C\u7D22",
  optionTavily: "Tavily",
  optionBaidu: "Baidu",
  tavilyKey: "Tavily API Key",
  baiduKey: "Baidu API Key",
  tavilyHint: "\u5728 Tavily \u63A7\u5236\u53F0\u514D\u8D39\u6CE8\u518C\uFF0C\u83B7\u53D6 API Key\uFF08\u6BCF\u6708 1000 \u6B21\u514D\u8D39\u989D\u5EA6\uFF09\uFF1A",
  tavilyLink: "app.tavily.com",
  baiduHint: "\u5728\u767E\u5EA6\u5343\u5E06\u5E73\u53F0\u521B\u5EFA\u5E94\u7528\uFF0C\u4ECE\u300CAPI Key\u300D\u83B7\u53D6\uFF08\u6BCF\u6708\u514D\u8D39\u989D\u5EA6\u4E3A1500\u6B21\uFF0C\u6309\u5929\u53D1\u653E\uFF09\uFF1A",
  baiduLink: "\u5343\u5E06\u63A7\u5236\u53F0",
  test: "\u6D4B\u8BD5\u8FDE\u63A5",
  save: "\u4FDD\u5B58",
  loading: "\u8F7D\u5165\u4E2D\u2026",
  testing: "\u6D4B\u8BD5\u4E2D\u2026",
  saved: "\u5DF2\u4FDD\u5B58\u5E76\u5373\u65F6\u751F\u6548",
  saveFailed: "\u4FDD\u5B58\u5931\u8D25",
  connected: "\u8FDE\u63A5\u6210\u529F \u2705",
  connectFailed: "\u8FDE\u63A5\u5931\u8D25",
  unknownError: "\u672A\u77E5\u9519\u8BEF",
  loadFailed: "\u8BFB\u53D6\u914D\u7F6E\u5931\u8D25",
  usage: "\u672C\u6708\u7528\u91CF"
};
function translate(locale) {
  const dict = locale.startsWith("zh") ? zh : en;
  return (key, vars) => {
    let text = dict[key] ?? en[key] ?? key;
    if (vars) for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
  };
}
var TAG_ID = `${PACKAGE_ID}/panel.module.css`;
if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css=${JSON.stringify(TAG_ID)}]`) === null) {
  const style = document.createElement("style");
  style.dataset.plugin = PACKAGE_ID;
  style.dataset.pluginCss = TAG_ID;
  style.textContent = /* css */
  `
/* --- custom dropdown (matches DSH menu items) --- */
.wssp-select-wrap { position: relative; }
.wssp-select-btn {
  width: 100%; height: 34px;
  box-sizing: border-box;
  display: flex; align-items: center;
  padding: 0 32px 0 12px;
  font: inherit; font-size: 14px; line-height: 22px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-layer-1);
  border: 0.5px solid var(--dsw-alias-border-l4);
  border-radius: var(--dsw-radius-md);
  cursor: pointer;
  outline: none;
  transition: border-color 120ms;
  text-align: left;
}
.wssp-select-btn:focus-visible,
.wssp-select-wrap.open .wssp-select-btn {
  border-color: var(--dsw-alias-state-business-primary);
}
.wssp-select-arrow {
  position: absolute; right: 8px; top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--dsw-alias-label-caption);
  font-size: 10px; line-height: 1;
  transition: transform 120ms;
}
.wssp-select-wrap.open .wssp-select-arrow {
  transform: translateY(-50%) rotate(180deg);
}
.wssp-select-menu {
  position: absolute; z-index: 1100;
  top: calc(100% + 4px); left: 0; right: 0;
  background: var(--dsw-alias-bg-overlay);
  border: 0.5px solid var(--dsw-alias-border-l3);
  border-radius: var(--dsw-radius-md);
  box-shadow: var(--dsw-elevation-prominent);
  padding: 4px;
  display: flex; flex-direction: column;
}
.wssp-select-option {
  display: flex; align-items: center;
  min-height: 34px; padding: 6px 8px;
  border: none; border-radius: var(--dsw-radius-sm);
  font: inherit; font-size: 14px; color: var(--dsw-alias-label-primary);
  background: transparent; cursor: pointer;
  outline: none; text-align: left; width: 100%;
}
.wssp-select-option:hover,
.wssp-select-option:focus-visible {
  background: var(--dsw-alias-interactive-bg-hover);
}

/* --- text input --- */
.wssp-input {
  width: 100%; height: 34px;
  box-sizing: border-box; padding: 0 12px;
  font: inherit; font-size: 14px; line-height: 22px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-layer-1);
  border: 0.5px solid var(--dsw-alias-border-l4);
  border-radius: var(--dsw-radius-md);
  outline: none; transition: border-color 120ms;
}
.wssp-input:focus-visible {
  border-color: var(--dsw-alias-state-business-primary);
}

/* --- buttons (matches DSH SettingsForm _save_ft7vz_32) --- */
.wssp-btn-row {
  display: flex; align-items: center;
  gap: 8px; padding-top: 16px;
}
.wssp-btn {
  appearance: none;
  box-sizing: border-box; display: inline-flex;
  align-items: center; justify-content: center;
  padding: 5px 14px;
  font: inherit; font-size: 13px; line-height: 1.5;
  border-radius: var(--dsw-radius-md);
  cursor: pointer;
  outline: none; transition: opacity 120ms;
}
.wssp-btn:disabled { opacity: 0.4; cursor: default; }
/* primary save button \u2014 filled */
.wssp-btn-save {
  border: 1px solid transparent;
  background: var(--dsw-alias-label-primary);
  color: var(--dsw-alias-bg-layer-3);
}
/* secondary test button \u2014 outline */
.wssp-btn-test {
  border: 0.5px solid var(--dsw-alias-border-l4);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
}
.wssp-btn-test:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
}

/* --- field layout --- */
.wssp-field { display: block; margin-bottom: 14px; }
.wssp-field-label {
  display: block; font-size: 12px; line-height: 18px;
  margin-bottom: 4px; color: var(--dsw-alias-label-secondary);
}
/* hint under a field \u2014 matches the built-in Web Search page's hint style */
.wssp-hint {
  margin: 6px 0 0; font-size: 12px; line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.wssp-link {
  color: var(--dsw-alias-link); text-decoration: none;
}
.wssp-link:hover { text-decoration: underline; }
.wssp-status {
  font-size: 12px; line-height: 18px; margin-top: 4px;
  color: var(--dsw-alias-label-secondary);
}
.wssp-status-ok  { color: var(--dsw-alias-state-success-primary); }
.wssp-status-err { color: var(--dsw-alias-state-error-primary); }
.wssp-usage { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
`;
  document.head.appendChild(style);
}
var h = React.createElement;
function options(t) {
  return [
    { value: "none", label: t("optionDefault") },
    { value: "tavily", label: t("optionTavily") },
    { value: "baidu", label: t("optionBaidu") }
  ];
}
function Select(props) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const btnRef = React.useRef(null);
  const list = options(props.t);
  const current = list.find((o) => o.value === props.value) ?? list[0];
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return h(
    "div",
    {
      ref: wrapRef,
      className: `wssp-select-wrap${open ? " open" : ""}`
    },
    h("button", {
      ref: btnRef,
      type: "button",
      className: "wssp-select-btn",
      disabled: props.disabled,
      "aria-haspopup": "listbox",
      "aria-expanded": open,
      onClick: () => {
        if (!props.disabled) setOpen(!open);
      }
    }, current.label),
    h("span", { className: "wssp-select-arrow", "aria-hidden": true }, "\u25BE"),
    open ? h(
      "div",
      { className: "wssp-select-menu", role: "listbox" },
      list.map(
        (o) => h("button", {
          key: o.value,
          type: "button",
          className: "wssp-select-option",
          role: "option",
          "aria-selected": o.value === props.value,
          onClick: () => {
            props.onChange(o.value);
            setOpen(false);
          }
        }, o.label)
      )
    ) : null
  );
}
function Panel(props) {
  const { t } = props;
  const [config, setConfig] = React.useState(null);
  const [usage, setUsage] = React.useState(null);
  const [status, setStatus] = React.useState("");
  const [statusOk, setStatusOk] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`${API}/config`, { headers: { accept: "application/json" } });
      if (res.ok) setConfig(await res.json());
      else setStatus(`${t("loadFailed")}: HTTP ${res.status}`);
      const ures = await fetch(`${API}/usage`, { headers: { accept: "application/json" } });
      if (ures.ok) {
        const body = await ures.json();
        setUsage(body.providers ?? null);
      }
    } catch (error) {
      setStatus(`${t("loadFailed")}: ${String(error)}`);
    }
  }, [t]);
  React.useEffect(() => {
    void load();
  }, [load]);
  const save = async () => {
    if (!config) return;
    setBusy(true);
    setStatus("");
    setStatusOk(null);
    try {
      const res = await fetch(`${API}/config`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(config)
      });
      const body = await res.json().catch(() => ({}));
      const ok = res.ok && body.ok !== false;
      setStatusOk(ok);
      setStatus(ok ? t("saved") : `${t("saveFailed")}: ${body.error ?? res.status}`);
      await load();
    } catch (error) {
      setStatusOk(false);
      setStatus(`${t("saveFailed")}: ${String(error)}`);
    } finally {
      setBusy(false);
    }
  };
  const test = async () => {
    if (!config || config.activeProvider === "none") return;
    setBusy(true);
    setStatus(t("testing"));
    setStatusOk(null);
    try {
      const res = await fetch(`${API}/test`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: config.activeProvider,
          tavilyApiKey: config.tavilyApiKey,
          baiduApiKey: config.baiduApiKey
        })
      });
      const body = await res.json();
      const ok = body.ok === true;
      setStatusOk(ok);
      setStatus(ok ? t("connected") : `${t("connectFailed")}: ${body.error ?? t("unknownError")}`);
    } catch (error) {
      setStatusOk(false);
      setStatus(`${t("connectFailed")}: ${String(error)}`);
    } finally {
      setBusy(false);
    }
  };
  if (!config) return h("div", null, status || t("loading"));
  const set = (key, value) => setConfig({ ...config, [key]: value });
  const statusCls = `wssp-status${statusOk === true ? " wssp-status-ok" : statusOk === false ? " wssp-status-err" : ""}`;
  return h(
    "div",
    null,
    // --- provider select ---
    h(
      "label",
      { className: "wssp-field" },
      h("span", { className: "wssp-field-label" }, t("provider")),
      h(Select, {
        value: config.activeProvider,
        onChange: (v) => set("activeProvider", v),
        disabled: busy,
        t
      })
    ),
    // --- tavily fields ---
    config.activeProvider === "tavily" ? h(
      "div",
      { className: "wssp-field" },
      h(
        "label",
        null,
        h("span", { className: "wssp-field-label" }, t("tavilyKey")),
        h("input", {
          className: "wssp-input",
          type: "password",
          value: config.tavilyApiKey,
          placeholder: "tvly-\u2026",
          spellCheck: false,
          autoComplete: "off",
          onChange: (e) => set("tavilyApiKey", e.target.value)
        })
      ),
      h(
        "p",
        { className: "wssp-hint" },
        t("tavilyHint"),
        h("a", {
          className: "wssp-link",
          href: "https://app.tavily.com/home",
          target: "_blank",
          rel: "noopener noreferrer"
        }, t("tavilyLink"))
      )
    ) : null,
    // --- baidu fields ---
    config.activeProvider === "baidu" ? h(
      "div",
      { className: "wssp-field" },
      h(
        "label",
        null,
        h("span", { className: "wssp-field-label" }, t("baiduKey")),
        h("input", {
          className: "wssp-input",
          type: "password",
          value: config.baiduApiKey,
          placeholder: "Bearer token",
          spellCheck: false,
          autoComplete: "off",
          onChange: (e) => set("baiduApiKey", e.target.value)
        })
      ),
      h(
        "p",
        { className: "wssp-hint" },
        t("baiduHint"),
        h("a", {
          className: "wssp-link",
          href: "https://console.bce.baidu.com/qianfan/ais/console/apikeylist",
          target: "_blank",
          rel: "noopener noreferrer"
        }, t("baiduLink"))
      )
    ) : null,
    // --- buttons (matches DSH SettingsForm footer) ---
    h(
      "div",
      { className: "wssp-btn-row" },
      h("button", { className: "wssp-btn wssp-btn-test", onClick: test, disabled: busy || config.activeProvider === "none" }, t("test")),
      h("button", { className: "wssp-btn wssp-btn-save", onClick: save, disabled: busy }, t("save"))
    ),
    // --- status ---
    status ? h("div", { className: statusCls }, status) : null,
    // --- usage ---
    usage ? h(
      "div",
      { className: "wssp-usage" },
      `${t("usage")}\uFF1A` + Object.entries(usage).map(([k, v]) => `${k}=${v?.used ?? 0}`).join(", ")
    ) : null
  );
}
var client_default = {
  inject: ["slots", "locale"],
  apply(ctx) {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), "web-search-providers: dictionaries");
    let locale = ctx.locale.getLocale?.()?.id ?? "en";
    const unsubscribe = ctx.locale.subscribe(() => {
      locale = ctx.locale.getLocale?.()?.id ?? locale;
    });
    function PanelEntry() {
      const [, force] = React.useReducer((n) => n + 1, 0);
      React.useEffect(() => ctx.locale.subscribe(force), []);
      return h(Panel, { t: ctx.locale.bind(NS) ?? translate(locale), locale });
    }
    ctx.slots.inject(
      "plugins.bundle.config",
      () => ctx.slots.register(
        { name: "plugins.bundle.config", key: PACKAGE_ID },
        PanelEntry
      )
    );
    ctx.effect(() => unsubscribe, "web-search-providers: locale subscription");
  }
};
return module.exports; } });
//# sourceMappingURL=client.js.map
