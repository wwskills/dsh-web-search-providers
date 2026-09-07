/**
 * Monthly usage tracking per provider. Counts are persisted as JSON inside the
 * plugin's data directory and surfaced through the usage Web API.
 * @module @wwskills/dsh-web-search-providers/usage
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { dataDirectory } from './config-path.js'

/** Free-tier monthly call quotas, used to make the usage gauge meaningful. */
export const FREE_QUOTAS: Record<string, number> = {
  tavily: 1000,
  baidu: 1500,
}

/** A single provider's count for the current month, against its quota. */
export interface UsageEntry {
  provider: string
  month: string
  used: number
  quota: number | null
}

/** Shape returned by {@link getUsageSnapshot}. */
export interface UsageSnapshot {
  month: string
  providers: Record<string, { used: number; quota: number | null }>
}

function usagePath(): string {
  return join(dataDirectory(), 'usage.json')
}

function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function loadUsage(): Record<string, Record<string, number>> {
  try {
    return JSON.parse(readFileSync(usagePath(), 'utf8'))
  } catch {
    return {}
  }
}

function saveUsage(data: unknown): void {
  try {
    mkdirSync(dirname(usagePath()), { recursive: true })
    writeFileSync(usagePath(), JSON.stringify(data, null, 2) + '\n', 'utf8')
  } catch (error) {
    console.warn(`[web-search-providers] usage persist failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Increment the call count for a provider in the current month, returning the
 * updated entry for that provider.
 */
export function incrementUsage(provider: string): UsageEntry {
  const data = loadUsage()
  const month = currentMonthKey()
  if (!data[month]) data[month] = {}
  if (!data[month][provider]) data[month][provider] = 0
  data[month][provider] += 1
  saveUsage(data)
  return {
    provider,
    month,
    used: data[month][provider],
    quota: FREE_QUOTAS[provider] ?? null,
  }
}

/** Snapshot of the current month's usage across all known providers. */
export function getUsageSnapshot(): UsageSnapshot {
  const data = loadUsage()
  const month = currentMonthKey()
  const monthData = data[month] ?? {}
  const providers: UsageSnapshot['providers'] = {}
  for (const provider of Object.keys(FREE_QUOTAS)) {
    providers[provider] = {
      used: monthData[provider] ?? 0,
      quota: FREE_QUOTAS[provider],
    }
  }
  return { month, providers }
}
