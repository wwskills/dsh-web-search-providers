/**
 * Settings panel for @wwskills/dsh-web-search-providers.
 *
 * Registered into `plugins.bundle.config`, keyed by the package name, so it
 * renders on this bundle's own Plugins page between its description and rows.
 *
 * Talks to the Host through this plugin's own HTTP routes, so switching the
 * provider or saving a key takes effect without a restart.
 * @module @wwskills/dsh-web-search-providers/client
 */

import * as React from 'react'

const PACKAGE_ID = '@wwskills/dsh-web-search-providers'
const API = '/plugins/web-search-providers/api'

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

const h = React.createElement

function field(label: string, node: React.ReactNode) {
  return h('label', { style: { display: 'block', marginBottom: 12 } },
    h('span', { style: { display: 'block', fontSize: 12, opacity: 0.75, marginBottom: 4 } }, label),
    node,
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '6px 8px',
  background: 'transparent', color: 'inherit',
  border: '1px solid currentColor', borderRadius: 4, opacity: 0.9,
}

const buttonStyle: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 4, cursor: 'pointer',
  border: '1px solid currentColor', background: 'transparent', color: 'inherit',
}

function Panel() {
  const [config, setConfig] = React.useState<Config | null>(null)
  const [usage, setUsage] = React.useState<Record<string, { used?: number }> | null>(null)
  const [status, setStatus] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`${API}/config`, { headers: { accept: 'application/json' } })
      if (res.ok) setConfig((await res.json()) as Config)
      else setStatus(`读取配置失败：HTTP ${res.status}`)
      const ures = await fetch(`${API}/usage`, { headers: { accept: 'application/json' } })
      if (ures.ok) {
        const body = (await ures.json()) as { providers?: Record<string, { used?: number }> }
        setUsage(body.providers ?? null)
      }
    } catch (error) {
      setStatus(`读取配置失败：${String(error)}`)
    }
  }, [])

  React.useEffect(() => { void load() }, [load])

  const save = async () => {
    if (!config) return
    setBusy(true)
    setStatus('')
    try {
      const res = await fetch(`${API}/config`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(config),
      })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      setStatus(res.ok && body.ok !== false ? '已保存并即时生效' : `保存失败：${body.error ?? res.status}`)
      await load()
    } catch (error) {
      setStatus(`保存失败：${String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    if (!config || config.activeProvider === 'none') return
    setBusy(true)
    setStatus('测试中…')
    try {
      const res = await fetch(`${API}/test`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider: config.activeProvider }),
      })
      const body = (await res.json()) as { ok?: boolean; error?: string }
      setStatus(body.ok ? '连接成功 ✅' : `连接失败：${body.error ?? '未知错误'}`)
    } catch (error) {
      setStatus(`连接失败：${String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  if (!config) return h('div', { style: { padding: 12, fontSize: 13 } }, status || '载入中…')

  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig({ ...config, [key]: value })

  return h('div', { style: { display: 'grid', gap: 12, fontSize: 13 } },
    field('启用哪个搜索 provider',
      h('select', {
        value: config.activeProvider,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => set('activeProvider', e.target.value),
        style: inputStyle,
      },
        h('option', { value: 'none' }, 'none — 用 DSH 内置搜索'),
        h('option', { value: 'tavily' }, 'Tavily'),
        h('option', { value: 'baidu' }, '百度千帆 AI 搜索'),
      ),
    ),

    config.activeProvider === 'tavily'
      ? h(React.Fragment, null,
          field('Tavily API Key',
            h('input', {
              type: 'password', value: config.tavilyApiKey, style: inputStyle,
              placeholder: 'tvly-…（免费额度 1000 次/月）',
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => set('tavilyApiKey', e.target.value),
            }),
          ),
        )
      : null,

    config.activeProvider === 'baidu'
      ? field('百度千帆 API Key',
          h('input', {
            type: 'password', value: config.baiduApiKey, style: inputStyle,
            placeholder: 'Bearer token',
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => set('baiduApiKey', e.target.value),
          }),
        )
      : null,

    h('div', { style: { display: 'flex', gap: 8 } },
      h('button', { onClick: save, disabled: busy, style: buttonStyle }, '保存'),
      h('button', {
        onClick: test, disabled: busy || config.activeProvider === 'none', style: buttonStyle,
      }, '测试连接'),
      h('button', { onClick: load, disabled: busy, style: buttonStyle }, '刷新'),
    ),

    status ? h('div', { style: { fontSize: 12, opacity: 0.8 } }, status) : null,

    usage
      ? h('div', { style: { fontSize: 12, opacity: 0.7 } },
          '本月用量：' + Object.entries(usage).map(([k, v]) => `${k}=${v?.used ?? 0}`).join('，'))
      : null,
  )
}

export default {
  inject: ['slots'],
  apply(ctx: any) {
    ctx.slots.inject('plugins.bundle.config', () =>
      ctx.slots.register(
        { name: 'plugins.bundle.config', key: PACKAGE_ID },
        Panel,
      ),
    )
  },
}
