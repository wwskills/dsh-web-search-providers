/**
 * Build pipeline for @wwskills/dsh-web-search-providers.
 *
 * Emits three host ESM bundles (loader shim, provider entry, client entry) and
 * the browser client bundle. On the host side the DSH/cordis peer packages stay
 * external — the DSH profile's node_modules provides them at runtime; schemastery
 * is inlined so the Loader validates plugin Config against it.
 *
 * The client bundle is emitted as a classic factory script that registers itself
 * through `window.__ModuleLoader__.load({ id, factory })` and pulls its platform
 * peers (react, cordis, UI packages) from the injected `require`.
 */
import { build } from 'esbuild'
import { mkdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const PACKAGE_ID = '@wwskills/dsh-web-search-providers'

mkdirSync('lib', { recursive: true })

/** Strip absolute build-machine paths esbuild stamps into inlined markers. */
async function stripMachinePaths(outfile) {
  const code = await readFile(outfile, 'utf8')
  const cleaned = code.replace(/^(\s*\/\/\s*)[A-Za-z]:[\\/][^\\/\r\n]*[\\/][^\\/\r\n]*[\\/]/gm, '$1dsh/')
  if (cleaned !== code) await writeFile(outfile, cleaned)
  try {
    const map = JSON.parse(await readFile(`${outfile}.map`, 'utf8'))
    if (Array.isArray(map.sources)) {
      const rewritten = map.sources.map(source =>
        source.startsWith('file:///')
          ? source.replace(/^file:\/\/\/[A-Za-z]:[\\/][^\\/]+[\\/][^\\/]+[\\/]/, 'dsh/')
          : source)
      if (rewritten.some((source, index) => source !== map.sources[index])) {
        map.sources = rewritten
        await writeFile(`${outfile}.map`, JSON.stringify(map))
      }
    }
  } catch {
    // No sourcemap present.
  }
}

// Host side: DSH/cordis peer packages resolve from node_modules at runtime.
const hostExternal = [
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-*',
  '@deepseek-ai/schemastery',
]

const hostEntries = [
  ['src/index.ts', 'lib/index.js'],
]

for (const [entry, outfile] of hostEntries) {
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: ['node20'],
    sourcemap: true,
    external: hostExternal,
    logLevel: 'info',
  })
  await stripMachinePaths(outfile)
}

// Client side: modules the shell shares through the frozen client module table.
const clientExternal = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-runtime',
]

await build({
  entryPoints: ['src/client.tsx'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2020'],
  sourcemap: true,
  jsx: 'automatic',
  external: clientExternal,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  banner: {
    js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_ID)}, factory: (require) => {\nvar module = { exports: {} };\n`,
  },
  footer: {
    js: 'return module.exports; } });',
  },
  logLevel: 'info',
})

// esbuild strips types, so declarations are emitted separately by tsc.
execFileSync(
  process.execPath,
  [fileURLToPath(import.meta.resolve('typescript/bin/tsc')), '-p', 'tsconfig.build.json'],
  { stdio: 'inherit' },
)
