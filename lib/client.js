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
var h = React.createElement;
function field(label, node) {
  return h(
    "label",
    { style: { display: "block", marginBottom: 12 } },
    h("span", { style: { display: "block", fontSize: 12, opacity: 0.75, marginBottom: 4 } }, label),
    node
  );
}
var inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 8px",
  background: "transparent",
  color: "inherit",
  border: "1px solid currentColor",
  borderRadius: 4,
  opacity: 0.9
};
var buttonStyle = {
  padding: "6px 12px",
  borderRadius: 4,
  cursor: "pointer",
  border: "1px solid currentColor",
  background: "transparent",
  color: "inherit"
};
function Panel() {
  const [config, setConfig] = React.useState(null);
  const [usage, setUsage] = React.useState(null);
  const [status, setStatus] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`${API}/config`, { headers: { accept: "application/json" } });
      if (res.ok) setConfig(await res.json());
      else setStatus(`\u8BFB\u53D6\u914D\u7F6E\u5931\u8D25\uFF1AHTTP ${res.status}`);
      const ures = await fetch(`${API}/usage`, { headers: { accept: "application/json" } });
      if (ures.ok) {
        const body = await ures.json();
        setUsage(body.providers ?? null);
      }
    } catch (error) {
      setStatus(`\u8BFB\u53D6\u914D\u7F6E\u5931\u8D25\uFF1A${String(error)}`);
    }
  }, []);
  React.useEffect(() => {
    void load();
  }, [load]);
  const save = async () => {
    if (!config) return;
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch(`${API}/config`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(config)
      });
      const body = await res.json().catch(() => ({}));
      setStatus(res.ok && body.ok !== false ? "\u5DF2\u4FDD\u5B58\u5E76\u5373\u65F6\u751F\u6548" : `\u4FDD\u5B58\u5931\u8D25\uFF1A${body.error ?? res.status}`);
      await load();
    } catch (error) {
      setStatus(`\u4FDD\u5B58\u5931\u8D25\uFF1A${String(error)}`);
    } finally {
      setBusy(false);
    }
  };
  const test = async () => {
    if (!config || config.activeProvider === "none") return;
    setBusy(true);
    setStatus("\u6D4B\u8BD5\u4E2D\u2026");
    try {
      const res = await fetch(`${API}/test`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: config.activeProvider })
      });
      const body = await res.json();
      setStatus(body.ok ? "\u8FDE\u63A5\u6210\u529F \u2705" : `\u8FDE\u63A5\u5931\u8D25\uFF1A${body.error ?? "\u672A\u77E5\u9519\u8BEF"}`);
    } catch (error) {
      setStatus(`\u8FDE\u63A5\u5931\u8D25\uFF1A${String(error)}`);
    } finally {
      setBusy(false);
    }
  };
  if (!config) return h("div", { style: { padding: 12, fontSize: 13 } }, status || "\u8F7D\u5165\u4E2D\u2026");
  const set = (key, value) => setConfig({ ...config, [key]: value });
  return h(
    "div",
    { style: { display: "grid", gap: 12, fontSize: 13 } },
    field(
      "\u542F\u7528\u54EA\u4E2A\u641C\u7D22 provider",
      h(
        "select",
        {
          value: config.activeProvider,
          onChange: (e) => set("activeProvider", e.target.value),
          style: inputStyle
        },
        h("option", { value: "none" }, "none \u2014 \u7528 DSH \u5185\u7F6E\u641C\u7D22"),
        h("option", { value: "tavily" }, "Tavily"),
        h("option", { value: "baidu" }, "\u767E\u5EA6\u5343\u5E06 AI \u641C\u7D22")
      )
    ),
    config.activeProvider === "tavily" ? h(
      React.Fragment,
      null,
      field(
        "Tavily API Key",
        h("input", {
          type: "password",
          value: config.tavilyApiKey,
          style: inputStyle,
          placeholder: "tvly-\u2026\uFF08\u514D\u8D39\u989D\u5EA6 1000 \u6B21/\u6708\uFF09",
          onChange: (e) => set("tavilyApiKey", e.target.value)
        })
      )
    ) : null,
    config.activeProvider === "baidu" ? field(
      "\u767E\u5EA6\u5343\u5E06 API Key",
      h("input", {
        type: "password",
        value: config.baiduApiKey,
        style: inputStyle,
        placeholder: "Bearer token",
        onChange: (e) => set("baiduApiKey", e.target.value)
      })
    ) : null,
    h(
      "div",
      { style: { display: "flex", gap: 8 } },
      h("button", { onClick: save, disabled: busy, style: buttonStyle }, "\u4FDD\u5B58"),
      h("button", {
        onClick: test,
        disabled: busy || config.activeProvider === "none",
        style: buttonStyle
      }, "\u6D4B\u8BD5\u8FDE\u63A5"),
      h("button", { onClick: load, disabled: busy, style: buttonStyle }, "\u5237\u65B0")
    ),
    status ? h("div", { style: { fontSize: 12, opacity: 0.8 } }, status) : null,
    usage ? h(
      "div",
      { style: { fontSize: 12, opacity: 0.7 } },
      "\u672C\u6708\u7528\u91CF\uFF1A" + Object.entries(usage).map(([k, v]) => `${k}=${v?.used ?? 0}`).join("\uFF0C")
    ) : null
  );
}
var client_default = {
  inject: ["slots"],
  apply(ctx) {
    ctx.slots.inject(
      "plugins.bundle.config",
      () => ctx.slots.register(
        { name: "plugins.bundle.config", key: PACKAGE_ID, id: "web-search-providers", order: 10 },
        Panel
      )
    );
  }
};
return module.exports; } });
//# sourceMappingURL=client.js.map
