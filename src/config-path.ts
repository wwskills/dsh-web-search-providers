/**
 * Cross-platform resolution of the plugin's data directory.
 * @module @wwskills/dsh-web-search-providers/config-path
 */

import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Resolve the directory where this plugin stores runtime state (usage counts,
 * a user-config override). The previous implementation assumed a POSIX `HOME`,
 * which collapsed to `/root/.dsh` on Windows; this honours `DSH_HOME`, then
 * falls back to the OS home directory.
 */
export function dataDirectory(): string {
  const override = process.env.DSH_HOME?.trim()
  if (override) return join(override, 'web-search-providers')
  return join(homedir(), '.dsh', 'web-search-providers')
}
