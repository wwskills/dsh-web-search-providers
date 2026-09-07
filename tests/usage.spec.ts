import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { rmSync } from 'node:fs'
import { FREE_QUOTAS, incrementUsage, getUsageSnapshot } from '../src/usage.js'
import { dataDirectory } from '../src/config-path.js'

let tmpDir: string

beforeEach(() => {
  tmpDir = process.env.TMPDIR ?? process.env.TEMP ?? '/tmp'
  process.env.DSH_HOME = tmpDir
  // Clean up any leaked state from previous runs.
  try { rmSync(dataDirectory(), { recursive: true, force: true }) } catch { /* ok */ }
})

afterEach(() => {
  vi.useRealTimers()
  delete process.env.DSH_HOME
})

describe('usage tracking', () => {
  it('starts at zero for every provider', () => {
    const snapshot = getUsageSnapshot()
    expect(snapshot.month).toMatch(/^\d{4}-\d{2}$/)
    expect(snapshot.providers.tavily.used).toBe(0)
    expect(snapshot.providers.baidu.used).toBe(0)
    expect(snapshot.providers.tavily.quota).toBe(FREE_QUOTAS.tavily)
  })

  it('increments the count for a provider this month', () => {
    const after = incrementUsage('tavily')
    expect(after.used).toBe(1)
    expect(after.provider).toBe('tavily')
    expect(getUsageSnapshot().providers.tavily.used).toBe(1)
  })

  it('accumulates across multiple calls', () => {
    incrementUsage('baidu')
    incrementUsage('baidu')
    incrementUsage('baidu')
    expect(getUsageSnapshot().providers.baidu.used).toBe(3)
  })
})

describe('dataDirectory cross-platform resolution', () => {
  it('honours DSH_HOME when set (Windows-safe, no /root collapse)', () => {
    process.env.DSH_HOME = 'C:/Users/tester/.dsh'
    expect(dataDirectory()).toBe('C:/Users/tester/.dsh/web-search-providers')
    delete process.env.DSH_HOME
  })

  it('falls back to the OS home directory, never a bare /root', () => {
    delete process.env.DSH_HOME
    expect(dataDirectory()).not.toBe('/root/web-search-providers')
    expect(dataDirectory()).toContain('.dsh')
  })
})
