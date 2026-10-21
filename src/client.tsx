/**
 * Settings panel for @wwskills/dsh-web-search-providers.
 *
 * Registered into `plugins.bundle.config`, keyed by the package name.
 * Uses a custom dropdown to match DSH's list-item hover (native <select>
 * option highlight cannot be styled on Windows). All controls follow the
 * exact DSH theme tokens.
 * @module @wwskills/dsh-web-search-providers/client
 */

import * as React from 'react'

const PACKAGE_ID = '@wwskills/dsh-web-search-providers'
const API = '/plugins/web-search-providers/api'
const NS = 'webSearchProviders'

/** Dictionary namespace owned by this plugin. */
const en = {
  provider: 'Provider',
  optionDefault: 'Default — use built-in DSH search',
  optionTavily: 'Tavily',
  optionBaidu: 'Baidu',
  tavilyKey: 'Tavily API Key',
  baiduKey: 'Baidu API Key',
  tavilyHint: 'Register for a free account to get an API key (1000 free calls/month):',
  tavilyLink: 'app.tavily.com',
  baiduHint: 'Create an application on Baidu Qianfan and copy its API key (1500 free calls/month, granted daily):',
  baiduLink: 'Qianfan console',
  test: 'Test connection',
  save: 'Save',
  loading: 'Loading…',
  testing: 'Testing…',
  saved: 'Saved and applied immediately',
  saveFailed: 'Save failed',
  connected: 'Connected',
  connectFailed: 'Connection failed',
  unknownError: 'unknown error',
  loadFailed: 'Failed to load config',
  usage: 'This month',
} as const

/** Simplified Chinese copy. */
const zh = {
  provider: 'Provider',
  optionDefault: 'Default — 使用 DSH 内置搜索',
  optionTavily: 'Tavily',
  optionBaidu: 'Baidu',
  tavilyKey: 'Tavily API Key',
  baiduKey: 'Baidu API Key',
  tavilyHint: '在 Tavily 控制台免费注册，获取 API Key（每月 1000 次免费额度）：',
  tavilyLink: 'app.tavily.com',
  baiduHint: '在百度千帆平台创建应用，从「API Key」获取（每月免费额度为1500次，按天发放）：',
  baiduLink: '千帆控制台',
  test: '测试连接',
  save: '保存',
  loading: '载入中…',
  testing: '测试中…',
  saved: '已保存并即时生效',
  saveFailed: '保存失败',
  connected: '连接成功 ✅',
  connectFailed: '连接失败',
  unknownError: '未知错误',
  loadFailed: '读取配置失败',
  usage: '本月用量',
} as const

type TKey = keyof typeof zh
type Translate = (key: TKey, vars?: Record<string, string | number>) => string

/**
 * Resolve one message for a locale. `ctx.locale.bind(NS)` already handles the
 * user's language; this is the offline fallback so the panel still renders when
 * the locale service has not registered the dictionary yet.
 */
function translate(locale: string): Translate {
  const dict = locale.startsWith('zh') ? zh : en
  return (key, vars) => {
    let text: string = dict[key] ?? en[key] ?? key
    if (vars) for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
    return text
  }
}

interface Config {
  activeProvider: string
  tavilyApiKey: string
  tavilyBaseURL: string
  tavilyMaxResults: number
  tavilySearchDepth: string
  baiduApiKey: string
  baiduMaxResults: number
  timeoutMs: number
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------
const TAG_ID = `${PACKAGE_ID}/panel.module.css`
if (
  typeof document !== 'undefined' &&
  document.querySelector(`style[data-plugin-css=${JSON.stringify(TAG_ID)}]`) === null
) {
  const style = document.createElement('style')
  style.dataset.plugin = PACKAGE_ID
  style.dataset.pluginCss = TAG_ID
  style.textContent = /* css */ `
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
/* primary save button — filled */
.wssp-btn-save {
  border: 1px solid transparent;
  background: var(--dsw-alias-label-primary);
  color: var(--dsw-alias-bg-layer-3);
}
/* secondary test button — outline */
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
/* hint under a field — matches the built-in Web Search page's hint style */
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
`
  document.head.appendChild(style)
}

const h = React.createElement

// ---------------------------------------------------------------------------
// Custom dropdown (replaces native <select> so hover matches DSH items)
// ---------------------------------------------------------------------------
/** Provider options; labels come from the locale dictionary. */
function options(t: Translate) {
  return [
    { value: 'none', label: t('optionDefault') },
    { value: 'tavily', label: t('optionTavily') },
    { value: 'baidu', label: t('optionBaidu') },
  ]
}

function Select(props: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  t: Translate
}) {
  const [open, setOpen] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const btnRef = React.useRef<HTMLButtonElement>(null)
  const list = options(props.t)
  const current = list.find((o) => o.value === props.value) ?? list[0]

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return h('div', {
    ref: wrapRef,
    className: `wssp-select-wrap${open ? ' open' : ''}`,
  },
    h('button', {
      ref: btnRef,
      type: 'button',
      className: 'wssp-select-btn',
      disabled: props.disabled,
      'aria-haspopup': 'listbox',
      'aria-expanded': open,
      onClick: () => { if (!props.disabled) setOpen(!open) },
    }, current.label),
    h('span', { className: 'wssp-select-arrow', 'aria-hidden': true }, '▾'),
    open
      ? h('div', { className: 'wssp-select-menu', role: 'listbox' },
          list.map((o) =>
            h('button', {
              key: o.value,
              type: 'button',
              className: 'wssp-select-option',
              role: 'option',
              'aria-selected': o.value === props.value,
              onClick: () => { props.onChange(o.value); setOpen(false) },
            }, o.label),
          ),
        )
      : null,
  )
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------
function Panel(props: { t: Translate; locale: string }) {
  const { t } = props
  const [config, setConfig] = React.useState<Config | null>(null)
  const [usage, setUsage] = React.useState<Record<string, { used?: number }> | null>(null)
  const [status, setStatus] = React.useState('')
  const [statusOk, setStatusOk] = React.useState<boolean | null>(null)
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`${API}/config`, { headers: { accept: 'application/json' } })
      if (res.ok) setConfig((await res.json()) as Config)
      else setStatus(`${t('loadFailed')}: HTTP ${res.status}`)
      const ures = await fetch(`${API}/usage`, { headers: { accept: 'application/json' } })
      if (ures.ok) {
        const body = (await ures.json()) as { providers?: Record<string, { used?: number }> }
        setUsage(body.providers ?? null)
      }
    } catch (error) {
      setStatus(`${t('loadFailed')}: ${String(error)}`)
    }
  }, [t])

  React.useEffect(() => { void load() }, [load])

  const save = async () => {
    if (!config) return
    setBusy(true)
    setStatus('')
    setStatusOk(null)
    try {
      const res = await fetch(`${API}/config`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(config),
      })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      const ok = res.ok && body.ok !== false
      setStatusOk(ok)
      setStatus(ok ? t('saved') : `${t('saveFailed')}: ${body.error ?? res.status}`)
      await load()
    } catch (error) {
      setStatusOk(false)
      setStatus(`${t('saveFailed')}: ${String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    if (!config || config.activeProvider === 'none') return
    setBusy(true)
    setStatus(t('testing'))
    setStatusOk(null)
    try {
      const res = await fetch(`${API}/test`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider: config.activeProvider,
          tavilyApiKey: config.tavilyApiKey,
          baiduApiKey: config.baiduApiKey,
        }),
      })
      const body = (await res.json()) as { ok?: boolean; error?: string }
      const ok = body.ok === true
      setStatusOk(ok)
      setStatus(ok ? t('connected') : `${t('connectFailed')}: ${body.error ?? t('unknownError')}`)
    } catch (error) {
      setStatusOk(false)
      setStatus(`${t('connectFailed')}: ${String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  if (!config) return h('div', null, status || t('loading'))

  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig({ ...config, [key]: value })

  const statusCls = `wssp-status${statusOk === true ? ' wssp-status-ok' : statusOk === false ? ' wssp-status-err' : ''}`

  return h('div', null,
    // --- provider select ---
    h('label', { className: 'wssp-field' },
      h('span', { className: 'wssp-field-label' }, t('provider')),
      h(Select, {
        value: config.activeProvider,
        onChange: (v: string) => set('activeProvider', v),
        disabled: busy,
        t,
      }),
    ),

    // --- tavily fields ---
    config.activeProvider === 'tavily'
      ? h('div', { className: 'wssp-field' },
          h('label', null,
            h('span', { className: 'wssp-field-label' }, t('tavilyKey')),
            h('input', {
              className: 'wssp-input', type: 'password',
              value: config.tavilyApiKey,
              placeholder: 'tvly-…',
              spellCheck: false, autoComplete: 'off',
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => set('tavilyApiKey', e.target.value),
            }),
          ),
          h('p', { className: 'wssp-hint' },
            t('tavilyHint'),
            h('a', {
              className: 'wssp-link', href: 'https://app.tavily.com/home', target: '_blank', rel: 'noopener noreferrer',
            }, t('tavilyLink')),
          ),
        )
      : null,

    // --- baidu fields ---
    config.activeProvider === 'baidu'
      ? h('div', { className: 'wssp-field' },
          h('label', null,
            h('span', { className: 'wssp-field-label' }, t('baiduKey')),
            h('input', {
              className: 'wssp-input', type: 'password',
              value: config.baiduApiKey,
              placeholder: 'Bearer token',
              spellCheck: false, autoComplete: 'off',
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => set('baiduApiKey', e.target.value),
            }),
          ),
          h('p', { className: 'wssp-hint' },
            t('baiduHint'),
            h('a', {
              className: 'wssp-link', href: 'https://console.bce.baidu.com/qianfan/ais/console/apikeylist', target: '_blank', rel: 'noopener noreferrer',
            }, t('baiduLink')),
          ),
        )
      : null,

    // --- buttons (matches DSH SettingsForm footer) ---
    h('div', { className: 'wssp-btn-row' },
      h('button', { className: 'wssp-btn wssp-btn-test', onClick: test, disabled: busy || config.activeProvider === 'none' }, t('test')),
      h('button', { className: 'wssp-btn wssp-btn-save', onClick: save, disabled: busy }, t('save')),
    ),

    // --- status ---
    status ? h('div', { className: statusCls }, status) : null,

    // --- usage ---
    usage
      ? h('div', { className: 'wssp-usage' },
          `${t('usage')}：` + Object.entries(usage).map(([k, v]) => `${k}=${v?.used ?? 0}`).join(', '))
      : null,
  )
}

// ---------------------------------------------------------------------------
// Client entry
// ---------------------------------------------------------------------------
export default {
  inject: ['slots', 'locale'],
  apply(ctx: any) {
    // Publish this panel's dictionary so DSH's Settings can switch languages.
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'web-search-providers: dictionaries')

    // The locale service re-emits on preference change; keep the panel's
    // language in state so a switch re-renders without a reload.
    let locale = ctx.locale.getLocale?.()?.id ?? 'en'
    const unsubscribe = ctx.locale.subscribe(() => {
      locale = ctx.locale.getLocale?.()?.id ?? locale
    })

    function PanelEntry() {
      const [, force] = React.useReducer((n: number) => n + 1, 0)
      React.useEffect(() => ctx.locale.subscribe(force), [])
      return h(Panel, { t: ctx.locale.bind(NS) ?? translate(locale), locale })
    }

    ctx.slots.inject('plugins.bundle.config', () =>
      ctx.slots.register(
        { name: 'plugins.bundle.config', key: PACKAGE_ID },
        PanelEntry,
      ),
    )

    ctx.effect(() => unsubscribe, 'web-search-providers: locale subscription')
  },
}