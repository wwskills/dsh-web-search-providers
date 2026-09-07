/**
 * Browser settings panel for the web search providers plugin.
 *
 * Rendered into the DSH settings "plugins" tab. A single merged card holds the
 * provider selector and its config; the save bar tracks dirty state and offers
 * test connection (server-side, so browser CORS is not an issue).
 * @module @wwskills/dsh-web-search-providers/client
 */

import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'

export const NS = 'web-search-providers'

interface ProviderConfig {
  activeProvider: 'none' | 'tavily' | 'baidu'
  tavily: {
    apiKey: string
    baseURL: string
    maxResults: number
    searchDepth: 'basic' | 'advanced'
    timeoutMs: number
  }
  baidu: { apiKey: string; maxResults: number; timeoutMs: number }
}

interface UsageSnapshot {
  month: string
  providers: Record<string, { used: number; quota: number | null }>
}

const API_ROOT = '/plugins/web-search-providers/api'

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function loadConfig(): Promise<ProviderConfig> {
  return fetch(`${API_ROOT}/config`)
    .then(response => response.json())
    .catch(() => ({ activeProvider: 'none', tavily: {}, baidu: {} } as unknown as ProviderConfig))
}

function loadUsage(): Promise<UsageSnapshot | null> {
  return fetch(`${API_ROOT}/usage`)
    .then(response => response.json())
    .catch(() => null)
}

function saveConfig(cfg: ProviderConfig): Promise<Response> {
  return fetch(`${API_ROOT}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cfg),
  })
}

function testProvider(provider: 'tavily' | 'baidu'): Promise<{ ok: boolean; status?: number; error?: string }> {
  return fetch(`${API_ROOT}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider }),
  }).then(response => response.json())
}

const cardStyle: Record<string, string> = {
  background: 'var(--dsw-alias-bg-layer-2)',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '12px',
}
const labelStyle: Record<string, string> = {
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--dsw-alias-label-primary)',
  marginBottom: '4px',
}
const descStyle: Record<string, string> = {
  fontSize: '12px',
  color: 'var(--dsw-alias-label-tertiary)',
  marginTop: '4px',
}
const inputStyle: Record<string, string> = {
  height: '40px',
  padding: '0 12px',
  background: 'var(--dsw-alias-bg-input)',
  color: 'var(--dsw-alias-label-primary)',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
const selectStyle: Record<string, string> = {
  ...inputStyle,
  background: 'var(--dsw-alias-bg-input)',
  color: 'var(--dsw-alias-label-primary)',
  colorScheme: 'dark',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M3 4.5l3 3 3-3'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
}
const optionStyle: Record<string, string> = {
  background: 'var(--dsw-alias-bg-layer-2)',
  color: 'var(--dsw-alias-label-primary)',
}
const btnPrimary: Record<string, string> = {
  height: '36px',
  padding: '0 20px',
  background: 'var(--dsw-alias-button-primary-fill)',
  color: 'var(--dsw-alias-label-primary-foreground)',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  cursor: 'pointer',
  fontWeight: 500,
}
const btnOutline: Record<string, string> = {
  height: '36px',
  padding: '0 16px',
  background: 'transparent',
  color: 'var(--dsw-alias-label-secondary)',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: '8px',
  fontSize: '14px',
  cursor: 'pointer',
}

interface Locale {
  tab: string
  title: string
  providerLabel: string
  tavily: string
  baidu: string
  none: string
  statusEnabled: string
  statusDisabled: string
  apiKey: string
  apiKeyHint: string
  baiduApiKeyHint: string
  getBaiduKey: string
  maxResults: string
  searchDepth: string
  testConnection: string
  save: string
  cancel: string
  saved: string
  getTavilyKey: string
  configLabel: string
  unsavedChanges: string
  saveFailed: string
  testing: string
  saving: string
  connectionOk: string
  connectionFail: string
  usageThisMonth: string
  usageUnit: string
}

const zh: Locale = {
  tab: '网络搜索',
  title: '网络搜索',
  providerLabel: 'Provider',
  tavily: 'Tavily',
  baidu: 'Baidu',
  none: '不使用',
  statusEnabled: '已启用',
  statusDisabled: '已停用',
  apiKey: 'API Key',
  apiKeyHint: 'Tavily API 密钥，以 tvly- 开头',
  baiduApiKeyHint: '千帆平台 API Key',
  getBaiduKey: '获取 API Key',
  maxResults: '最大返回结果',
  searchDepth: '搜索深度',
  testConnection: '测试连接',
  save: '保存',
  cancel: '取消',
  saved: '✓ 已保存，即时生效',
  getTavilyKey: '获取 API Key',
  configLabel: '配置',
  unsavedChanges: '● 有未保存的更改',
  saveFailed: '✗ 保存失败',
  testing: '测试中...',
  saving: '保存中...',
  connectionOk: '✓ 连接成功',
  connectionFail: '✗ HTTP',
  usageThisMonth: '本月用量',
  usageUnit: '次',
}

const en: Locale = {
  tab: 'Web Search',
  title: 'Web Search',
  providerLabel: 'Provider',
  tavily: 'Tavily',
  baidu: 'Baidu',
  none: 'None',
  statusEnabled: 'Enabled',
  statusDisabled: 'Disabled',
  apiKey: 'API Key',
  apiKeyHint: 'Tavily API key, starts with tvly-',
  baiduApiKeyHint: 'Qianfan API Key',
  getBaiduKey: 'Get API Key',
  maxResults: 'Max Results',
  searchDepth: 'Search Depth',
  testConnection: 'Test Connection',
  save: 'Save',
  cancel: 'Cancel',
  saved: '✓ Saved',
  getTavilyKey: 'Get API Key',
  configLabel: 'Config',
  unsavedChanges: '● Unsaved changes',
  saveFailed: '✗ Save failed',
  testing: 'Testing...',
  saving: 'Saving...',
  connectionOk: '✓ Connected',
  connectionFail: '✗ HTTP',
  usageThisMonth: 'This month',
  usageUnit: 'calls',
}

function SettingsTab(props: { t: (key: string) => string }): ReactElement {
  const t = props.t
  const [cfg, setCfg] = useState<ProviderConfig | null>(null)
  const [snapshot, setSnapshot] = useState<ProviderConfig | null>(null)
  const [usage, setUsage] = useState<UsageSnapshot | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [testing, setTesting] = useState(false)
  const [testRes, setTestRes] = useState('')

  useEffect(() => {
    let cancelled = false
    void loadConfig().then(data => {
      if (cancelled) return
      setCfg(data)
      setSnapshot(deepClone(data))
    })
    void loadUsage().then(data => {
      if (cancelled) return
      setUsage(data)
    })
    return () => { cancelled = true }
  }, [])

  if (cfg === null) {
    return <div style={{ color: 'var(--dsw-alias-label-tertiary)', padding: '24px' }}>Loading...</div>
  }

  const update = (path: string, value: unknown): void => {
    const next = deepClone(cfg)
    const parts = path.split('.')
    let cursor = next as Record<string, unknown>
    for (let i = 0; i < parts.length - 1; i += 1) {
      if (typeof cursor[parts[i]] !== 'object' || cursor[parts[i]] === null) cursor[parts[i]] = {}
      cursor = cursor[parts[i]] as Record<string, unknown>
    }
    cursor[parts[parts.length - 1]] = value
    setCfg(next)
    setDirty(true)
  }

  const doSave = (): void => {
    if (cfg === null || saving) return
    setSaving(true)
    setMsg('')
    void saveConfig(cfg)
      .then(res => {
        if (res.ok) {
          setMsg(t('saved'))
          setDirty(false)
          setSnapshot(deepClone(cfg))
        } else {
          setMsg(`${t('saveFailed')} (HTTP ${res.status})`)
        }
        setSaving(false)
      })
      .catch(err => {
        setMsg(`✗ ${err instanceof Error ? err.message : String(err)}`)
        setSaving(false)
      })
  }

  const doCancel = (): void => {
    if (snapshot) setCfg(deepClone(snapshot))
    setDirty(false)
    setMsg('')
    setTestRes('')
  }

  const doTest = (): void => {
    if (cfg === null || testing || cfg.activeProvider === 'none') return
    setTesting(true)
    setTestRes('')
    void testProvider(cfg.activeProvider)
      .then(d => {
        setTestRes(d.ok ? t('connectionOk') : `${t('connectionFail')} ${d.status ?? d.error ?? ''}`)
        setTesting(false)
      })
      .catch(err => {
        setTestRes(`✗ ${err instanceof Error ? err.message : String(err)}`)
        setTesting(false)
      })
  }

  const isEnabled = cfg.activeProvider !== 'none'
  const providerUsage = isEnabled && usage?.providers?.[cfg.activeProvider]

  const statusPill = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {isEnabled && (
        <span style={{
          display: 'inline-block',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'var(--dsw-alias-state-success-primary)',
          flexShrink: 0,
        }} />
      )}
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '32px',
        padding: '0 10px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: '18px',
        whiteSpace: 'nowrap',
        background: isEnabled ? 'var(--dsw-alias-state-success-tertiary)' : 'transparent',
        color: isEnabled ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-label-tertiary)',
      }}>
        {isEnabled ? t('statusEnabled') : t('statusDisabled')}
      </span>
    </span>
  )

  let providerConfig: ReactElement | null = null
  if (cfg.activeProvider === 'tavily') {
    providerConfig = (
      <>
        <div style={{ height: '1px', background: 'var(--dsw-alias-border-l2)', margin: '16px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={labelStyle}>{t('tavily')} {t('configLabel')}</div>
          <a href="https://tavily.com" target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--dsw-alias-accent)' }}>{t('getTavilyKey')}</a>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={labelStyle}>{t('apiKey')}</div>
          <input type="password" value={cfg.tavily.apiKey || ''} onChange={e => update('tavily.apiKey', e.target.value)} placeholder="tvly-xxx" style={inputStyle} />
          <div style={descStyle}>{t('apiKeyHint')}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={labelStyle}>{t('maxResults')}</div>
            <input type="number" value={cfg.tavily.maxResults || 5} onChange={e => update('tavily.maxResults', parseInt(e.target.value, 10) || 5)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={labelStyle}>{t('searchDepth')}</div>
            <select value={cfg.tavily.searchDepth || 'basic'} onChange={e => update('tavily.searchDepth', e.target.value)} style={selectStyle}>
              <option value="basic">Basic</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
        <TestRow t={t} testing={testing} testRes={testRes} onTest={doTest} />
      </>
    )
  } else if (cfg.activeProvider === 'baidu') {
    providerConfig = (
      <>
        <div style={{ height: '1px', background: 'var(--dsw-alias-border-l2)', margin: '16px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={labelStyle}>{t('baidu')} {t('configLabel')}</div>
          <a href="https://console.bce.baidu.com/qianfan/ais/api/applicationService/api" target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--dsw-alias-accent)' }}>{t('getBaiduKey')}</a>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={labelStyle}>{t('apiKey')}</div>
          <input type="password" value={cfg.baidu.apiKey || ''} onChange={e => update('baidu.apiKey', e.target.value)} placeholder="bce-v3/..." style={inputStyle} />
          <div style={descStyle}>{t('baiduApiKeyHint')}</div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={labelStyle}>{t('maxResults')}</div>
          <input type="number" value={cfg.baidu.maxResults || 5} onChange={e => update('baidu.maxResults', parseInt(e.target.value, 10) || 5)} style={inputStyle} />
        </div>
        <TestRow t={t} testing={testing} testRes={testRes} onTest={doTest} />
      </>
    )
  }

  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ ...cardStyle, padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)', margin: 0 }}>{t('providerLabel')}</div>
          {statusPill}
        </div>
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select value={cfg.activeProvider} onChange={e => update('activeProvider', e.target.value)} style={{ ...selectStyle, maxWidth: '240px' }}>
            <option value="none" style={optionStyle}>{t('none')}</option>
            <option value="tavily" style={optionStyle}>{t('tavily')}</option>
            <option value="baidu" style={optionStyle}>{t('baidu')}</option>
          </select>
          {providerUsage && (
            <span style={{ fontSize: '12px', color: 'var(--dsw-alias-label-tertiary)', whiteSpace: 'nowrap' }}>
              {t('usageThisMonth')} {providerUsage.used} {t('usageUnit')}
            </span>
          )}
        </div>
        {providerConfig}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
        {dirty
          ? <span style={{ fontSize: '12px', color: 'var(--dsw-alias-accent)', marginRight: 'auto' }}>{t('unsavedChanges')}</span>
          : msg
            ? <span style={{ fontSize: '12px', color: msg.startsWith('✓') ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-label-error)', marginRight: 'auto' }}>{msg}</span>
            : null}
        <button onClick={doCancel} style={{ ...btnOutline, opacity: dirty ? 1 : 0.5 }}>{t('cancel')}</button>
        <button onClick={doSave} disabled={saving || !dirty} style={{ ...btnPrimary, opacity: (saving || !dirty) ? 0.5 : 1, cursor: (saving || !dirty) ? 'default' : 'pointer' }}>{saving ? t('saving') : t('save')}</button>
      </div>
    </div>
  )
}

function TestRow(props: { t: (key: string) => string; testing: boolean; testRes: string; onTest: () => void }): ReactElement {
  const { t, testing, testRes, onTest } = props
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
      {testRes
        ? <span style={{ fontSize: '12px', color: testRes.startsWith('✓') ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-label-error)' }}>{testRes}</span>
        : null}
      <button onClick={onTest} disabled={testing} style={{ ...btnOutline, opacity: testing ? 0.5 : 1 }}>
        {testing ? t('testing') : t('testConnection')}
      </button>
    </div>
  )
}

export const inject = ['slots', 'locale']

export function apply(ctx: {
  effect: (fn: () => unknown, label?: string) => unknown
  locale: { register: (ns: string, dicts: { zh: Locale; en: Locale }) => unknown; bind: (ns: string) => (key: string) => string }
  slots: { inject: (slot: string, fn: () => unknown) => unknown }
}): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'web-search-providers: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('settings.plugins.tab', () =>
    ctx.slots.register(
      { name: 'settings.plugins.tab', id: NS, order: 21, label: () => t('tab'), locale: NS, inject: () => ({}) },
      SettingsTab,
    ),
  )
}
