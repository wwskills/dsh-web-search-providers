/**
 * Ambient declarations for the DSH peer packages this plugin consumes.
 *
 * The DSH host supplies these at runtime (via `peerDependencies`), but they are
 * not present in this checkout, so we declare only the members we use. This
 * keeps `tsc --noEmit` and vitest self-contained without linking a `../dsh`.
 * @module @wwskills/dsh-web-search-providers/dsh-shims
 */

declare module '@deepseek-ai/cordis' {
  export interface CordisEventMap {}
  export class Service {}
  export function inject(): void
}

declare module '@deepseek-ai/schemastery' {
  export interface Schema<T = unknown> {
    default(value: T): Schema<T>
    role(name: string): Schema<T>
    description(text: string): Schema<T>
  }
  export interface SchemaObject<T> extends Schema<T> {
    shape: T
  }
  interface SchemaStatic {
    object<T extends Record<string, Schema>>(shape: T): Schema<T>
    union<T extends string>(values: ReadonlyArray<T>): Schema<T>
    string(): Schema<string>
    number(): Schema<number>
    boolean(): Schema<boolean>
    natural(): Schema<number>
  }
  const Schema: SchemaStatic
  export default Schema
}

declare module '@deepseek-ai/dsh-settings' {
  import type { Schema } from '@deepseek-ai/schemastery'
  export interface SettingsHandle<T> {
    get(): T
    /** Async since DSH 0.1.2. */
    update(patch: Partial<T>): Promise<void>
  }
  export interface SettingsRegistry {
    register<T>(namespace: string, config: Schema<T>, init?: { base?: Partial<T> }): SettingsHandle<T>
  }
  export interface SettingsContext {
    settings: SettingsRegistry
  }
}

declare module '@deepseek-ai/dsh-web' {
  export interface WebSearchProvider {
    readonly id: string
    available(): boolean
    search(request: { query: string; maxResults?: number }, signal?: AbortSignal): Promise<{
      sources: Array<{ url: string; title?: string; snippet?: string; publishedAt?: string }>
      /** Renamed from `answer` in DSH 0.1.2. */
      content?: string
      truncated: boolean
    }>
    dispose?(): void
  }
  export interface WebContext {
    web: {
      registerSearchProvider(provider: WebSearchProvider): () => void
    }
  }
  export const WebError: new (message: string, code: string, opts?: { cause?: unknown }) => Error
}

declare module '@deepseek-ai/dsh-host-webserver' {
  export interface WebServerRoute {
    kind: 'prefix' | 'exact'
    path: string
    handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void | Promise<void>
  }
  export interface WebServer {
    register(route: WebServerRoute, name?: string): void
  }
}
