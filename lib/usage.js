// @wwskills/dsh-web-search-providers — Usage tracking
//
// Tracks monthly API call counts per provider.
// Data is persisted to usage.json in the plugin's data directory.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

// Free tier quotas per month
const FREE_QUOTAS = {
  tavily: 1000,
  baidu: 1500,
};

function resolveUsagePath() {
  const home = process.env.DSH_HOME || `${process.env.HOME || '/root'}/.dsh`;
  return join(home, 'web-search-providers', 'usage.json');
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function loadUsage() {
  try {
    const raw = readFileSync(resolveUsagePath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveUsage(data) {
  const path = resolveUsagePath();
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
  } catch (e) {
    console.warn('[web-search-providers] usage persist failed:', e.message);
  }
}

/**
 * Increment the call count for a provider in the current month.
 * Returns the updated usage snapshot for that provider.
 */
export function incrementUsage(provider) {
  const data = loadUsage();
  const monthKey = currentMonthKey();
  if (!data[monthKey]) data[monthKey] = {};
  if (!data[monthKey][provider]) data[monthKey][provider] = 0;
  data[monthKey][provider]++;
  saveUsage(data);
  return {
    provider,
    month: monthKey,
    used: data[monthKey][provider],
    quota: FREE_QUOTAS[provider] || null,
  };
}

/**
 * Get usage snapshot for the current month.
 * Returns { provider: { used, quota }, ... } for all known providers.
 */
export function getUsageSnapshot() {
  const data = loadUsage();
  const monthKey = currentMonthKey();
  const monthData = data[monthKey] || {};
  const result = {};
  for (const provider of Object.keys(FREE_QUOTAS)) {
    result[provider] = {
      used: monthData[provider] || 0,
      quota: FREE_QUOTAS[provider],
    };
  }
  return { month: monthKey, providers: result };
}

export { FREE_QUOTAS };
